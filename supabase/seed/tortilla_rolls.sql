-- Product: tortilla "sushi" roll tray (מגש רולים טורטייה), two sizes (25 / 35), assorted fillings
-- chosen by the kitchen (no customer choice). Created hidden with price 0.
--
-- Per unit (one slice): a large tortilla gives ~8 slices → 0.12 tortilla (25 → 3, 35 → 5).
-- Spreads aren't quantified in the recipe; estimate ~40 g per tortilla (≈ 2½–3 tbsp), across the
-- 5 fillings: tahini in 2 of 5 (antipasti, sabich), mayo in 2 of 5 (coleslaw, mushrooms),
-- avocado in 1 (manual) → tahini 2/5 × 40/8 = 2 g, mayo 2 g per slice. Estimates – adjust in the recipe page.
-- Lemon juice, salt, oil, spices and plastic wrap aren't tracked.

do $$
declare
  v_product uuid;
  c_veg uuid;
  c_sauce uuid;
  c_dough uuid;
begin
  if exists (select 1 from public.products where slug = 'מגש-רולים-טורטייה') then
    raise exception 'המוצר מגש רולים טורטייה כבר קיים';
  end if;

  select id into c_veg from public.material_categories where name = 'ירקות';
  select id into c_sauce from public.material_categories where name = 'תבלינים ורטבים';
  select id into c_dough from public.material_categories where name = 'בצקים';

  insert into public.raw_materials (name, unit, tracking, category_id) values
    ('טורטייה גדולה', 'unit', 'measured', c_dough),
    ('טחינה גולמית', 'g', 'measured', c_sauce),
    ('אבוקדו', 'unit', 'manual', c_veg),
    ('גזר', 'unit', 'manual', c_veg),
    ('כרוב סגול', 'unit', 'manual', c_veg),
    ('מלפפון חמוץ', 'unit', 'manual', c_veg),
    ('עגבניות', 'unit', 'manual', c_veg)
  on conflict (name) do nothing;

  insert into public.products (title, slug, description, contents, diet_tags, is_active, sort_order)
  values (
    'מגש רולים טורטייה',
    'מגש-רולים-טורטייה',
    'רולים של טורטייה חתוכים בסגנון סושי, במבחר מילויי ירקות: אנטיפסטי וטחינה, אבוקדו וירקות פריכים, סביח, קולסלאו מקסיקני, פטריות ובצל מקורמל.',
    'טורטייה, ממרח מקשר (טחינה / אבוקדו / מיונז), ירקות טריים וקלויים',
    array['parve'],
    false,
    0
  )
  returning id into v_product;

  insert into public.product_sizes (product_id, label, price, serves, unit_count, sort_order) values
    (v_product, 'מגש 25 רולים', 0, '3 טורטיות, מילויים מגוונים', 25, 0),
    (v_product, 'מגש 35 רולים', 0, '4–5 טורטיות, מילויים מגוונים', 35, 1);

  insert into public.recipe_items (product_id, option_id, raw_material_id, amount_per_unit, sort_order)
  select v_product, null, m.id, x.amount, x.ord
  from (values
    ('טורטייה גדולה', 0.12, 1),
    ('טחינה גולמית', 2.0, 2),
    ('מיונז', 2.0, 3)
  ) as x (name, amount, ord)
  join public.raw_materials m on m.name = x.name;

  insert into public.recipe_items (product_id, option_id, raw_material_id, amount_per_unit, sort_order)
  select v_product, null, m.id, null, x.ord
  from (values
    ('פלפלים', 10), ('חציל', 11), ('קישואים', 12), ('אבוקדו', 13), ('גזר', 14), ('מלפפון', 15),
    ('מלפפון חמוץ', 16), ('עגבניות', 17), ('פטרוזיליה', 18), ('כרוב סגול', 19), ('זיתים שחורים', 20),
    ('פטריות', 21), ('בצל', 22), ('לימון', 23)
  ) as x (name, ord)
  join public.raw_materials m on m.name = x.name;

  insert into public.prep_steps (product_id, title, days_before, sort_order) values
    (v_product, 'קליית פלפלים, חציל וקישוא · הקפצת פטריות ובצל מקורמל', 1, 1),
    (v_product, 'ממרחים: טחינה סמיכה ומיונז מתובל', 1, 2),
    (v_product, 'בבוקר: ירקות טריים ואבוקדו, מריחה, גלגול הדוק ועטיפה בניילון – לפחות 30 דקות במקרר', 0, 3),
    (v_product, 'חיתוך לפרוסות של 2–2.5 ס״מ וסידור במגש – סמוך לאיסוף', 0, 4);
end;
$$;
