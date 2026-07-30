import { supabase } from "../../lib/supabase";
import type { Banco, BancoInsert } from "../../types/database";

const supabaseUnsafe = supabase as any;

function onlyDigits(value: string | null | undefined) {
  return value?.replace(/\D/g, "") || null;
}

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function cleanText(value: string | null | undefined, upper = true) {
  const text = value?.trim();
  if (!text) return null;
  return upper ? text.toUpperCase() : text;
}

export async function listBancos(search: string) {
  let query = supabaseUnsafe
    .from("bancos")
    .select("*")
    .order("banco_nome", { ascending: true });

  const term = search.trim();
  if (term) {
    query = query.or(`banco_numero.ilike.%${term}%,banco_nome.ilike.%${term}%,agencia_numero.ilike.%${term}%,conta_numero.ilike.%${term}%,nome_gerente.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as Banco[];
}

export async function saveBanco(values: BancoInsert) {
  const payload = {
    ...values,
    ativo: values.ativo || "S",
    banco_numero: onlyDigits(values.banco_numero) ?? "",
    banco_nome: values.banco_nome.trim().toUpperCase(),
    agencia_numero: values.agencia_numero.trim(),
    conta_numero: values.conta_numero.trim(),
    telefone: onlyDigits(values.telefone),
    nome_gerente: cleanText(values.nome_gerente),
    logotipo_path: values.logotipo_path || null,
    nosso_numero_inicio: toNumber(values.nosso_numero_inicio),
    nosso_numero_fim: toNumber(values.nosso_numero_fim),
    nosso_numero_proximo: toNumber(values.nosso_numero_proximo),
    codigo_cedente: cleanText(values.codigo_cedente, false),
    carteira: cleanText(values.carteira, false),
    padrao_retorno: values.padrao_retorno || "FEBRABAN240",
    tx_bancaria: toNumber(values.tx_bancaria),
    multa_percentual: toNumber(values.multa_percentual),
    juros_dia_percentual: toNumber(values.juros_dia_percentual),
    desconto_percentual: toNumber(values.desconto_percentual),
    outros_acrescimos: toNumber(values.outros_acrescimos)
  };

  if (payload.id) {
    const { data, error } = await supabaseUnsafe
      .from("bancos")
      .update(payload)
      .eq("id", payload.id)
      .select()
      .single();
    if (error) throw error;
    return data as Banco;
  }

  const { data, error } = await supabaseUnsafe
    .from("bancos")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as Banco;
}

export async function uploadBancoLogotipo(bancoId: number, file: File) {
  const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const path = `${bancoId}/${Date.now()}.${extension}`;
  const { error } = await supabase.storage.from("bancos-logotipos").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export function getBancoLogotipoUrl(path: string | null | undefined) {
  if (!path) return null;
  return supabase.storage.from("bancos-logotipos").getPublicUrl(path).data.publicUrl;
}
