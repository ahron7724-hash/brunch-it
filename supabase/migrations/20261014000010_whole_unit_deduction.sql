-- Stock deduction rounds each order's total up to a whole unit of the material (3.57 eggs → 4),
-- matching the shopping list and work plan. Rounds to 2 decimals first, so 5.0015 stays 5.
-- Same function as in 20261014000006_inventory.sql except for that one line.

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
      select raw_material_id, -ceil(round(amount, 2)), 'order', new.id from needs where amount > 0
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
