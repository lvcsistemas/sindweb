import { z } from "zod";
import { isValidCpf, normalizeCpf } from "../../lib/cpf";

const emptyToNull = z.string().trim().transform((value) => value === "" ? null : value.toUpperCase());
const optionalDate = z.string().transform((value) => value || null);
const optionalNumber = z.coerce.number().int().positive().nullable().optional();

export const associadoSchema = z.object({
  id: z.number().optional(),
  ativo: z.boolean().default(true),
  gerar_matricula: z.boolean().default(false),
  nome: z.string().trim().min(3, "Informe o nome do associado.").transform((value) => value.toUpperCase()),
  cpf: z.string().trim().refine(isValidCpf, "CPF inválido.").transform(normalizeCpf),
  matricula: emptyToNull,
  matricula_empresa: emptyToNull,
  empresa_id: optionalNumber,
  situacao_id: optionalNumber,
  local_trabalho_id: optionalNumber,
  local_pagamento_id: optionalNumber,
  escolaridade_id: optionalNumber,
  funcao_id: optionalNumber,
  data_categoria: optionalDate,
  data_nascimento: optionalDate,
  data_admissao: optionalDate,
  data_situacao: optionalDate,
  data_ficha: optionalDate,
  naturalidade: emptyToNull,
  nacionalidade: emptyToNull,
  endereco: emptyToNull,
  numero: emptyToNull,
  complemento: emptyToNull,
  bairro: emptyToNull,
  cidade: emptyToNull,
  uf: z.string().trim().max(2).transform((value) => value.toUpperCase() || null),
  cep: z.string().trim().transform((value) => value || null),
  tel1: z.string().trim().transform((value) => value || null),
  tel2: z.string().trim().transform((value) => value || null),
  tel3: z.string().trim().transform((value) => value || null),
  email: z.string().trim().email("E-mail inválido.").or(z.literal("")).transform((value) => value || null),
  rg: emptyToNull,
  rg_data_emissao: optionalDate,
  rg_orgao_emissor: emptyToNull,
  rg_uf: z.string().trim().max(2).transform((value) => value.toUpperCase() || null),
  sexo: z.string().trim().transform((value) => value || null),
  estado_civil: emptyToNull,
  pis: z.string().trim().transform((value) => value || null),
  nome_pai: emptyToNull,
  nome_mae: emptyToNull,
  titulo_eleitor: z.string().trim().transform((value) => value || null),
  titulo_zona: z.string().trim().transform((value) => value || null),
  titulo_secao: z.string().trim().transform((value) => value || null),
  ctps: emptyToNull,
  ctps_serie: emptyToNull,
  ctps_uf: z.string().trim().max(2).transform((value) => value.toUpperCase() || null),
  salario: z.coerce.number().min(0).nullable().optional(),
  posto_trabalho: emptyToNull,
  masterclin: z.string().trim().max(1).transform((value) => value.toUpperCase() || null),
  observacao: emptyToNull,
  foto_path: z.string().nullable().optional()
});

export type AssociadoFormValues = z.input<typeof associadoSchema>;
