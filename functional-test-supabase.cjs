const { Client } = require('pg');

const url = 'https://qpylbiywcpvcxrroljmj.supabase.co';
const anon = process.env.SUPABASE_ANON_KEY;
const service = process.env.SUPABASE_SERVICE_ROLE;
const password = 'Teste-' + Math.random().toString(36).slice(2) + 'A1!';
const email = `codex-test-${Date.now()}@sindweb.local`;

async function api(path, options = {}) {
  const res = await fetch(url + path, {
    ...options,
    headers: {
      apikey: options.service ? service : anon,
      Authorization: `Bearer ${options.bearer ?? (options.service ? service : anon)}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  });
  const text = await res.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!res.ok) throw new Error(`${path} ${res.status}: ${text}`);
  return body;
}

(async () => {
  let userId;
  let associadoId;
  const created = await api('/auth/v1/admin/users', {
    service: true,
    method: 'POST',
    body: JSON.stringify({ email, password, email_confirm: true })
  });
  userId = created.id;

  const session = await api('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  const bearer = session.access_token;

  await api('/rest/v1/rpc/claim_first_admin', { method: 'POST', bearer, body: '{}' });

  associadoId = await api('/rest/v1/rpc/save_associado', {
    method: 'POST',
    bearer,
    body: JSON.stringify({ payload: { ativo: true, nome: 'TESTE CODEX', cpf: '52998224725', matricula: 'TESTE-CODEX' } })
  });

  const rows = await api(`/rest/v1/associados_lista?id=eq.${associadoId}&select=id,nome,cpf,matricula`, { bearer });
  if (!Array.isArray(rows) || rows.length !== 1 || rows[0].nome !== 'TESTE CODEX') {
    throw new Error('Associado de teste não retornou pela view associados_lista.');
  }

  const client = new Client({ connectionString: process.env.SUPABASE_DB_URL, ssl: { rejectUnauthorized: false } });
  await client.connect();
  await client.query('delete from public.audit_log where record_id = $1 and table_name = $2', [associadoId, 'associados']);
  await client.query('delete from public.associados where id = $1', [associadoId]);
  await client.end();
  await api(`/auth/v1/admin/users/${userId}`, { service: true, method: 'DELETE' });

  console.log(JSON.stringify({ ok: true, userCreated: true, adminClaimed: true, associadoSaved: true, cleanup: true }));
})().catch(async (error) => {
  console.error(error.message);
  process.exit(1);
});
