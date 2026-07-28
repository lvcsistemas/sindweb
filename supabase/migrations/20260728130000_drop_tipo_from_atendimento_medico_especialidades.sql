alter table public.atendimento_medico_especialidades
  drop constraint if exists atendimento_medico_especialidade_tipo_check,
  drop constraint if exists atendimento_medico_especialidade_tipo_nm_especialidade_key;

drop index if exists public.atendimento_medico_especialidade_tipo_idx;

alter table public.atendimento_medico_especialidades
  drop column if exists tipo;

create unique index if not exists atendimento_medico_especialidades_nm_especialidade_key
on public.atendimento_medico_especialidades(nm_especialidade);

create index if not exists atendimento_medico_especialidades_nm_especialidade_idx
on public.atendimento_medico_especialidades(nm_especialidade);
