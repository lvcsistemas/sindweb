import { supabase } from "../../lib/supabase";
import type { Associado, AssociadoContribuicaoLista, AssociadoLista, Auxiliar, Empresa, LocalTrabalho } from "../../types/database";
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

export async function listAssociadoContribuicoes(associadoId: number) {
  const { data, error } = await supabaseUnsafe
    .from("associados_contribuicoes")
    .select(`
      id,
      associado_id,
      contribuicao_id,
      created_at,
      dt_pg,
      contribuicao:contribuicoes!associados_contribuicoes_contribuicao_id_fkey (
        tipo,
        nm_contribuicao,
        valor_base
      )
    `)
    .eq("associado_id", associadoId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as AssociadoContribuicaoLista[];
}

export async function addAssociadoContribuicao(associadoId: number, contribuicaoId: number) {
  const { data, error } = await supabaseUnsafe
    .from("associados_contribuicoes")
    .insert({ associado_id: associadoId, contribuicao_id: contribuicaoId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteAssociadoContribuicao(id: number) {
  const { error } = await supabaseUnsafe.from("associados_contribuicoes").delete().eq("id", id);
  if (error) throw error;
}

export async function saveAssociado(values: AssociadoFormValues) {
  const { data, error } = await supabaseUnsafe.rpc("save_associado", { payload: values });
  if (error) throw error;
  return data as number;
}

function mapEmpresaOption(empresa: {
  id: number;
  nm_fantasia: string;
  razao_social: string | null;
  cei_cnpj: string | null;
  ativo: string;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: empresa.id,
    legacy_id: null,
    nome_fantasia: empresa.nm_fantasia,
    razao_social: empresa.razao_social,
    cnpj: empresa.cei_cnpj,
    ativo: empresa.ativo === "S",
    created_at: empresa.created_at,
    updated_at: empresa.updated_at
  } as Empresa;
}

export async function listEmpresas(search = "") {
  let query = supabaseUnsafe
    .from("empresas")
    .select("id, nm_fantasia, razao_social, cei_cnpj, ativo, created_at, updated_at")
    .eq("ativo", "S")
    .order("nm_fantasia")
    .limit(30);

  const term = search.trim();
  if (term) {
    const filters = [`nm_fantasia.ilike.%${term}%`, `razao_social.ilike.%${term}%`, `cei_cnpj.ilike.%${term}%`];
    if (/^\d+$/.test(term)) {
      filters.unshift(`id.eq.${term}`);
    }
    query = query.or(filters.join(","));
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as Parameters<typeof mapEmpresaOption>[0][]).map(mapEmpresaOption);
}

export async function getEmpresaOption(id: number) {
  const { data, error } = await supabaseUnsafe
    .from("empresas")
    .select("id, nm_fantasia, razao_social, cei_cnpj, ativo, created_at, updated_at")
    .eq("id", id)
    .single();
  if (error) throw error;
  return mapEmpresaOption(data as Parameters<typeof mapEmpresaOption>[0]);
}

export async function listAuxiliaresOptions(grupo: string) {
  const { data, error } = await supabaseUnsafe
    .from("auxiliares")
    .select("*")
    .eq("grupo", grupo)
    .eq("ativo", "S")
    .order("ordem", { ascending: true })
    .order("nome", { ascending: true });
  if (error) throw error;
  return data as Auxiliar[];
}

export async function listLocaisTrabalhoOptions() {
  const { data, error } = await supabaseUnsafe
    .from("locais_trabalho")
    .select("*")
    .order("nome", { ascending: true })
    .limit(500);
  if (error) throw error;
  return data as LocalTrabalho[];
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
