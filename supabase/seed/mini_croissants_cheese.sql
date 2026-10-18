-- Separate product: mini croissants with cheeses & roasted antipasti (tray of 15), created hidden with price 0.
-- Also removes the "גבינות ואנטיפסטי קלוי" filling that was briefly added to the original mini croissant tray
-- (its recipe rows are deleted with it) and restores that tray's steps and description.
-- Estimates per croissant: 10 g white cheese 5% + 5 g bulgarian; vegetables, herbs, lettuce and sprouts are manual.
-- Safe to run once: stops if the new product already exists.

do $$
declare
  v_old uuid;
  v_new uuid;
begin
  if exists (select 1 from public.products where slug = 'מגש-מיני-קרואסונים-גבינות-ואנטיפסטי') then
    raise exception 'המוצר כבר קיים';
  end if;
  select id into v_old from public.products where slug = 'מגש-מיני-קרואסונים';

  -- 1. The original tray goes back to two fillings.
  delete from public.product_options where product_id = v_old and label = 'גבינות ואנטיפסטי קלוי';
  delete from public.prep_steps where product_id = v_old and title like 'קליית ירקות אנטיפסטי%';
  update public.prep_steps set sort_order = sort_order - 1 where product_id = v_old and sort_order > 2;
  update public.prep_steps set title = 'בבוקר: סלט ביצים / ממרח אבוקדו, שטיפת חסה'
  where product_id = v_old and title like 'בבוקר: סלט ביצים / ממרח אבוקדו / ממרח גבינות%';
  update public.products
  set description = 'מיני קרואסונים פריכים מבצק עלים וחמאה, ממולאים בחומרי גלם טריים: סלט ביצים קלאסי עם עירית וחסה, או אבוקדו, חסה וסלמון מעושן. מוגש מסודר על מצע נבטים ועלים רעננים.'
  where id = v_old;

  -- 2. The new product.
  insert into public.products (title, slug, description, contents, diet_tags, is_active, sort_order)
  values (
    'מגש מיני קרואסונים גבינות ואנטיפסטי',
    'מגש-מיני-קרואסונים-גבינות-ואנטיפסטי',
    'מיני קרואסונים אווריריים ופריכים מבצק עלים וחמאה, במילוי עשיר של גבינות וירקות אנטיפסטי קלויים בתנור: פלפל אדום, חציל, קישואים וזיתים שחורים, עם עלים רעננים. מוגש בשורות צפופות במגש אירוח.',
    'מיני קרואסונים, ממרח גבינות ועשבי תיבול, ירקות אנטיפסטי קלויים, עלי חסה, נבטים',
    array['dairy'],
    false,
    0
  )
  returning id into v_new;

  insert into public.product_sizes (product_id, label, price, serves, unit_count, sort_order)
  values (v_new, 'מגש 15 יחידות', 0, '15 מיני קרואסונים', 15, 0);

  insert into public.recipe_items (product_id, option_id, raw_material_id, amount_per_unit, sort_order)
  select v_new, null, m.id, x.amount, x.ord
  from (values
    ('מיני קרואסון (מוכן לאפייה)', 1.0, 1),
    ('גבינה לבנה 5%', 10.0, 2),
    ('בולגרית', 5.0, 3),
    ('פלפלים', null, 4),
    ('חציל', null, 5),
    ('קישואים', null, 6),
    ('זיתים שחורים', null, 7),
    ('עשבי תיבול טריים', null, 8),
    ('חסה', null, 9),
    ('נבטי אלפלפא', null, 10)
  ) as x (name, amount, ord)
  join public.raw_materials m on m.name = x.name;

  insert into public.prep_steps (product_id, title, days_before, sort_order) values
    (v_new, 'קליית ירקות אנטיפסטי (פלפל, חציל, קישוא, זיתים) בשמן זית ועשבי תיבול', 1, 1),
    (v_new, 'בבוקר: אפיית קרואסונים וקירור', 0, 2),
    (v_new, 'בבוקר: ממרח גבינות ועשבי תיבול, שטיפת חסה', 0, 3),
    (v_new, 'חיתוך לרוחב, חסה ואז מילוי, סידור בשורות צפופות – סמוך לאיסוף', 0, 4);
end;
$$;
