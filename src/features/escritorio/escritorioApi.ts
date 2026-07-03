import { supabase } from "../../lib/supabase";
import type { Escritorio, EscritorioInsert } from "../../types/database";

const supabaseUnsafe = supabase as any;

function onlyDigits(value: string | null | undefined) {
  return value?.replace(/\D/g, "") || null;
}

export async function listEscritorios(search: string) {
  let query = supabaseUnsafe
    .from("empresas_escritorios")
    .select("*")
    .order("razao_social", { ascending: true });

  const term = search.trim();
  if (term) {
    query = query.or(`razao_social.ilike.%${term}%,nm_fantasia.ilike.%${term}%,cpf_cnpj.ilike.%${term}%,nm_contato.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Escritorio[];
}

export async function listEscritoriosByEmpresa(empresaId: number) {
  const { data, error } = await supabaseUnsafe
    .from("empresas_escritorios")
    .select("*")
    .eq("empresa_id", empresaId)
    .order("nm_fantasia", { ascending: true });

  if (error) throw error;
  return data as Escritorio[];
}

export async function saveEscritorio(values: EscritorioInsert) {
  const payload = {
    ...values,
    empresa_id: Number(values.empresa_id || 0),
    razao_social: values.razao_social.trim().toUpperCase(),
    nm_fantasia: values.nm_fantasia.trim().toUpperCase(),
    cpf_cnpj: onlyDigits(values.cpf_cnpj) ?? "",
    email: values.email?.trim().toLowerCase() || null,
    tel1: onlyDigits(values.tel1),
    tel2: onlyDigits(values.tel2),
    nm_contato: values.nm_contato?.trim().toUpperCase() || null,
    endereco: values.endereco?.trim().toUpperCase() || null,
    numero: values.numero?.trim() || null,
    complemento: values.complemento?.trim().toUpperCase() || null,
    bairro: values.bairro?.trim().toUpperCase() || null,
    cidade: values.cidade?.trim().toUpperCase() || null,
    uf: values.uf?.trim().toUpperCase() || "RJ",
    cep: onlyDigits(values.cep),
    obs: values.obs?.trim() || null
  };

  if (payload.id) {
    const { data, error } = await supabaseUnsafe
      .from("empresas_escritorios")
      .update(payload)
      .eq("id", payload.id)
      .select()
      .single();
    if (error) throw error;
    return data as Escritorio;
  }

  const { data, error } = await supabaseUnsafe
    .from("empresas_escritorios")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Escritorio;
}

export async function deleteEscritorio(id: number) {
  const { error } = await supabaseUnsafe.from("empresas_escritorios").delete().eq("id", id);
  if (error) throw error;
}
