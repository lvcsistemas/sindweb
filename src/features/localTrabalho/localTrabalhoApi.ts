import { supabase } from "../../lib/supabase";
import type { LocalTrabalho, LocalTrabalhoInsert } from "../../types/database";

const supabaseUnsafe = supabase as any;

function onlyDigits(value: string | null | undefined) {
  return value?.replace(/\D/g, "") || null;
}

export async function listLocaisTrabalho(search: string) {
  let query = supabaseUnsafe
    .from("locais_trabalho")
    .select("*")
    .order("nome", { ascending: true });

  const term = search.trim();
  if (term) {
    query = query.or(`nome.ilike.%${term}%,email.ilike.%${term}%,nm_contato.ilike.%${term}%,cidade.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as LocalTrabalho[];
}

export async function saveLocalTrabalho(values: LocalTrabalhoInsert) {
  const payload = {
    ...values,
    nome: values.nome.trim().toUpperCase(),
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
      .from("locais_trabalho")
      .update(payload)
      .eq("id", payload.id)
      .select()
      .single();
    if (error) throw error;
    return data as LocalTrabalho;
  }

  const { data, error } = await supabaseUnsafe
    .from("locais_trabalho")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as LocalTrabalho;
}

export async function deleteLocalTrabalho(id: number) {
  const { error } = await supabaseUnsafe.from("locais_trabalho").delete().eq("id", id);
  if (error) throw error;
}
