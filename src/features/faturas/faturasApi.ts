import { supabase } from "../../lib/supabase";
import type { Banco, Contribuicao, FaturaInsert, FaturaLista } from "../../types/database";

const supabaseUnsafe = supabase as any;

export type FaturaFilters = {
  sacadoTipo: "TODOS" | "ASSOCIADO" | "EMPRESA";
  situacao: "TODOS" | "ABERTA" | "PAGA" | "CANCELADA";
  inicio: string;
  fim: string;
  valor: string;
};

export type GerarFaturasPayload = {
  sacadoTipo: "ASSOCIADO" | "EMPRESA";
  escopo: "TODOS" | "ESPECIFICO";
  sacadoId: number;
  contribuicaoId: number;
  bancoId: number;
  ateMes: number;
  ateAno: number;
};

export type GerarFaturasResultado = {
  geradas: number;
  ignoradas: number;
};

function raiseSupabaseError(error: { message?: string } | null) {
  if (error) throw new Error(error.message || "Erro ao acessar o Supabase.");
}

function monthStart(date = new Date()) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function lastDayOfMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function toDateOnly(year: number, month: number, day: number) {
  const safeDay = Math.min(day, lastDayOfMonth(year, month));
  return `${year}-${String(month).padStart(2, "0")}-${String(safeDay).padStart(2, "0")}`;
}

function referenciaFromVencimento(year: number, month: number) {
  if (month === 1) return { mes: 12, ano: year - 1 };
  return { mes: month - 1, ano: year };
}

function buildCompetenciasAte(ateMes: number, ateAno: number) {
  const start = monthStart();
  const end = new Date(ateAno, ateMes - 1, 1);
  const months: Array<{ vencimentoMes: number; vencimentoAno: number; competenciaMes: number; competenciaAno: number }> = [];

  for (let current = start; current <= end; current = addMonths(current, 1)) {
    const vencimentoMes = current.getMonth() + 1;
    const vencimentoAno = current.getFullYear();
    const referencia = referenciaFromVencimento(vencimentoAno, vencimentoMes);
    months.push({
      vencimentoMes,
      vencimentoAno,
      competenciaMes: referencia.mes,
      competenciaAno: referencia.ano
    });
  }

  return months;
}

export async function listFaturas(filters: FaturaFilters) {
  let query = supabaseUnsafe
    .from("faturas_lista")
    .select("*")
    .gte("dt_vencimento", filters.inicio)
    .lte("dt_vencimento", filters.fim)
    .order("dt_vencimento", { ascending: true });

  if (filters.sacadoTipo !== "TODOS") query = query.eq("sacado_tipo", filters.sacadoTipo);
  if (filters.situacao !== "TODOS") query = query.eq("situacao", filters.situacao);

  const term = filters.valor.trim();
  if (term) {
    query = query.or(`associado_nome.ilike.%${term}%,empresa_nome.ilike.%${term}%,associado_documento.ilike.%${term}%,empresa_documento.ilike.%${term}%,nm_contribuicao.ilike.%${term}%,banco_nome.ilike.%${term}%`);
  }

  const { data, error } = await query;
  raiseSupabaseError(error);
  return data as FaturaLista[];
}

export async function gerarFaturas(payload: GerarFaturasPayload) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.id) throw new Error("Sessao expirada. Entre novamente para gerar faturas.");

  const { data: contribuicao, error: contribuicaoError } = await supabaseUnsafe
    .from("contribuicoes")
    .select("*")
    .eq("id", payload.contribuicaoId)
    .single();
  raiseSupabaseError(contribuicaoError);

  const { data: banco, error: bancoError } = await supabaseUnsafe
    .from("bancos")
    .select("*")
    .eq("id", payload.bancoId)
    .single();
  raiseSupabaseError(bancoError);

  const sacadosQuery = payload.sacadoTipo === "ASSOCIADO"
    ? supabaseUnsafe.from("associados").select("id").order("nome", { ascending: true })
    : supabaseUnsafe.from("empresas").select("id").order("nm_fantasia", { ascending: true });

  const scopedQuery = payload.escopo === "ESPECIFICO" ? sacadosQuery.eq("id", payload.sacadoId) : sacadosQuery;
  const { data: sacados, error: sacadosError } = await scopedQuery;
  raiseSupabaseError(sacadosError);

  const meses = buildCompetenciasAte(payload.ateMes, payload.ateAno);
  if (meses.length === 0) throw new Error("Informe mês/ano final igual ou posterior ao mês atual.");

  const payloads: FaturaInsert[] = [];
  for (const sacado of sacados as Array<{ id: number }>) {
    for (const mes of meses) {
      payloads.push(buildFaturaPayload(payload.sacadoTipo, sacado.id, contribuicao as Contribuicao, banco as Banco, mes, user.id));
    }
  }

  if (payloads.length === 0) return { geradas: 0, ignoradas: 0 } satisfies GerarFaturasResultado;

  const { data, error } = await supabaseUnsafe
    .from("faturas")
    .upsert(payloads, {
      onConflict: "sacado_tipo,associado_id,empresa_id,contribuicao_id,competencia_mes,competencia_ano",
      ignoreDuplicates: true
    })
    .select("id");
  raiseSupabaseError(error);

  const geradas = data?.length ?? 0;
  return { geradas, ignoradas: payloads.length - geradas } satisfies GerarFaturasResultado;
}

function buildFaturaPayload(
  sacadoTipo: "ASSOCIADO" | "EMPRESA",
  sacadoId: number,
  contribuicao: Contribuicao,
  banco: Banco,
  mes: { vencimentoMes: number; vencimentoAno: number; competenciaMes: number; competenciaAno: number },
  userId: string
): FaturaInsert {
  return {
    sacado_tipo: sacadoTipo,
    associado_id: sacadoTipo === "ASSOCIADO" ? sacadoId : null,
    empresa_id: sacadoTipo === "EMPRESA" ? sacadoId : null,
    contribuicao_id: contribuicao.id,
    banco_id: banco.id,
    competencia_mes: mes.competenciaMes,
    competencia_ano: mes.competenciaAno,
    dt_emissao: new Date().toISOString().slice(0, 10),
    dt_vencimento: toDateOnly(mes.vencimentoAno, mes.vencimentoMes, contribuicao.dia_vencimento),
    valor_base: Number(contribuicao.valor_base || 0),
    tx_bancaria: Number(banco.tx_bancaria || 0),
    multa_percentual: Number(banco.multa_percentual || 0),
    juros_dia_percentual: Number(banco.juros_dia_percentual || 0),
    desconto_percentual: Number(banco.desconto_percentual || 0),
    outros_acrescimos: Number(banco.outros_acrescimos || 0),
    nosso_numero: null,
    linha_digitavel: null,
    situacao: "ABERTA",
    created_by: userId,
    updated_by: userId
  };
}
