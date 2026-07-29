import { supabase } from "../../lib/supabase";
import type { AtendimentoMedicoExame, AtendimentoMedicoExameInsert } from "../../types/database";

const supabaseUnsafe = supabase as any;

export const ATENDIMENTO_MEDICO_EXAME_TIPOS = [
  "FEZES/URINA",
  "OUTROS",
  "RADIOLOGIA",
  "SANGUE",
  "ULTRASSONOGRAFIA"
] as const;

export async function listAtendimentoMedicoExames(search: string) {
  let query = supabaseUnsafe
    .from("atendimento_medico_exames")
    .select("*")
    .order("tipo", { ascending: true })
    .order("exame", { ascending: true });

  const term = search.trim();
  if (term) {
    query = query.or(`tipo.ilike.%${term}%,exame.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as AtendimentoMedicoExame[];
}

export async function listAtendimentoMedicoExamesByTipos(tipos: string[]) {
  const { data, error } = await supabaseUnsafe
    .from("atendimento_medico_exames")
    .select("*")
    .in("tipo", tipos)
    .order("tipo", { ascending: true })
    .order("exame", { ascending: true });

  if (error) throw error;
  return data as AtendimentoMedicoExame[];
}

export async function saveAtendimentoMedicoExame(values: AtendimentoMedicoExameInsert) {
  const payload = {
    ...values,
    tipo: values.tipo.trim().toUpperCase(),
    exame: values.exame.trim().toUpperCase()
  };

  if (payload.id) {
    const { data, error } = await supabaseUnsafe
      .from("atendimento_medico_exames")
      .update(payload)
      .eq("id", payload.id)
      .select()
      .single();
    if (error) throw error;
    return data as AtendimentoMedicoExame;
  }

  const { data, error } = await supabaseUnsafe
    .from("atendimento_medico_exames")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as AtendimentoMedicoExame;
}

export async function deleteAtendimentoMedicoExame(id: number) {
  const { error } = await supabaseUnsafe.from("atendimento_medico_exames").delete().eq("id", id);
  if (error) throw error;
}
