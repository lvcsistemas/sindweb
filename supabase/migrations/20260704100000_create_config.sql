create table if not exists public.config (
  id smallint primary key default 1,
  ultima_matricula integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint config_singleton check (id = 1),
  constraint config_ultima_matricula_nonnegative check (ultima_matricula >= 0)
);

insert into public.config (id, ultima_matricula)
values (1, 0)
on conflict (id) do nothing;

create trigger config_touch_updated_at
before update on public.config
for each row execute function public.touch_updated_at();

alter table public.config enable row level security;

create policy "config authenticated read" on public.config
for select to authenticated using (true);

create policy "config admin write" on public.config
for all using (public.current_user_is_admin())
with check (public.current_user_is_admin());
