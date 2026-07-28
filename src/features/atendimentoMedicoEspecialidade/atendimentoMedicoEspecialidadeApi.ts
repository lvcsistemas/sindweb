import { supabase } from "../../lib/supabase";
import type { AtendimentoMedicoEspecialidade, AtendimentoMedicoEspecialidadeInsert } from "../../types/database";

const supabaseUnsafe = supabase as any;

export async function listAtendimentoMedicoEspecialidades(search: string) {
  let query = supabaseUnsafe
    .from("atendimento_medico_especialidades")
    .select("*")
    .order("nm_especialidade", { ascending: true });

  const term = search.trim();
  if (term) {
    query = query.ilike("nm_especialidade", `%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as AtendimentoMedicoEspecialidade[];
}

export async function saveAtendimentoMedicoEspecialidade(values: AtendimentoMedicoEspecialidadeInsert) {
  const payload = {
    ...values,
    nm_especialidade: values.nm_especialidade.trim().toUpperCase()
  };

  if (payload.id) {
    const { data, error } = await supabaseUnsafe
      .from("atendimento_medico_especialidades")
      .update(payload)
      .eq("id", payload.id)
      .select()
      .single();
    if (error) throw error;
    return data as AtendimentoMedicoEspecialidade;
  }

  const { data, error } = await supabaseUnsafe
    .from("atendimento_medico_especialidades")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as AtendimentoMedicoEspecialidade;
}

export async function deleteAtendimentoMedicoEspecialidade(id: number) {
  const { error } = await supabaseUnsafe.from("atendimento_medico_especialidades").delete().eq("id", id);
  if (error) throw error;
}
