create or replace function public.save_associado(payload jsonb)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  target_id bigint := nullif(payload->>'id', '')::bigint;
  saved_id bigint;
  before_row jsonb;
  generated_matricula text;
begin
  if not public.can_access_module('associados', 'save') then
    raise exception 'Sem permissao para salvar associado.' using errcode = '42501';
  end if;

  if target_id is null and coalesce(nullif(payload->>'gerar_matricula', '')::boolean, false) then
    insert into public.config (id, ultima_matricula)
    values (1, 0)
    on conflict (id) do nothing;

    update public.config
    set ultima_matricula = ultima_matricula + 1
    where id = 1
    returning ultima_matricula::text into generated_matricula;
  end if;

  if target_id is not null then
    select to_jsonb(a) into before_row from public.associados a where a.id = target_id;
    update public.associados set
      matricula = nullif(upper(trim(payload->>'matricula')), ''),
      matricula_empresa = nullif(upper(trim(payload->>'matricula_empresa')), ''),
      nome = upper(trim(payload->>'nome')),
      cpf = regexp_replace(payload->>'cpf', '\D', '', 'g'),
      rg = nullif(upper(trim(payload->>'rg')), ''),
      rg_data_emissao = nullif(payload->>'rg_data_emissao', '')::date,
      rg_orgao_emissor = nullif(upper(trim(payload->>'rg_orgao_emissor')), ''),
      rg_uf = nullif(upper(trim(payload->>'rg_uf')), ''),
      sexo = nullif(payload->>'sexo', ''),
      estado_civil = nullif(upper(trim(payload->>'estado_civil')), ''),
      naturalidade = nullif(upper(trim(payload->>'naturalidade')), ''),
      nacionalidade = nullif(upper(trim(payload->>'nacionalidade')), ''),
      nome_pai = nullif(upper(trim(payload->>'nome_pai')), ''),
      nome_mae = nullif(upper(trim(payload->>'nome_mae')), ''),
      titulo_eleitor = nullif(payload->>'titulo_eleitor', ''),
      titulo_zona = nullif(payload->>'titulo_zona', ''),
      titulo_secao = nullif(payload->>'titulo_secao', ''),
      empresa_id = nullif(payload->>'empresa_id', '')::bigint,
      situacao_id = nullif(payload->>'situacao_id', '')::bigint,
      local_trabalho_id = nullif(payload->>'local_trabalho_id', '')::bigint,
      local_pagamento_id = nullif(payload->>'local_pagamento_id', '')::bigint,
      escolaridade_id = nullif(payload->>'escolaridade_id', '')::bigint,
      funcao_id = nullif(payload->>'funcao_id', '')::bigint,
      data_categoria = nullif(payload->>'data_categoria', '')::date,
      data_nascimento = nullif(payload->>'data_nascimento', '')::date,
      data_admissao = nullif(payload->>'data_admissao', '')::date,
      data_situacao = nullif(payload->>'data_situacao', '')::date,
      data_ficha = nullif(payload->>'data_ficha', '')::date,
      endereco = nullif(upper(trim(payload->>'endereco')), ''),
      numero = nullif(upper(trim(payload->>'numero')), ''),
      complemento = nullif(upper(trim(payload->>'complemento')), ''),
      bairro = nullif(upper(trim(payload->>'bairro')), ''),
      cidade = nullif(upper(trim(payload->>'cidade')), ''),
      uf = nullif(upper(trim(payload->>'uf')), ''),
      cep = nullif(payload->>'cep', ''),
      tel1 = nullif(payload->>'tel1', ''),
      tel2 = nullif(payload->>'tel2', ''),
      tel3 = nullif(payload->>'tel3', ''),
      email = nullif(lower(trim(payload->>'email')), ''),
      pis = nullif(payload->>'pis', ''),
      ctps = nullif(upper(trim(payload->>'ctps')), ''),
      ctps_serie = nullif(upper(trim(payload->>'ctps_serie')), ''),
      ctps_uf = nullif(upper(trim(payload->>'ctps_uf')), ''),
      salario = nullif(payload->>'salario', '')::numeric,
      secao = nullif(upper(trim(payload->>'secao')), ''),
      turno = nullif(upper(trim(payload->>'turno')), ''),
      posto_trabalho = nullif(upper(trim(payload->>'posto_trabalho')), ''),
      masterclin = nullif(upper(trim(payload->>'masterclin')), ''),
      observacao = nullif(upper(trim(payload->>'observacao')), ''),
      updated_by = auth.uid()
    where id = target_id
    returning id into saved_id;
  else
    insert into public.associados(
      matricula, matricula_empresa, nome, cpf, rg, rg_data_emissao, rg_orgao_emissor, rg_uf,
      sexo, estado_civil, naturalidade, nacionalidade, nome_pai, nome_mae, titulo_eleitor, titulo_zona,
      titulo_secao, empresa_id, situacao_id, local_trabalho_id, local_pagamento_id, escolaridade_id,
      funcao_id, data_categoria, data_nascimento, data_admissao, data_situacao, data_ficha, endereco,
      numero, complemento, bairro, cidade, uf, cep, tel1, tel2, tel3, email, pis, ctps, ctps_serie,
      ctps_uf, salario, secao, turno, posto_trabalho, masterclin, observacao, created_by, updated_by
    ) values (
      coalesce(generated_matricula, nullif(upper(trim(payload->>'matricula')), '')),
      nullif(upper(trim(payload->>'matricula_empresa')), ''), upper(trim(payload->>'nome')),
      regexp_replace(payload->>'cpf', '\D', '', 'g'), nullif(upper(trim(payload->>'rg')), ''),
      nullif(payload->>'rg_data_emissao', '')::date, nullif(upper(trim(payload->>'rg_orgao_emissor')), ''),
      nullif(upper(trim(payload->>'rg_uf')), ''), nullif(payload->>'sexo', ''),
      nullif(upper(trim(payload->>'estado_civil')), ''), nullif(upper(trim(payload->>'naturalidade')), ''),
      nullif(upper(trim(payload->>'nacionalidade')), ''), nullif(upper(trim(payload->>'nome_pai')), ''),
      nullif(upper(trim(payload->>'nome_mae')), ''), nullif(payload->>'titulo_eleitor', ''),
      nullif(payload->>'titulo_zona', ''), nullif(payload->>'titulo_secao', ''),
      nullif(payload->>'empresa_id', '')::bigint, nullif(payload->>'situacao_id', '')::bigint,
      nullif(payload->>'local_trabalho_id', '')::bigint, nullif(payload->>'local_pagamento_id', '')::bigint,
      nullif(payload->>'escolaridade_id', '')::bigint, nullif(payload->>'funcao_id', '')::bigint,
      nullif(payload->>'data_categoria', '')::date, nullif(payload->>'data_nascimento', '')::date,
      nullif(payload->>'data_admissao', '')::date, nullif(payload->>'data_situacao', '')::date,
      nullif(payload->>'data_ficha', '')::date, nullif(upper(trim(payload->>'endereco')), ''),
      nullif(upper(trim(payload->>'numero')), ''), nullif(upper(trim(payload->>'complemento')), ''),
      nullif(upper(trim(payload->>'bairro')), ''), nullif(upper(trim(payload->>'cidade')), ''),
      nullif(upper(trim(payload->>'uf')), ''), nullif(payload->>'cep', ''), nullif(payload->>'tel1', ''),
      nullif(payload->>'tel2', ''), nullif(payload->>'tel3', ''), nullif(lower(trim(payload->>'email')), ''),
      nullif(payload->>'pis', ''), nullif(upper(trim(payload->>'ctps')), ''),
      nullif(upper(trim(payload->>'ctps_serie')), ''), nullif(upper(trim(payload->>'ctps_uf')), ''),
      nullif(payload->>'salario', '')::numeric, nullif(upper(trim(payload->>'secao')), ''),
      nullif(upper(trim(payload->>'turno')), ''), nullif(upper(trim(payload->>'posto_trabalho')), ''),
      nullif(upper(trim(payload->>'masterclin')), ''), nullif(upper(trim(payload->>'observacao')), ''),
      auth.uid(), auth.uid()
    ) returning id into saved_id;
  end if;

  insert into public.audit_log(table_name, record_id, action, old_data, new_data, user_id)
  select 'associados', saved_id, case when target_id is null then 'insert' else 'update' end, before_row, to_jsonb(a), auth.uid()
  from public.associados a where a.id = saved_id;

  return saved_id;
end;
$$;

drop view if exists public.associados_lista;

alter table public.associados
drop column if exists ativo;

create or replace view public.associados_lista as
select
  a.id,
  a.empresa_id,
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
