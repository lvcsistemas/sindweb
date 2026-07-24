import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Minus, Plus, Save, Upload } from "lucide-react";
import type { Associado } from "../../types/database";
import { associadoSchema, type AssociadoFormValues } from "./associadosSchema";
import { getEmpresaOption, listAuxiliaresOptions, listEmpresas, listLocaisTrabalhoOptions, saveAssociado, uploadAssociadoFoto } from "./associadosApi";

const defaultValues: AssociadoFormValues = {
  ativo: true,
  gerar_matricula: false,
  nome: "",
  cpf: "",
  matricula: "",
  matricula_empresa: "",
  empresa_id: null,
  situacao_id: null,
  local_trabalho_id: null,
  local_pagamento_id: null,
  escolaridade_id: null,
  funcao_id: null,
  data_categoria: "",
  data_nascimento: "",
  data_admissao: "",
  data_situacao: "",
  data_ficha: "",
  naturalidade: "",
  nacionalidade: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  cep: "",
  tel1: "",
  tel2: "",
  tel3: "",
  email: "",
  rg: "",
  rg_data_emissao: "",
  rg_orgao_emissor: "",
  rg_uf: "",
  sexo: "",
  estado_civil: "",
  pis: "",
  nome_pai: "",
  nome_mae: "",
  titulo_eleitor: "",
  titulo_zona: "",
  titulo_secao: "",
  ctps: "",
  ctps_serie: "",
  ctps_uf: "",
  salario: 0,
  secao: "",
  turno: "",
  posto_trabalho: "",
  masterclin: "",
  observacao: "",
  foto_path: null
};

const detalheCards = ["Residência", "Contatos", "Identificação", "Classe"] as const;
type DetalheCard = typeof detalheCards[number];

function toInputDate(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function onlyDigits(value: string | null | undefined) {
  return value?.replace(/\D/g, "") ?? "";
}

function formatCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

function formatTelefone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function toValues(associado: Associado | null): AssociadoFormValues {
  if (!associado) return defaultValues;
  return {
    id: associado.id,
    ativo: associado.ativo,
    gerar_matricula: false,
    nome: associado.nome,
    cpf: associado.cpf,
    matricula: associado.matricula ?? "",
    matricula_empresa: associado.matricula_empresa ?? "",
    empresa_id: associado.empresa_id,
    situacao_id: associado.situacao_id,
    local_trabalho_id: associado.local_trabalho_id,
    local_pagamento_id: associado.local_pagamento_id,
    escolaridade_id: associado.escolaridade_id,
    funcao_id: associado.funcao_id,
    data_categoria: toInputDate(associado.data_categoria),
    data_nascimento: toInputDate(associado.data_nascimento),
    data_admissao: toInputDate(associado.data_admissao),
    data_situacao: toInputDate(associado.data_situacao),
    data_ficha: toInputDate(associado.data_ficha),
    naturalidade: associado.naturalidade ?? "",
    nacionalidade: associado.nacionalidade ?? "",
    endereco: associado.endereco ?? "",
    numero: associado.numero ?? "",
    complemento: associado.complemento ?? "",
    bairro: associado.bairro ?? "",
    cidade: associado.cidade ?? "",
    uf: associado.uf ?? "",
    cep: associado.cep ?? "",
    tel1: associado.tel1 ?? "",
    tel2: associado.tel2 ?? "",
    tel3: associado.tel3 ?? "",
    email: associado.email ?? "",
    rg: associado.rg ?? "",
    rg_data_emissao: toInputDate(associado.rg_data_emissao),
    rg_orgao_emissor: associado.rg_orgao_emissor ?? "",
    rg_uf: associado.rg_uf ?? "",
    sexo: associado.sexo ?? "",
    estado_civil: associado.estado_civil ?? "",
    pis: associado.pis ?? "",
    nome_pai: associado.nome_pai ?? "",
    nome_mae: associado.nome_mae ?? "",
    titulo_eleitor: associado.titulo_eleitor ?? "",
    titulo_zona: associado.titulo_zona ?? "",
    titulo_secao: associado.titulo_secao ?? "",
    ctps: associado.ctps ?? "",
    ctps_serie: associado.ctps_serie ?? "",
    ctps_uf: associado.ctps_uf ?? "",
    salario: associado.salario ?? 0,
    secao: associado.secao ?? "",
    turno: associado.turno ?? "",
    posto_trabalho: associado.posto_trabalho ?? "",
    masterclin: associado.masterclin ?? "",
    observacao: associado.observacao ?? "",
    foto_path: associado.foto_path
  };
}

export function AssociadoForm({ associado, onSaved }: { associado: Associado | null; onSaved: (id: number) => void }) {
  const queryClient = useQueryClient();
  const [savedId, setSavedId] = useState<number | null>(associado?.id ?? null);
  const [openCards, setOpenCards] = useState<Record<DetalheCard, boolean>>({
    Residência: false,
    Contatos: false,
    Identificação: false,
    Classe: false
  });
  const [empresaSearch, setEmpresaSearch] = useState("");
  const { data: empresas = [] } = useQuery({ queryKey: ["empresas", empresaSearch], queryFn: () => listEmpresas(empresaSearch) });
  const { data: situacoes = [] } = useQuery({ queryKey: ["auxiliares", "situacao"], queryFn: () => listAuxiliaresOptions("situacao") });
  const { data: locaisTrabalho = [] } = useQuery({ queryKey: ["locais-trabalho"], queryFn: listLocaisTrabalhoOptions });
  const { data: locaisPagamento = [] } = useQuery({ queryKey: ["auxiliares", "locais_pagamento"], queryFn: () => listAuxiliaresOptions("locais_pagamento") });
  const { data: funcoes = [] } = useQuery({ queryKey: ["auxiliares", "funcao"], queryFn: () => listAuxiliaresOptions("funcao") });
  const { data: escolaridades = [] } = useQuery({ queryKey: ["auxiliares", "escolaridade"], queryFn: () => listAuxiliaresOptions("escolaridade") });

  const form = useForm<AssociadoFormValues>({ resolver: zodResolver(associadoSchema), defaultValues: toValues(associado) });
  const isNew = !associado?.id;
  const gerarMatricula = form.watch("gerar_matricula");
  const selectedEmpresaId = form.watch("empresa_id");
  const { data: selectedEmpresa } = useQuery({
    queryKey: ["empresa-option", selectedEmpresaId],
    queryFn: () => getEmpresaOption(Number(selectedEmpresaId)),
    enabled: Boolean(selectedEmpresaId)
  });
  const empresaOptions = useMemo(() => {
    if (!selectedEmpresa) return empresas;
    return [selectedEmpresa, ...empresas.filter((empresa) => empresa.id !== selectedEmpresa.id)];
  }, [empresas, selectedEmpresa]);

  useEffect(() => {
    form.reset(toValues(associado));
    setSavedId(associado?.id ?? null);
  }, [associado, form]);

  useEffect(() => {
    if (isNew && gerarMatricula) {
      form.setValue("matricula", "");
    }
  }, [form, gerarMatricula, isNew]);

  const saveMutation = useMutation({
    mutationFn: saveAssociado,
    onSuccess: async (id) => {
      setSavedId(id);
      await queryClient.invalidateQueries({ queryKey: ["associados"] });
      await queryClient.invalidateQueries({ queryKey: ["associado", id] });
      onSaved(id);
    }
  });

  const photoMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => uploadAssociadoFoto(id, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["associados"] });
      if (savedId) await queryClient.invalidateQueries({ queryKey: ["associado", savedId] });
    }
  });

  const errorList = useMemo(() => Object.values(form.formState.errors).map((error) => error.message).filter(Boolean), [form.formState.errors]);
  const cepField = form.register("cep");

  async function handleCepBlur() {
    const cep = onlyDigits(form.getValues("cep"));
    const enderecoAtual = String(form.getValues("endereco") ?? "").trim();
    if (cep.length !== 8 || enderecoAtual) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) return;
      const data = await response.json() as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (data.erro) return;

      form.setValue("cep", formatCep(cep), { shouldDirty: true });
      if (data.logradouro) form.setValue("endereco", data.logradouro.toUpperCase(), { shouldDirty: true });
      if (data.bairro) form.setValue("bairro", data.bairro.toUpperCase(), { shouldDirty: true });
      if (data.localidade) form.setValue("cidade", data.localidade.toUpperCase(), { shouldDirty: true });
      if (data.uf) form.setValue("uf", data.uf.toUpperCase(), { shouldDirty: true });
    } catch {
      // Consulta de CEP e apenas uma ajuda; o preenchimento manual continua livre.
    }
  }

  return (
    <form className="form-panel" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
      <div className={`form-grid associado-status-grid ${isNew ? "" : "existing"}`}>
        <label className="field"><input {...form.register("matricula")} placeholder=" " disabled={isNew && gerarMatricula} /><span>Matrícula</span></label>
        {isNew ? <label className="check"><input type="checkbox" {...form.register("gerar_matricula")} /> Gerar Matricula?</label> : null}
      </div>
      <div className="form-grid">
        <label className="field"><select {...form.register("situacao_id", { setValueAs: (value) => value ? Number(value) : null })}><option value="">Selecione</option>{situacoes.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select><span>Situação</span></label>
        <label className="field"><input type="date" {...form.register("data_situacao")} placeholder=" " /><span>Data Situação</span></label>
      </div>
      <div className="form-grid">
        <label className="field"><input {...form.register("nome")} placeholder=" " /><span>Nome do Associado</span></label>
        <label className="field"><input {...form.register("cpf")} placeholder=" " /><span>CPF</span></label>
      </div>
      <label className="field"><textarea rows={3} {...form.register("observacao")} placeholder=" " /><span>Observação</span></label>
      <div className="detail-card-stack">
        {detalheCards.map((card) => {
          const isOpen = openCards[card];
          return (
            <section className="detail-card" key={card}>
              <div className="detail-card-title">
                <strong>{card}</strong>
                <button type="button" className="icon-button" aria-label={isOpen ? `Fechar ${card}` : `Abrir ${card}`} onClick={() => setOpenCards((current) => ({ ...current, [card]: !current[card] }))}>
                  {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                </button>
              </div>
              {isOpen ? <div className="detail-card-body">
                {card === "Residência" ? <>
                  <div className="form-grid residence-cep-grid">
                    <label className="field">
                      <input
                        {...cepField}
                        maxLength={9}
                        placeholder=" "
                        onChange={(event) => form.setValue("cep", formatCep(event.target.value), { shouldDirty: true })}
                        onBlur={(event) => { void cepField.onBlur(event); void handleCepBlur(); }}
                      />
                      <span>CEP</span>
                    </label>
                  </div>
                  <div className="form-grid residence-address-grid">
                    <label className="field"><input {...form.register("endereco")} placeholder=" " /><span>Endereço</span></label>
                    <label className="field"><input {...form.register("numero")} placeholder=" " /><span>Número</span></label>
                    <label className="field"><input {...form.register("complemento")} placeholder=" " /><span>Complemento</span></label>
                  </div>
                  <div className="form-grid residence-city-grid">
                    <label className="field"><input {...form.register("bairro")} placeholder=" " /><span>Bairro</span></label>
                    <label className="field"><input {...form.register("cidade")} placeholder=" " /><span>Cidade</span></label>
                    <label className="field"><input maxLength={2} {...form.register("uf")} placeholder=" " /><span>UF</span></label>
                  </div>
                </> : null}
                {card === "Contatos" ? <>
                  <div className="form-grid contatos-phone-grid">
                    <label className="field"><input value={form.watch("tel1") ?? ""} maxLength={15} onChange={(event) => form.setValue("tel1", formatTelefone(event.target.value), { shouldDirty: true })} placeholder=" " /><span>Telefone 1</span></label>
                    <label className="field"><input value={form.watch("tel2") ?? ""} maxLength={15} onChange={(event) => form.setValue("tel2", formatTelefone(event.target.value), { shouldDirty: true })} placeholder=" " /><span>Telefone 2</span></label>
                    <label className="field"><input value={form.watch("tel3") ?? ""} maxLength={15} onChange={(event) => form.setValue("tel3", formatTelefone(event.target.value), { shouldDirty: true })} placeholder=" " /><span>Telefone 3</span></label>
                  </div>
                  <div className="form-grid contatos-email-grid">
                    <label className="field"><input {...form.register("email")} placeholder=" " /><span>E-mail</span></label>
                  </div>
                </> : null}
                {card === "Identificação" ? <>
                  <div className="form-grid identificacao-birth-grid">
                    <label className="field"><input type="date" {...form.register("data_nascimento")} placeholder=" " /><span>Data de Nascimento</span></label>
                    <label className="field"><input {...form.register("naturalidade")} placeholder=" " /><span>Naturalidade</span></label>
                    <label className="field"><input {...form.register("nacionalidade")} placeholder=" " /><span>Nacionalidade</span></label>
                    <label className="field"><select {...form.register("sexo")}><option value="">Selecione</option><option value="M">Masculino</option><option value="F">Feminino</option></select><span>Sexo</span></label>
                  </div>
                  <div className="form-grid identificacao-civil-grid">
                    <label className="field">
                      <select {...form.register("estado_civil")}>
                        <option value="">Selecione</option>
                        <option value="CASADO(A)">CASADO(A)</option>
                        <option value="SOLTEIRO(A)">SOLTEIRO(A)</option>
                        <option value="VIUVO(A)">VIUVO(A)</option>
                        <option value="DIVORCIADO(A)">DIVORCIADO(A)</option>
                        <option value="AMASIADO(A)">AMASIADO(A)</option>
                        <option value="OUTROS">OUTROS</option>
                      </select>
                      <span>Estado Civil</span>
                    </label>
                    <label className="field"><input {...form.register("pis")} placeholder=" " /><span>PIS</span></label>
                  </div>
                  <div className="form-grid identificacao-parents-grid">
                    <label className="field"><input {...form.register("nome_pai")} placeholder=" " /><span>Nome do Pai</span></label>
                    <label className="field"><input {...form.register("nome_mae")} placeholder=" " /><span>Nome da Mãe</span></label>
                  </div>
                  <div className="form-grid identificacao-rg-grid">
                    <label className="field"><input {...form.register("rg")} placeholder=" " /><span>RG</span></label>
                    <label className="field"><input type="date" {...form.register("rg_data_emissao")} placeholder=" " /><span>Data Emissão RG</span></label>
                    <label className="field"><input {...form.register("rg_orgao_emissor")} placeholder=" " /><span>Órgão Emissor RG</span></label>
                    <label className="field"><input maxLength={2} {...form.register("rg_uf")} placeholder=" " /><span>UF RG</span></label>
                  </div>
                  <div className="form-grid identificacao-titulo-grid">
                    <label className="field"><input {...form.register("titulo_eleitor")} placeholder=" " /><span>Título de Eleitor</span></label>
                    <label className="field"><input {...form.register("titulo_zona")} placeholder=" " /><span>Zona do Título</span></label>
                    <label className="field"><input {...form.register("titulo_secao")} placeholder=" " /><span>Seção do Título</span></label>
                  </div>
                  <div className="form-grid identificacao-ctps-grid">
                    <label className="field"><input {...form.register("ctps")} placeholder=" " /><span>CTPS</span></label>
                    <label className="field"><input {...form.register("ctps_serie")} placeholder=" " /><span>Série da CTPS</span></label>
                    <label className="field"><input maxLength={2} {...form.register("ctps_uf")} placeholder=" " /><span>UF da CTPS</span></label>
                  </div>
                </> : null}
                {card === "Classe" ? <>
                  <div className="form-grid classe-empresa-grid">
                    <label className="field"><input value={empresaSearch} onChange={(event) => setEmpresaSearch(event.target.value)} placeholder=" " /><span>Buscar Empresa</span></label>
                    <label className="field"><select {...form.register("empresa_id", { setValueAs: (value) => value ? Number(value) : null })}><option value="">Selecione</option>{empresaOptions.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome_fantasia}{empresa.cnpj ? ` - ${empresa.cnpj}` : ""}</option>)}</select><span>Empresa</span></label>
                  </div>
                  <div className="form-grid classe-matricula-grid">
                    <label className="field"><input {...form.register("matricula_empresa")} placeholder=" " /><span>Matrícula Empresa</span></label>
                    <label className="field"><select {...form.register("masterclin")}><option value="">Selecione</option><option value="SIM">SIM</option><option value="NAO">NÃO</option></select><span>Masterclin</span></label>
                    <label className="field"><input type="date" {...form.register("data_categoria")} placeholder=" " /><span>Data Categoria</span></label>
                    <label className="field"><input type="date" {...form.register("data_ficha")} placeholder=" " /><span>Ficha Enviada</span></label>
                  </div>
                  <div className="form-grid classe-local-pagamento-grid">
                    <label className="field"><select {...form.register("local_pagamento_id", { setValueAs: (value) => value ? Number(value) : null })}><option value="">Selecione</option>{locaisPagamento.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select><span>Local de Pagamento</span></label>
                  </div>
                  <div className="form-grid classe-local-trabalho-grid">
                    <label className="field"><select {...form.register("local_trabalho_id", { setValueAs: (value) => value ? Number(value) : null })}><option value="">Selecione</option>{locaisTrabalho.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select><span>Local de Trabalho</span></label>
                    <label className="field"><input {...form.register("secao")} placeholder=" " /><span>Seção</span></label>
                  </div>
                  <div className="form-grid classe-profissional-grid">
                    <label className="field">
                      <select {...form.register("turno")}>
                        <option value="">Selecione</option>
                        <option value="MANHA">MANHA</option>
                        <option value="TARDE">TARDE</option>
                        <option value="NOITE">NOITE</option>
                        <option value="DIURNO">DIURNO</option>
                        <option value="NOTURNO">NOTURNO</option>
                        <option value="DIARISTA">DIARISTA</option>
                      </select>
                      <span>Turno</span>
                    </label>
                    <label className="field"><select {...form.register("funcao_id", { setValueAs: (value) => value ? Number(value) : null })}><option value="">Selecione</option>{funcoes.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select><span>Função</span></label>
                    <label className="field"><select {...form.register("escolaridade_id", { setValueAs: (value) => value ? Number(value) : null })}><option value="">Selecione</option>{escolaridades.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select><span>Escolaridade</span></label>
                    <label className="field"><input type="number" step="0.01" {...form.register("salario")} placeholder=" " /><span>Salário</span></label>
                  </div>
                  <div className="form-grid">
                    <label className="field"><input type="date" {...form.register("data_admissao")} placeholder=" " /><span>Admissão</span></label>
                  </div>
                </> : null}
              </div> : null}
            </section>
          );
        })}
      </div>
      {errorList.length ? <div className="form-error">{errorList.join(" ")}</div> : null}
      {saveMutation.error ? <div className="form-error">{saveMutation.error.message}</div> : null}
      {photoMutation.error ? <div className="form-error">{photoMutation.error.message}</div> : null}
      <div className="form-actions">
        <label className={`secondary-button ${!savedId ? "disabled" : ""}`}><Upload size={16} /> Foto<input type="file" accept="image/*" disabled={!savedId} onChange={(event) => { const file = event.target.files?.[0]; if (file && savedId) photoMutation.mutate({ id: savedId, file }); }} /></label>
        <button type="submit" disabled={saveMutation.isPending}><Save size={16} /> {saveMutation.isPending ? "Salvando..." : "Salvar"}</button>
      </div>
    </form>
  );
}
