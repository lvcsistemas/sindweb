alter table public.empresas
add column if not exists logo_path text;

insert into storage.buckets(id, name, public)
values ('empresas-logos', 'empresas-logos', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "empresas logos read" on storage.objects;
drop policy if exists "empresas logos upload" on storage.objects;
drop policy if exists "empresas logos update" on storage.objects;

create policy "empresas logos read" on storage.objects
for select using (bucket_id = 'empresas-logos' and auth.role() = 'authenticated');

create policy "empresas logos upload" on storage.objects
for insert with check (bucket_id = 'empresas-logos' and public.current_user_is_admin());

create policy "empresas logos update" on storage.objects
for update using (bucket_id = 'empresas-logos' and public.current_user_is_admin())
with check (bucket_id = 'empresas-logos' and public.current_user_is_admin());
