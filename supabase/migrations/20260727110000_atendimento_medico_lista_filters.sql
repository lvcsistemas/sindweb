alter table public.atendimento_medico
add column if not exists created_by_profile_id uuid references public.profiles(id) default auth.uid(),
add column if not exists updated_by_profile_id uuid references public.profiles(id) default auth.uid();

create or replace view public.atendimento_medico_lista
with (security_invoker = true) as
select
  am.id,
  am.created_by,
  am.updated_by,
  am.created_by_profile_id,
  am.updated_by_profile_id,
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
  p.codinome as updated_by_codinome,
  p.full_name as updated_by_nome
from public.atendimento_medico am
join public.atendimento_medico_convenios c on c.id = am.convenio_id
join public.associados a on a.id = am.associado_id
left join public.associados_dependentes d on d.id = am.dependente_id
left join public.profiles p on p.id = am.updated_by_profile_id;
