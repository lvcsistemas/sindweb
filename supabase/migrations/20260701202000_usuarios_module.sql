alter table public.profiles
  add column if not exists email text;

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and p.email is null;

insert into public.modules(key, label, position)
values ('usuarios', 'Usuários', 20)
on conflict (key) do update set label = excluded.label, position = excluded.position;

insert into public.module_permissions(user_id, module_key, can_access, can_save, can_delete)
select id, 'usuarios', true, true, true
from public.profiles
where is_admin = true
on conflict (user_id, module_key)
do update set can_access = true, can_save = true, can_delete = true;

create or replace view public.usuarios_lista as
select
  p.id,
  p.email,
  p.full_name,
  p.codinome,
  p.is_admin,
  coalesce(mp.can_access, false) as associados_access,
  coalesce(mp.can_save, false) as associados_save,
  coalesce(mp.can_delete, false) as associados_delete,
  p.created_at,
  p.updated_at
from public.profiles p
left join public.module_permissions mp
  on mp.user_id = p.id
 and mp.module_key = 'associados';

create policy "usuarios read" on public.profiles
for select using (public.can_access_module('usuarios', 'access') or id = auth.uid());

create policy "usuarios permissions read" on public.module_permissions
for select using (public.can_access_module('usuarios', 'access') or user_id = auth.uid());
