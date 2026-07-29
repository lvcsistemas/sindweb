alter table public.atendimento_homologacao
  add column if not exists created_by uuid default auth.uid(),
  add column if not exists updated_by uuid default auth.uid();

create index if not exists atendimento_homologacao_created_by_idx
on public.atendimento_homologacao(created_by);

create index if not exists atendimento_homologacao_updated_by_idx
on public.atendimento_homologacao(updated_by);

drop view if exists public.atendimento_homologacao_lista;

create view public.atendimento_homologacao_lista
with (security_invoker = true) as
select
  ah.id,
  ah.created_by,
  ah.updated_by,
  ah.sede_id,
  ah.empresa_id,
  ah.dt_agendado,
  ah.situacao,
  ah.nm_homologador,
  ah.qtd,
  ah.obs,
  ah.created_at,
  ah.updated_at,
  sede.nome as nm_sede,
  empresa.nm_fantasia as nm_empresa,
  empresa.razao_social,
  empresa.cei_cnpj,
  pc.codinome as created_by_codinome,
  pc.full_name as created_by_nome,
  pu.codinome as updated_by_codinome,
  pu.full_name as updated_by_nome
from public.atendimento_homologacao ah
join public.auxiliares sede on sede.id = ah.sede_id
join public.empresas empresa on empresa.id = ah.empresa_id
left join public.profiles pc on pc.id = ah.created_by
left join public.profiles pu on pu.id = ah.updated_by;
