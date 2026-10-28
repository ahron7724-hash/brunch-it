-- Free-text notes the admin keeps on each recipe ("15 buns came out a perfect size", "dusted flour instead of egg").
-- Separate table, admin-only, so customers can never read them through the public products table.

create table public.recipe_notes (
  product_id uuid primary key references public.products (id) on delete cascade,
  notes text not null check (char_length(notes) between 1 and 2000),
  updated_at timestamptz not null default now()
);

create trigger recipe_notes_updated_at before update on public.recipe_notes
  for each row execute function public.set_updated_at();

alter table public.recipe_notes enable row level security;

create policy "admin read" on public.recipe_notes for select to authenticated using ((select public.is_admin()));
create policy "admin insert" on public.recipe_notes for insert to authenticated with check ((select public.is_admin()));
create policy "admin update" on public.recipe_notes for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admin delete" on public.recipe_notes for delete to authenticated using ((select public.is_admin()));
