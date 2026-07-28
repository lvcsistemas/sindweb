import { supabase } from "../../lib/supabase";
import type { AtendimentoMedicoConvenio, AtendimentoMedicoConvenioEspecialidadeLista, AtendimentoMedicoConvenioInsert } from "../../types/database";

const supabaseUnsafe = supabase as any;

function onlyDigits(value: string | null | undefined) {
  return value?.replace(/\D/g, "") || null;
}

export async function listAtendimentoMedicoConvenios(search: string) {
  let query = supabaseUnsafe
    .from("atendimento_medico_convenios")
    .select("*")
    .order("nm_convenio", { ascending: true });

  const term = search.trim();
  if (term) {
    query = query.or(`nm_convenio.ilike.%${term}%,nm_responsavel.ilike.%${term}%,cpf_cnpj.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as AtendimentoMedicoConvenio[];
}

export async function saveAtendimentoMedicoConvenio(values: AtendimentoMedicoConvenioInsert) {
  const payload = {
    ...values,
    ativo: values.ativo || "S",
    tipo_pessoa: values.tipo_pessoa || "J",
    nm_convenio: values.nm_convenio.trim().toUpperCase(),
    nm_responsavel: values.nm_responsavel?.trim().toUpperCase() || null,
    cpf_cnpj: onlyDigits(values.cpf_cnpj) ?? "",
    endereco: values.endereco?.trim().toUpperCase() || null,
    numero: values.numero?.trim() || null,
    complemento: values.complemento?.trim().toUpperCase() || null,
    bairro: values.bairro?.trim().toUpperCase() || null,
    cidade: values.cidade?.trim().toUpperCase() || null,
    uf: values.uf?.trim().toUpperCase() || "RJ",
    cep: onlyDigits(values.cep),
    tel1: onlyDigits(values.tel1),
    tel2: onlyDigits(values.tel2),
    tel3: onlyDigits(values.tel3),
    obs: values.obs?.trim() || null
  };

  if (payload.id) {
    const { data, error } = await supabaseUnsafe
      .from("atendimento_medico_convenios")
      .update(payload)
      .eq("id", payload.id)
      .select()
      .single();
    if (error) throw error;
    return data as AtendimentoMedicoConvenio;
  }

  const { data, error } = await supabaseUnsafe
    .from("atendimento_medico_convenios")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as AtendimentoMedicoConvenio;
}

export async function deleteAtendimentoMedicoConvenio(id: number) {
  const { error } = await supabaseUnsafe.from("atendimento_medico_convenios").delete().eq("id", id);
  if (error) throw error;
}
export async function listConvenioEspecialidades(convenioId: number) {
  const { data, error } = await supabaseUnsafe
    .from("atendimento_medico_convenios_especialidades")
    .select("id, convenio_id, especialidade_id, created_at, especialidade:atendimento_medico_especialidades(id, tipo, nm_especialidade)")
    .eq("convenio_id", convenioId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as AtendimentoMedicoConvenioEspecialidadeLista[];
}

export async function addConvenioEspecialidade(convenioId: number, especialidadeId: number) {
  const { data, error } = await supabaseUnsafe
    .from("atendimento_medico_convenios_especialidades")
    .insert({ convenio_id: convenioId, especialidade_id: especialidadeId })
    .select("id, convenio_id, especialidade_id, created_at, especialidade:atendimento_medico_especialidades(id, tipo, nm_especialidade)")
    .single();

  if (error) throw error;
  return data as AtendimentoMedicoConvenioEspecialidadeLista;
}

export async function deleteConvenioEspecialidade(id: number) {
  const { error } = await supabaseUnsafe
    .from("atendimento_medico_convenios_especialidades")
    .delete()
    .eq("id", id);

  if (error) throw error;
}
