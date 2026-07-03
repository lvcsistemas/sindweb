const { Client } = require('pg');

(async () => {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  const tables = await client.query(`
    select table_name
    from information_schema.tables
    where table_schema = 'public'
      and table_name in ('profiles','modules','module_permissions','lookup_items','empresas','associados','dependentes','audit_log')
    order by table_name
  `);
  console.log('tables=' + tables.rows.map((row) => row.table_name).join(','));
  const funcs = await client.query(`
    select proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and proname in ('can_access_module','save_associado','claim_first_admin')
    order by proname
  `);
  console.log('functions=' + funcs.rows.map((row) => row.proname).join(','));
  await client.query(`notify pgrst, 'reload schema'`);
  await client.end();
})();
