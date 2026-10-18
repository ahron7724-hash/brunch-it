-- Product: mini croissant tray (מגש מיני קרואסונים), one size of 15, choice of filling.
-- Created hidden with price 0. The recipe gives no amounts, so these are estimates per croissant:
--   egg salad: ½ egg + 8 g mayo · salmon: 10 g smoked salmon · 1 ready mini croissant each.
-- Mustard isn't tracked; lettuce, chives, avocado and alfalfa sprouts are manual.

do $$
declare
  v_product uuid;
  o_egg uuid;
  o_salmon uuid;
  c_veg uuid;
  c_dough uuid;
begin
  if exists (select 1 from public.products where slug = 'מגש-מיני-קרואסונים') then
    raise exception 'המוצר מגש מיני קרואסונים כבר קיים';
  end if;

  select id into c_veg from public.material_categories where name = 'ירקות';
  select id into c_dough from public.material_categories where name = 'בצקים';

  insert into public.raw_materials (name, unit, tracking, category_id) values
    ('מיני קרואסון (מוכן לאפייה)', 'unit', 'measured', c_dough),
    ('סלמון מעושן', 'g', 'measured', null),
    ('חסה', 'unit', 'manual', c_veg),
    ('נבטי אלפלפא', 'unit', 'manual', c_veg)
  on conflict (name) do nothing;

  insert into public.products (title, slug, description, contents, diet_tags, is_active, sort_order)
  values (
    'מגש מיני קרואסונים',
    'מגש-מיני-קרואסונים',
    'מיני קרואסונים פריכים מבצק עלים וחמאה, ממולאים בחומרי גלם טריים: סלט ביצים קלאסי עם עירית וחסה, או אבוקדו, חסה וסלמון מעושן. מוגש מסודר על מצע נבטים ועלים רעננים.',
    'מיני קרואסונים, מילוי לבחירה, עלי חסה, נבטי אלפלפא',
    array['dairy'],
    false,
    0
  )
  returning id into v_product;

  insert into public.product_sizes (product_id, label, price, serves, unit_count, sort_order) values
    (v_product, 'מגש 15 יחידות', 0, '15 מיני קרואסונים', 15, 0);

  insert into public.product_options (product_id, group_name, label, extra_price, sort_order)
  values (v_product, 'מילוי', 'סלט ביצים קלאסי', 0, 0) returning id into o_egg;
  insert into public.product_options (product_id, group_name, label, extra_price, sort_order)
  values (v_product, 'מילוי', 'אבוקדו, חסה וסלמון מעושן', 0, 1) returning id into o_salmon;

  insert into public.recipe_items (product_id, option_id, raw_material_id, amount_per_unit, sort_order)
  select v_product, x.option_id, m.id, x.amount, x.ord
  from (values
    -- Base: every croissant, lettuce under the filling, sprouts on the tray.
    (null::uuid, 'מיני קרואסון (מוכן לאפייה)', 1.0, 1),
    (null::uuid, 'חסה', null, 2),
    (null::uuid, 'נבטי אלפלפא', null, 3),
    -- Egg salad.
    (o_egg, 'ביצים', 0.5, 1),
    (o_egg, 'מיונז', 8.0, 2),
    (o_egg, 'עירית', null, 3),
    -- Avocado & salmon.
    (o_salmon, 'סלמון מעושן', 10.0, 1),
    (o_salmon, 'אבוקדו', null, 2)
  ) as x (option_id, name, amount, ord)
  join public.raw_materials m on m.name = x.name;

  insert into public.prep_steps (product_id, title, days_before, sort_order) values
    (v_product, 'בישול ביצים קשות', 1, 1),
    (v_product, 'בבוקר: אפיית קרואסונים וקירור', 0, 2),
    (v_product, 'בבוקר: סלט ביצים / ממרח אבוקדו, שטיפת חסה', 0, 3),
    (v_product, 'חיתוך לרוחב, חסה ואז מילוי, סידור בשורות על נבטים – סמוך לאיסוף', 0, 4);
end;
$$;
