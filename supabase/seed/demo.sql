-- Demo content so the site has something to show before the owner adds her own.
-- Everything here can be edited or deleted from the admin panel.
-- Images point to placeholder files in /public/demo.

insert into public.categories (name, slug, description, image_url, sort_order) values
  ('ימי הולדת', 'ימי-הולדת', 'עוגות מעוצבות לימי הולדת, מהגיל הראשון ועד המאה.', '/demo/photo-berry.webp', 1),
  ('בר ובת מצווה', 'בר-ובת-מצווה', 'עוגות קומות ועוגות מרשימות לשמחות גדולות.', '/demo/photo-vanilla.webp', 2),
  ('עוגות בנטו', 'עוגות-בנטו', 'עוגות קטנות ואישיות, עם כיתוב לבחירתכם.', '/demo/photo-caramel.webp', 3),
  ('ללא גלוטן', 'ללא-גלוטן', 'עוגות וטארטים ללא חיטה, באותה הקפדה על הטעם.', '/demo/photo-pistachio.webp', 4);

with p as (
  insert into public.products
    (title, slug, description, contents, min_lead_time_hours, diet_tags, allows_custom_text, custom_text_label, is_featured, sort_order)
  values
    ('עוגת שכבות פיסטוק ופטל', 'עוגת-שכבות-פיסטוק-ופטל',
     'שכבות טורט פיסטוק רכות, קרם מסקרפונה פיסטוק וריבת פטל ביתית. מעוטרת בפיסטוקים קלויים ופטל טרי.',
     'טורט פיסטוק, קרם מסקרפונה, ריבת פטל, פיסטוקים קלויים', 48, '{dairy}', true, 'כיתוב על העוגה', true, 1),
    ('עוגת בנטו עם כיתוב אישי', 'עוגת-בנטו-עם-כיתוב-אישי',
     'עוגה קטנה בקופסה, בעיצוב נקי ועם כיתוב לבחירתכם. מתאימה למתנה או לחגיגה קטנה.',
     'טורט וניל או שוקולד, קרם חמאה, כיתוב בזילוף', 24, '{dairy}', true, 'כיתוב על העוגה', true, 2),
    ('עוגת שוקולד בלגי בשלוש קומות', 'עוגת-שוקולד-בלגי-בשלוש-קומות',
     'עוגת קומות מרשימה משוקולד בלגי, גנאש מריר וקרם שוקולד חלב. מתאימה לבר ובת מצווה ולאירועים גדולים.',
     'טורט שוקולד, גנאש מריר, קרם שוקולד חלב, עיטורי שוקולד', 120, '{dairy}', true, 'כיתוב על העוגה', true, 3),
    ('טארט פירות יער', 'טארט-פירות-יער',
     'בצק פריך ללא גלוטן, קרם שקדים ופירות יער טריים. פרווה.',
     'בצק פריך ללא גלוטן, קרם שקדים, פירות יער', 48, '{parve,gluten_free}', false, null, true, 4),
    ('עוגת קרמל מלוח ואגוזי פקאן', 'עוגת-קרמל-מלוח-ואגוזי-פקאן',
     'טורט חום בהיר, רוטב קרמל מלוח ביתי ופקאן מסוכר.',
     'טורט חמאה חומה, קרמל מלוח, פקאן מסוכר', 48, '{dairy}', true, 'כיתוב על העוגה', false, 5),
    ('עוגת וניל ופרחים', 'עוגת-וניל-ופרחים',
     'עוגה לבנה ועדינה בעיצוב פרחי בצק סוכר. בחירה מושלמת לבת מצווה.',
     'טורט וניל, קרם וניל צרפתי, פרחי בצק סוכר', 72, '{dairy}', true, 'כיתוב על העוגה', false, 6),
    ('עוגת גזר טבעונית', 'עוגת-גזר-טבעונית',
     'עוגת גזר עשירה עם אגוזי מלך וקרם קשיו לימוני. ללא מוצרים מן החי.',
     'עוגת גזר, אגוזי מלך, קרם קשיו לימוני', 48, '{parve,vegan}', false, null, false, 7),
    ('מגש פטיפורים', 'מגש-פטיפורים',
     'מבחר פטיפורים קטנים: טארטלטים, מקרונים וכדורי שוקולד. מתאים לאירוח ולשולחן קינוחים.',
     'טארטלטים, מקרונים, כדורי שוקולד, עוגיות חמאה', 48, '{dairy}', false, null, false, 8)
  returning id, slug
),
-- Categories (many-to-many)
pc as (
  insert into public.product_categories (product_id, category_id)
  select p.id, c.id from p join public.categories c on (p.slug, c.slug) in (
    ('עוגת-שכבות-פיסטוק-ופטל', 'ימי-הולדת'),
    ('עוגת-בנטו-עם-כיתוב-אישי', 'עוגות-בנטו'),
    ('עוגת-בנטו-עם-כיתוב-אישי', 'ימי-הולדת'),
    ('עוגת-שוקולד-בלגי-בשלוש-קומות', 'בר-ובת-מצווה'),
    ('טארט-פירות-יער', 'ללא-גלוטן'),
    ('עוגת-קרמל-מלוח-ואגוזי-פקאן', 'ימי-הולדת'),
    ('עוגת-וניל-ופרחים', 'בר-ובת-מצווה'),
    ('עוגת-וניל-ופרחים', 'ימי-הולדת'),
    ('עוגת-גזר-טבעונית', 'ללא-גלוטן'),
    ('מגש-פטיפורים', 'בר-ובת-מצווה')
  )
  returning 1
),
-- Sizes (up to 3 each)
s as (
  insert into public.product_sizes (product_id, label, price, serves, sort_order)
  select p.id, v.label, v.price, v.serves, v.sort_order from p join (values
    ('עוגת-שכבות-פיסטוק-ופטל', 'קטנה', 260, '8–10 סועדים', 1),
    ('עוגת-שכבות-פיסטוק-ופטל', 'בינונית', 320, '12–14 סועדים', 2),
    ('עוגת-שכבות-פיסטוק-ופטל', 'גדולה', 420, '18–20 סועדים', 3),
    ('עוגת-בנטו-עם-כיתוב-אישי', 'אחידה', 140, '2–4 סועדים', 1),
    ('עוגת-שוקולד-בלגי-בשלוש-קומות', 'שתי קומות', 690, '25 סועדים', 1),
    ('עוגת-שוקולד-בלגי-בשלוש-קומות', 'שלוש קומות', 890, '40 סועדים', 2),
    ('טארט-פירות-יער', 'קוטר 22', 210, '8–10 סועדים', 1),
    ('טארט-פירות-יער', 'קוטר 28', 290, '12–14 סועדים', 2),
    ('עוגת-קרמל-מלוח-ואגוזי-פקאן', 'בינונית', 300, '12 סועדים', 1),
    ('עוגת-קרמל-מלוח-ואגוזי-פקאן', 'גדולה', 390, '18 סועדים', 2),
    ('עוגת-וניל-ופרחים', 'קומה אחת', 380, '15 סועדים', 1),
    ('עוגת-וניל-ופרחים', 'שתי קומות', 640, '30 סועדים', 2),
    ('עוגת-גזר-טבעונית', 'אחידה', 230, '10–12 סועדים', 1),
    ('מגש-פטיפורים', '30 יחידות', 240, '30 יחידות', 1),
    ('מגש-פטיפורים', '50 יחידות', 380, '50 יחידות', 2),
    ('מגש-פטיפורים', '80 יחידות', 580, '80 יחידות', 3)
  ) as v (slug, label, price, serves, sort_order) on v.slug = p.slug
  returning 1
),
-- Images (up to 3 each)
i as (
  insert into public.product_images (product_id, url, alt, sort_order)
  select p.id, v.url, v.alt, v.sort_order from p join (values
    ('עוגת-שכבות-פיסטוק-ופטל', '/demo/photo-pistachio.webp', 'עוגת שכבות פיסטוק ופטל', 1),
    ('עוגת-שכבות-פיסטוק-ופטל', '/demo/photo-berry.webp', 'חתך של עוגת הפיסטוק', 2),
    ('עוגת-שכבות-פיסטוק-ופטל', '/demo/photo-cream.webp', 'עיטור פטל טרי', 3),
    ('עוגת-בנטו-עם-כיתוב-אישי', '/demo/photo-vanilla.webp', 'עוגת בנטו עם כיתוב', 1),
    ('עוגת-בנטו-עם-כיתוב-אישי', '/demo/photo-caramel.webp', 'עוגת בנטו בקופסה', 2),
    ('עוגת-שוקולד-בלגי-בשלוש-קומות', '/demo/photo-chocolate.webp', 'עוגת שוקולד בשלוש קומות', 1),
    ('עוגת-שוקולד-בלגי-בשלוש-קומות', '/demo/photo-caramel.webp', 'עיטורי שוקולד', 2),
    ('טארט-פירות-יער', '/demo/photo-berry.webp', 'טארט פירות יער', 1),
    ('עוגת-קרמל-מלוח-ואגוזי-פקאן', '/demo/photo-caramel.webp', 'עוגת קרמל מלוח', 1),
    ('עוגת-וניל-ופרחים', '/demo/photo-vanilla.webp', 'עוגת וניל עם פרחי בצק סוכר', 1),
    ('עוגת-וניל-ופרחים', '/demo/photo-cream.webp', 'פרחי בצק סוכר', 2),
    ('עוגת-גזר-טבעונית', '/demo/photo-citrus.webp', 'עוגת גזר טבעונית', 1),
    ('מגש-פטיפורים', '/demo/photo-savory.webp', 'מגש פטיפורים', 1),
    ('מגש-פטיפורים', '/demo/photo-greens.webp', 'פטיפורים מקרוב', 2)
  ) as v (slug, url, alt, sort_order) on v.slug = p.slug
  returning 1
)
-- Flavor options
insert into public.product_options (product_id, group_name, label, extra_price, sort_order)
select p.id, v.group_name, v.label, v.extra_price, v.sort_order from p join (values
  ('עוגת-בנטו-עם-כיתוב-אישי', 'טעם', 'וניל', 0, 1),
  ('עוגת-בנטו-עם-כיתוב-אישי', 'טעם', 'שוקולד', 0, 2),
  ('עוגת-בנטו-עם-כיתוב-אישי', 'טעם', 'רד ולווט', 15, 3),
  ('עוגת-שוקולד-בלגי-בשלוש-קומות', 'מילוי', 'גנאש מריר', 0, 1),
  ('עוגת-שוקולד-בלגי-בשלוש-קומות', 'מילוי', 'קרם פרלינה', 40, 2),
  ('עוגת-וניל-ופרחים', 'צבע הפרחים', 'לבן', 0, 1),
  ('עוגת-וניל-ופרחים', 'צבע הפרחים', 'ורוד עתיק', 0, 2),
  ('עוגת-וניל-ופרחים', 'צבע הפרחים', 'שמנת וזהב', 25, 3)
) as v (slug, group_name, label, extra_price, sort_order) on v.slug = p.slug;

insert into public.testimonials (client_name, content, event_label, rating, sort_order) values
  ('מיכל א.', 'העוגה ליום ההולדת של נועה הייתה בדיוק כמו בסקיצה, והפיסטוק נעלם תוך דקות.', 'יום הולדת', 5, 1),
  ('רונית ש.', 'הזמנתי שלושה ימים מראש, אספתי בזמן, והכל היה ארוז בצורה מושלמת לנסיעה.', 'אירוע משפחתי', 5, 2),
  ('דוד ל.', 'עוגת הבר מצווה הייתה הדבר שכולם צילמו, וגם הטעם עמד בציפיות.', 'בר מצווה', 5, 3);

insert into public.hero_slides (url, alt, sort_order) values
  ('/demo/hero-1.webp', 'עוגת שוקולד מעוצבת', 1),
  ('/demo/hero-2.webp', 'עוגת פיסטוק', 2),
  ('/demo/hero-3.webp', 'עוגת פירות יער', 3);

insert into public.strip_images (strip, url, alt, sort_order) values
  ('top', '/demo/photo-pistachio.webp', 'קרם פיסטוק', 1),
  ('top', '/demo/photo-chocolate.webp', 'שכבות שוקולד', 2),
  ('top', '/demo/photo-vanilla.webp', 'פרחי בצק סוכר', 3),
  ('top', '/demo/photo-caramel.webp', 'קרמל מלוח', 4),
  ('top', '/demo/photo-berry.webp', 'פירות יער', 5),
  ('top', '/demo/photo-cream.webp', 'זילוף וניל', 6),
  ('bottom', '/demo/photo-savory.webp', 'פטיפורים', 1),
  ('bottom', '/demo/photo-citrus.webp', 'טארט הדרים', 2),
  ('bottom', '/demo/photo-greens.webp', 'עיטור עלים', 3),
  ('bottom', '/demo/photo-berry.webp', 'פטל טרי', 4),
  ('bottom', '/demo/photo-chocolate.webp', 'גנאש מריר', 5),
  ('bottom', '/demo/photo-pistachio.webp', 'פיסטוק קלוי', 6);

insert into public.gallery_images (url, alt, caption, sort_order) values
  ('/demo/photo-vanilla.webp', 'שולחן קינוחים בבת מצווה', 'בת מצווה, אביב 2026', 1),
  ('/demo/photo-chocolate.webp', 'עוגת קומות באולם', 'בר מצווה', 2),
  ('/demo/photo-berry.webp', 'עוגת יום הולדת', 'יום הולדת 40', 3),
  ('/demo/photo-savory.webp', 'מגשי פטיפורים', 'אירוע חברה', 4),
  ('/demo/photo-pistachio.webp', 'עוגת פיסטוק', 'ארוחת שישי משפחתית', 5),
  ('/demo/photo-cream.webp', 'עוגת חתונה קטנה', 'חתונה בחצר', 6);

update public.pages set
  hero_image_url = '/demo/about.webp',
  body_text = E'## איך הכל התחיל\n\nהכל התחיל במטבח הביתי, עם עוגת יום הולדת אחת שחברה ביקשה. היום אנחנו סטודיו קטן לעוגות מעוצבות, ועדיין אופות בכמויות קטנות.\n\n## איך אנחנו עובדות\n\nאנחנו מקבלות מספר מוגבל של הזמנות בכל יום, כדי שכל עוגה תקבל את הזמן שהיא צריכה. חומרי הגלם נבחרים בקפידה: חמאה אמיתית, שוקולד בלגי ופירות טריים.\n\nכל עיצוב נבנה יחד איתכם, משיחה קצרה על האירוע ועל מי שחוגג ועד הפרט האחרון.'
where slug = 'about';

update public.pages set
  hero_image_url = null,
  body_text = E'## סוג הכשרות\n\nכל המוצרים כשרים חלבי, חלב ישראל, בהשגחת הרבנות המקומית.\n\n## הנחיות\n\nמוצרים המסומנים "פרווה" מיוצרים על כלים פרווה ואינם מכילים מוצרי חלב.\n\nהמוצרים אינם מתאימים לפסח.',
  extra = '{"certificateUrl": "/demo/kashrut-certificate.webp", "supervision": "רבנות מקומית – כשר חלבי, חלב ישראל", "validUntil": "2027-03-31"}'::jsonb
where slug = 'kashrut';



