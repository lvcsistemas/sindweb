import { supabase } from "../../lib/supabase";
import type { Associado, AssociadoLista, Empresa, LookupItem } from "../../types/database";
import type { AssociadoFormValues } from "./associadosSchema";

const supabaseUnsafe = supabase as any;

export async function listAssociados(search: string) {
  let query = supabase
    .from("associados_lista")
    .select("*")
    .order("nome", { ascending: true })
    .limit(80);

  const term = search.trim();
  if (term) {
    query = query.or(`nome.ilike.%${term}%,cpf.ilike.%${term}%,matricula.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as AssociadoLista[];
}

export async function getAssociado(id: number) {
  const { data, error } = await supabase.from("associados").select("*").eq("id", id).single();
  if (error) throw error;
  return data as Associado;
}

export async function saveAssociado(values: AssociadoFormValues) {
  const { data, error } = await supabaseUnsafe.rpc("save_associado", { payload: values });
  if (error) throw error;
  return data as number;
}

export async function listEmpresas() {
  const { data, error } = await supabaseUnsafe
    .from("empresas")
    .select("id, nm_fantasia, razao_social, cei_cnpj, ativo, created_at, updated_at")
    .eq("ativo", "S")
    .order("nm_fantasia");
  if (error) throw error;
  return (data as Array<{
    id: number;
    nm_fantasia: string;
    razao_social: string | null;
    cei_cnpj: string | null;
    ativo: string;
    created_at: string;
    updated_at: string;
  }>).map((empresa) => ({
    id: empresa.id,
    legacy_id: null,
    nome_fantasia: empresa.nm_fantasia,
    razao_social: empresa.razao_social,
    cnpj: empresa.cei_cnpj,
    ativo: empresa.ativo === "S",
    created_at: empresa.created_at,
    updated_at: empresa.updated_at
  })) as Empresa[];
}

export async function listLookup(kind: string) {
  const { data, error } = await supabase
    .from("lookup_items")
    .select("*")
    .eq("kind", kind)
    .eq("active", true)
    .order("label");
  if (error) throw error;
  return data as LookupItem[];
}

export async function uploadAssociadoFoto(associadoId: number, file: File) {
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${associadoId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("associados-fotos").upload(path, file, { upsert: false });
  if (error) throw error;

  const { error: updateError } = await supabaseUnsafe.from("associados").update({ foto_path: path }).eq("id", associadoId);
  if (updateError) throw updateError;

  return path;
}

export function getFotoUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from("associados-fotos").getPublicUrl(path).data.publicUrl;
}
