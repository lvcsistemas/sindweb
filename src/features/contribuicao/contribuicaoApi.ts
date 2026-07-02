import { supabase } from "../../lib/supabase";
import type { Contribuicao, ContribuicaoInsert } from "../../types/database";

const supabaseUnsafe = supabase as any;

export async function listContribuicoes(search: string) {
  let query = supabaseUnsafe
    .from("contribuicao")
    .select("*")
    .order("tipo", { ascending: true });

  const term = search.trim();
  if (term) {
    query = query.or(`tipo.ilike.%${term}%,nm_contribuicao.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Contribuicao[];
}

export async function saveContribuicao(values: ContribuicaoInsert) {
  const payload = {
    ...values,
    tipo: values.tipo.trim().toUpperCase(),
    nm_contribuicao: values.nm_contribuicao.trim().toUpperCase(),
    instrucao: values.instrucao?.trim() || null,
    dia_vencimento: Number(values.dia_vencimento || 1),
    valor_base: Number(values.valor_base || 0)
  };

  if (payload.id) {
    const { data, error } = await supabaseUnsafe
      .from("contribuicao")
      .update(payload)
      .eq("id", payload.id)
      .select()
      .single();
    if (error) throw error;
    return data as Contribuicao;
  }

  const { data, error } = await supabaseUnsafe
    .from("contribuicao")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Contribuicao;
}

export async function deleteContribuicao(id: number) {
  const { error } = await supabaseUnsafe.from("contribuicao").delete().eq("id", id);
  if (error) throw error;
}
