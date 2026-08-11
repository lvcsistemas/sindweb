alter table public.faturas
  add column if not exists codigo_barras varchar(44),
  add column if not exists boleto_gerado_em timestamptz;

create index if not exists faturas_codigo_barras_idx on public.faturas(codigo_barras);

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
  fp.nome as forma_pagamento_nome,
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
left join public.auxiliares fp on fp.id = f.forma_pagamento_id and fp.grupo = 'formas_pagamento'
left join public.profiles pc on pc.id = f.created_by
left join public.profiles pu on pu.id = f.updated_by
left join public.profiles px on px.id = f.cancelada_por;
