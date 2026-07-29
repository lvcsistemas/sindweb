import { supabase } from "../../lib/supabase";
import type { AssociadoContribuicaoLista, AtendimentoMedicoInsert, AtendimentoMedicoItem, AtendimentoMedicoItemInsert, AtendimentoMedicoLista } from "../../types/database";

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

export type AtendimentoAssociadoResumo = {
  id: number;
  matricula: string | null;
  situacao: string | null;
  data_filiacao: string | null;
  data_nascimento: string | null;
  sexo: string | null;
  tel1: string | null;
  tel2: string | null;
  tel3: string | null;
  empresa_id: number | null;
  empresa_nome: string | null;
  convencao: string | null;
  local_pagamento: string | null;
  observacao: string | null;
  consultas_mes: number;
  exames_mes: number;
  contribuicoes: AssociadoContribuicaoLista[];
};

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function raiseSupabaseError(error: { message?: string } | null) {
  if (error) throw new Error(error.message || "Erro ao acessar o Supabase.");
}

const situacaoFilters = new Set(["AGENDADO", "ATENDIDO", "CANCELADO"]);
const tipoFilters = new Set(["AURICULOTERAPIA", "CARDIOLOGIA", "CLINICO GERAL", "CONSULTA", "EXAME", "EXAME DE SANGUE", "FISIOTERAPIA", "FONOAUDIOLOGIA", "MASSOTERAPIA", "ODONTOLOGIA", "PSICOLOGIA"]);

function dateEnd(value: string) {
  return value ? value : new Date().toISOString();
}

function currentMonthRange() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const toLocal = (date: Date) => {
    const offsetMs = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - offsetMs).toISOString().slice(0, 19);
  };
  return { start: toLocal(start), end: toLocal(end) };
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
    query = query.eq("updated_by", filters.usuarioId);
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
  raiseSupabaseError(error);
  return data as AtendimentoMedicoLista[];
}

export async function saveAtendimentoMedico(values: AtendimentoMedicoInsert) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error("Sessao expirada. Entre novamente para salvar o atendimento.");

  const payload = {
    ...values,
    created_by: values.id ? values.created_by ?? user.id : user.id,
    updated_by: user.id,
    created_by_legacy: toNumber(values.created_by_legacy),
    updated_by_legacy: toNumber(values.updated_by_legacy),
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
    raiseSupabaseError(error);
    return data as AtendimentoMedicoLista;
  }

  const { data, error } = await supabaseUnsafe
    .from("atendimento_medico")
    .insert(payload)
    .select()
    .single();
  raiseSupabaseError(error);
  return data as AtendimentoMedicoLista;
}

export async function listAtendimentoMedicoItens(atendimentoId: number) {
  const { data, error } = await supabaseUnsafe
    .from("atendimento_medico_itens")
    .select("*")
    .eq("atendimento_id", atendimentoId)
    .order("descricao", { ascending: true });

  raiseSupabaseError(error);
  return data as AtendimentoMedicoItem[];
}

export async function replaceAtendimentoMedicoItens(atendimentoId: number, itens: AtendimentoMedicoItemInsert[]) {
  const { error: deleteError } = await supabaseUnsafe
    .from("atendimento_medico_itens")
    .delete()
    .eq("atendimento_id", atendimentoId);
  raiseSupabaseError(deleteError);

  const payload = itens.map((item) => ({
    atendimento_id: atendimentoId,
    tipo: item.tipo.trim().toUpperCase(),
    descricao: item.descricao.trim().toUpperCase()
  })).filter((item) => item.descricao);

  if (payload.length === 0) return [] as AtendimentoMedicoItem[];

  const { data, error } = await supabaseUnsafe
    .from("atendimento_medico_itens")
    .insert(payload)
    .select()
    .order("descricao", { ascending: true });

  raiseSupabaseError(error);
  return data as AtendimentoMedicoItem[];
}

export async function getAtendimentoAssociadoResumo(associadoId: number) {
  const { start, end } = currentMonthRange();

  const { data: associado, error: associadoError } = await supabaseUnsafe
    .from("associados")
    .select("id, matricula, situacao_id, data_cadastro, data_nascimento, sexo, tel1, tel2, tel3, empresa_id, local_pagamento_id, observacao")
    .eq("id", associadoId)
    .single();
  raiseSupabaseError(associadoError);

  const empresaId = associado?.empresa_id ? Number(associado.empresa_id) : 0;
  const situacaoId = associado?.situacao_id ? Number(associado.situacao_id) : 0;
  const localPagamentoId = associado?.local_pagamento_id ? Number(associado.local_pagamento_id) : 0;

  const [
    empresaResult,
    situacaoResult,
    localPagamentoResult,
    consultasResult,
    examesResult,
    contribuicoesResult
  ] = await Promise.all([
    empresaId ? supabaseUnsafe.from("empresas").select("id, nm_fantasia, convencao_id").eq("id", empresaId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    situacaoId ? supabaseUnsafe.from("auxiliares").select("nome").eq("id", situacaoId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    localPagamentoId ? supabaseUnsafe.from("auxiliares").select("nome").eq("id", localPagamentoId).maybeSingle() : Promise.resolve({ data: null, error: null }),
    supabaseUnsafe.from("atendimento_medico").select("id", { count: "exact", head: true }).eq("associado_id", associadoId).gte("dt_agendado", start).lt("dt_agendado", end).ilike("tipo", "%CONSULTA%"),
    supabaseUnsafe.from("atendimento_medico").select("id", { count: "exact", head: true }).eq("associado_id", associadoId).gte("dt_agendado", start).lt("dt_agendado", end).ilike("tipo", "%EXAME%"),
    supabaseUnsafe
      .from("associados_contribuicoes")
      .select(`
        id,
        associado_id,
        contribuicao_id,
        created_at,
        dt_pg,
        contribuicao:contribuicoes!associados_contribuicoes_contribuicao_id_fkey (
          tipo,
          nm_contribuicao,
          valor_base
        )
      `)
      .eq("associado_id", associadoId)
      .order("dt_pg", { ascending: false })
  ]);

  raiseSupabaseError(empresaResult.error);
  raiseSupabaseError(situacaoResult.error);
  raiseSupabaseError(localPagamentoResult.error);
  raiseSupabaseError(consultasResult.error);
  raiseSupabaseError(examesResult.error);
  raiseSupabaseError(contribuicoesResult.error);

  const empresa = empresaResult.data;
  const convencaoId = empresa?.convencao_id ? Number(empresa.convencao_id) : 0;
  const { data: convencao, error: convencaoError } = convencaoId
    ? await supabaseUnsafe.from("auxiliares").select("nome").eq("id", convencaoId).maybeSingle()
    : { data: null, error: null };
  raiseSupabaseError(convencaoError);

  return {
    id: associado.id,
    matricula: associado.matricula,
    situacao: situacaoResult.data?.nome ?? null,
    data_filiacao: associado.data_cadastro,
    data_nascimento: associado.data_nascimento,
    sexo: associado.sexo,
    tel1: associado.tel1,
    tel2: associado.tel2,
    tel3: associado.tel3,
    empresa_id: empresa?.id ?? null,
    empresa_nome: empresa?.nm_fantasia ?? null,
    convencao: convencao?.nome ?? null,
    local_pagamento: localPagamentoResult.data?.nome ?? null,
    observacao: associado.observacao,
    consultas_mes: consultasResult.count ?? 0,
    exames_mes: examesResult.count ?? 0,
    contribuicoes: (contribuicoesResult.data ?? []) as AssociadoContribuicaoLista[]
  } satisfies AtendimentoAssociadoResumo;
}

export async function listAtendimentosAssociadoMes(associadoId: number) {
  const { start, end } = currentMonthRange();
  const { data, error } = await supabaseUnsafe
    .from("atendimento_medico_lista")
    .select("*")
    .eq("associado_id", associadoId)
    .gte("dt_agendado", start)
    .lt("dt_agendado", end)
    .order("dt_agendado", { ascending: false });

  raiseSupabaseError(error);
  return data as AtendimentoMedicoLista[];
}
