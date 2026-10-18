-- Lea site: initial schema (phase 1)

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create table public.admin_users (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.admin_users where id = (select auth.uid()));
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- Site settings (single row, edited from the admin "design & texts" screen)
-- ---------------------------------------------------------------------------

create table public.site_settings (
  id smallint primary key default 1 check (id = 1),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

create trigger site_settings_updated_at before update on public.site_settings
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Catalog
-- ---------------------------------------------------------------------------

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  image_url text,
  sort_order int not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger categories_updated_at before update on public.categories
  for each row execute function public.set_updated_at();

create table public.products (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text,
  contents text,                                   -- תכולה
  min_lead_time_hours int check (min_lead_time_hours >= 0), -- null = use the site default
  diet_tags text[] not null default '{}'
    check (diet_tags <@ array['dairy', 'parve', 'gluten_free', 'vegan']::text[]),
  allows_custom_text boolean not null default false,
  custom_text_label text,                          -- e.g. "כיתוב על העוגה"
  is_active boolean not null default true,
  is_featured boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger products_updated_at before update on public.products
  for each row execute function public.set_updated_at();

create table public.product_categories (
  product_id uuid not null references public.products (id) on delete cascade,
  category_id uuid not null references public.categories (id) on delete cascade,
  primary key (product_id, category_id)
);

create index product_categories_category_idx on public.product_categories (category_id);

-- Up to 3 images per product; the lowest sort_order is the catalog image.
create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index product_images_product_idx on public.product_images (product_id, sort_order);

-- Up to 3 sizes per product, each with its own price.
create table public.product_sizes (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  label text not null,                             -- e.g. "קטן", "בינוני", "גדול"
  price numeric(10, 2) not null check (price >= 0),
  serves text,                                     -- e.g. "10–12 סועדים"
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index product_sizes_product_idx on public.product_sizes (product_id, sort_order);

create or replace function public.enforce_max_three_per_product()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  existing int;
begin
  execute format('select count(*) from public.%I where product_id = $1 and id <> $2', tg_table_name)
    into existing
    using new.product_id, new.id;
  if existing >= 3 then
    raise exception 'מותר עד 3 פריטים מסוג זה לכל מוצר (%).', tg_table_name
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger product_images_max_three before insert or update of product_id on public.product_images
  for each row execute function public.enforce_max_three_per_product();

create trigger product_sizes_max_three before insert or update of product_id on public.product_sizes
  for each row execute function public.enforce_max_three_per_product();

-- Flavors / add-ons the customer picks on the product page.
create table public.product_options (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  group_name text not null default 'טעם',
  label text not null,
  extra_price numeric(10, 2) not null default 0 check (extra_price >= 0),
  sort_order int not null default 0,
  is_active boolean not null default true
);

create index product_options_product_idx on public.product_options (product_id, sort_order);

-- ---------------------------------------------------------------------------
-- Pickup scheduling
-- ---------------------------------------------------------------------------

create table public.time_slot_settings (
  id uuid primary key default gen_random_uuid(),
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0 = Sunday
  slot_start time not null,
  slot_end time not null,
  is_active boolean not null default true,
  check (slot_end > slot_start)
);

create index time_slot_settings_day_idx on public.time_slot_settings (day_of_week);

-- custom_slots: [{"start": "10:00", "end": "12:00"}, ...]; null = use the weekly slots.
create table public.date_overrides (
  id uuid primary key default gen_random_uuid(),
  override_date date not null unique,
  is_blocked boolean not null default false,
  custom_slots jsonb check (custom_slots is null or jsonb_typeof(custom_slots) = 'array'),
  note text
);

-- ---------------------------------------------------------------------------
-- Delivery
-- ---------------------------------------------------------------------------

create table public.delivery_zones (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10, 2) not null check (price >= 0),
  min_order numeric(10, 2) not null default 0 check (min_order >= 0),
  sort_order int not null default 0,
  is_active boolean not null default true
);

-- ---------------------------------------------------------------------------
-- Home page, about, kashrut
-- ---------------------------------------------------------------------------

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  content text not null,
  event_label text,
  rating int not null default 5 check (rating between 1 and 5),
  image_url text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.hero_slides (
  id uuid primary key default gen_random_uuid(),
  media_type text not null default 'image' check (media_type in ('image', 'video')),
  url text not null,
  alt text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create table public.strip_images (
  id uuid primary key default gen_random_uuid(),
  strip text not null check (strip in ('top', 'bottom')),
  url text not null,
  alt text,
  sort_order int not null default 0,
  is_active boolean not null default true
);

create index strip_images_strip_idx on public.strip_images (strip, sort_order);

create table public.pages (
  slug text primary key check (slug in ('about', 'kashrut')),
  title text not null,
  hero_image_url text,
  body_html text not null default '',
  extra jsonb not null default '{}'::jsonb,       -- kashrut: certificate image, supervision type, etc.
  updated_at timestamptz not null default now()
);

create trigger pages_updated_at before update on public.pages
  for each row execute function public.set_updated_at();

create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  alt text,
  caption text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Orders (created server-side after validation; read and managed by the admin)
-- ---------------------------------------------------------------------------

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity (start with 1001) unique,
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'ready', 'collected', 'cancelled')),
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  notes text,
  pickup_date date not null,
  slot_start time not null,
  slot_end time not null,
  fulfillment text not null check (fulfillment in ('pickup', 'delivery')),
  delivery_zone_id uuid references public.delivery_zones (id) on delete set null,
  delivery_zone_name text,
  delivery_address text,
  delivery_fee numeric(10, 2) not null default 0,
  subtotal numeric(10, 2) not null,
  total numeric(10, 2) not null,
  payment_status text not null default 'none'
    check (payment_status in ('none', 'pending', 'paid', 'failed', 'refunded')),
  payment_provider text,
  payment_reference text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fulfillment = 'pickup' or delivery_address is not null)
);

create index orders_pickup_date_idx on public.orders (pickup_date, slot_start);
create index orders_status_idx on public.orders (status);

create trigger orders_updated_at before update on public.orders
  for each row execute function public.set_updated_at();

-- Snapshot of what was ordered, so later price/product edits don't change past orders.
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  product_title text not null,
  size_label text not null,
  unit_price numeric(10, 2) not null,
  quantity int not null check (quantity > 0),
  custom_text text,
  options jsonb not null default '[]'::jsonb,
  line_total numeric(10, 2) not null
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);
create index orders_delivery_zone_idx on public.orders (delivery_zone_id);

-- ---------------------------------------------------------------------------
-- Row level security
-- ---------------------------------------------------------------------------

alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_categories enable row level security;
alter table public.product_images enable row level security;
alter table public.product_sizes enable row level security;
alter table public.product_options enable row level security;
alter table public.time_slot_settings enable row level security;
alter table public.date_overrides enable row level security;
alter table public.delivery_zones enable row level security;
alter table public.testimonials enable row level security;
alter table public.hero_slides enable row level security;
alter table public.strip_images enable row level security;
alter table public.pages enable row level security;
alter table public.gallery_images enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- Admins can see who is an admin; nobody manages this table from the client.
create policy "admins read admin list" on public.admin_users
  for select to authenticated using ((select public.is_admin()));

-- Public read of published content.
create policy "public read" on public.site_settings for select using (true);
create policy "public read active" on public.categories for select using (is_active or (select public.is_admin()));
create policy "public read active" on public.products for select using (is_active or (select public.is_admin()));
create policy "public read" on public.product_categories for select using (true);
create policy "public read" on public.product_images for select using (true);
create policy "public read" on public.product_sizes for select using (true);
create policy "public read active" on public.product_options for select using (is_active or (select public.is_admin()));
create policy "public read" on public.time_slot_settings for select using (true);
create policy "public read" on public.date_overrides for select using (true);
create policy "public read active" on public.delivery_zones for select using (is_active or (select public.is_admin()));
create policy "public read published" on public.testimonials for select using (is_published or (select public.is_admin()));
create policy "public read active" on public.hero_slides for select using (is_active or (select public.is_admin()));
create policy "public read active" on public.strip_images for select using (is_active or (select public.is_admin()));
create policy "public read" on public.pages for select using (true);
create policy "public read" on public.gallery_images for select using (true);

-- Admin writes on everything editable.
do $$
declare
  t text;
begin
  foreach t in array array[
    'site_settings', 'categories', 'products', 'product_categories', 'product_images',
    'product_sizes', 'product_options', 'time_slot_settings', 'date_overrides',
    'delivery_zones', 'testimonials', 'hero_slides', 'strip_images', 'pages', 'gallery_images'
  ]
  loop
    execute format('create policy "admin insert" on public.%I for insert to authenticated with check ((select public.is_admin()))', t);
    execute format('create policy "admin update" on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('create policy "admin delete" on public.%I for delete to authenticated using ((select public.is_admin()))', t);
  end loop;
end;
$$;

-- Orders: admin only. Customers' orders are inserted server-side with the service role.
create policy "admin read" on public.orders for select to authenticated using ((select public.is_admin()));
create policy "admin update" on public.orders for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin delete" on public.orders for delete to authenticated using ((select public.is_admin()));
create policy "admin read" on public.order_items for select to authenticated using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Storage: one public bucket for all site images and videos
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif', 'video/mp4', 'video/webm']
);

create policy "admin upload media" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (select public.is_admin()));
create policy "admin update media" on storage.objects for update to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));
create policy "admin delete media" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Seed: settings row, default pickup slots (Sun–Thu), empty about/kashrut pages
-- ---------------------------------------------------------------------------

insert into public.site_settings (id, data) values (1, '{}'::jsonb);

insert into public.time_slot_settings (day_of_week, slot_start, slot_end)
select d, s.slot_start, s.slot_end
from generate_series(0, 4) as d
cross join (values ('10:00'::time, '12:00'::time), ('16:00'::time, '18:00'::time)) as s (slot_start, slot_end);

insert into public.pages (slug, title) values ('about', 'אודות'), ('kashrut', 'כשרות');
