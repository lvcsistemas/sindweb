alter table public.faturas
  add column if not exists cancelada_em timestamptz,
  add column if not exists cancelada_por uuid;

alter table public.faturas
  drop constraint if exists faturas_cancelada_por_fkey;

alter table public.faturas
  add constraint faturas_cancelada_por_fkey foreign key (cancelada_por) references public.profiles(id);

create index if not exists faturas_cancelada_em_idx on public.faturas(cancelada_em);

drop view if exists public.faturas_lista;
create view public.faturas_lista
with (security_invoker = true) as
select
  f.*,
  c.tipo as contribuicao_tipo,
  c.nm_contribuicao,
  b.banco_numero,
  b.banco_nome,
  b.agencia_numero,
  b.conta_numero,
  a.nome as associado_nome,
  a.cpf as associado_documento,
  e.nm_fantasia as empresa_nome,
  e.cei_cnpj as empresa_documento,
  pc.codinome as created_by_codinome,
  pc.full_name as created_by_nome,
  pu.codinome as updated_by_codinome,
  pu.full_name as updated_by_nome,
  px.codinome as cancelada_por_codinome,
  px.full_name as cancelada_por_nome
from public.faturas f
join public.contribuicoes c on c.id = f.contribuicao_id
join public.bancos b on b.id = f.banco_id
left join public.associados a on a.id = f.associado_id
left join public.empresas e on e.id = f.empresa_id
left join public.profiles pc on pc.id = f.created_by
left join public.profiles pu on pu.id = f.updated_by
left join public.profiles px on px.id = f.cancelada_por;
