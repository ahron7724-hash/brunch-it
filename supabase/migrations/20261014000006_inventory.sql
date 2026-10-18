-- Phase 7: raw materials, recipes, automatic stock deduction and production planning.
-- Admin-only. Customers never see any of this.

-- ---------------------------------------------------------------------------
-- Raw materials
-- ---------------------------------------------------------------------------

create table public.raw_materials (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 80),
  unit text not null default 'g'
    check (unit in ('g', 'kg', 'ml', 'l', 'unit', 'cup', 'tbsp', 'tsp')),
  -- measured: recipes give an amount per unit and stock is deducted automatically.
  -- manual (vegetables etc.): recipes only say "needed"; the admin enters actual usage.
  tracking text not null default 'measured' check (tracking in ('measured', 'manual')),
  current_stock numeric(12, 3) not null default 0,
  min_stock_alert numeric(12, 3) not null default 0 check (min_stock_alert >= 0),
  notes text check (char_length(notes) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger raw_materials_updated_at before update on public.raw_materials
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Recipes: per single unit of a product (one quiche).
-- option_id null = the base recipe shared by all flavors; otherwise the extra ingredients of one flavor.
-- ---------------------------------------------------------------------------

alter table public.product_options add constraint product_options_id_product_key unique (id, product_id);

create table public.recipe_items (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  option_id uuid,
  raw_material_id uuid not null references public.raw_materials (id) on delete restrict,
  amount_per_unit numeric(12, 4) check (amount_per_unit > 0), -- null for manual materials
  sort_order int not null default 0,
  -- The flavor must belong to the same product.
  foreign key (option_id, product_id) references public.product_options (id, product_id) on delete cascade,
  unique nulls not distinct (product_id, option_id, raw_material_id)
);

create index recipe_items_raw_material_idx on public.recipe_items (raw_material_id);
create index recipe_items_option_idx on public.recipe_items (option_id, product_id);

-- Units in one package of each size (20 / 35 quiches).
alter table public.product_sizes
  add column unit_count int not null default 1 check (unit_count between 1 and 10000);

-- Snapshot at order time, so editing a size later doesn't change past orders.
alter table public.order_items
  add column size_id uuid references public.product_sizes (id) on delete set null,
  add column unit_count int not null default 1 check (unit_count > 0);

create index order_items_size_idx on public.order_items (size_id);

-- ---------------------------------------------------------------------------
-- Prep steps per product: what to do and how many days before pickup.
-- ---------------------------------------------------------------------------

create table public.prep_steps (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  days_before int not null default 0 check (days_before between 0 and 14),
  sort_order int not null default 0
);

create index prep_steps_product_idx on public.prep_steps (product_id, sort_order);

-- A prep step ticked off for one pickup date.
create table public.prep_step_done (
  step_id uuid not null references public.prep_steps (id) on delete cascade,
  pickup_date date not null,
  done_at timestamptz not null default now(),
  primary key (step_id, pickup_date)
);

-- ---------------------------------------------------------------------------
-- Stock ledger: every change to current_stock, and why.
-- ---------------------------------------------------------------------------

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  raw_material_id uuid not null references public.raw_materials (id) on delete cascade,
  change numeric(12, 3) not null,
  reason text not null check (reason in ('order', 'order_return', 'purchase', 'count', 'usage')),
  order_id uuid references public.orders (id) on delete set null,
  note text check (char_length(note) <= 200),
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

create index stock_movements_material_idx on public.stock_movements (raw_material_id, created_at desc);
create index stock_movements_order_idx on public.stock_movements (order_id);

alter table public.orders add column stock_deducted_at timestamptz;

-- ---------------------------------------------------------------------------
-- Automatic deduction: stock is deducted while an order is confirmed / ready / collected,
-- and returned when it goes back (cancelled or new). Runs inside the status update itself.
-- ---------------------------------------------------------------------------

create or replace function public.sync_order_stock()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_should_deduct boolean := new.status in ('confirmed', 'ready', 'collected');
begin
  if v_should_deduct and new.stock_deducted_at is null then
    with chosen as (
      -- Flavor ids chosen on each line (older orders without ids just use the base recipe).
      select oi.id as item_id, (o->>'id')::uuid as option_id
      from public.order_items oi
      cross join lateral jsonb_array_elements(oi.options) o
      where oi.order_id = new.id
        and o->>'id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    ),
    needs as (
      select r.raw_material_id, sum(oi.quantity * oi.unit_count * r.amount_per_unit) as amount
      from public.order_items oi
      join public.recipe_items r on r.product_id = oi.product_id
      join public.raw_materials m on m.id = r.raw_material_id and m.tracking = 'measured'
      where oi.order_id = new.id
        and r.amount_per_unit is not null
        and (r.option_id is null
             or exists (select 1 from chosen c where c.item_id = oi.id and c.option_id = r.option_id))
      group by r.raw_material_id
    ),
    logged as (
      insert into public.stock_movements (raw_material_id, change, reason, order_id)
      select raw_material_id, -round(amount, 3), 'order', new.id from needs where amount > 0
      returning raw_material_id, change
    )
    update public.raw_materials m
    set current_stock = m.current_stock + logged.change
    from logged
    where m.id = logged.raw_material_id;

    new.stock_deducted_at := now();

  elsif not v_should_deduct and new.stock_deducted_at is not null then
    -- Return exactly what this order took, even if the recipe changed since.
    with net as (
      select raw_material_id, sum(change) as change
      from public.stock_movements
      where order_id = new.id and reason in ('order', 'order_return')
      group by raw_material_id
      having sum(change) <> 0
    ),
    logged as (
      insert into public.stock_movements (raw_material_id, change, reason, order_id)
      select raw_material_id, -change, 'order_return', new.id from net
      returning raw_material_id, change
    )
    update public.raw_materials m
    set current_stock = m.current_stock + logged.change
    from logged
    where m.id = logged.raw_material_id;

    new.stock_deducted_at := null;
  end if;

  return new;
end;
$$;

create trigger orders_sync_stock before update of status on public.orders
  for each row execute function public.sync_order_stock();

-- ---------------------------------------------------------------------------
-- Manual stock changes from the admin panel, in one transaction:
--   purchase: add amount · usage: subtract amount · count: set stock to amount
-- p_items: [{ "id": uuid, "amount": number }]
-- ---------------------------------------------------------------------------

create or replace function public.record_stock(p_reason text, p_items jsonb, p_note text default null)
returns int
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_count int;
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = 'insufficient_privilege';
  end if;
  if p_reason not in ('purchase', 'usage', 'count') then
    raise exception 'invalid reason' using errcode = 'check_violation';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 or jsonb_array_length(p_items) > 500 then
    raise exception 'invalid items' using errcode = 'check_violation';
  end if;

  with input as (
    select distinct on (x.id) x.id, x.amount
    from jsonb_to_recordset(p_items) as x (id uuid, amount numeric)
    where x.amount >= 0
  ),
  deltas as (
    select m.id,
           round(case p_reason
             when 'purchase' then i.amount
             when 'usage' then -i.amount
             else i.amount - m.current_stock
           end, 3) as change
    from input i
    join public.raw_materials m on m.id = i.id
  ),
  logged as (
    insert into public.stock_movements (raw_material_id, change, reason, note)
    select id, change, p_reason, nullif(left(trim(p_note), 200), '') from deltas where change <> 0
    returning raw_material_id, change
  ),
  updated as (
    update public.raw_materials m
    set current_stock = m.current_stock + logged.change
    from logged
    where m.id = logged.raw_material_id
    returning m.id
  )
  select count(*) into v_count from updated;

  return v_count;
end;
$$;

revoke all on function public.record_stock(text, jsonb, text) from public, anon;
grant execute on function public.record_stock(text, jsonb, text) to authenticated;

-- create_order now also stores the size id and units per package.
create or replace function public.create_order(p_order jsonb, p_items jsonb)
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
  v_number bigint;
begin
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) = 0 then
    raise exception 'order has no items' using errcode = 'check_violation';
  end if;

  insert into public.orders (
    customer_name, customer_phone, customer_email, notes,
    pickup_date, slot_start, slot_end, fulfillment,
    delivery_zone_id, delivery_zone_name, delivery_address, delivery_fee,
    subtotal, total, payment_status, payment_provider
  )
  values (
    p_order->>'customer_name', p_order->>'customer_phone', p_order->>'customer_email', p_order->>'notes',
    (p_order->>'pickup_date')::date, (p_order->>'slot_start')::time, (p_order->>'slot_end')::time, p_order->>'fulfillment',
    (p_order->>'delivery_zone_id')::uuid, p_order->>'delivery_zone_name', p_order->>'delivery_address',
    (p_order->>'delivery_fee')::numeric,
    (p_order->>'subtotal')::numeric, (p_order->>'total')::numeric,
    coalesce(p_order->>'payment_status', 'none'), p_order->>'payment_provider'
  )
  returning id, order_number into v_id, v_number;

  insert into public.order_items (
    order_id, product_id, product_title, size_id, size_label, unit_count, unit_price, quantity, custom_text, options, line_total
  )
  select v_id, x.product_id, x.product_title, x.size_id, x.size_label, coalesce(x.unit_count, 1), x.unit_price, x.quantity,
         x.custom_text, coalesce(x.options, '[]'::jsonb), x.line_total
  from jsonb_to_recordset(p_items) as x (
    product_id uuid, product_title text, size_id uuid, size_label text, unit_count int, unit_price numeric,
    quantity int, custom_text text, options jsonb, line_total numeric
  );

  return jsonb_build_object('id', v_id, 'order_number', v_number);
end;
$$;

revoke all on function public.create_order(jsonb, jsonb) from public, anon, authenticated;
grant execute on function public.create_order(jsonb, jsonb) to service_role;

-- ---------------------------------------------------------------------------
-- Row level security: admin only
-- ---------------------------------------------------------------------------

alter table public.raw_materials enable row level security;
alter table public.recipe_items enable row level security;
alter table public.prep_steps enable row level security;
alter table public.prep_step_done enable row level security;
alter table public.stock_movements enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['raw_materials', 'recipe_items', 'prep_steps', 'prep_step_done']
  loop
    execute format('create policy "admin read" on public.%I for select to authenticated using ((select public.is_admin()))', t);
    execute format('create policy "admin insert" on public.%I for insert to authenticated with check ((select public.is_admin()))', t);
    execute format('create policy "admin update" on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('create policy "admin delete" on public.%I for delete to authenticated using ((select public.is_admin()))', t);
  end loop;
end;
$$;

-- The ledger is append-only: written by the order trigger and record_stock().
create policy "admin read" on public.stock_movements for select to authenticated using ((select public.is_admin()));
create policy "admin insert" on public.stock_movements for insert to authenticated with check ((select public.is_admin()));
