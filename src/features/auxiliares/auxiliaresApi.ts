import { supabase } from "../../lib/supabase";
import type { Auxiliar, AuxiliarInsert } from "../../types/database";

const supabaseUnsafe = supabase as any;

export async function listAuxiliares(grupo: string, search: string) {
  let query = supabaseUnsafe
    .from("auxiliares")
    .select("*")
    .eq("grupo", grupo)
    .order("ordem", { ascending: true })
    .order("nome", { ascending: true });

  const term = search.trim();
  if (term) {
    query = query.ilike("nome", `%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Auxiliar[];
}

export async function saveAuxiliar(values: AuxiliarInsert) {
  const payload = {
    ...values,
    grupo: values.grupo.trim(),
    nome: values.nome.trim().toUpperCase(),
    ativo: values.ativo || "S",
    ordem: Number(values.ordem || 0)
  };

  if (payload.id) {
    const { data, error } = await supabaseUnsafe
      .from("auxiliares")
      .update(payload)
      .eq("id", payload.id)
      .select()
      .single();
    if (error) throw error;
    return data as Auxiliar;
  }

  const { data, error } = await supabaseUnsafe
    .from("auxiliares")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Auxiliar;
}

export async function deleteAuxiliar(id: number) {
  const { error } = await supabaseUnsafe.from("auxiliares").delete().eq("id", id);
  if (error) throw error;
}
