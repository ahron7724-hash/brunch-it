-- Product: canapé tray (מגש קנאפס), two sizes (25 / 35), always all 5 flavors in equal parts
-- (5 or 7 of each), so there is no flavor choice: the recipe per unit is the tray average.
-- Created hidden with price 0 – set prices in the admin panel, then publish.
--
-- Per-unit amounts from the 35-tray recipe ÷ 35 (1 tbsp ≈ 15 g):
--   bread      10 slices (4 bases per slice)            → 0.28 slice
--   mayo       spread 45 g + tuna 15 g + eggs 15 g = 75 g → 2.1429 g
--   white 5%   spread 45 g + cucumber flavor ~8 g × 7 = 101 g → 2.8857 g   (8 g per canapé is an estimate)
--   tuna       ½ can                                     → 0.0143 can
--   eggs       2 (egg salad)                             → 0.0571
-- Salt, pepper, garlic powder, mustard, lemon juice and oil (a pinch / a little) aren't tracked.

do $$
declare
  v_product uuid;
  c_veg uuid;
  c_sauce uuid;
  c_baking uuid;
begin
  if exists (select 1 from public.products where slug = 'מגש-קנאפס') then
    raise exception 'המוצר מגש קנאפס כבר קיים';
  end if;

  select id into c_veg from public.material_categories where name = 'ירקות';
  select id into c_sauce from public.material_categories where name = 'תבלינים ורטבים';
  select id into c_baking from public.material_categories where name = 'קמחים ואפייה';

  insert into public.raw_materials (name, unit, tracking, category_id) values
    ('לחם קסטן (פרוסות)', 'unit', 'measured', c_baking),
    ('מיונז', 'g', 'measured', c_sauce),
    ('טונה (קופסה)', 'unit', 'measured', c_sauce),
    ('זיתים שחורים', 'unit', 'manual', c_veg),
    ('לימון', 'unit', 'manual', c_veg),
    ('עירית', 'unit', 'manual', c_veg),
    ('מלפפון', 'unit', 'manual', c_veg),
    ('שמיר', 'unit', 'manual', c_veg),
    ('עגבניות מיובשות', 'unit', 'manual', c_veg),
    ('עשבי תיבול טריים', 'unit', 'manual', c_veg)
  on conflict (name) do nothing;

  insert into public.products (title, slug, description, contents, diet_tags, is_active, sort_order)
  values (
    'מגש קנאפס',
    'מגש-קנאפס',
    'מגש קנאפס צבעוני ב־5 טעמים: פלפלים קלויים וזית שחור, מוס טונה ועשבי תיבול, סלט ביצים ועירית, מלפפון גבינה ושמיר, עגבניות מיובשות וזית ירוק. כמות שווה מכל טעם.',
    'בסיס לחם קלוי, ממרח גבינה ומיונז, 5 טעמים במגש אחד',
    array['dairy'],
    false,
    0
  )
  returning id into v_product;

  insert into public.product_sizes (product_id, label, price, serves, unit_count, sort_order) values
    (v_product, 'מגש 25 קנאפס', 0, '5 מכל טעם', 25, 0),
    (v_product, 'מגש 35 קנאפס', 0, '7 מכל טעם', 35, 1);

  -- Measured, per canapé (tray average).
  insert into public.recipe_items (product_id, option_id, raw_material_id, amount_per_unit, sort_order)
  select v_product, null, m.id, x.amount, x.ord
  from (values
    ('לחם קסטן (פרוסות)', 0.28, 1),
    ('מיונז', 2.1429, 2),
    ('גבינה לבנה 5%', 2.8857, 3),
    ('טונה (קופסה)', 0.0143, 4),
    ('ביצים', 0.0571, 5)
  ) as x (name, amount, ord)
  join public.raw_materials m on m.name = x.name;

  -- Vegetables and garnishes, manual (no amounts).
  insert into public.recipe_items (product_id, option_id, raw_material_id, amount_per_unit, sort_order)
  select v_product, null, m.id, null, x.ord
  from (values
    ('פלפלים', 10), ('זיתים שחורים', 11), ('פטרוזיליה', 12), ('לימון', 13), ('עירית', 14),
    ('מלפפון', 15), ('שמיר', 16), ('עגבניות מיובשות', 17), ('זיתים ירוקים', 18), ('עשבי תיבול טריים', 19)
  ) as x (name, ord)
  join public.raw_materials m on m.name = x.name;

  insert into public.prep_steps (product_id, title, days_before, sort_order) values
    (v_product, 'קליית פלפלים, ביצים קשות וממרחים (טונה, סלט ביצים, עגבניות מיובשות, ממרח בסיס)', 1, 1),
    (v_product, 'קריצה וקליית בסיסי לחם – לשמור בקופסה סגורה', 1, 2),
    (v_product, 'חיתוך מלפפון, עירית ועשבי תיבול – בבוקר', 0, 3),
    (v_product, 'מריחה, הרכבה וסידור במגש לפי צבעים – סמוך לאיסוף', 0, 4);
end;
$$;
