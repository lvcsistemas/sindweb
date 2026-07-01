drop view if exists public.usuarios_lista;

create view public.usuarios_lista as
select
  p.id,
  p.email,
  p.full_name,
  p.codinome,
  p.created_at,
  p.updated_at
from public.profiles p;
