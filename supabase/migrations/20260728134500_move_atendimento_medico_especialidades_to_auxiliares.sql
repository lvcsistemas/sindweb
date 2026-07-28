insert into public.auxiliares (grupo, nome, ativo, ordem, created_at, updated_at)
select
  'atendimento_medico_especialidade',
  upper(trim(nm_especialidade)),
  'S',
  row_number() over (order by upper(trim(nm_especialidade))),
  min(created_at),
  max(updated_at)
from public.atendimento_medico_especialidades
where trim(coalesce(nm_especialidade, '')) <> ''
group by upper(trim(nm_especialidade))
on conflict (grupo, nome) do nothing;

alter table public.atendimento_medico_convenios_especialidades
  drop constraint if exists atendimento_medico_convenios_especialidades_especialidade_fkey;

update public.atendimento_medico_convenios_especialidades ce
set especialidade_id = a.id
from public.atendimento_medico_especialidades e
join public.auxiliares a
  on a.grupo = 'atendimento_medico_especialidade'
 and a.nome = upper(trim(e.nm_especialidade))
where ce.especialidade_id = e.id;

do $$
begin
  if exists (
    select 1
    from public.atendimento_medico_convenios_especialidades ce
    left join public.auxiliares a
      on a.id = ce.especialidade_id
     and a.grupo = 'atendimento_medico_especialidade'
    where a.id is null
  ) then
    raise exception 'Existem especialidades de convênio sem correspondência em auxiliares.';
  end if;
end $$;

alter table public.atendimento_medico_convenios_especialidades
  add constraint atendimento_medico_convenios_especialidades_especialidade_fkey
  foreign key (especialidade_id) references public.auxiliares(id) on delete restrict;

do $$
begin
  if to_regclass('public.atendimento_medico_especialidades') is not null
     and to_regclass('public.atendimento_medico_especialidades_backup') is null then
    alter table public.atendimento_medico_especialidades rename to atendimento_medico_especialidades_backup;
  end if;
end $$;
