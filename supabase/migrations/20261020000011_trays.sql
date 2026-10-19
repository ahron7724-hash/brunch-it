-- Build-your-own trays (cookies, doughnuts…): the customer picks a tray size and fills it
-- with items, each priced per unit. Not linked to recipes or stock.
-- Ordered trays are stored as regular order_items rows (product_id null, contents in options).

create table public.trays (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  slug text not null unique check (char_length(slug) between 1 and 140),
  description text check (char_length(description) <= 2000),
  image_url text check (char_length(image_url) <= 2048),
  min_lead_time_hours int check (min_lead_time_hours between 0 and 1440), -- null = use the site default
  is_active boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger trays_updated_at before update on public.trays
  for each row execute function public.set_updated_at();

-- Tray sizes: how many units fit. capacity null = singles (any amount the customer wants).
create table public.tray_sizes (
  id uuid primary key default gen_random_uuid(),
  tray_id uuid not null references public.trays (id) on delete cascade,
  label text not null check (char_length(label) between 1 and 60),
  capacity int check (capacity between 1 and 200),
  sort_order int not null default 0
);

create index tray_sizes_tray_idx on public.tray_sizes (tray_id);

-- What goes in the tray, priced per unit.
create table public.tray_items (
  id uuid primary key default gen_random_uuid(),
  tray_id uuid not null references public.trays (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  price numeric(10, 2) not null check (price >= 0 and price <= 100000),
  image_url text check (char_length(image_url) <= 2048),
  is_active boolean not null default true,
  sort_order int not null default 0
);

create index tray_items_tray_idx on public.tray_items (tray_id);

alter table public.trays enable row level security;
alter table public.tray_sizes enable row level security;
alter table public.tray_items enable row level security;

create policy "public read active" on public.trays for select using (is_active or (select public.is_admin()));
create policy "public read" on public.tray_sizes for select using (true);
create policy "public read active" on public.tray_items for select using (is_active or (select public.is_admin()));

do $$
declare
  t text;
begin
  foreach t in array array['trays', 'tray_sizes', 'tray_items']
  loop
    execute format('create policy "admin insert" on public.%I for insert to authenticated with check ((select public.is_admin()))', t);
    execute format('create policy "admin update" on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('create policy "admin delete" on public.%I for delete to authenticated using ((select public.is_admin()))', t);
  end loop;
end;
$$;
