drop view if exists public.atendimento_medico_lista;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'atendimento_medico'
      and column_name = 'created_by_profile_id'
  ) then
    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'atendimento_medico'
        and column_name = 'created_by'
    ) and not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'atendimento_medico'
        and column_name = 'created_by_legacy'
    ) then
      alter table public.atendimento_medico rename column created_by to created_by_legacy;
    end if;

    if exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'atendimento_medico'
        and column_name = 'updated_by'
    ) and not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'atendimento_medico'
        and column_name = 'updated_by_legacy'
    ) then
      alter table public.atendimento_medico rename column updated_by to updated_by_legacy;
    end if;

    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'atendimento_medico'
        and column_name = 'created_by'
    ) then
      alter table public.atendimento_medico rename column created_by_profile_id to created_by;
    end if;

    if not exists (
      select 1 from information_schema.columns
      where table_schema = 'public'
        and table_name = 'atendimento_medico'
        and column_name = 'updated_by'
    ) then
      alter table public.atendimento_medico rename column updated_by_profile_id to updated_by;
    end if;
  end if;
end $$;

alter table public.atendimento_medico
alter column created_by set default auth.uid(),
alter column updated_by set default auth.uid();

create index if not exists atendimento_medico_created_by_idx
on public.atendimento_medico(created_by);

create index if not exists atendimento_medico_updated_by_idx
on public.atendimento_medico(updated_by);

create or replace view public.atendimento_medico_lista
with (security_invoker = true) as
select
  am.id,
  am.created_by,
  am.updated_by,
  am.created_by_legacy,
  am.updated_by_legacy,
  am.convenio_id,
  am.associado_id,
  am.dependente_id,
  am.qtd,
  am.created_at,
  am.updated_at,
  am.dt_agendado,
  am.situacao,
  am.tipo,
  am.obs,
  c.nm_convenio,
  a.nome as nm_associado,
  a.matricula,
  d.nm_dependente,
  pc.codinome as created_by_codinome,
  pc.full_name as created_by_nome,
  pu.codinome as updated_by_codinome,
  pu.full_name as updated_by_nome
from public.atendimento_medico am
join public.atendimento_medico_convenios c on c.id = am.convenio_id
join public.associados a on a.id = am.associado_id
left join public.associados_dependentes d on d.id = am.dependente_id
left join public.profiles pc on pc.id = am.created_by
left join public.profiles pu on pu.id = am.updated_by;
