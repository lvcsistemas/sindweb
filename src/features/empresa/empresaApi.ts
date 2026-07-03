import { supabase } from "../../lib/supabase";
import type { EmpresaCadastro, EmpresaCadastroInsert } from "../../types/database";

const supabaseUnsafe = supabase as any;

function onlyDigits(value: string | null | undefined) {
  return value?.replace(/\D/g, "") || null;
}

function toNumber(value: number | string | null | undefined, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function listEmpresasCadastro(search: string) {
  let query = supabaseUnsafe
    .from("empresas")
    .select("*")
    .order("razao_social", { ascending: true });

  const term = search.trim();
  if (term) {
    query = query.or(`razao_social.ilike.%${term}%,nm_fantasia.ilike.%${term}%,cei_cnpj.ilike.%${term}%,cidade.ilike.%${term}%`);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data as EmpresaCadastro[];
}

export async function saveEmpresaCadastro(values: EmpresaCadastroInsert) {
  const payload = {
    ...values,
    user_resp_id: values.user_resp_id || "",
    estabelecimento_id: toNumber(values.estabelecimento_id, 1),
    estabelecimento_tipo_id: toNumber(values.estabelecimento_tipo_id, 1),
    escritorio_id: toNumber(values.escritorio_id),
    ramo_atividade_id: toNumber(values.ramo_atividade_id),
    convencao_id: toNumber(values.convencao_id),
    cnae_id: toNumber(values.cnae_id),
    tipo_cei_cnpj: toNumber(values.tipo_cei_cnpj, 1),
    dt_inicio_atividades: values.dt_inicio_atividades || null,
    ativo: values.ativo || "S",
    razao_social: values.razao_social.trim().toUpperCase(),
    nm_fantasia: values.nm_fantasia.trim().toUpperCase(),
    cei_cnpj: onlyDigits(values.cei_cnpj) ?? "",
    insc_estadual: values.insc_estadual?.trim().toUpperCase() || null,
    nm_contato1: values.nm_contato1?.trim().toUpperCase() || null,
    nm_contato2: values.nm_contato2?.trim().toUpperCase() || null,
    nm_contato3: values.nm_contato3?.trim().toUpperCase() || null,
    email1: values.email1?.trim().toLowerCase() || null,
    email2: values.email2?.trim().toLowerCase() || null,
    email3: values.email3?.trim().toLowerCase() || null,
    tel1: onlyDigits(values.tel1),
    tel2: onlyDigits(values.tel2),
    tel3: onlyDigits(values.tel3),
    site: values.site?.trim().toLowerCase() || null,
    endereco: values.endereco?.trim().toUpperCase() || null,
    numero: values.numero?.trim() || null,
    complemento: values.complemento?.trim().toUpperCase() || null,
    bairro: values.bairro?.trim().toUpperCase() || null,
    cidade: values.cidade?.trim().toUpperCase() || null,
    uf: values.uf?.trim().toUpperCase() || "RJ",
    cep: onlyDigits(values.cep),
    capital_social: toNumber(values.capital_social),
    obs: values.obs?.trim() || null
  };

  if (payload.id) {
    const { data, error } = await supabaseUnsafe
      .from("empresas")
      .update(payload)
      .eq("id", payload.id)
      .select()
      .single();
    if (error) throw error;
    return data as EmpresaCadastro;
  }

  const { data, error } = await supabaseUnsafe
    .from("empresas")
    .insert(payload)
    .select()
    .single();
  if (error) throw error;
  return data as EmpresaCadastro;
}

export async function deleteEmpresaCadastro(id: number) {
  const { error } = await supabaseUnsafe.from("empresas").delete().eq("id", id);
  if (error) throw error;
}

export async function uploadEmpresaLogo(empresaId: number, file: File) {
  const extension = file.name.split(".").pop() ?? "jpg";
  const path = `${empresaId}/${crypto.randomUUID()}.${extension}`;
  const { error } = await supabase.storage.from("empresas-logos").upload(path, file, { upsert: false });
  if (error) throw error;
  return path;
}

export function getEmpresaLogoUrl(path: string | null | undefined) {
  if (!path) return null;
  return supabase.storage.from("empresas-logos").getPublicUrl(path).data.publicUrl;
}
