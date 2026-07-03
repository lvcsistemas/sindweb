create or replace function public.can_access_module(module_key text, action_key text default 'access')
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_user_is_admin();
$$;

drop view if exists public.associados_lista;

do $$
declare
  fk_name text;
begin
  select conname into fk_name
  from pg_constraint
  where conrelid = 'public.associados'::regclass
    and contype = 'f'
    and conkey = array[
      (select attnum from pg_attribute where attrelid = 'public.associados'::regclass and attname = 'empresa_id')
    ];

  if fk_name is not null then
    execute format('alter table public.associados drop constraint %I', fk_name);
  end if;
end $$;

do $$
begin
  if to_regclass('public.empresa') is not null and to_regclass('public.empresas') is not null then
    if to_regclass('public.empresas_legado') is null then
      alter table public.empresas rename to empresas_legado;
    end if;
    alter table public.empresa rename to empresas;
  elsif to_regclass('public.empresa') is not null and to_regclass('public.empresas') is null then
    alter table public.empresa rename to empresas;
  end if;
end $$;

do $$
declare
  seq_name text;
begin
  if to_regclass('public.empresas_legado') is not null then
    execute $sql$
      insert into public.empresas(
        id,
        user_resp_id,
        estabelecimento_id,
        estabelecimento_tipo_id,
        escritorio_id,
        ramo_atividade_id,
        convencao_id,
        cnae_id,
        tipo_cei_cnpj,
        ativo,
        razao_social,
        nm_fantasia,
        cei_cnpj,
        created_at,
        updated_at
      )
      select
        el.id,
        0,
        1,
        1,
        0,
        0,
        0,
        0,
        1,
        case when el.ativo then 'S' else 'N' end,
        coalesce(el.razao_social, el.nome_fantasia),
        el.nome_fantasia,
        coalesce(nullif(regexp_replace(coalesce(el.cnpj, ''), '\D', '', 'g'), ''), 'LEGACY' || el.id::text),
        el.created_at,
        el.updated_at
      from public.empresas_legado el
      on conflict (id) do nothing
    $sql$;
  end if;

  select pg_get_serial_sequence('public.empresas', 'id') into seq_name;
  if seq_name is not null then
    execute format(
      'select setval(%L, greatest(coalesce((select max(id) from public.empresas), 1), 1), true)',
      seq_name
    );
  end if;
end $$;

do $$
begin
  if to_regclass('public.contribuicao') is not null and to_regclass('public.contribuicoes') is null then
    alter table public.contribuicao rename to contribuicoes;
  end if;

  if to_regclass('public.cnae') is not null and to_regclass('public.cnaes') is null then
    alter table public.cnae rename to cnaes;
  end if;

  if to_regclass('public.escritorio') is not null and to_regclass('public.escritorios') is null then
    alter table public.escritorio rename to escritorios;
  end if;

  if to_regclass('public.local_trabalho') is not null and to_regclass('public.locais_trabalho') is null then
    alter table public.local_trabalho rename to locais_trabalho;
  end if;

  if to_regclass('public.atendimento_medico_convenio') is not null and to_regclass('public.atendimento_medico_convenios') is null then
    alter table public.atendimento_medico_convenio rename to atendimento_medico_convenios;
  end if;

  if to_regclass('public.atendimento_medico_especialidade') is not null and to_regclass('public.atendimento_medico_especialidades') is null then
    alter table public.atendimento_medico_especialidade rename to atendimento_medico_especialidades;
  end if;
end $$;

alter table public.associados
add constraint associados_empresa_id_fkey
foreign key (empresa_id) references public.empresas(id);

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
  s.label as situacao_nome
from public.associados a
left join public.empresas e on e.id = a.empresa_id
left join public.lookup_items s on s.id = a.situacao_id;

drop table if exists public.module_permissions cascade;
