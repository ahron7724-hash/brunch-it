-- Raw material categories (dairy base, doughs, disposables, branding…), editable from the admin,
-- plus a starter list of basic ingredients. Safe to run again: existing names are left as they are.

create table public.material_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (char_length(name) between 1 and 60),
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.raw_materials
  add column category_id uuid references public.material_categories (id) on delete set null;

create index raw_materials_category_idx on public.raw_materials (category_id);

alter table public.material_categories enable row level security;

create policy "admin read" on public.material_categories for select to authenticated using ((select public.is_admin()));
create policy "admin insert" on public.material_categories for insert to authenticated with check ((select public.is_admin()));
create policy "admin update" on public.material_categories for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin delete" on public.material_categories for delete to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Starter data
-- ---------------------------------------------------------------------------

insert into public.material_categories (name, sort_order) values
  ('בסיס חלבי', 1),
  ('ביצים ושומנים', 2),
  ('בצקים', 3),
  ('קמחים ואפייה', 4),
  ('ירקות', 5),
  ('תבלינים ורטבים', 6),
  ('חד פעמי ואריזה', 7),
  ('מיתוג', 8)
on conflict (name) do nothing;

insert into public.raw_materials (name, unit, tracking, category_id)
select x.name, x.unit, x.tracking, c.id
from (values
  -- בסיס חלבי
  ('שמנת מתוקה 38%', 'ml', 'measured', 'בסיס חלבי'),
  ('שמנת לבישול 10%', 'ml', 'measured', 'בסיס חלבי'),
  ('חלב 3%', 'ml', 'measured', 'בסיס חלבי'),
  ('גבינה לבנה 5%', 'g', 'measured', 'בסיס חלבי'),
  ('קוטג׳', 'g', 'measured', 'בסיס חלבי'),
  ('גבינת שמנת', 'g', 'measured', 'בסיס חלבי'),
  ('גבינה צהובה מגוררת', 'g', 'measured', 'בסיס חלבי'),
  ('מוצרלה מגוררת', 'g', 'measured', 'בסיס חלבי'),
  ('בולגרית', 'g', 'measured', 'בסיס חלבי'),
  ('פרמזן', 'g', 'measured', 'בסיס חלבי'),
  ('חמאה', 'g', 'measured', 'בסיס חלבי'),
  -- ביצים ושומנים
  ('ביצים', 'unit', 'measured', 'ביצים ושומנים'),
  ('שמן קנולה', 'ml', 'measured', 'ביצים ושומנים'),
  ('שמן זית', 'ml', 'measured', 'ביצים ושומנים'),
  ('מרגרינה', 'g', 'measured', 'ביצים ושומנים'),
  -- בצקים
  ('בצק פריך', 'g', 'measured', 'בצקים'),
  ('בצק עלים', 'g', 'measured', 'בצקים'),
  ('בצק שמרים', 'g', 'measured', 'בצקים'),
  ('בצק פילו', 'g', 'measured', 'בצקים'),
  -- קמחים ואפייה
  ('קמח לבן', 'g', 'measured', 'קמחים ואפייה'),
  ('קמח מלא', 'g', 'measured', 'קמחים ואפייה'),
  ('סוכר', 'g', 'measured', 'קמחים ואפייה'),
  ('אבקת אפייה', 'g', 'measured', 'קמחים ואפייה'),
  ('שמרים יבשים', 'g', 'measured', 'קמחים ואפייה'),
  ('קורנפלור', 'g', 'measured', 'קמחים ואפייה'),
  ('שומשום', 'g', 'measured', 'קמחים ואפייה'),
  -- ירקות (ידני)
  ('בצל', 'unit', 'manual', 'ירקות'),
  ('שום', 'unit', 'manual', 'ירקות'),
  ('תרד', 'unit', 'manual', 'ירקות'),
  ('ברוקולי', 'unit', 'manual', 'ירקות'),
  ('פטריות', 'unit', 'manual', 'ירקות'),
  ('בטטה', 'unit', 'manual', 'ירקות'),
  ('תפוחי אדמה', 'unit', 'manual', 'ירקות'),
  ('קישואים', 'unit', 'manual', 'ירקות'),
  ('פלפלים', 'unit', 'manual', 'ירקות'),
  ('עגבניות שרי', 'unit', 'manual', 'ירקות'),
  ('תירס', 'unit', 'manual', 'ירקות'),
  -- תבלינים ורטבים
  ('מלח', 'g', 'measured', 'תבלינים ורטבים'),
  ('פלפל שחור', 'g', 'measured', 'תבלינים ורטבים'),
  ('אגוז מוסקט', 'g', 'measured', 'תבלינים ורטבים'),
  ('פפריקה', 'g', 'measured', 'תבלינים ורטבים'),
  ('אורגנו', 'g', 'measured', 'תבלינים ורטבים'),
  ('רוטב עגבניות', 'ml', 'measured', 'תבלינים ורטבים'),
  -- חד פעמי ואריזה
  ('תבניות אלומיניום', 'unit', 'measured', 'חד פעמי ואריזה'),
  ('מכסים לתבניות', 'unit', 'measured', 'חד פעמי ואריזה'),
  ('קופסאות קרטון', 'unit', 'measured', 'חד פעמי ואריזה'),
  ('מגשי הגשה', 'unit', 'measured', 'חד פעמי ואריזה'),
  ('נייר אפייה', 'unit', 'measured', 'חד פעמי ואריזה'),
  ('ניילון נצמד', 'unit', 'measured', 'חד פעמי ואריזה'),
  ('שקיות', 'unit', 'measured', 'חד פעמי ואריזה'),
  -- מיתוג
  ('מדבקות לוגו', 'unit', 'measured', 'מיתוג'),
  ('כרטיסי ברכה', 'unit', 'measured', 'מיתוג'),
  ('סרט קישוט', 'unit', 'measured', 'מיתוג'),
  ('שקיות ממותגות', 'unit', 'measured', 'מיתוג')
) as x (name, unit, tracking, category)
join public.material_categories c on c.name = x.category
on conflict (name) do nothing;
