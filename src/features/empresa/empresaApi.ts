import { supabase } from "../../lib/supabase";
import type { EmpresaAssociadoLista, EmpresaCadastro, EmpresaCadastroInsert, EmpresaContribuicaoLista } from "../../types/database";

const supabaseUnsafe = supabase as any;

export type CnpjConsulta = {
  cnpj: string;
  razao_social?: string | null;
  nome_fantasia?: string | null;
  descricao_situacao_cadastral?: string | null;
  data_inicio_atividade?: string | null;
  ddd_telefone_1?: string | null;
  ddd_telefone_2?: string | null;
  email?: string | null;
  logradouro?: string | null;
  numero?: string | null;
  complemento?: string | null;
  bairro?: string | null;
  municipio?: string | null;
  uf?: string | null;
  cep?: string | null;
  cnae_fiscal?: number | string | null;
  cnae_fiscal_descricao?: string | null;
  capital_social?: number | string | null;
};

export type CepConsulta = {
  cep: string;
  state?: string | null;
  city?: string | null;
  neighborhood?: string | null;
  street?: string | null;
  service?: string | null;
};

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

export async function listEmpresaAssociados(empresaId: number) {
  const { data, error } = await supabase
    .from("associados_lista")
    .select("id, matricula, nome, cpf, tel1, email, situacao_nome")
    .eq("empresa_id", empresaId)
    .order("nome", { ascending: true });

  if (error) throw error;
  return data as EmpresaAssociadoLista[];
}

export async function listEmpresaContribuicoes(empresaId: number) {
  const { data, error } = await supabaseUnsafe
    .from("empresas_contribuicoes")
    .select(`
      id,
      empresa_id,
      contribuicao_id,
      created_at,
      dt_pg,
      contribuicao:contribuicoes!empresas_contribuicoes_contribuicao_id_fkey (
        tipo,
        nm_contribuicao,
        valor_base
      )
    `)
    .eq("empresa_id", empresaId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data as EmpresaContribuicaoLista[];
}

export async function addEmpresaContribuicao(empresaId: number, contribuicaoId: number) {
  const { data, error } = await supabaseUnsafe
    .from("empresas_contribuicoes")
    .insert({ empresa_id: empresaId, contribuicao_id: contribuicaoId })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteEmpresaContribuicao(id: number) {
  const { error } = await supabaseUnsafe.from("empresas_contribuicoes").delete().eq("id", id);
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

export async function consultarCnpj(cnpj: string) {
  const digits = cnpj.replace(/\D/g, "");
  if (digits.length !== 14) throw new Error("Informe um CNPJ com 14 digitos.");

  const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${digits}`);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? "Nao foi possivel consultar esse CNPJ.");
  }

  return payload as CnpjConsulta;
}

export async function consultarCep(cep: string) {
  const digits = cep.replace(/\D/g, "");
  if (digits.length !== 8) throw new Error("Informe um CEP com 8 digitos.");

  const response = await fetch(`https://brasilapi.com.br/api/cep/v1/${digits}`);
  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(payload?.message ?? "Nao foi possivel consultar esse CEP.");
  }

  return payload as CepConsulta;
}
