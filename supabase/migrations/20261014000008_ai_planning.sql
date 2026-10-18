-- AI production planning: the kitchen's rules (written by the admin) and saved AI plans.
-- Admin-only (site_settings is publicly readable, so kitchen data doesn't go there).

create table public.kitchen_settings (
  id smallint primary key default 1 check (id = 1),
  -- Free text the AI follows, e.g. "בצקים יומיים לפני, מתוקים יום לפני, סלטים באותו יום בבוקר".
  rules text not null default '' check (char_length(rules) <= 4000),
  updated_at timestamptz not null default now()
);

create trigger kitchen_settings_updated_at before update on public.kitchen_settings
  for each row execute function public.set_updated_at();

insert into public.kitchen_settings (id, rules) values (1,
'בצקים ותחתיות – יומיים לפני האיסוף.
מתוקים, עוגות וקינוחים – יום לפני.
מילויים ואפייה מרכזית – יום לפני.
סלטים וירקות חתוכים – באותו יום בבוקר.
הרכבה, חימום, גימור ואריזה – באותו יום, סמוך לאיסוף או למשלוח.
לא עובדים בשבת. מה שצריך לקרות בשבת – עובר ליום שישי.');

create table public.ai_plans (
  id uuid primary key default gen_random_uuid(),
  from_date date not null,
  to_date date not null,
  plan jsonb not null,
  model text,
  created_at timestamptz not null default now()
);

create index ai_plans_range_idx on public.ai_plans (from_date, to_date, created_at desc);

alter table public.kitchen_settings enable row level security;
alter table public.ai_plans enable row level security;

do $$
declare
  t text;
begin
  foreach t in array array['kitchen_settings', 'ai_plans']
  loop
    execute format('create policy "admin read" on public.%I for select to authenticated using ((select public.is_admin()))', t);
    execute format('create policy "admin insert" on public.%I for insert to authenticated with check ((select public.is_admin()))', t);
    execute format('create policy "admin update" on public.%I for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()))', t);
    execute format('create policy "admin delete" on public.%I for delete to authenticated using ((select public.is_admin()))', t);
  end loop;
end;
$$;
