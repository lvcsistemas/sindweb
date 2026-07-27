import { supabase } from "../../lib/supabase";
import type { AtendimentoMedicoInsert, AtendimentoMedicoLista } from "../../types/database";

const supabaseUnsafe = supabase as any;

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function listAtendimentosMedicos(search: string) {
  let query = supabaseUnsafe
    .from("atendimento_medico")
    .select(`
      id,
      created_by,
      updated_by,
      convenio_id,
      associado_id,
      dependente_id,
      qtd,
      created_at,
      updated_at,
      dt_agendado,
      situacao,
      tipo,
      obs,
      convenio:atendimento_medico_convenios!atendimento_medico_convenio_id_fkey (
        nm_convenio
      ),
      associado:associados!atendimento_medico_associado_id_fkey (
        nome,
        matricula
      )
    `)
    .order("dt_agendado", { ascending: false });

  const term = search.trim();
  if (term) {
    query = query.or(`situacao.ilike.%${term}%,tipo.ilike.%${term}%,obs.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as AtendimentoMedicoLista[];
}

export async function saveAtendimentoMedico(values: AtendimentoMedicoInsert) {
  const payload = {
    ...values,
    created_by: toNumber(values.created_by),
    updated_by: toNumber(values.updated_by),
    convenio_id: toNumber(values.convenio_id),
    associado_id: toNumber(values.associado_id),
    dependente_id: toNumber(values.dependente_id),
    qtd: toNumber(values.qtd),
    dt_agendado: values.dt_agendado || new Date().toISOString(),
    situacao: values.situacao.trim().toUpperCase(),
    tipo: values.tipo.trim().toUpperCase(),
    obs: values.obs?.trim() || null
  };

  if (payload.id) {
    const { data, error } = await supabaseUnsafe
      .from("atendimento_medico")
      .update(payload)
      .eq("id", payload.id)
      .select()
      .single();
    if (error) throw error;
    return data as AtendimentoMedicoLista;
  }

  const { data, error } = await supabaseUnsafe
    .from("atendimento_medico")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as AtendimentoMedicoLista;
}

export async function deleteAtendimentoMedico(id: number) {
  const { error } = await supabaseUnsafe.from("atendimento_medico").delete().eq("id", id);
  if (error) throw error;
}
