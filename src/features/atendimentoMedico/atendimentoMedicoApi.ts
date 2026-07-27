import { supabase } from "../../lib/supabase";
import type { AtendimentoMedicoInsert, AtendimentoMedicoLista } from "../../types/database";

const supabaseUnsafe = supabase as any;

export type AtendimentoMedicoSearchType =
  | "T"
  | "CADASTRO"
  | "ID ATENDIMENTO"
  | "ID ASSOCIADO"
  | "ID CONVENIO"
  | "ID DEPENDENTE"
  | "NM ASSOCIADO"
  | "NM DEPENDENTE"
  | "NM CONVENIO"
  | "AGENDADO"
  | "ATENDIDO"
  | "CANCELADO"
  | "AURICULOTERAPIA"
  | "CARDIOLOGIA"
  | "CLINICO GERAL"
  | "CONSULTA"
  | "EXAME"
  | "EXAME DE SANGUE"
  | "FISIOTERAPIA"
  | "FONOAUDIOLOGIA"
  | "MASSOTERAPIA"
  | "ODONTOLOGIA"
  | "PSICOLOGIA";

export type AtendimentoMedicoFilters = {
  pesquisa: AtendimentoMedicoSearchType;
  inicio: string;
  fim: string;
  usuarioId: string;
  valor: string;
};

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const situacaoFilters = new Set(["AGENDADO", "ATENDIDO", "CANCELADO"]);
const tipoFilters = new Set(["AURICULOTERAPIA", "CARDIOLOGIA", "CLINICO GERAL", "CONSULTA", "EXAME", "EXAME DE SANGUE", "FISIOTERAPIA", "FONOAUDIOLOGIA", "MASSOTERAPIA", "ODONTOLOGIA", "PSICOLOGIA"]);

function dateEnd(value: string) {
  return value ? value : new Date().toISOString();
}

export async function listAtendimentosMedicos(filters: AtendimentoMedicoFilters) {
  let query = supabaseUnsafe
    .from("atendimento_medico_lista")
    .select("*")
    .order("dt_agendado", { ascending: false });

  if (filters.pesquisa === "CADASTRO") {
    query = query.gte("created_at", filters.inicio).lte("created_at", dateEnd(filters.fim));
  } else {
    query = query.gte("dt_agendado", filters.inicio).lte("dt_agendado", dateEnd(filters.fim));
  }

  if (filters.usuarioId !== "TODOS") {
    query = query.eq("updated_by_profile_id", filters.usuarioId);
  }

  const term = filters.valor.trim();
  if (filters.pesquisa === "ID ATENDIMENTO" && term) {
    query = query.eq("id", Number(term));
  } else if (filters.pesquisa === "ID ASSOCIADO" && term) {
    query = query.eq("associado_id", Number(term));
  } else if (filters.pesquisa === "ID CONVENIO" && term) {
    query = query.eq("convenio_id", Number(term));
  } else if (filters.pesquisa === "ID DEPENDENTE" && term) {
    query = query.eq("dependente_id", Number(term));
  } else if (filters.pesquisa === "NM ASSOCIADO" && term) {
    query = query.ilike("nm_associado", `%${term}%`);
  } else if (filters.pesquisa === "NM DEPENDENTE" && term) {
    query = query.ilike("nm_dependente", `%${term}%`);
  } else if (filters.pesquisa === "NM CONVENIO" && term) {
    query = query.ilike("nm_convenio", `%${term}%`);
  } else if (situacaoFilters.has(filters.pesquisa)) {
    query = query.eq("situacao", filters.pesquisa);
  } else if (tipoFilters.has(filters.pesquisa)) {
    query = query.eq("tipo", filters.pesquisa);
  } else if (term) {
    query = query.or(`nm_associado.ilike.%${term}%,nm_dependente.ilike.%${term}%,nm_convenio.ilike.%${term}%,situacao.ilike.%${term}%,tipo.ilike.%${term}%,obs.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as AtendimentoMedicoLista[];
}

export async function saveAtendimentoMedico(values: AtendimentoMedicoInsert) {
  const { data: { user } } = await supabase.auth.getUser();
  const payload = {
    ...values,
    created_by: toNumber(values.created_by),
    updated_by: toNumber(values.updated_by),
    created_by_profile_id: values.id ? values.created_by_profile_id : user?.id,
    updated_by_profile_id: user?.id,
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
