-- Saves a product's whole recipe and prep steps in one transaction (from the admin recipe page).
-- p_items: [{ "option_id": uuid | null, "raw_material_id": uuid, "amount_per_unit": number | null }]
-- p_steps: [{ "id": uuid | null, "title": text, "days_before": int }]  (kept ids keep their "done" marks)
create or replace function public.save_recipe(p_product_id uuid, p_items jsonb, p_steps jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if not public.is_admin() then
    raise exception 'not authorized' using errcode = 'insufficient_privilege';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 300
     or jsonb_typeof(p_steps) <> 'array' or jsonb_array_length(p_steps) > 30 then
    raise exception 'invalid recipe' using errcode = 'check_violation';
  end if;

  delete from public.recipe_items where product_id = p_product_id;

  insert into public.recipe_items (product_id, option_id, raw_material_id, amount_per_unit, sort_order)
  select p_product_id, (x.v->>'option_id')::uuid, m.id,
         case when m.tracking = 'manual' then null else (x.v->>'amount_per_unit')::numeric end,
         x.ord
  from jsonb_array_elements(p_items) with ordinality as x (v, ord)
  join public.raw_materials m on m.id = (x.v->>'raw_material_id')::uuid;

  delete from public.prep_steps s
  where s.product_id = p_product_id
    and s.id not in (
      select (x.v->>'id')::uuid from jsonb_array_elements(p_steps) as x (v) where x.v->>'id' is not null
    );

  update public.prep_steps s
  set title = x.v->>'title', days_before = (x.v->>'days_before')::int, sort_order = x.ord
  from jsonb_array_elements(p_steps) with ordinality as x (v, ord)
  where s.id = (x.v->>'id')::uuid and s.product_id = p_product_id;

  insert into public.prep_steps (product_id, title, days_before, sort_order)
  select p_product_id, x.v->>'title', (x.v->>'days_before')::int, x.ord
  from jsonb_array_elements(p_steps) with ordinality as x (v, ord)
  where x.v->>'id' is null;
end;
$$;

revoke all on function public.save_recipe(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.save_recipe(uuid, jsonb, jsonb) to authenticated;
