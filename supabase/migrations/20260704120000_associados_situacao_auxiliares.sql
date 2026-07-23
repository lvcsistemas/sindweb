do $$
declare
  fk_name text;
begin
  select conname into fk_name
  from pg_constraint
  where conrelid = 'public.associados'::regclass
    and contype = 'f'
    and conkey = array[
      (select attnum from pg_attribute where attrelid = 'public.associados'::regclass and attname = 'situacao_id')
    ];

  if fk_name is not null then
    execute format('alter table public.associados drop constraint %I', fk_name);
  end if;
end $$;

create or replace view public.associados_lista as
select
  a.id,
  a.ativo,
  a.matricula,
  a.nome,
  a.cpf,
  a.tel1,
  a.email,
  a.foto_path,
  e.nm_fantasia as empresa_nome,
  s.nome::text as situacao_nome
from public.associados a
left join public.empresas e on e.id = a.empresa_id
left join public.auxiliares s on s.id = a.situacao_id and s.grupo = 'situacao';
