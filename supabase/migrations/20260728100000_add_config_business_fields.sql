alter table public.config
  add column if not exists cpf_cnpj varchar(14),
  add column if not exists dt_vencimento date,
  add column if not exists razao_social varchar(100),
  add column if not exists nm_fantasia varchar(50),
  add column if not exists nm_diretor varchar(50),
  add column if not exists email varchar(100),
  add column if not exists telefone varchar(11),
  add column if not exists cep varchar(8),
  add column if not exists endereco varchar(50),
  add column if not exists numero varchar(15),
  add column if not exists complemento varchar(30),
  add column if not exists bairro varchar(30),
  add column if not exists cidade varchar(30),
  add column if not exists uf char(2) default 'RJ',
  add column if not exists obs text,
  add column if not exists qtd_exames integer not null default 0,
  add column if not exists qtd_consultas integer not null default 0;

alter table public.config
  drop constraint if exists config_qtd_exames_nonnegative,
  drop constraint if exists config_qtd_consultas_nonnegative,
  add constraint config_qtd_exames_nonnegative check (qtd_exames >= 0),
  add constraint config_qtd_consultas_nonnegative check (qtd_consultas >= 0);

update public.config
set uf = coalesce(uf, 'RJ'),
    qtd_exames = coalesce(qtd_exames, 0),
    qtd_consultas = coalesce(qtd_consultas, 0)
where id = 1;
