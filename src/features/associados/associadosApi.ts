import { supabase } from "../../lib/supabase";
import type { Associado, AssociadoLista, Empresa, LookupItem } from "../../types/database";
import type { AssociadoFormValues } from "./associadosSchema";

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
  const { data, error } = await supabase.rpc("save_associado", { payload: values });
  if (error) throw error;
  return data as number;
}

export async function listEmpresas() {
  const { data, error } = await supabase
    .from("empresas")
    .select("id, legacy_id, nome_fantasia, razao_social, cnpj, ativo, created_at, updated_at")
    .eq("ativo", true)
    .order("nome_fantasia");
  if (error) throw error;
  return data as Empresa[];
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

  const { error: updateError } = await supabase.from("associados").update({ foto_path: path }).eq("id", associadoId);
  if (updateError) throw updateError;

  return path;
}

export function getFotoUrl(path: string | null) {
  if (!path) return null;
  return supabase.storage.from("associados-fotos").getPublicUrl(path).data.publicUrl;
}
