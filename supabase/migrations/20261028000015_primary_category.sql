-- The one category a product is listed under in the grouped catalog
-- (a product can belong to several categories; it still shows on each category page).
-- null = the first of its categories by category order.

alter table public.products
  add column primary_category_id uuid references public.categories (id) on delete set null;

-- Starting choice for products in several categories: the most specific one (editable per product).
update public.products p
set primary_category_id = c.id
from (values
  ('קרואסונים במילוי', 'מאפים'),
  ('קרואסון חמאה', 'מאפים'),
  ('לחמניות ביס ירקות וסלט ביצים', 'מאפים'),
  ('לחמניות ביס אנטיפסטי', 'מאפים'),
  ('מגש פיצות מיני', 'מאפים'),
  ('סושי טורטייה', 'מאפים'),
  ('מגש מאפי בוקר', 'מאפים'),
  ('מיני בייגלס במילוי טונה', 'מאפים'),
  ('פיתות ביס במילוי קציצת ירק', 'מאפים'),
  ('קרואסון סלמון', 'דגים'),
  ('מאפי סלמון מפורק', 'דגים'),
  ('כריכוני סלמון מעושן', 'דגים'),
  ('פחזניות וניל', 'מתוקים'),
  ('קראנץ שמרים', 'מתוקים'),
  ('סינבון', 'מתוקים'),
  ('עוגיות שוקולד ציפס חמאה חומה', 'מתוקים'),
  ('לחמניות ובייגלס מתוק כפרי', 'מתוקים')
) as x (product, category)
join public.categories c on c.name = x.category
where p.title = x.product;
