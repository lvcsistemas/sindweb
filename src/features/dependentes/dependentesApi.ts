import { supabase } from "../../lib/supabase";
import type { AssociadoOption, AssociadoDependente, AssociadoDependenteInsert } from "../../types/database";

const supabaseUnsafe = supabase as any;

function onlyDigits(value: string | null | undefined) {
  return value?.replace(/\D/g, "") || null;
}

export async function listDependentes(search: string) {
  let query = supabaseUnsafe
    .from("associados_dependentes")
    .select("*")
    .order("nm_dependente", { ascending: true });

  const term = search.trim();
  if (term) {
    query = query.or(`nm_dependente.ilike.%${term}%,cpf.ilike.%${term}%,parentesco.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as AssociadoDependente[];
}

export async function listAssociadosOptions() {
  const { data, error } = await supabaseUnsafe
    .from("associados")
    .select("id, nome, cpf")
    .order("nome", { ascending: true })
    .limit(500);
  if (error) throw error;
  return data as AssociadoOption[];
}

export async function saveDependente(values: AssociadoDependenteInsert) {
  if (!Number(values.associado_id)) {
    throw new Error("Selecione um associado.");
  }

  const payload = {
    ...values,
    associado_id: Number(values.associado_id || 0),
    dt_nascimento: values.dt_nascimento,
    nm_dependente: values.nm_dependente.trim().toUpperCase(),
    cpf: onlyDigits(values.cpf),
    sexo: values.sexo || "M",
    estado_civil: values.estado_civil.trim().toUpperCase(),
    parentesco: values.parentesco.trim().toUpperCase(),
    telefone: onlyDigits(values.telefone),
    obs: values.obs?.trim() || null
  };

  if (payload.id) {
    const { data, error } = await supabaseUnsafe
      .from("associados_dependentes")
      .update(payload)
      .eq("id", payload.id)
      .select()
      .single();
    if (error) throw error;
    return data as AssociadoDependente;
  }

  const { data, error } = await supabaseUnsafe
    .from("associados_dependentes")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as AssociadoDependente;
}

export async function deleteDependente(id: number) {
  const { error } = await supabaseUnsafe.from("associados_dependentes").delete().eq("id", id);
  if (error) throw error;
}
