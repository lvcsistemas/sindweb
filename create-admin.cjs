const { Client } = require('pg');

const service = process.env.SUPABASE_SERVICE_ROLE;
const anon = process.env.SUPABASE_ANON_KEY;
const baseUrl = 'https://qpylbiywcpvcxrroljmj.supabase.co';
const email = 'admin@lvcsistemas.com.br';
const password = 'SindWeb#2026!Admin';

async function request(path, options = {}) {
  const key = options.service ? service : anon;
  const response = await fetch(baseUrl + path, {
    ...options,
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {})
    }
  });
  const text = await response.text();
  let body;
  try { body = text ? JSON.parse(text) : null; } catch { body = text; }
  if (!response.ok) {
    const err = new Error(text || response.statusText);
    err.status = response.status;
    err.body = body;
    throw err;
  }
  return body;
}

async function ensureUser() {
  try {
    const created = await request('/auth/v1/admin/users', {
      service: true,
      method: 'POST',
      body: JSON.stringify({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Administrador SindWeb' }
      })
    });
    return created.id;
  } catch (error) {
    const users = await request('/auth/v1/admin/users?page=1&per_page=100', { service: true });
    const existing = users.users.find((user) => user.email === email);
    if (!existing) throw error;
    await request(`/auth/v1/admin/users/${existing.id}`, {
      service: true,
      method: 'PUT',
      body: JSON.stringify({
        password,
        email_confirm: true,
        user_metadata: { full_name: 'Administrador SindWeb' }
      })
    });
    return existing.id;
  }
}

async function ensureDatabasePermissions(userId) {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  });
  await client.connect();
  await client.query(
    `insert into public.profiles(id, full_name, codinome, is_admin)
     values ($1, $2, $3, true)
     on conflict (id) do update
     set full_name = excluded.full_name,
         codinome = excluded.codinome,
         is_admin = true,
         updated_at = now()`,
    [userId, 'Administrador SindWeb', 'ADMIN']
  );
  await client.query(
    `insert into public.module_permissions(user_id, module_key, can_access, can_save, can_delete)
     values ($1, 'associados', true, true, true)
     on conflict (user_id, module_key) do update
     set can_access = true,
         can_save = true,
         can_delete = true`,
    [userId]
  );
  await client.end();
}

async function validateLogin() {
  const session = await request('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  if (!session.access_token) throw new Error('Login test failed');
}

(async () => {
  const userId = await ensureUser();
  await ensureDatabasePermissions(userId);
  await validateLogin();
  console.log(JSON.stringify({ ok: true, email }));
})().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
