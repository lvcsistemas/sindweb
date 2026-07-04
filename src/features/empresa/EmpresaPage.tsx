import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Camera, Plus, Save, Search, Trash2 } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import type { EmpresaCadastro, EmpresaCadastroInsert } from "../../types/database";
import { listAuxiliares } from "../auxiliares/auxiliaresApi";
import { listCnaes } from "../cnae/cnaeApi";
import { listContribuicoes } from "../contribuicao/contribuicaoApi";
import { listEscritorios } from "../escritorio/escritorioApi";
import { listUsuarios } from "../usuarios/usuariosApi";
import { addEmpresaContribuicao, consultarCep, consultarCnpj, deleteEmpresaCadastro, deleteEmpresaContribuicao, getEmpresaLogoUrl, listEmpresaAssociados, listEmpresaContribuicoes, listEmpresasCadastro, saveEmpresaCadastro, uploadEmpresaLogo } from "./empresaApi";
import type { CnpjConsulta } from "./empresaApi";

type EmpresaTab = "dados" | "associados" | "contribuicoes" | "financeiro";
type NovoEmpresaStep = "tipo" | "cnpj" | "revisao";

function onlyDigits(value: string | null | undefined) {
  return value?.replace(/\D/g, "") ?? "";
}

function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatCei(value: string) {
  const digits = onlyDigits(value).slice(0, 12);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{5})(\d)/, ".$1/$2");
}

function formatCeiCnpj(value: string, tipo: number) {
  return tipo === 2 ? formatCei(value) : formatCnpj(value);
}

function formatCep(value: string | null | undefined) {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

function formatTelefone(value: string | null | undefined) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

function formatCpf(value: string | null | undefined) {
  const digits = onlyDigits(value).slice(0, 11);
  return digits
    .replace(/^(\d{3})(\d)/, "$1.$2")
    .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1-$2");
}

function firstText(...values: Array<string | null | undefined>) {
  return values.find((value) => value && value.trim())?.trim() ?? "";
}

function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value ?? 0));
}

function parseCurrency(value: string) {
  const digits = onlyDigits(value);
  return Number(digits || 0) / 100;
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

function findCnaeIdByApiCode(apiCode: string | number | null | undefined, cnaes: Array<{ id: number; codigo_cnae: string }>) {
  const prefix = onlyDigits(String(apiCode ?? "")).slice(0, 2);
  if (!prefix) return 0;

  return cnaes.find((item) => onlyDigits(item.codigo_cnae).startsWith(prefix))?.id ?? 0;
}

function mapCnpjConsultaToForm(data: CnpjConsulta): EmpresaCadastroInsert {
  const razaoSocial   = firstText(data.razao_social);
  const nomeFantasia  = firstText(data.nome_fantasia, data.razao_social);

  return {
    ...emptyForm,
    tipo_cei_cnpj       : 1,
    dt_inicio_atividades: data.data_inicio_atividade ?? "",
    ativo               : data.descricao_situacao_cadastral ? (data.descricao_situacao_cadastral.toUpperCase() === "ATIVA" ? "S" : "N") : emptyForm.ativo,
    razao_social        : razaoSocial,
    nm_fantasia         : nomeFantasia,
    cei_cnpj: formatCnpj(data.cnpj),
    email1: data.email ?? "",
    tel1: formatTelefone(data.ddd_telefone_1),
    tel2: formatTelefone(data.ddd_telefone_2),
    endereco: data.logradouro ?? "",
    numero: data.numero ?? "",
    complemento: data.complemento ?? "",
    bairro: data.bairro ?? "",
    cidade: data.municipio ?? "",
    uf: data.uf ?? emptyForm.uf,
    cep: formatCep(data.cep),
    capital_social: Number(data.capital_social ?? 0) || 0,
    obs: data.cnae_fiscal_descricao ? `CNAE fiscal: ${data.cnae_fiscal ?? ""} - ${data.cnae_fiscal_descricao}` : ""
  };
}

const emptyForm: EmpresaCadastroInsert = {
  user_resp_id: "",
  estabelecimento_id: 1,
  estabelecimento_tipo_id: 1,
  escritorio_id: 0,
  ramo_atividade_id: 0,
  convencao_id: 0,
  cnae_id: 0,
  tipo_cei_cnpj: 1,
  dt_inicio_atividades: "",
  ativo: "S",
  razao_social: "",
  nm_fantasia: "",
  cei_cnpj: "",
  insc_estadual: "",
  nm_contato1: "",
  nm_contato2: "",
  nm_contato3: "",
  email1: "",
  email2: "",
  email3: "",
  tel1: "",
  tel2: "",
  tel3: "",
  site: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "RJ",
  cep: "",
  capital_social: 0,
  logo_path: null,
  obs: ""
};

export function EmpresaPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<EmpresaTab>("dados");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState<EmpresaCadastroInsert>(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [novoStep, setNovoStep] = useState<NovoEmpresaStep | null>(null);
  const [cnpjInput, setCnpjInput] = useState("");
  const [cnpjData, setCnpjData] = useState<CnpjConsulta | null>(null);
  const [cnpjMessage, setCnpjMessage] = useState<string | null>(null);
  const [selectedContribuicaoId, setSelectedContribuicaoId] = useState("");

  const empresasQuery = useQuery({ queryKey: ["empresas-cadastro", search], queryFn: () => listEmpresasCadastro(search) });
  const usuariosQuery = useQuery({ queryKey: ["usuarios"], queryFn: listUsuarios });
  const contribuicoesQuery = useQuery({ queryKey: ["contribuicoes-options"], queryFn: () => listContribuicoes("") });
  const cnaesQuery = useQuery({ queryKey: ["cnaes-options"], queryFn: () => listCnaes("") });
  const estabelecimentosQuery = useQuery({ queryKey: ["auxiliares", "estabelecimento"], queryFn: () => listAuxiliares("estabelecimento", "") });
  const estabelecimentoTiposQuery = useQuery({ queryKey: ["auxiliares", "estabelecimento_tipo"], queryFn: () => listAuxiliares("estabelecimento_tipo", "") });
  const ramoAtividadesQuery = useQuery({ queryKey: ["auxiliares", "ramo_atividade"], queryFn: () => listAuxiliares("ramo_atividade", "") });
  const convencoesQuery = useQuery({ queryKey: ["auxiliares", "convencao"], queryFn: () => listAuxiliares("convencao", "") });
  const empresaContribuicoesQuery = useQuery({
    queryKey: ["empresa-contribuicoes", selectedId],
    queryFn: () => listEmpresaContribuicoes(selectedId ?? 0),
    enabled: Boolean(selectedId)
  });
  const empresaAssociadosQuery = useQuery({
    queryKey: ["empresa-associados", selectedId],
    queryFn: () => listEmpresaAssociados(selectedId ?? 0),
    enabled: Boolean(selectedId)
  });
  const escritoriosQuery = useQuery({ queryKey: ["empresas-escritorios-options"], queryFn: () => listEscritorios("") });
  const empresas = empresasQuery.data ?? [];
  const usuarios = usuariosQuery.data ?? [];
  const contribuicoes = contribuicoesQuery.data ?? [];
  const cnaes = cnaesQuery.data ?? [];
  const estabelecimentos = (estabelecimentosQuery.data ?? []).filter((item) => item.ativo === "S");
  const estabelecimentoTipos = (estabelecimentoTiposQuery.data ?? []).filter((item) => item.ativo === "S");
  const ramoAtividades = (ramoAtividadesQuery.data ?? []).filter((item) => item.ativo === "S");
  const convencoes = (convencoesQuery.data ?? []).filter((item) => item.ativo === "S");
  const defaultEstabelecimentoId = estabelecimentos[0]?.id ?? emptyForm.estabelecimento_id;
  const defaultEstabelecimentoTipoId = estabelecimentoTipos[0]?.id ?? emptyForm.estabelecimento_tipo_id;
  const defaultRamoAtividadeId = ramoAtividades[0]?.id ?? emptyForm.ramo_atividade_id;
  const defaultConvencaoId = convencoes[0]?.id ?? emptyForm.convencao_id;
  const empresaContribuicoes = empresaContribuicoesQuery.data ?? [];
  const empresaAssociados = empresaAssociadosQuery.data ?? [];
  const escritorios = escritoriosQuery.data ?? [];
  const selected = empresas.find((item) => item.id === selectedId) ?? null;
  const formOpen = creatingNew || Boolean(selectedId);

  useEffect(() => {
    if (!selected) {
      setForm(emptyForm);
      return;
    }

    setForm({
      id: selected.id,
      user_resp_id: selected.user_resp_id,
      estabelecimento_id: selected.estabelecimento_id,
      estabelecimento_tipo_id: selected.estabelecimento_tipo_id,
      escritorio_id: selected.escritorio_id,
      ramo_atividade_id: selected.ramo_atividade_id,
      convencao_id: selected.convencao_id,
      cnae_id: selected.cnae_id,
      tipo_cei_cnpj: selected.tipo_cei_cnpj,
      dt_inicio_atividades: selected.dt_inicio_atividades ?? "",
      ativo: selected.ativo,
      razao_social: selected.razao_social,
      nm_fantasia: selected.nm_fantasia,
      cei_cnpj: formatCeiCnpj(selected.cei_cnpj, selected.tipo_cei_cnpj),
      insc_estadual: selected.insc_estadual ?? "",
      nm_contato1: selected.nm_contato1 ?? "",
      nm_contato2: selected.nm_contato2 ?? "",
      nm_contato3: selected.nm_contato3 ?? "",
      email1: selected.email1 ?? "",
      email2: selected.email2 ?? "",
      email3: selected.email3 ?? "",
      tel1: formatTelefone(selected.tel1),
      tel2: formatTelefone(selected.tel2),
      tel3: formatTelefone(selected.tel3),
      site: selected.site ?? "",
      endereco: selected.endereco ?? "",
      numero: selected.numero ?? "",
      complemento: selected.complemento ?? "",
      bairro: selected.bairro ?? "",
      cidade: selected.cidade ?? "",
      uf: selected.uf,
      cep: formatCep(selected.cep),
      capital_social: selected.capital_social,
      logo_path: selected.logo_path,
      obs: selected.obs ?? ""
    });
    setLogoFile(null);
  }, [selected]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(getEmpresaLogoUrl(form.logo_path));
      return;
    }

    const previewUrl = URL.createObjectURL(logoFile);
    setLogoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [form.logo_path, logoFile]);

  const saveMutation = useMutation({
    mutationFn: async (values: EmpresaCadastroInsert) => {
      const saved = await saveEmpresaCadastro(values);
      if (!logoFile) return saved;

      const logoPath = await uploadEmpresaLogo(saved.id, logoFile);
      return saveEmpresaCadastro({ ...values, id: saved.id, logo_path: logoPath });
    },
    onSuccess: async (saved) => {
      setSelectedId(saved.id);
      setCreatingNew(false);
      setLogoFile(null);
      setMessage("Empresa salva com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["empresas-cadastro"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar a empresa.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmpresaCadastro,
    onSuccess: async () => {
      setSelectedId(null);
      setCreatingNew(false);
      setForm(emptyForm);
      setMessage("Empresa excluida com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["empresas-cadastro"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel excluir a empresa.")
  });

  const cnpjMutation = useMutation({
    mutationFn: consultarCnpj,
    onSuccess: (data) => {
      setCnpjData(data);
      setCnpjMessage(null);
      setNovoStep("revisao");
    },
    onError: (error) => setCnpjMessage(error instanceof Error ? error.message : "Nao foi possivel consultar esse CNPJ.")
  });

  const cepMutation = useMutation({
    mutationFn: consultarCep,
    onSuccess: (data) => {
      setForm((current) => {
        if (current.endereco?.trim()) return current;

        return {
          ...current,
          cep: formatCep(data.cep),
          endereco: data.street ?? current.endereco,
          bairro: data.neighborhood ?? current.bairro,
          cidade: data.city ?? current.cidade,
          uf: data.state ?? current.uf
        };
      });
    }
  });

  const addContribuicaoMutation = useMutation({
    mutationFn: ({ empresaId, contribuicaoId }: { empresaId: number; contribuicaoId: number }) => addEmpresaContribuicao(empresaId, contribuicaoId),
    onSuccess: async () => {
      setSelectedContribuicaoId("");
      setMessage("Contribuicao adicionada com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["empresa-contribuicoes", selectedId] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel adicionar a contribuicao.")
  });

  const deleteContribuicaoMutation = useMutation({
    mutationFn: deleteEmpresaContribuicao,
    onSuccess: async () => {
      setMessage("Contribuicao removida com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["empresa-contribuicoes", selectedId] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel remover a contribuicao.")
  });

  const totalLabel = useMemo(() => `${empresas.length} registro${empresas.length === 1 ? "" : "s"}`, [empresas.length]);

  function handleNew() {
    setSelectedId(null);
    setCreatingNew(false);
    setActiveTab("dados");
    setMessage(null);
    setCnpjMessage(null);
    setCnpjData(null);
    setCnpjInput("");
    setLogoFile(null);
    setNovoStep("tipo");
  }

  function startManualNew(tipo: number) {
    setSelectedId(null);
    setCreatingNew(true);
    setActiveTab("dados");
    setMessage(null);
    setCnpjMessage(null);
    setCnpjData(null);
    setLogoFile(null);
    setForm({
      ...emptyForm,
      estabelecimento_id: defaultEstabelecimentoId,
      estabelecimento_tipo_id: defaultEstabelecimentoTipoId,
      ramo_atividade_id: defaultRamoAtividadeId,
      convencao_id: defaultConvencaoId,
      tipo_cei_cnpj: tipo,
      cei_cnpj: ""
    });
    setNovoStep(null);
  }

  function handleCnpjSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCnpjMessage(null);
    cnpjMutation.mutate(cnpjInput);
  }

  function fillFormFromCnpj() {
    if (!cnpjData) return;
    setSelectedId(null);
    setCreatingNew(true);
    setActiveTab("dados");
    setMessage(null);
    setLogoFile(null);
    setForm({
      ...mapCnpjConsultaToForm(cnpjData),
      estabelecimento_id: defaultEstabelecimentoId,
      estabelecimento_tipo_id: defaultEstabelecimentoTipoId,
      ramo_atividade_id: defaultRamoAtividadeId,
      convencao_id: defaultConvencaoId,
      cnae_id: findCnaeIdByApiCode(cnpjData.cnae_fiscal, cnaes)
    });
    setNovoStep(null);
  }

  function closeNovoDialog() {
    setNovoStep(null);
    setCnpjMessage(null);
    setCnpjData(null);
    setCnpjInput("");
  }

  function handleSelect(item: EmpresaCadastro) {
    setSelectedId(item.id);
    setCreatingNew(false);
    setActiveTab("dados");
    setMessage(null);
    setLogoFile(null);
    setSelectedContribuicaoId("");
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    saveMutation.mutate(form);
  }

  function handleDeleteEmpresa(id: number) {
    if (!window.confirm("Deseja excluir esta empresa?")) return;
    setMessage(null);
    deleteMutation.mutate(id);
  }

  function handleTipoCeiCnpjChange(value: number) {
    setForm({ ...form, tipo_cei_cnpj: value, cei_cnpj: formatCeiCnpj(form.cei_cnpj, value) });
  }

  function handleCeiCnpjChange(value: string) {
    setForm({ ...form, cei_cnpj: formatCeiCnpj(value, form.tipo_cei_cnpj) });
  }

  function handleCepBlur() {
    if (form.endereco?.trim()) return;
    const digits = onlyDigits(form.cep);
    if (digits.length !== 8) return;
    cepMutation.mutate(digits);
  }

  function handleAddContribuicao() {
    if (!selectedId || !selectedContribuicaoId) return;
    setMessage(null);
    addContribuicaoMutation.mutate({ empresaId: selectedId, contribuicaoId: Number(selectedContribuicaoId) });
  }

  function handleDeleteContribuicao(id: number) {
    if (!window.confirm("Deseja excluir esta contribuicao da empresa?")) return;
    setMessage(null);
    deleteContribuicaoMutation.mutate(id);
  }

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Cadastros" }, { label: "Empresas" }]} />
      <section className="module-header">
        <div>
          <h1>Empresas</h1>
          <p>Cadastro de Empresas.</p>
        </div>
        <button onClick={handleNew}><Plus size={16} /> Novo</button>
      </section>

      {novoStep ? <div className="modal-backdrop" role="presentation">
        <div className="modal-panel" role="dialog" aria-modal="true" aria-label="Novo cadastro de empresa">
          {novoStep === "tipo" ? <>
            <div>
              <h2>Novo cadastro</h2>
              <p>Selecione o tipo de documento da empresa.</p>
            </div>
            <div className="choice-grid">
              <button type="button" onClick={() => setNovoStep("cnpj")}>CNPJ</button>
              <button type="button" className="secondary-button" onClick={() => startManualNew(2)}>CEI</button>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={closeNovoDialog}>Cancelar</button>
            </div>
          </> : null}

          {novoStep === "cnpj" ? <form className="modal-form" onSubmit={handleCnpjSearch}>
            <div>
              <h2>Consultar CNPJ</h2>
              <p>Informe o CNPJ para buscar os dados cadastrais.</p>
            </div>
            <label className="field">
              <input value={cnpjInput} maxLength={18} onChange={(event) => setCnpjInput(formatCnpj(event.target.value))} placeholder=" " autoFocus />
              <span>CNPJ</span>
            </label>
            {cnpjMessage ? <div className="form-error">{cnpjMessage}</div> : null}
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => startManualNew(1)}>Preencher manualmente</button>
              <button type="button" className="secondary-button" onClick={closeNovoDialog}>Cancelar</button>
              <button type="submit" disabled={cnpjMutation.isPending}>{cnpjMutation.isPending ? "Buscando..." : "Buscar"}</button>
            </div>
          </form> : null}

          {novoStep === "revisao" && cnpjData ? <>
            <div>
              <h2>Dados encontrados</h2>
              <p>Revise antes de preencher o cadastro.</p>
            </div>
            <div className="lookup-summary">
              <div><span>Razao social</span><strong>{firstText(cnpjData.razao_social) || "-"}</strong></div>
              <div><span>Nome fantasia</span><strong>{firstText(cnpjData.nome_fantasia, cnpjData.razao_social) || "-"}</strong></div>
              <div><span>CNPJ</span><strong>{formatCnpj(cnpjData.cnpj)}</strong></div>
              <div><span>Cidade/UF</span><strong>{firstText(cnpjData.municipio) || "-"} / {cnpjData.uf ?? "-"}</strong></div>
              <div><span>E-mail</span><strong>{cnpjData.email || "-"}</strong></div>
              <div><span>Telefone</span><strong>{onlyDigits(cnpjData.ddd_telefone_1) || "-"}</strong></div>
            </div>
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setNovoStep("cnpj")}>Nova consulta</button>
              <button type="button" className="secondary-button" onClick={closeNovoDialog}>Cancelar</button>
              <button type="button" onClick={fillFormFromCnpj}>Preencher cadastro</button>
            </div>
          </> : null}
        </div>
      </div> : null}

      <section className={`split-view ${formOpen ? "" : "list-only"}`}>
        <div className="list-panel">
          <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por razao, fantasia, CNPJ ou cidade" /></label>
          <div className="list-summary">{totalLabel}</div>
          <div className="record-list">
            {empresasQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
            {empresas.map((item) => (
              <div key={item.id}
                className={`record-row with-action ${item.id === selectedId ? "selected" : ""}`}
                onClick={() => handleSelect(item)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") handleSelect(item);
                }}
                role="button"
                tabIndex={0}
              >
                <div className="avatar">{getEmpresaLogoUrl(item.logo_path) ? <img src={getEmpresaLogoUrl(item.logo_path) ?? ""} alt="" /> : <Building2 size={19} />}</div>
                <div>
                  <strong>{item.nm_fantasia}</strong>
                  <span>{formatCeiCnpj(item.cei_cnpj, item.tipo_cei_cnpj)}</span>
                </div>
                
              </div>
            ))}
            {!empresasQuery.isLoading && empresas.length === 0 ? <div className="empty-state">Nenhuma empresa encontrada.</div> : null}
          </div>
        </div>

        {formOpen ? <div className="detail-panel">
          <form className="form-panel" onSubmit={handleSubmit}>
            <div className="tabs" role="tablist" aria-label="Empresa">
              <button type="button" className={activeTab === "dados" ? "active" : ""} onClick={() => setActiveTab("dados")}>Dados</button>
              <button type="button" className={activeTab === "associados" ? "active" : ""} onClick={() => setActiveTab("associados")}>Associados</button>
              <button type="button" className={activeTab === "contribuicoes" ? "active" : ""} onClick={() => setActiveTab("contribuicoes")}>Contribuições</button>
              <button type="button" className={activeTab === "financeiro" ? "active" : ""} onClick={() => setActiveTab("financeiro")}>Financeiro</button>
            </div>

            {activeTab === "dados" ? <>
              <div className="form-grid compact">
                <label className="field">
                  <select value={form.ativo} onChange={(event) => setForm({ ...form, ativo: event.target.value })}>
                    <option value="S">Ativa</option>
                    <option value="N">Inativa</option>
                  </select>
                  <span>Status</span>
                </label>
                <label className="field">
                  <select value={form.tipo_cei_cnpj} onChange={(event) => handleTipoCeiCnpjChange(Number(event.target.value))}>
                    <option value={1}>CNPJ</option>
                    <option value={2}>CEI</option>
                  </select>
                  <span>Tipo CEI/CNPJ</span>
                </label>
                <label className="field"><input value={form.cei_cnpj} maxLength={form.tipo_cei_cnpj === 2 ? 15 : 18} onChange={(event) => handleCeiCnpjChange(event.target.value)} placeholder=" " required /><span>CEI/CNPJ</span></label>
              </div>

              <div className="form-grid compact">
                <label className="field"><input type="date" value={form.dt_inicio_atividades ?? ""} onChange={(event) => setForm({ ...form, dt_inicio_atividades: event.target.value })} placeholder=" " /><span>Inicio Atividades</span></label>
                <label className="field"><input value={form.insc_estadual ?? ""} maxLength={25} onChange={(event) => setForm({ ...form, insc_estadual: event.target.value })} placeholder=" " /><span>Inscrição Estadual</span></label>
                <label className="field"><input className="currency-input" value={formatCurrency(form.capital_social)} onChange={(event) => setForm({ ...form, capital_social: parseCurrency(event.target.value) })} placeholder=" " /><span>Capital Social</span></label>
              </div>

              <div className="form-grid">
                <label className="field"><input value={form.razao_social} maxLength={100} onChange={(event) => setForm({ ...form, razao_social: event.target.value })} placeholder=" " required /><span>Razão Social</span></label>
                <label className="field"><input value={form.nm_fantasia} maxLength={50} onChange={(event) => setForm({ ...form, nm_fantasia: event.target.value })} placeholder=" " required /><span>Nome Fantasia</span></label>
              </div>

              <div className="photo-field">
                <div className="avatar large">{logoPreview ? <img src={logoPreview} alt="" /> : <Building2 size={30} />}</div>
                <label className="secondary-button">
                  <Camera size={16} /> Logomarca
                  <input type="file" accept="image/*" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
                </label>
              </div>

              <div className="form-grid compact">
                <label className="field">
                  <select value={form.user_resp_id} onChange={(event) => setForm({ ...form, user_resp_id: event.target.value })}>
                    <option value="">Selecione</option>
                    {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.full_name || usuario.codinome || usuario.email}</option>)}
                  </select>
                  <span>Usuário Responsável</span>
                </label>
                <label className="field">
                  <select value={form.estabelecimento_id} onChange={(event) => setForm({ ...form, estabelecimento_id: Number(event.target.value) })}>
                    <option value={0}>Selecione</option>
                    {estabelecimentos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                  </select>
                  <span>Estabelecimento</span>
                </label>
                <label className="field">
                  <select value={form.estabelecimento_tipo_id} onChange={(event) => setForm({ ...form, estabelecimento_tipo_id: Number(event.target.value) })}>
                    <option value={0}>Selecione</option>
                    {estabelecimentoTipos.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                  </select>
                  <span>Tipo Estabelecimento</span>
                </label>
              </div>

              <div className="form-grid compact">
                <label className="field">
                  <select value={form.escritorio_id} onChange={(event) => setForm({ ...form, escritorio_id: Number(event.target.value) })}>
                    <option value={0}>Selecione</option>
                    {escritorios.map((item) => <option key={item.id} value={item.id}>{item.nm_fantasia || item.razao_social}</option>)}
                  </select>
                  <span>Escritório</span>
                </label>
                <label className="field">
                  <select value={form.ramo_atividade_id} onChange={(event) => setForm({ ...form, ramo_atividade_id: Number(event.target.value) })}>
                    <option value={0}>Selecione</option>
                    {ramoAtividades.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                  </select>
                  <span>Ramo Atividade</span>
                </label>
                <label className="field">
                  <select value={form.convencao_id} onChange={(event) => setForm({ ...form, convencao_id: Number(event.target.value) })}>
                    <option value={0}>Selecione</option>
                    {convencoes.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
                  </select>
                  <span>Convenção Coletiva</span>
                </label>
              </div>

              <label className="field">
                <select value={form.cnae_id} onChange={(event) => setForm({ ...form, cnae_id: Number(event.target.value) })}>
                  <option value={0}>Selecione</option>
                  {cnaes.map((item) => <option key={item.id} value={item.id}>{item.codigo_cnae} - {item.descricao}</option>)}
                </select>
                <span>CNAE</span>
              </label>

              <div className="form-grid compact">
                <label className="field"><input value={form.nm_contato1 ?? ""} maxLength={40} onChange={(event) => setForm({ ...form, nm_contato1: event.target.value })} placeholder=" " /><span>Contato 1</span></label>
                <label className="field"><input type="email" value={form.email1 ?? ""} maxLength={100} onChange={(event) => setForm({ ...form, email1: event.target.value })} placeholder=" " /><span>E-mail 1</span></label>
                <label className="field"><input value={form.tel1 ?? ""} maxLength={15} onChange={(event) => setForm({ ...form, tel1: formatTelefone(event.target.value) })} placeholder=" " /><span>Telefone 1</span></label>
              </div>

              <div className="form-grid compact">
                <label className="field"><input value={form.nm_contato2 ?? ""} maxLength={40} onChange={(event) => setForm({ ...form, nm_contato2: event.target.value })} placeholder=" " /><span>Contato 2</span></label>
                <label className="field"><input type="email" value={form.email2 ?? ""} maxLength={100} onChange={(event) => setForm({ ...form, email2: event.target.value })} placeholder=" " /><span>E-mail 2</span></label>
                <label className="field"><input value={form.tel2 ?? ""} maxLength={15} onChange={(event) => setForm({ ...form, tel2: formatTelefone(event.target.value) })} placeholder=" " /><span>Telefone 2</span></label>
              </div>

              <div className="form-grid compact">
                <label className="field"><input value={form.nm_contato3 ?? ""} maxLength={40} onChange={(event) => setForm({ ...form, nm_contato3: event.target.value })} placeholder=" " /><span>Contato 3</span></label>
                <label className="field"><input type="email" value={form.email3 ?? ""} maxLength={100} onChange={(event) => setForm({ ...form, email3: event.target.value })} placeholder=" " /><span>E-mail 3</span></label>
                <label className="field"><input value={form.tel3 ?? ""} maxLength={15} onChange={(event) => setForm({ ...form, tel3: formatTelefone(event.target.value) })} placeholder=" " /><span>Telefone 3</span></label>
              </div>

              <label className="field"><input value={form.site ?? ""} maxLength={100} onChange={(event) => setForm({ ...form, site: event.target.value })} placeholder=" " /><span>Site</span></label>
              <label className="field"><input value={form.cep ?? ""} maxLength={9} onBlur={handleCepBlur} onChange={(event) => setForm({ ...form, cep: formatCep(event.target.value) })} placeholder=" " /><span>CEP</span></label>

              <div className="form-grid compact">
                <label className="field"><input value={form.endereco ?? ""} maxLength={50} onChange={(event) => setForm({ ...form, endereco: event.target.value })} placeholder=" " /><span>Endereço</span></label>
                <label className="field"><input value={form.numero ?? ""} maxLength={15} onChange={(event) => setForm({ ...form, numero: event.target.value })} placeholder=" " /><span>Número</span></label>
                <label className="field"><input value={form.complemento ?? ""} maxLength={30} onChange={(event) => setForm({ ...form, complemento: event.target.value })} placeholder=" " /><span>Complemento</span></label>
              </div>

              <div className="form-grid compact">
                <label className="field"><input value={form.bairro ?? ""} maxLength={30} onChange={(event) => setForm({ ...form, bairro: event.target.value })} placeholder=" " /><span>Bairro</span></label>
                <label className="field"><input value={form.cidade ?? ""} maxLength={30} onChange={(event) => setForm({ ...form, cidade: event.target.value })} placeholder=" " /><span>Cidade</span></label>
                <label className="field"><input value={form.uf} maxLength={2} onChange={(event) => setForm({ ...form, uf: event.target.value.toUpperCase() })} placeholder=" " /><span>UF</span></label>
              </div>

              <label className="field"><textarea rows={3} value={form.obs ?? ""} onChange={(event) => setForm({ ...form, obs: event.target.value })} placeholder=" " /><span>Observação</span></label>
            </> : null}

            {activeTab === "associados" ? <div className="related-panel">
              {!selectedId ? <div className="empty-state tab-empty">Salve a empresa antes de consultar associados.</div> : <div className="data-table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Matricula</th>
                      <th>Nome</th>
                      <th>CPF</th>
                      <th>Telefone</th>
                      <th>E-mail</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {empresaAssociados.map((associado) => (
                      <tr key={associado.id}>
                        <td>{associado.matricula ?? "-"}</td>
                        <td>{associado.nome}</td>
                        <td>{formatCpf(associado.cpf)}</td>
                        <td>{associado.tel1 ?? "-"}</td>
                        <td>{associado.email ?? "-"}</td>
                        <td className={associado.ativo ? "status-ok" : "status-muted"}>{associado.ativo ? "Ativo" : "Inativo"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {empresaAssociadosQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
                {!empresaAssociadosQuery.isLoading && empresaAssociados.length === 0 ? <div className="empty-state">Nenhum associado vinculado.</div> : null}
              </div>}
            </div> : null}
            {activeTab === "contribuicoes" ? <div className="related-panel">
              {!selectedId ? <div className="empty-state tab-empty">Salve a empresa antes de adicionar contribuições.</div> : <>
                <div className="related-toolbar">
                  <label className="field">
                    <select value={selectedContribuicaoId} onChange={(event) => setSelectedContribuicaoId(event.target.value)}>
                      <option value="">Selecione</option>
                      {contribuicoes.map((contribuicao) => (
                        <option key={contribuicao.id} value={contribuicao.id}>{contribuicao.tipo} • {contribuicao.nm_contribuicao}</option>
                      ))}
                    </select>
                    <span>Contribuicao</span>
                  </label>
                  <button type="button" onClick={handleAddContribuicao} disabled={!selectedContribuicaoId || addContribuicaoMutation.isPending}>
                    <Plus size={16} /> Adicionar
                  </button>
                </div>

                <div className="data-table-wrap">
                  <table className="data-table clickable-rows">
                    <thead>
                      <tr>
                        <th>Tipo</th>
                        <th>Contribuição</th>
                        <th>Valor</th>
                        <th>Pagamento</th>
                        <th>Incluido</th>
                      </tr>
                    </thead>
                    <tbody>
                      {empresaContribuicoes.map((item) => (
                        <tr key={item.id} onClick={() => handleDeleteContribuicao(item.id)} tabIndex={0}>
                          <td>{item.contribuicao?.tipo ?? "-"}</td>
                          <td>{item.contribuicao?.nm_contribuicao ?? "-"}</td>
                          <td className="numeric-cell">{formatCurrency(item.contribuicao?.valor_base)}</td>
                          <td>{formatDateTime(item.dt_pg)}</td>
                          <td>{formatDateTime(item.created_at)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {empresaContribuicoesQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
                  {!empresaContribuicoesQuery.isLoading && empresaContribuicoes.length === 0 ? <div className="empty-state">Nenhuma contribuição vinculada.</div> : null}
                </div>
              </>}
            </div> : null}
            {activeTab === "financeiro" ? <div className="empty-state tab-empty">Nenhum lançamento financeiro vinculado nesta tela.</div> : null}

            {message ? <div className={saveMutation.isError || deleteMutation.isError ? "form-error" : "form-success"}>{message}</div> : null}

            <div className="form-actions">
              {activeTab === "dados" ? <button type="submit" disabled={saveMutation.isPending}><Save size={16} /> {saveMutation.isPending ? "Salvando..." : "Salvar"}</button> : null}
            </div>
          </form>
        </div> : null}
      </section>
    </main>
  );
}
