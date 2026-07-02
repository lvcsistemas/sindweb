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
  avatar_path?: string | null;
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
    return json({ error: "Configuracao da funcao incompleta." }, 500);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } }
  });
  const serviceClient = createClient(supabaseUrl, serviceRoleKey);

  const { data: currentUser, error: userError } = await userClient.auth.getUser();
  if (userError || !currentUser.user) {
    return json({ error: "Sessao expirada. Entre novamente." }, 401);
  }

  const { data: currentProfile, error: profileLookupError } = await userClient
    .from("profiles")
    .select("is_admin")
    .eq("id", currentUser.user.id)
    .single();

  if (profileLookupError || !currentProfile?.is_admin) {
    return json({ error: "Sem permissao para administrar usuarios." }, 403);
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
    return json({ error: "Metodo nao permitido." }, 405);
  }

  const payload = await req.json() as UserPayload;
  const email = payload.email?.trim().toLowerCase();
  const password = payload.password?.trim();

  if (!email) {
    return json({ error: "Informe o e-mail do usuario." }, 400);
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
      return json({ error: "Informe a senha para criar um novo usuario." }, 400);
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
    return json({ error: "Nao foi possivel identificar o usuario salvo." }, 400);
  }

  const profileValues: Record<string, unknown> = {
    id: userId,
    email,
    full_name: payload.full_name?.trim() || email,
    codinome: payload.codinome?.trim().toUpperCase() || null,
    avatar_path: payload.avatar_path ?? null
  };

  if (!payload.id) {
    profileValues.is_admin = false;
  }

  const { error: profileError } = await serviceClient
    .from("profiles")
    .upsert(profileValues, { onConflict: "id" });

  if (profileError) return json({ error: profileError.message }, 400);

  return json({ id: userId });
});
