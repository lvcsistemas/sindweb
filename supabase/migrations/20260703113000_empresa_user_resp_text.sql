alter table public.empresas
alter column user_resp_id type text using case when user_resp_id = 0 then '' else user_resp_id::text end,
alter column user_resp_id set default '';
