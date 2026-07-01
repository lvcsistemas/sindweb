import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS"
};

type UserPayload = {
  id?: string;
  email: string;
  password?: string;
  full_name?: string | null;
  codinome?: string | null;
  is_admin?: boolean;
  associados_access?: boolean;
  associados_save?: boolean;
  associados_delete?: boolean;
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization") ?? "";

  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: "Configuração da função incompleta." }, 500);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: allowed, error: permissionError } = await userClient.rpc("can_access_module", {
    module_key: "usuarios",
    action_key: req.method === "GET" ? "access" : "save"
  });

  if (permissionError || !allowed) {
    return json({ error: "Sem permissão para administrar usuários." }, 403);
  }

  if (req.method === "GET") {
    const { data, error } = await serviceClient
      .from("usuarios_lista")
      .select("*")
      .order("full_name", { ascending: true, nullsFirst: false });

    if (error) return json({ error: error.message }, 400);
    return json({ users: data ?? [] });
  }

  if (req.method !== "POST") {
    return json({ error: "Método não permitido." }, 405);
  }

  const payload = await req.json() as UserPayload;
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();

  if (!email) {
    return json({ error: "Informe o e-mail do usuário." }, 400);
  }

  let userId = payload.id;

  if (userId) {
    const attributes: Record<string, unknown> = {
      email,
      email_confirm: true,
      user_metadata: { full_name: payload.full_name ?? email }
    };
    if (password) attributes.password = password;

    const { error } = await serviceClient.auth.admin.updateUserById(userId, attributes);
    if (error) return json({ error: error.message }, 400);
  } else {
    if (!password) {
      return json({ error: "Informe a senha para criar um novo usuário." }, 400);
    }

    const { data, error } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: payload.full_name ?? email }
    });

    if (error) return json({ error: error.message }, 400);
    userId = data.user?.id;
  }

  if (!userId) {
    return json({ error: "Não foi possível identificar o usuário salvo." }, 400);
  }

  const { error: profileError } = await serviceClient
    .from("profiles")
    .upsert({
      id: userId,
      email,
      full_name: payload.full_name?.trim() || email,
      codinome: payload.codinome?.trim().toUpperCase() || null,
      is_admin: Boolean(payload.is_admin)
    }, { onConflict: "id" });

  if (profileError) return json({ error: profileError.message }, 400);

  const permissions = [
    {
      user_id: userId,
      module_key: "associados",
      can_access: Boolean(payload.associados_access),
      can_save: Boolean(payload.associados_save),
      can_delete: Boolean(payload.associados_delete)
    },
    {
      user_id: userId,
      module_key: "usuarios",
      can_access: Boolean(payload.is_admin),
      can_save: Boolean(payload.is_admin),
      can_delete: Boolean(payload.is_admin)
    }
  ];

  const { error: permissionSaveError } = await serviceClient
    .from("module_permissions")
    .upsert(permissions, { onConflict: "user_id,module_key" });

  if (permissionSaveError) return json({ error: permissionSaveError.message }, 400);

  return json({ id: userId });
});
