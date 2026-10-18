-- Product: personal quiches (קישים אישיים), two tray sizes (25 / 35), recipe per single quiche,
-- five fillings, and prep steps. Created hidden with price 0 – set prices in the admin panel, then publish.
-- Per-unit amounts come from the 35-quiche recipe divided by 35.
-- Water, white pepper and nutmeg (a pinch) aren't tracked.

do $$
declare
  v_product uuid;
  v_veg_category uuid;
  o_onion uuid; o_roasted uuid; o_corn uuid; o_potato uuid; o_spinach uuid;
begin
  if exists (select 1 from public.products where slug = 'קישים-אישיים') then
    raise exception 'המוצר קישים אישיים כבר קיים';
  end if;

  -- Missing vegetables (manual tracking, counted in units).
  select id into v_veg_category from public.material_categories where name = 'ירקות';
  insert into public.raw_materials (name, unit, tracking, category_id) values
    ('חציל', 'unit', 'manual', v_veg_category),
    ('פטרוזיליה', 'unit', 'manual', v_veg_category),
    ('זיתים ירוקים', 'unit', 'manual', v_veg_category)
  on conflict (name) do nothing;

  insert into public.products (title, slug, description, contents, diet_tags, is_active, sort_order)
  values (
    'קישים אישיים',
    'קישים-אישיים',
    'קישים אישיים בקוטר 7–8 ס״מ: בצק פריך, בלילת רויאל עשירה ומילוי לבחירה. מגיעים במגש של 25 או 35 יחידות.',
    'בצק פריך, בלילת ביצים, חלב וגבינה צהובה, מילוי לבחירה',
    array['dairy'],
    false,
    0
  )
  returning id into v_product;

  insert into public.product_sizes (product_id, label, price, serves, unit_count, sort_order) values
    (v_product, 'מגש 25 קישים', 0, '25 קישים אישיים', 25, 0),
    (v_product, 'מגש 35 קישים', 0, '35 קישים אישיים', 35, 1);

  insert into public.product_options (product_id, group_name, label, extra_price, sort_order) values (v_product, 'טעם', 'בצל מקורמל', 0, 0) returning id into o_onion;
  insert into public.product_options (product_id, group_name, label, extra_price, sort_order) values (v_product, 'טעם', 'ירקות קלויים', 0, 1) returning id into o_roasted;
  insert into public.product_options (product_id, group_name, label, extra_price, sort_order) values (v_product, 'טעם', 'תירס ופטריות', 0, 2) returning id into o_corn;
  insert into public.product_options (product_id, group_name, label, extra_price, sort_order) values (v_product, 'טעם', 'בטטה ועשבי תיבול', 0, 3) returning id into o_potato;
  insert into public.product_options (product_id, group_name, label, extra_price, sort_order) values (v_product, 'טעם', 'תרד וזיתים', 0, 4) returning id into o_spinach;

  -- Base recipe per single quiche (dough + royale).
  insert into public.recipe_items (product_id, option_id, raw_material_id, amount_per_unit, sort_order)
  select v_product, null, m.id, x.amount, x.ord
  from (values
    ('קמח לבן', 14.2857, 1),           -- 500 g / 35
    ('מרגרינה', 5.1429, 2),            -- 180 g / 35
    ('ביצים', 0.1429, 3),              -- 1 (dough) + 4 (royale) = 5 / 35
    ('חלב 3%', 14.2857, 4),            -- 500 ml / 35
    ('קורנפלור', 0.7143, 5),           -- 25 g / 35
    ('גבינה צהובה מגוררת', 2.0, 6),    -- 70 g / 35
    ('מלח', 0.2571, 7)                 -- 1 tsp + ½ tsp ≈ 9 g / 35
  ) as x (name, amount, ord)
  join public.raw_materials m on m.name = x.name;

  -- Fillings: vegetables, manual (no amounts).
  insert into public.recipe_items (product_id, option_id, raw_material_id, amount_per_unit, sort_order)
  select v_product, x.option_id, m.id, null, x.ord
  from (values
    (o_onion, 'בצל', 1),
    (o_roasted, 'קישואים', 1), (o_roasted, 'פלפלים', 2), (o_roasted, 'חציל', 3),
    (o_corn, 'תירס', 1), (o_corn, 'פטריות', 2),
    (o_potato, 'בטטה', 1), (o_potato, 'פטרוזיליה', 2),
    (o_spinach, 'תרד', 1), (o_spinach, 'זיתים ירוקים', 2)
  ) as x (option_id, name, ord)
  join public.raw_materials m on m.name = x.name;

  insert into public.prep_steps (product_id, title, days_before, sort_order) values
    (v_product, 'בצק ותחתיות', 2, 1),
    (v_product, 'בלילת רויאל, בצל מקורמל וקליית ירקות', 1, 2),
    (v_product, 'מילוי ואפייה', 1, 3),
    (v_product, 'חימום, גימור ואריזה – סמוך לאיסוף או למשלוח', 0, 4);
end;
$$;
