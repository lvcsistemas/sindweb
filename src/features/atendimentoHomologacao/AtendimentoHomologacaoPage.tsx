import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Plus, Save, Search } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { applyAtendimentoDateRangePreference, getAtendimentoDateRangePreference, setAtendimentoDateRangePreference } from "../../shared/dateRangePreference";
import type { AtendimentoHomologacaoInsert, AtendimentoHomologacaoLista } from "../../types/database";
import { listAuxiliares } from "../auxiliares/auxiliaresApi";
import { listEmpresasCadastro } from "../empresa/empresaApi";
import { listAtendimentosHomologacao, saveAtendimentoHomologacao, type AtendimentoHomologacaoFilters, type AtendimentoHomologacaoSearchType } from "./atendimentoHomologacaoApi";

const pesquisaOptions: Array<{ value: AtendimentoHomologacaoSearchType; label: string }> = [
  { value: "T",              label: "TODOS" },
  { value: "AGENDAMENTO",    label: "DATA: AGENDAMENTO" },
  { value: "ID ATENDIMENTO", label: "ID: ATENDIMENTO" },
  { value: "ID EMPRESA",     label: "ID: EMPRESA" },
  { value: "NM EMPRESA",     label: "NOME: EMPRESA" },
  { value: "SEDE",           label: "SEDE" },
  { value: "HOMOLOGADOR",    label: "HOMOLOGADOR" },
  { value: "AGENDADO",       label: "SITUACAO: AGENDADO" },
  { value: "ATENDIDO",       label: "SITUACAO: ATENDIDO" },
  { value: "CANCELADO",      label: "SITUACAO: CANCELADO" }
];

function localDateTimeValue(date = new Date()) {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function todayAt(time: "start" | "end") {
  const date = new Date();
  date.setHours(time === "start" ? 0 : 23, time === "start" ? 0 : 59, 0, 0);
  return localDateTimeValue(date);
}

function emptyFilters(): AtendimentoHomologacaoFilters {
  return applyAtendimentoDateRangePreference({ pesquisa: "T", inicio: todayAt("start"), fim: todayAt("end"), valor: "" });
}

function newEmptyForm(): AtendimentoHomologacaoInsert {
  const preferredRange = getAtendimentoDateRangePreference();
  return {
    sede_id: 0,
    empresa_id: 0,
    dt_agendado: preferredRange?.inicio ?? localDateTimeValue(),
    situacao: "AGENDADO",
    nm_homologador: "",
    qtd: 0,
    obs: ""
  };
}

function toDateTimeLocal(value: string | null | undefined) {
  return value ? value.slice(0, 16) : "";
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const [date = "", time = ""] = value.slice(0, 19).split("T");
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year} ${time}`;
}

function formatTimestampLocal(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDateTime(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}

function formatDocumento(value: string | null | undefined) {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (digits.length === 14) {
    return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  }
  return value ?? "-";
}

export function AtendimentoHomologacaoPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<AtendimentoHomologacaoFilters>(emptyFilters);
  const [draftFilters, setDraftFilters] = useState<AtendimentoHomologacaoFilters>(emptyFilters);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<AtendimentoHomologacaoInsert>(newEmptyForm);
  const [empresaSearch, setEmpresaSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const atendimentosQuery = useQuery({ queryKey: ["atendimento-homologacao", filters], queryFn: () => listAtendimentosHomologacao(filters) });
  const sedesQuery = useQuery({ queryKey: ["auxiliares", "sede"], queryFn: () => listAuxiliares("sede", "") });
  const empresasQuery = useQuery({ queryKey: ["atendimento-homologacao-empresas", empresaSearch], queryFn: () => listEmpresasCadastro(empresaSearch), enabled: formOpen });

  const atendimentos = atendimentosQuery.data ?? [];
  const sedes = sedesQuery.data ?? [];
  const empresas = empresasQuery.data ?? [];
  const selected = atendimentos.find((item) => item.id === selectedId) ?? null;
  const totalLabel = useMemo(() => `${atendimentos.length} registro${atendimentos.length === 1 ? "" : "s"}`, [atendimentos.length]);
  const empresaOptions = useMemo(() => {
    if (!form.empresa_id || empresas.some((empresa) => empresa.id === form.empresa_id)) return empresas;
    return [{
      id: form.empresa_id,
      nm_fantasia: selected?.nm_empresa ?? `Empresa #${form.empresa_id}`,
      razao_social: selected?.razao_social ?? "",
      cei_cnpj: selected?.cei_cnpj ?? "",
      user_resp_id: "",
      estabelecimento_id: 0,
      estabelecimento_tipo_id: 0,
      escritorio_id: 0,
      ramo_atividade_id: 0,
      convencao_id: 0,
      cnae_id: 0,
      tipo_cei_cnpj: 1,
      dt_inicio_atividades: null,
      ativo: "S",
      insc_estadual: null,
      nm_contato1: null,
      nm_contato2: null,
      nm_contato3: null,
      email1: null,
      email2: null,
      email3: null,
      tel1: null,
      tel2: null,
      tel3: null,
      site: null,
      endereco: null,
      numero: null,
      complemento: null,
      bairro: null,
      cidade: null,
      uf: "RJ",
      cep: null,
      capital_social: 0,
      logo_path: null,
      obs: null,
      created_at: "",
      updated_at: ""
    }, ...empresas];
  }, [empresas, form.empresa_id, selected]);

  const saveMutation = useMutation({
    mutationFn: async (values: AtendimentoHomologacaoInsert) => {
      if (!Number(values.sede_id)) throw new Error("Selecione a sede antes de salvar.");
      if (!Number(values.empresa_id)) throw new Error("Selecione a empresa antes de salvar.");
      if (!values.dt_agendado) throw new Error("Informe a data do agendamento antes de salvar.");
      if (!values.situacao?.trim()) throw new Error("Selecione a situacao antes de salvar.");
      if (!values.nm_homologador?.trim()) throw new Error("Informe o homologador antes de salvar.");
      return saveAtendimentoHomologacao(values);
    },
    onSuccess: async (saved) => {
      setSelectedId(saved.id);
      setFormOpen(false);
      setMessage("Atendimento de homologacao salvo com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["atendimento-homologacao"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o atendimento de homologacao.")
  });

  function openFormForAtendimento(item: AtendimentoHomologacaoLista) {
    setSelectedId(item.id);
    setForm({
      id: item.id,
      created_by: item.created_by,
      updated_by: item.updated_by,
      sede_id: item.sede_id,
      empresa_id: item.empresa_id,
      dt_agendado: toDateTimeLocal(item.dt_agendado),
      situacao: item.situacao,
      nm_homologador: item.nm_homologador,
      qtd: item.qtd,
      obs: item.obs ?? ""
    });
    setEmpresaSearch(item.nm_empresa ?? "");
    setMessage(null);
    setFormOpen(true);
  }

  function handleNew() {
    setSelectedId(null);
    setEmpresaSearch("");
    setMessage(null);
    setForm(newEmptyForm());
    setFormOpen(true);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAtendimentoDateRangePreference({ inicio: draftFilters.inicio, fim: draftFilters.fim });
    setFilters(draftFilters);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    saveMutation.mutate(form);
  }

  const atendimentoForm = formOpen ? (
    <section className="detail-panel atendimento-form-panel">
      <form className="form-panel" onSubmit={handleSubmit}>
        <div className="form-grid compact">
          <label className="field"><input type="datetime-local" value={form.dt_agendado} onChange={(event) => setForm({ ...form, dt_agendado: event.target.value })} placeholder=" " required /><span>Agendamento</span></label>
          <label className="field">
            <select value={form.situacao} onChange={(event) => setForm({ ...form, situacao: event.target.value })} required>
              <option value="AGENDADO">AGENDADO</option>
              <option value="ATENDIDO">ATENDIDO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
            <span>Situação</span>
          </label>
          <label className="field"><input type="number" min={0} step={1} value={form.qtd} onChange={(event) => setForm({ ...form, qtd: Number(event.target.value) })} placeholder=" " /><span>Qtd</span></label>
        </div>

        <div className="form-grid">
          <label className="field">
            <select value={form.sede_id} onChange={(event) => setForm({ ...form, sede_id: Number(event.target.value) })} required>
              <option value={0}>Selecione</option>
              {sedes.map((sede) => <option key={sede.id} value={sede.id}>{sede.nome}</option>)}
            </select>
            <span>Sede</span>
          </label>
          <label className="field"><input value={form.nm_homologador} maxLength={50} onChange={(event) => setForm({ ...form, nm_homologador: event.target.value.toUpperCase() })} placeholder=" " required /><span>Homologador</span></label>
        </div>

        <div className="form-grid">
          <label className="field"><input value={empresaSearch} onChange={(event) => setEmpresaSearch(event.target.value)} placeholder=" " /><span>Buscar empresa</span></label>
          <label className="field">
            <select value={form.empresa_id} onChange={(event) => setForm({ ...form, empresa_id: Number(event.target.value) })} required>
              <option value={0}>Selecione</option>
              {empresaOptions.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nm_fantasia} - {empresa.id} - {formatDocumento(empresa.cei_cnpj)}</option>)}
            </select>
            <span>Empresa</span>
          </label>
        </div>

        <label className="field"><textarea rows={3} value={form.obs ?? ""} onChange={(event) => setForm({ ...form, obs: event.target.value })} placeholder=" " /><span>Observação</span></label>

        {message ? <div className={saveMutation.isError ? "form-error" : "form-success"}>{message}</div> : null}

        <div className="form-actions atendimento-full-grid">
          <span className="form-actions-spacer" />
          <button type="button" className="secondary-button" onClick={() => setFormOpen(false)}><LogOut size={16} /> Sair</button>
          <button type="submit" disabled={saveMutation.isPending}><Save size={16} /> {saveMutation.isPending ? "Salvando..." : "Salvar"}</button>
        </div>
      </form>
    </section>
  ) : null;

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Atendimentos" }, { label: "Homologação" }]} />
      <section className="module-header">
        <div>
          <h1>Atendimento Homologação</h1>
          <p>Pesquisa e gestão de atendimentos de homologação.</p>
        </div>
      </section>

      {!formOpen ? (
        <>
          <div className="toolbar-right">
            <button type="button" onClick={handleNew}><Plus size={16} /> Novo Atendimento</button>
          </div>

          <section className="form-panel atendimento-search-panel">
            <form className="atendimento-search-grid homologacao-search-grid" onSubmit={handleSearch}>
              <label className="field">
                <select value={draftFilters.pesquisa} onChange={(event) => setDraftFilters({ ...draftFilters, pesquisa: event.target.value as AtendimentoHomologacaoSearchType })}>
                  {pesquisaOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <span>Pesquisar por</span>
              </label>
              <label className="field"><input type="datetime-local" value={draftFilters.inicio} onChange={(event) => {
                const nextFilters = { ...draftFilters, inicio: event.target.value };
                setDraftFilters(nextFilters);
                setAtendimentoDateRangePreference({ inicio: nextFilters.inicio, fim: nextFilters.fim });
              }} placeholder=" " /><span>Inicial</span></label>
              <label className="field"><input type="datetime-local" value={draftFilters.fim} onChange={(event) => {
                const nextFilters = { ...draftFilters, fim: event.target.value };
                setDraftFilters(nextFilters);
                setAtendimentoDateRangePreference({ inicio: nextFilters.inicio, fim: nextFilters.fim });
              }} placeholder=" " /><span>Final</span></label>
              <label className="field"><input value={draftFilters.valor} onChange={(event) => setDraftFilters({ ...draftFilters, valor: event.target.value })} placeholder=" " /><span>Valor procurado</span></label>
              <button type="submit"><Search size={16} /> Pesquisar</button>
            </form>
          </section>

          <section className="form-panel">
            <div className="list-summary">{totalLabel}</div>
            <div className="data-table-wrap">
              <table className="data-table clickable-rows">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Agendado</th>
                    <th>Empresa</th>
                    <th>Sede</th>
                    <th>Homologador</th>
                    <th>Qtd</th>
                    <th>Cadastrado</th>
                    <th>Alterado</th>
                  </tr>
                </thead>
                <tbody>
                  {atendimentos.map((item) => (
                    <tr key={item.id} onClick={() => openFormForAtendimento(item)}>
                      <td>{item.id}</td>
                      <td><strong>{formatDateTime(item.dt_agendado)}</strong><span>{item.situacao}</span></td>
                      <td><strong>{item.nm_empresa ?? "-"}</strong><span>{item.empresa_id} - {formatDocumento(item.cei_cnpj)}</span></td>
                      <td>{item.nm_sede ?? "-"}</td>
                      <td>{item.nm_homologador}</td>
                      <td>{item.qtd}</td>
                      <td><strong>{formatTimestampLocal(item.created_at)}</strong><span>{item.created_by_codinome || item.created_by_nome || "-"}</span></td>
                      <td><strong>{formatTimestampLocal(item.updated_at)}</strong><span>{item.updated_by_codinome || item.updated_by_nome || "-"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {atendimentosQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
              {!atendimentosQuery.isLoading && atendimentos.length === 0 ? <div className="empty-state">Nenhum atendimento encontrado.</div> : null}
            </div>
          </section>
        </>
      ) : null}

      {atendimentoForm}
    </main>
  );
}
