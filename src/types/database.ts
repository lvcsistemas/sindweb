export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      associados: { Row: Associado; Insert: AssociadoInsert; Update: Partial<AssociadoInsert> };
      associados_dependentes: { Row: AssociadoDependente; Insert: AssociadoDependenteInsert; Update: Partial<AssociadoDependenteInsert> };
      auxiliares: { Row: Auxiliar; Insert: AuxiliarInsert; Update: Partial<AuxiliarInsert> };
      atendimento_medico_convenios: { Row: AtendimentoMedicoConvenio; Insert: AtendimentoMedicoConvenioInsert; Update: Partial<AtendimentoMedicoConvenioInsert> };
      atendimento_medico_especialidades: { Row: AtendimentoMedicoEspecialidade; Insert: AtendimentoMedicoEspecialidadeInsert; Update: Partial<AtendimentoMedicoEspecialidadeInsert> };
      cnaes: { Row: Cnae; Insert: CnaeInsert; Update: Partial<CnaeInsert> };
      contribuicoes: { Row: Contribuicao; Insert: ContribuicaoInsert; Update: Partial<ContribuicaoInsert> };
      empresas: { Row: EmpresaCadastro; Insert: EmpresaCadastroInsert; Update: Partial<EmpresaCadastroInsert> };
      empresas_contribuicoes: { Row: EmpresaContribuicao; Insert: EmpresaContribuicaoInsert; Update: Partial<EmpresaContribuicaoInsert> };
      empresas_escritorios: { Row: Escritorio; Insert: EscritorioInsert; Update: Partial<EscritorioInsert> };
      locais_trabalho: { Row: LocalTrabalho; Insert: LocalTrabalhoInsert; Update: Partial<LocalTrabalhoInsert> };
      lookup_items: { Row: LookupItem; Insert: Omit<LookupItem, "id" | "created_at">; Update: Partial<Omit<LookupItem, "id" | "created_at">> };
    };
    Views: {
      associados_lista: { Row: AssociadoLista };
    };
    Functions: {
      can_access_module: { Args: { module_key: string; action_key?: string }; Returns: boolean };
      save_associado: { Args: { payload: Json }; Returns: number };
    };
  };
};

export type Associado = {
  id: number;
  legacy_id: number | null;
  empresa_id: number | null;
  local_trabalho_id: number | null;
  local_pagamento_id: number | null;
  escolaridade_id: number | null;
  funcao_id: number | null;
  situacao_id: number | null;
  ativo: boolean;
  matricula: string | null;
  matricula_empresa: string | null;
  nome: string;
  cpf: string;
  rg: string | null;
  sexo: string | null;
  estado_civil: string | null;
  data_cadastro: string;
  data_categoria: string | null;
  data_nascimento: string | null;
  data_admissao: string | null;
  data_situacao: string | null;
  data_ficha: string | null;
  data_recadastro: string | null;
  endereco: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
  tel1: string | null;
  tel2: string | null;
  tel3: string | null;
  email: string | null;
  site: string | null;
  pis: string | null;
  ctps: string | null;
  ctps_serie: string | null;
  salario: number | null;
  posto_trabalho: string | null;
  masterclin: string | null;
  observacao: string | null;
  foto_path: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type AssociadoInsert = Omit<Associado, "id" | "data_cadastro" | "created_by" | "updated_by" | "created_at" | "updated_at"> & {
  id?: number;
  data_cadastro?: string;
};

export type AssociadoLista = Pick<Associado, "id" | "ativo" | "matricula" | "nome" | "cpf" | "tel1" | "email" | "foto_path"> & {
  empresa_nome: string | null;
  situacao_nome: string | null;
};

export type EmpresaAssociadoLista = Pick<Associado, "id" | "ativo" | "matricula" | "nome" | "cpf" | "tel1" | "email">;

export type AssociadoOption = Pick<Associado, "id" | "nome" | "cpf">;

export type AssociadoDependente = {
  id: number;
  associado_id: number;
  dt_nascimento: string;
  nm_dependente: string;
  cpf: string | null;
  sexo: string;
  estado_civil: string;
  parentesco: string;
  telefone: string | null;
  obs: string | null;
  created_at: string;
  updated_at: string;
};

export type AssociadoDependenteInsert = Omit<AssociadoDependente, "id" | "created_at" | "updated_at"> & { id?: number };

export type Empresa = {
  id: number;
  legacy_id: number | null;
  nome_fantasia: string;
  razao_social: string | null;
  cnpj: string | null;
  ativo: boolean;
  created_at: string;
  updated_at: string;
};

export type EmpresaInsert = Omit<Empresa, "id" | "created_at" | "updated_at"> & { id?: number };

export type EmpresaCadastro = {
  id: number;
  user_resp_id: string;
  estabelecimento_id: number;
  estabelecimento_tipo_id: number;
  escritorio_id: number;
  ramo_atividade_id: number;
  convencao_id: number;
  cnae_id: number;
  tipo_cei_cnpj: number;
  dt_inicio_atividades: string | null;
  ativo: string;
  razao_social: string;
  nm_fantasia: string;
  cei_cnpj: string;
  insc_estadual: string | null;
  nm_contato1: string | null;
  nm_contato2: string | null;
  nm_contato3: string | null;
  email1: string | null;
  email2: string | null;
  email3: string | null;
  tel1: string | null;
  tel2: string | null;
  tel3: string | null;
  site: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string;
  cep: string | null;
  capital_social: number;
  logo_path: string | null;
  obs: string | null;
  created_at: string;
  updated_at: string;
};

export type EmpresaCadastroInsert = Omit<EmpresaCadastro, "id" | "created_at" | "updated_at"> & { id?: number };

export type Contribuicao = {
  id: number;
  tipo: string;
  nm_contribuicao: string;
  dia_vencimento: number;
  instrucao: string | null;
  valor_base: number;
  created_at: string;
  updated_at: string;
};

export type ContribuicaoInsert = Omit<Contribuicao, "id" | "created_at" | "updated_at"> & { id?: number };

export type EmpresaContribuicao = {
  id: number;
  empresa_id: number;
  contribuicao_id: number;
  created_at: string;
  dt_pg: string | null;
};

export type EmpresaContribuicaoInsert = Omit<EmpresaContribuicao, "id" | "created_at"> & {
  id?: number;
  created_at?: string;
};

export type EmpresaContribuicaoLista = EmpresaContribuicao & {
  contribuicao: Pick<Contribuicao, "tipo" | "nm_contribuicao" | "valor_base"> | null;
};

export type AtendimentoMedicoConvenio = {
  id: number;
  ativo: string;
  tipo_pessoa: string;
  nm_convenio: string;
  nm_responsavel: string | null;
  cpf_cnpj: string;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string;
  cep: string | null;
  tel1: string | null;
  tel2: string | null;
  tel3: string | null;
  obs: string | null;
  created_at: string;
  updated_at: string;
};

export type AtendimentoMedicoConvenioInsert = Omit<AtendimentoMedicoConvenio, "id" | "created_at" | "updated_at"> & { id?: number };

export type AtendimentoMedicoEspecialidade = {
  id: number;
  tipo: string;
  nm_especialidade: string;
  created_at: string;
  updated_at: string;
};

export type AtendimentoMedicoEspecialidadeInsert = Omit<AtendimentoMedicoEspecialidade, "id" | "created_at" | "updated_at"> & { id?: number };

export type Auxiliar = {
  id: number;
  grupo: string;
  nome: string;
  ativo: string;
  ordem: number;
  created_at: string;
  updated_at: string;
};

export type AuxiliarInsert = Omit<Auxiliar, "id" | "created_at" | "updated_at"> & { id?: number };

export type Cnae = {
  id: number;
  codigo_cnae: string;
  descricao: string;
  created_at: string;
  updated_at: string;
};

export type CnaeInsert = Omit<Cnae, "id" | "created_at" | "updated_at"> & { id?: number };

export type Escritorio = {
  id: number;
  empresa_id: number;
  razao_social: string;
  nm_fantasia: string;
  cpf_cnpj: string;
  email: string | null;
  tel1: string | null;
  tel2: string | null;
  nm_contato: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string;
  cep: string | null;
  obs: string | null;
  created_at: string;
  updated_at: string;
};

export type EscritorioInsert = Omit<Escritorio, "id" | "created_at" | "updated_at"> & { id?: number };

export type LocalTrabalho = {
  id: number;
  nome: string;
  email: string | null;
  tel1: string | null;
  tel2: string | null;
  nm_contato: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string;
  cep: string | null;
  obs: string | null;
  created_at: string;
  updated_at: string;
};

export type LocalTrabalhoInsert = Omit<LocalTrabalho, "id" | "created_at" | "updated_at"> & { id?: number };

export type LookupItem = {
  id: number;
  kind: string;
  label: string;
  active: boolean;
  legacy_id: number | null;
  created_at: string;
};

