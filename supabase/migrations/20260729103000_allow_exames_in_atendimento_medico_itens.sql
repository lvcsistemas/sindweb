alter table public.atendimento_medico_itens
  drop constraint if exists atendimento_medico_itens_item_fkey;

alter table public.atendimento_medico_itens
  drop constraint if exists atendimento_medico_itens_unique;

drop index if exists public.atendimento_medico_itens_item_idx;

alter table public.atendimento_medico_itens
  drop column if exists item_id;

create unique index if not exists atendimento_medico_itens_unique
on public.atendimento_medico_itens(atendimento_id, tipo, descricao);
