import { supabase } from "../../lib/supabase";
import type { AtendimentoHomologacaoInsert, AtendimentoHomologacaoLista } from "../../types/database";

const supabaseUnsafe = supabase as any;

export type AtendimentoHomologacaoSearchType =
  | "T"
  | "AGENDAMENTO"
  | "ID ATENDIMENTO"
  | "ID EMPRESA"
  | "NM EMPRESA"
  | "SEDE"
  | "HOMOLOGADOR"
  | "AGENDADO"
  | "ATENDIDO"
  | "CANCELADO";

export type AtendimentoHomologacaoFilters = {
  pesquisa: AtendimentoHomologacaoSearchType;
  inicio: string;
  fim: string;
  valor: string;
};

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function dateEnd(value: string) {
  return value ? value : new Date().toISOString();
}

function raiseSupabaseError(error: { message?: string } | null) {
  if (error) throw new Error(error.message || "Erro ao acessar o Supabase.");
}

const situacaoFilters = new Set(["AGENDADO", "ATENDIDO", "CANCELADO"]);

export async function listAtendimentosHomologacao(filters: AtendimentoHomologacaoFilters) {
  let query = supabaseUnsafe
    .from("atendimento_homologacao_lista")
    .select("*")
    .gte("dt_agendado", filters.inicio)
    .lte("dt_agendado", dateEnd(filters.fim))
    .order("dt_agendado", { ascending: true });

  const term = filters.valor.trim();
  if (filters.pesquisa === "ID ATENDIMENTO" && term) {
    query = query.eq("id", Number(term));
  } else if (filters.pesquisa === "ID EMPRESA" && term) {
    query = query.eq("empresa_id", Number(term));
  } else if (filters.pesquisa === "NM EMPRESA" && term) {
    query = query.ilike("nm_empresa", `%${term}%`);
  } else if (filters.pesquisa === "SEDE" && term) {
    query = query.ilike("nm_sede", `%${term}%`);
  } else if (filters.pesquisa === "HOMOLOGADOR" && term) {
    query = query.ilike("nm_homologador", `%${term}%`);
  } else if (situacaoFilters.has(filters.pesquisa)) {
    query = query.eq("situacao", filters.pesquisa);
  } else if (term) {
    query = query.or(`nm_empresa.ilike.%${term}%,razao_social.ilike.%${term}%,cei_cnpj.ilike.%${term}%,nm_sede.ilike.%${term}%,nm_homologador.ilike.%${term}%,situacao.ilike.%${term}%,obs.ilike.%${term}%`);
  }

  const { data, error } = await query;
  raiseSupabaseError(error);
  return data as AtendimentoHomologacaoLista[];
}

export async function saveAtendimentoHomologacao(values: AtendimentoHomologacaoInsert) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error("Sessao expirada. Entre novamente para salvar o atendimento de homologacao.");

  const payload = {
    ...values,
    created_by: values.id ? values.created_by ?? user.id : user.id,
    updated_by: user.id,
    sede_id: toNumber(values.sede_id),
    empresa_id: toNumber(values.empresa_id),
    dt_agendado: values.dt_agendado || new Date().toISOString(),
    situacao: values.situacao.trim().toUpperCase(),
    nm_homologador: values.nm_homologador.trim().toUpperCase(),
    qtd: toNumber(values.qtd),
    obs: values.obs?.trim() || null,
    updated_at: values.id ? new Date().toISOString() : values.updated_at
  };

  if (payload.id) {
    const { data, error } = await supabaseUnsafe
      .from("atendimento_homologacao")
      .update(payload)
      .eq("id", payload.id)
      .select()
      .single();
    raiseSupabaseError(error);
    return data as AtendimentoHomologacaoLista;
  }

  const { data, error } = await supabaseUnsafe
    .from("atendimento_homologacao")
    .insert(payload)
    .select()
    .single();
  raiseSupabaseError(error);
  return data as AtendimentoHomologacaoLista;
}
