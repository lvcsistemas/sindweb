export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      associados: { Row: Associado; Insert: AssociadoInsert; Update: Partial<AssociadoInsert> };
      associados_contribuicoes: { Row: AssociadoContribuicao; Insert: AssociadoContribuicaoInsert; Update: Partial<AssociadoContribuicaoInsert> };
      associados_dependentes: { Row: AssociadoDependente; Insert: AssociadoDependenteInsert; Update: Partial<AssociadoDependenteInsert> };
      auxiliares: { Row: Auxiliar; Insert: AuxiliarInsert; Update: Partial<AuxiliarInsert> };
      atendimento_homologacao: { Row: AtendimentoHomologacao; Insert: AtendimentoHomologacaoInsert; Update: Partial<AtendimentoHomologacaoInsert> };
      atendimento_medico: { Row: AtendimentoMedico; Insert: AtendimentoMedicoInsert; Update: Partial<AtendimentoMedicoInsert> };
      atendimento_medico_convenios: { Row: AtendimentoMedicoConvenio; Insert: AtendimentoMedicoConvenioInsert; Update: Partial<AtendimentoMedicoConvenioInsert> };
      atendimento_medico_convenios_especialidades: { Row: AtendimentoMedicoConvenioEspecialidade; Insert: AtendimentoMedicoConvenioEspecialidadeInsert; Update: Partial<AtendimentoMedicoConvenioEspecialidadeInsert> };
      atendimento_medico_exames: { Row: AtendimentoMedicoExame; Insert: AtendimentoMedicoExameInsert; Update: Partial<AtendimentoMedicoExameInsert> };
      atendimento_medico_itens: { Row: AtendimentoMedicoItem; Insert: AtendimentoMedicoItemInsert; Update: Partial<AtendimentoMedicoItemInsert> };
      bancos: { Row: Banco; Insert: BancoInsert; Update: Partial<BancoInsert> };
      cnaes: { Row: Cnae; Insert: CnaeInsert; Update: Partial<CnaeInsert> };
      config: { Row: Config; Insert: ConfigInsert; Update: Partial<ConfigInsert> };
      contribuicoes: { Row: Contribuicao; Insert: ContribuicaoInsert; Update: Partial<ContribuicaoInsert> };
      empresas: { Row: EmpresaCadastro; Insert: EmpresaCadastroInsert; Update: Partial<EmpresaCadastroInsert> };
      empresas_contribuicoes: { Row: EmpresaContribuicao; Insert: EmpresaContribuicaoInsert; Update: Partial<EmpresaContribuicaoInsert> };
      empresas_escritorios: { Row: Escritorio; Insert: EscritorioInsert; Update: Partial<EscritorioInsert> };
      faturas: { Row: Fatura; Insert: FaturaInsert; Update: Partial<FaturaInsert> };
      locais_trabalho: { Row: LocalTrabalho; Insert: LocalTrabalhoInsert; Update: Partial<LocalTrabalhoInsert> };
      lookup_items: { Row: LookupItem; Insert: Omit<LookupItem, "id" | "created_at">; Update: Partial<Omit<LookupItem, "id" | "created_at">> };
    };
    Views: {
      associados_lista: { Row: AssociadoLista };
      atendimento_homologacao_lista: { Row: AtendimentoHomologacaoLista };
      atendimento_medico_lista: { Row: AtendimentoMedicoLista };
      faturas_lista: { Row: FaturaLista };
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
  naturalidade: string | null;
  nacionalidade: string | null;
  endereco: string | null;
  numero: string | null;
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
  nome_pai: string | null;
  nome_mae: string | null;
  rg_data_emissao: string | null;
  rg_orgao_emissor: string | null;
  rg_uf: string | null;
  titulo_eleitor: string | null;
  titulo_zona: string | null;
  titulo_secao: string | null;
  ctps: string | null;
  ctps_serie: string | null;
  ctps_uf: string | null;
  salario: number | null;
  secao: string | null;
  turno: string | null;
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

export type AssociadoLista = Pick<Associado, "id" | "empresa_id" | "matricula" | "nome" | "cpf" | "tel1" | "email" | "foto_path"> & {
  empresa_nome: string | null;
  situacao_nome: string | null;
};

export type EmpresaAssociadoLista = Pick<Associado, "id" | "matricula" | "nome" | "cpf" | "tel1" | "email"> & {
  situacao_nome: string | null;
};

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

export type AssociadoContribuicao = {
  id: number;
  associado_id: number;
  contribuicao_id: number;
  created_at: string;
  dt_pg: string | null;
};

export type AssociadoContribuicaoInsert = Omit<AssociadoContribuicao, "id" | "created_at"> & {
  id?: number;
  created_at?: string;
};

export type AssociadoContribuicaoLista = AssociadoContribuicao & {
  contribuicao: Pick<Contribuicao, "tipo" | "nm_contribuicao" | "valor_base"> | null;
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

export type Config = {
  id: number;
  cpf_cnpj: string | null;
  dt_vencimento: string | null;
  razao_social: string | null;
  nm_fantasia: string | null;
  nm_diretor: string | null;
  email: string | null;
  telefone: string | null;
  cep: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  obs: string | null;
  ultima_matricula: number;
  qtd_exames: number;
  qtd_consultas: number;
  created_at: string;
  updated_at: string;
};

export type ConfigInsert = Omit<Config, "id" | "created_at" | "updated_at"> & { id?: number };
export type ConfigUpdate = Partial<ConfigInsert>;

export type Banco = {
  id: number;
  ativo: string;
  banco_numero: string;
  banco_nome: string;
  agencia_numero: string;
  conta_numero: string;
  telefone: string | null;
  nome_gerente: string | null;
  logotipo_path: string | null;
  nosso_numero_inicio: number;
  nosso_numero_fim: number;
  nosso_numero_proximo: number;
  codigo_cedente: string | null;
  carteira: string | null;
  padrao_retorno: string;
  tx_bancaria: number;
  multa_percentual: number;
  juros_dia_percentual: number;
  desconto_percentual: number;
  outros_acrescimos: number;
  created_at: string;
  updated_at: string;
};

export type BancoInsert = Omit<Banco, "id" | "created_at" | "updated_at"> & { id?: number };

export type Fatura = {
  id: number;
  sacado_tipo: string;
  associado_id: number | null;
  empresa_id: number | null;
  contribuicao_id: number;
  banco_id: number;
  competencia_mes: number;
  competencia_ano: number;
  dt_emissao: string;
  dt_vencimento: string;
  valor_base: number;
  tx_bancaria: number;
  multa_percentual: number;
  juros_dia_percentual: number;
  desconto_percentual: number;
  outros_acrescimos: number;
  valor_total: number;
  nosso_numero: string | null;
  linha_digitavel: string | null;
  situacao: string;
  cancelada_em: string | null;
  cancelada_por: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
};

export type FaturaInsert = Omit<Fatura, "id" | "valor_total" | "cancelada_em" | "cancelada_por" | "created_by" | "updated_by" | "created_at" | "updated_at"> & {
  id?: number;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type FaturaLista = Fatura & {
  contribuicao_tipo: string | null;
  nm_contribuicao: string | null;
  banco_numero: string | null;
  banco_nome: string | null;
  agencia_numero: string | null;
  conta_numero: string | null;
  associado_nome: string | null;
  associado_documento: string | null;
  empresa_nome: string | null;
  empresa_documento: string | null;
  created_by_codinome: string | null;
  created_by_nome: string | null;
  updated_by_codinome: string | null;
  updated_by_nome: string | null;
  cancelada_por_codinome: string | null;
  cancelada_por_nome: string | null;
};

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

export type AtendimentoHomologacao = {
  id: number;
  created_by: string | null;
  updated_by: string | null;
  sede_id: number;
  empresa_id: number;
  dt_agendado: string;
  situacao: string;
  nm_homologador: string;
  qtd: number;
  obs: string | null;
  created_at: string;
  updated_at: string;
};

export type AtendimentoHomologacaoInsert = Omit<AtendimentoHomologacao, "id" | "created_by" | "updated_by" | "created_at" | "updated_at"> & {
  id?: number;
  created_by?: string | null;
  updated_by?: string | null;
  created_at?: string;
  updated_at?: string;
};

export type AtendimentoHomologacaoLista = AtendimentoHomologacao & {
  nm_sede: string | null;
  nm_empresa: string | null;
  razao_social: string | null;
  cei_cnpj: string | null;
  created_by_codinome: string | null;
  created_by_nome: string | null;
  updated_by_codinome: string | null;
  updated_by_nome: string | null;
};

export type AtendimentoMedico = {
  id: number;
  created_by: string | null;
  updated_by: string | null;
  created_by_legacy: number | null;
  updated_by_legacy: number | null;
  convenio_id: number;
  associado_id: number;
  dependente_id: number;
  qtd: number;
  created_at: string;
  updated_at: string;
  dt_agendado: string;
  situacao: string;
  tipo: string;
  obs: string | null;
};

export type AtendimentoMedicoInsert = Omit<AtendimentoMedico, "id" | "created_at" | "updated_at"> & {
  id?: number;
  created_at?: string;
  updated_at?: string;
};

export type AtendimentoMedicoLista = AtendimentoMedico & {
  nm_convenio: string | null;
  nm_associado: string | null;
  matricula: string | null;
  nm_dependente: string | null;
  created_by_codinome: string | null;
  created_by_nome: string | null;
  updated_by_codinome: string | null;
  updated_by_nome: string | null;
};

export type AtendimentoMedicoItem = {
  id: number;
  atendimento_id: number;
  tipo: string;
  descricao: string;
  created_at: string;
};

export type AtendimentoMedicoItemInsert = Omit<AtendimentoMedicoItem, "id" | "created_at"> & {
  id?: number;
  created_at?: string;
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

export type AtendimentoMedicoConvenioEspecialidade = {
  id: number;
  convenio_id: number;
  especialidade_id: number;
  created_at: string;
};

export type AtendimentoMedicoConvenioEspecialidadeInsert = Omit<AtendimentoMedicoConvenioEspecialidade, "id" | "created_at"> & {
  id?: number;
  created_at?: string;
};

export type AtendimentoMedicoConvenioEspecialidadeLista = AtendimentoMedicoConvenioEspecialidade & {
  especialidade: Pick<Auxiliar, "id" | "nome"> | null;
};

export type AtendimentoMedicoExame = {
  id: number;
  tipo: string;
  exame: string;
};

export type AtendimentoMedicoExameInsert = Omit<AtendimentoMedicoExame, "id"> & { id?: number };

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
