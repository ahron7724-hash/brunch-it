-- How many options the customer may pick from each option group of a product (e.g. up to 3 flavors).
-- 1 = one choice per group (the old behaviour).

alter table public.products
  add column max_option_choices int not null default 1
  constraint products_max_option_choices_range check (max_option_choices between 1 and 20);

-- The free-text field is now a note ("בלי זיתים"), open on every product (can be turned off per product).
-- Old generic titles go back to the default title "הערה"; custom titles such as "כיתוב על העוגה" stay.
update public.products
set allows_custom_text = true,
    custom_text_label = case when custom_text_label in ('כיתוב אישי', 'כיתוב') then null else custom_text_label end;

-- Stock deduction: when several options of one group were chosen on a line (e.g. 3 flavors in a box of 30),
-- each option's extra ingredients count for its share of the units (1/3 each), not for the whole box.
-- Same function as in 20261014000010_whole_unit_deduction.sql except for the share.

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
      -- Flavor ids chosen on each line (older orders without ids just use the base recipe),
      -- with each one's share of the line's units within its group.
      select oi.id as item_id,
             (o->>'id')::uuid as option_id,
             1.0 / count(*) over (partition by oi.id, coalesce(o->>'group', '')) as share
      from public.order_items oi
      cross join lateral jsonb_array_elements(oi.options) o
      where oi.order_id = new.id
        and o->>'id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
    ),
    needs as (
      select r.raw_material_id, sum(oi.quantity * oi.unit_count * r.amount_per_unit * coalesce(c.share, 1)) as amount
      from public.order_items oi
      join public.recipe_items r on r.product_id = oi.product_id
      join public.raw_materials m on m.id = r.raw_material_id and m.tracking = 'measured'
      left join chosen c on c.item_id = oi.id and c.option_id = r.option_id
      where oi.order_id = new.id
        and r.amount_per_unit is not null
        and (r.option_id is null or c.option_id is not null)
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
