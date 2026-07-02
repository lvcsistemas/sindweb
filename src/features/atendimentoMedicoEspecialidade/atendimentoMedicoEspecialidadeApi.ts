import { supabase } from "../../lib/supabase";
import type { AtendimentoMedicoEspecialidade, AtendimentoMedicoEspecialidadeInsert } from "../../types/database";

const supabaseUnsafe = supabase as any;

export const ATENDIMENTO_MEDICO_ESPECIALIDADE_TIPOS = [
  "ESPECIALIDADE",
  "FEZES-URINA",
  "OUTROS",
  "RADIOLOGIA",
  "EXAME DE SANGUE",
  "ULTRASSONOGRAFIA"
] as const;

export async function listAtendimentoMedicoEspecialidades(search: string) {
  let query = supabaseUnsafe
    .from("atendimento_medico_especialidade")
    .select("*")
    .order("tipo", { ascending: true })
    .order("nm_especialidade", { ascending: true });

  const term = search.trim();
  if (term) {
    query = query.or(`tipo.ilike.%${term}%,nm_especialidade.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as AtendimentoMedicoEspecialidade[];
}

export async function saveAtendimentoMedicoEspecialidade(values: AtendimentoMedicoEspecialidadeInsert) {
  const payload = {
    ...values,
    tipo: values.tipo.trim().toUpperCase(),
    nm_especialidade: values.nm_especialidade.trim().toUpperCase()
  };

  if (payload.id) {
    const { data, error } = await supabaseUnsafe
      .from("atendimento_medico_especialidade")
      .update(payload)
      .eq("id", payload.id)
      .select()
      .single();
    if (error) throw error;
    return data as AtendimentoMedicoEspecialidade;
  }

  const { data, error } = await supabaseUnsafe
    .from("atendimento_medico_especialidade")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as AtendimentoMedicoEspecialidade;
}

export async function deleteAtendimentoMedicoEspecialidade(id: number) {
  const { error } = await supabaseUnsafe.from("atendimento_medico_especialidade").delete().eq("id", id);
  if (error) throw error;
}
