-- Large rotating hero images at the top of each tray page (up to 10 per tray).

create table public.tray_images (
  id uuid primary key default gen_random_uuid(),
  tray_id uuid not null references public.trays (id) on delete cascade,
  url text not null check (char_length(url) <= 2048),
  alt text check (char_length(alt) <= 200),
  sort_order int not null default 0
);

create index tray_images_tray_idx on public.tray_images (tray_id);

alter table public.tray_images enable row level security;

create policy "public read" on public.tray_images for select using (true);
create policy "admin insert" on public.tray_images for insert to authenticated with check ((select public.is_admin()));
create policy "admin update" on public.tray_images for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin delete" on public.tray_images for delete to authenticated using ((select public.is_admin()));
