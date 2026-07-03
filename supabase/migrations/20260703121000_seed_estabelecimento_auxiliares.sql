insert into public.auxiliares (grupo, nome, ativo, ordem)
values
  ('estabelecimento', 'AUTONOMOS', 'S', 10),
  ('estabelecimento', 'EMPREGADOS', 'S', 20),
  ('estabelecimento', 'PATRONAL/EMPREGADOR', 'S', 30),
  ('estabelecimento', 'PROFISSIONAL LIBERAL', 'S', 40),
  ('estabelecimento_tipo', 'FILIAL', 'S', 10),
  ('estabelecimento_tipo', 'OUTROS', 'S', 20),
  ('estabelecimento_tipo', 'PRINCIPAL', 'S', 30),
  ('estabelecimento_tipo', 'UNICO', 'S', 40)
on conflict (grupo, nome) do update
set ativo = excluded.ativo,
    ordem = excluded.ordem;
