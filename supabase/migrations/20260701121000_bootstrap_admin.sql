create or replace function public.claim_first_admin()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.' using errcode = '42501';
  end if;

  if exists (select 1 from public.profiles where is_admin = true) then
    raise exception 'Administrador inicial já foi definido.' using errcode = '42501';
  end if;

  insert into public.profiles(id, full_name, is_admin)
  values (auth.uid(), auth.email(), true)
  on conflict (id) do update set is_admin = true, updated_at = now();

  insert into public.module_permissions(user_id, module_key, can_access, can_save, can_delete)
  values (auth.uid(), 'associados', true, true, true)
  on conflict (user_id, module_key)
  do update set can_access = true, can_save = true, can_delete = true;
end;
$$;

grant execute on function public.claim_first_admin() to authenticated;
