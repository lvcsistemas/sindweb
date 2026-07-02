import { supabase, supabaseUrl } from "../../lib/supabase";

export type UsuarioRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  codinome: string | null;
  avatar_path: string | null;
  created_at: string;
  updated_at: string;
};

export type UsuarioPayload = {
  id?: string;
  email: string;
  password?: string;
  full_name?: string;
  codinome?: string;
  avatar_path?: string | null;
};

async function callAdminUsers<T>(method: "GET" | "POST", body?: unknown) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error("Sessao expirada. Entre novamente.");

  const response = await fetch(`${supabaseUrl}/functions/v1/admin-users`, {
    method,
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error ?? "Nao foi possivel concluir a operacao.");
  }

  return payload as T;
}

export async function listUsuarios() {
  const data = await callAdminUsers<{ users: UsuarioRow[] }>("GET");
  return data.users;
}

export async function saveUsuario(values: UsuarioPayload) {
  const data = await callAdminUsers<{ id: string }>("POST", values);
  return data.id;
}

export async function uploadUsuarioFoto(userId: string, file: File) {
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("usuarios-fotos").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export function getUsuarioFotoUrl(path: string | null | undefined) {
  if (!path) return null;
  return supabase.storage.from("usuarios-fotos").getPublicUrl(path).data.publicUrl;
}
