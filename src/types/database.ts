export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      associados: { Row: Associado; Insert: AssociadoInsert; Update: Partial<AssociadoInsert> };
      contribuicao: { Row: Contribuicao; Insert: ContribuicaoInsert; Update: Partial<ContribuicaoInsert> };
      empresas: { Row: Empresa; Insert: EmpresaInsert; Update: Partial<EmpresaInsert> };
      lookup_items: { Row: LookupItem; Insert: Omit<LookupItem, "id" | "created_at">; Update: Partial<Omit<LookupItem, "id" | "created_at">> };
      module_permissions: { Row: ModulePermission; Insert: Omit<ModulePermission, "id" | "created_at">; Update: Partial<Omit<ModulePermission, "id" | "created_at">> };
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

export type LookupItem = {
  id: number;
  kind: string;
  label: string;
  active: boolean;
  legacy_id: number | null;
  created_at: string;
};

export type ModulePermission = {
  id: number;
  user_id: string;
  module_key: string;
  can_access: boolean;
  can_save: boolean;
  can_delete: boolean;
  created_at: string;
};
