import { supabase } from "../../lib/supabase";
import type { Cnae, CnaeInsert } from "../../types/database";

const supabaseUnsafe = supabase as any;

export async function listCnaes(search: string) {
  let query = supabaseUnsafe
    .from("cnae")
    .select("*")
    .order("codigo_cnae", { ascending: true });

  const term = search.trim();
  if (term) {
    query = query.or(`codigo_cnae.ilike.%${term}%,descricao.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Cnae[];
}

export async function saveCnae(values: CnaeInsert) {
  const payload = {
    ...values,
    codigo_cnae: values.codigo_cnae.trim(),
    descricao: values.descricao.trim().toUpperCase()
  };

  if (payload.id) {
    const { data, error } = await supabaseUnsafe
      .from("cnae")
      .update(payload)
      .eq("id", payload.id)
      .select()
      .single();
    if (error) throw error;
    return data as Cnae;
  }

  const { data, error } = await supabaseUnsafe
    .from("cnae")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Cnae;
}

export async function deleteCnae(id: number) {
  const { error } = await supabaseUnsafe.from("cnae").delete().eq("id", id);
  if (error) throw error;
}
