import { supabase } from "../../lib/supabase";
import type { Config, ConfigUpdate } from "../../types/database";

const supabaseUnsafe = supabase as any;

function onlyDigits(value: string | null | undefined) {
  return value?.replace(/\D/g, "") || null;
}

function cleanText(value: string | null | undefined, upper = true) {
  const text = value?.trim();
  if (!text) return null;
  return upper ? text.toUpperCase() : text;
}

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function getConfig() {
  const { data, error } = await supabaseUnsafe
    .from("config")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) throw error;
  return data as Config;
}

export async function saveConfig(values: ConfigUpdate) {
  const payload = {
    id: 1,
    cpf_cnpj: onlyDigits(values.cpf_cnpj),
    dt_vencimento: values.dt_vencimento || null,
    razao_social: cleanText(values.razao_social),
    nm_fantasia: cleanText(values.nm_fantasia),
    nm_diretor: cleanText(values.nm_diretor),
    email: cleanText(values.email, false)?.toLowerCase() ?? null,
    telefone: onlyDigits(values.telefone),
    cep: onlyDigits(values.cep),
    endereco: cleanText(values.endereco),
    numero: cleanText(values.numero, false),
    complemento: cleanText(values.complemento),
    bairro: cleanText(values.bairro),
    cidade: cleanText(values.cidade),
    uf: cleanText(values.uf) ?? "RJ",
    obs: values.obs?.trim() || null,
    ultima_matricula: toNumber(values.ultima_matricula),
    qtd_exames: toNumber(values.qtd_exames),
    qtd_consultas: toNumber(values.qtd_consultas)
  };

  const { data, error } = await supabaseUnsafe
    .from("config")
    .upsert(payload, { onConflict: "id" })
    .select()
    .single();

  if (error) throw error;
  return data as Config;
}
