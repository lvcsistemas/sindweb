alter table public.profiles
  add column if not exists avatar_path text;

drop view if exists public.usuarios_lista;

create view public.usuarios_lista as
select
  p.id,
  p.email,
  p.full_name,
  p.codinome,
  p.avatar_path,
  p.created_at,
  p.updated_at
from public.profiles p;

insert into storage.buckets(id, name, public)
values ('usuarios-fotos', 'usuarios-fotos', true)
on conflict (id) do update set public = excluded.public;

create policy "usuarios foto read" on storage.objects
for select using (bucket_id = 'usuarios-fotos' and auth.role() = 'authenticated');

create policy "usuarios foto upload" on storage.objects
for insert with check (bucket_id = 'usuarios-fotos' and public.current_user_is_admin());

create policy "usuarios foto update" on storage.objects
for update using (bucket_id = 'usuarios-fotos' and public.current_user_is_admin())
with check (bucket_id = 'usuarios-fotos' and public.current_user_is_admin());
