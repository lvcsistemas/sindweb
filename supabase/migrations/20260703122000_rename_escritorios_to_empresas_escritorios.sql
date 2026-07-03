do $$
begin
  if to_regclass('public.escritorios') is not null and to_regclass('public.empresas_escritorios') is null then
    alter table public.escritorios rename to empresas_escritorios;
  elsif to_regclass('public.escritorio') is not null and to_regclass('public.empresas_escritorios') is null then
    alter table public.escritorio rename to empresas_escritorios;
  end if;
end $$;
