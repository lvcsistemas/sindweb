import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Search, Trash2 } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import type { AtendimentoMedicoInsert, AtendimentoMedicoLista } from "../../types/database";
import { listAssociados } from "../associados/associadosApi";
import { listAtendimentoMedicoConvenios } from "../atendimentoMedicoConvenio/atendimentoMedicoConvenioApi";
import { listAtendimentoMedicoEspecialidadesByTipo } from "../atendimentoMedicoEspecialidade/atendimentoMedicoEspecialidadeApi";
import { listDependentesByAssociado } from "../dependentes/dependentesApi";
import { listUsuarios } from "../usuarios/usuariosApi";
import { deleteAtendimentoMedico, listAtendimentosMedicos, saveAtendimentoMedico, type AtendimentoMedicoFilters, type AtendimentoMedicoSearchType } from "./atendimentoMedicoApi";

const pesquisaOptions: Array<{ value: AtendimentoMedicoSearchType; label: string }> = [
  { value: "T",               label: "TODOS" },
  { value: "CADASTRO",        label: "DATA: CADASTRO" },
  { value: "ID ATENDIMENTO",  label: "ID: ATENDIMENTO" },
  { value: "ID ASSOCIADO",    label: "ID: ASSOCIADO" },
  { value: "ID CONVENIO",     label: "ID: CONVENIO" },
  { value: "ID DEPENDENTE",   label: "ID: DEPENDENTE" },
  { value: "NM ASSOCIADO",    label: "NOME: ASSOCIADO" },
  { value: "NM DEPENDENTE",   label: "NOME: DEPENDENTE" },
  { value: "NM CONVENIO",     label: "NOME: CONVENIO" },
  { value: "AGENDADO",        label: "SITUACAO: AGENDADO" },
  { value: "ATENDIDO",        label: "SITUACAO: ATENDIDO" },
  { value: "CANCELADO",       label: "SITUACAO: CANCELADO" },
  { value: "AURICULOTERAPIA", label: "TIPO: AURICULOTERAPIA" },
  { value: "CARDIOLOGIA",     label: "TIPO: CARDIOLOGIA" },
  { value: "CLINICO GERAL",   label: "TIPO: CLINICO GERAL" },
  { value: "CONSULTA",        label: "TIPO: CONSULTA" },
  { value: "EXAME",           label: "TIPO: EXAME" },
  { value: "EXAME DE SANGUE", label: "TIPO: EXAME DE SANGUE" },
  { value: "FISIOTERAPIA",    label: "TIPO: FISIOTERAPIA" },
  { value: "FONOAUDIOLOGIA",  label: "TIPO: FONOAUDIOLOGIA" },
  { value: "MASSOTERAPIA",    label: "TIPO: MASSOTERAPIA" },
  { value: "ODONTOLOGIA",     label: "TIPO: ODONTOLOGIA" },
  { value: "PSICOLOGIA",      label: "TIPO: PSICOLOGIA" }
];

function toDateTimeLocal(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value.slice(0, 16);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function todayAt(time: "start" | "end") {
  const date = new Date();
  date.setHours(time === "start" ? 0 : 23, time === "start" ? 0 : 59, 0, 0);
  return toDateTimeLocal(date.toISOString());
}

function datePart(value: string | null | undefined) {
  return toDateTimeLocal(value).slice(0, 10);
}

function timePart(value: string | null | undefined) {
  return toDateTimeLocal(value).slice(11, 16);
}

function combineDateTime(date: string, time: string) {
  return `${date || datePart(new Date().toISOString())}T${time || timePart(new Date().toISOString())}`;
}

function weekDayLabel(date: string) {
  if (!date) return "";
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(parsed);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "medium" }).format(new Date(value));
}

function getAtendimentoRowClass(item: AtendimentoMedicoLista) {
  const situacao = item.situacao?.toUpperCase();
  const agendado = new Date(item.dt_agendado);
  if (situacao === "CANCELADO") return "atendimento-row canceled";
  if (situacao === "ATENDIDO") return "atendimento-row completed";
  if (situacao === "AGENDADO" && !Number.isNaN(agendado.getTime()) && new Date() > agendado) return "atendimento-row overdue";
  return "atendimento-row scheduled";
}

function emptyFilters(): AtendimentoMedicoFilters {
  return {
    pesquisa: "T",
    inicio: todayAt("start"),
    fim: todayAt("end"),
    usuarioId: "TODOS",
    valor: ""
  };
}

function newEmptyForm(): AtendimentoMedicoInsert {
  return {
    created_by: null,
    updated_by: null,
    created_by_legacy: null,
    updated_by_legacy: null,
    convenio_id: 0,
    associado_id: 0,
    dependente_id: 0,
    qtd: 0,
    dt_agendado: toDateTimeLocal(new Date().toISOString()),
    situacao: "AGENDADO",
    tipo: "",
    obs: ""
  };
}

export function AtendimentoMedicoPage() {
  const queryClient                     = useQueryClient();
  const [filters, setFilters]           = useState<AtendimentoMedicoFilters>(emptyFilters);
  const [draftFilters, setDraftFilters] = useState<AtendimentoMedicoFilters>(emptyFilters);
  const [selectedId, setSelectedId]     = useState<number | null>(null);
  const [formOpen, setFormOpen]         = useState(false);
  const [form, setForm]                 = useState<AtendimentoMedicoInsert>(newEmptyForm);
  const [associadoSearch, setAssociadoSearch] = useState("");
  const [message, setMessage]           = useState<string | null>(null);

  const atendimentosQuery   = useQuery({ queryKey: ["atendimento-medico", filters], queryFn: () => listAtendimentosMedicos(filters) });
  const conveniosQuery      = useQuery({ queryKey: ["atendimento-medico-convenios", ""], queryFn: () => listAtendimentoMedicoConvenios("") });
  const especialidadesQuery = useQuery({ queryKey: ["atendimento-medico-especialidades", "ESPECIALIDADE"], queryFn: () => listAtendimentoMedicoEspecialidadesByTipo("ESPECIALIDADE") });
  const associadosQuery     = useQuery({ queryKey: ["atendimento-medico-associados", associadoSearch], queryFn: () => listAssociados(associadoSearch), enabled: formOpen });
  const usuariosQuery       = useQuery({ queryKey: ["usuarios"], queryFn: listUsuarios });
  const dependentesQuery    = useQuery({
    queryKey: ["atendimento-medico-dependentes", form.associado_id],
    queryFn: () => listDependentesByAssociado(Number(form.associado_id)),
    enabled: Boolean(form.associado_id)
  });

  const atendimentos    = atendimentosQuery.data ?? [];
  const convenios       = conveniosQuery.data ?? [];
  const especialidades  = especialidadesQuery.data ?? [];
  const associados      = associadosQuery.data ?? [];
  const usuarios        = usuariosQuery.data ?? [];
  const dependentes     = dependentesQuery.data ?? [];
  const selected        = atendimentos.find((item) => item.id === selectedId) ?? null;
  const associadoOptions = useMemo(() => {
    if (!form.associado_id || associados.some((associado) => associado.id === form.associado_id)) return associados;
    return [{
      id: form.associado_id,
      nome: selected?.nm_associado ?? `Associado #${form.associado_id}`,
      matricula: selected?.matricula ?? null
    }, ...associados];
  }, [associados, form.associado_id, selected?.matricula, selected?.nm_associado]);

  useEffect(() => {
    if (!selected) return;
    setForm({
      id: selected.id,
      created_by: selected.created_by,
      updated_by: selected.updated_by,
      created_by_legacy: selected.created_by_legacy,
      updated_by_legacy: selected.updated_by_legacy,
      convenio_id: selected.convenio_id,
      associado_id: selected.associado_id,
      dependente_id: selected.dependente_id,
      qtd: selected.qtd,
      dt_agendado: toDateTimeLocal(selected.dt_agendado),
      situacao: selected.situacao,
      tipo: selected.tipo,
      obs: selected.obs ?? ""
    });
    setAssociadoSearch(selected.nm_associado ?? "");
    setFormOpen(true);
  }, [selected]);

  const saveMutation = useMutation({
    mutationFn: saveAtendimentoMedico,
    onSuccess: async (saved) => {
      setSelectedId(saved.id);
      setFormOpen(false);
      setMessage("Atendimento salvo com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["atendimento-medico"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o atendimento.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAtendimentoMedico,
    onSuccess: async () => {
      setSelectedId(null);
      setFormOpen(false);
      setForm(newEmptyForm());
      setMessage("Atendimento excluido com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["atendimento-medico"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel excluir o atendimento.")
  });

  const totalLabel = useMemo(() => `${atendimentos.length} registro${atendimentos.length === 1 ? "" : "s"}`, [atendimentos.length]);

  function handleNew() {
    setSelectedId(null);
    setAssociadoSearch("");
    setMessage(null);
    setForm(newEmptyForm());
    setFormOpen(true);
  }

  function handleSelect(item: AtendimentoMedicoLista) {
    setSelectedId(item.id);
    setMessage(null);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters(draftFilters);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    saveMutation.mutate(form);
  }

  function handleDelete() {
    if (!form.id) return;
    if (!window.confirm("Deseja excluir este atendimento?")) return;
    deleteMutation.mutate(form.id);
  }

  const atendimentoForm = formOpen ? (
    <section className="detail-panel atendimento-form-panel">
      <form className="form-panel" onSubmit={handleSubmit}>
        <div className="form-grid atendimento-agendamento-grid">
          <label className="field"><input type="date" value={datePart(form.dt_agendado)} onChange={(event) => setForm({ ...form, dt_agendado: combineDateTime(event.target.value, timePart(form.dt_agendado)) })} placeholder=" " required /><span>Agendamento</span></label>
          <label className="field"><input type="time" value={timePart(form.dt_agendado)} onChange={(event) => setForm({ ...form, dt_agendado: combineDateTime(datePart(form.dt_agendado), event.target.value) })} placeholder=" " required /><span>Hora</span></label>
          <div className="weekday-label">{weekDayLabel(datePart(form.dt_agendado))}</div>
          <label className="field">
            <select value={form.situacao} onChange={(event) => setForm({ ...form, situacao: event.target.value })} required>
              <option value="AGENDADO">AGENDADO</option>
              <option value="ATENDIDO">ATENDIDO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
            <span>Status</span>
          </label>
        </div>

        <div className="form-grid">
          <label className="field">
            <select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })} required>
              <option value="">Selecione</option>
              {especialidades.map((especialidade) => <option key={especialidade.id} value={especialidade.nm_especialidade}>{especialidade.nm_especialidade}</option>)}
            </select>
            <span>Tipo</span>
          </label>
          <label className="field">
            <select value={form.convenio_id} onChange={(event) => setForm({ ...form, convenio_id: Number(event.target.value) })} required>
              <option value={0}>Selecione</option>
              {convenios.map((convenio) => <option key={convenio.id} value={convenio.id}>{convenio.nm_convenio}</option>)}
            </select>
            <span>Convênio</span>
          </label>
        </div>

        <div className="form-grid">
          <label className="field"><input value={associadoSearch} onChange={(event) => setAssociadoSearch(event.target.value)} placeholder=" " /><span>Buscar associado</span></label>
          <label className="field">
            <select value={form.associado_id} onChange={(event) => setForm({ ...form, associado_id: Number(event.target.value), dependente_id: 0 })} required>
              <option value={0}>Selecione</option>
              {associadoOptions.map((associado) => <option key={associado.id} value={associado.id}>{associado.nome}{associado.matricula ? ` - ${associado.matricula}` : ""}</option>)}
            </select>
            <span>Associado</span>
          </label>
        </div>

        <div className="form-grid compact">
          <label className="field">
            <select value={form.dependente_id} onChange={(event) => setForm({ ...form, dependente_id: Number(event.target.value) })}>
              <option value={0}>Sem dependente</option>
              {dependentes.map((dependente) => <option key={dependente.id} value={dependente.id}>{dependente.nm_dependente}</option>)}
            </select>
            <span>Dependente</span>
          </label>
        </div>

        <label className="field"><textarea rows={3} value={form.obs ?? ""} onChange={(event) => setForm({ ...form, obs: event.target.value })} placeholder=" " /><span>Observacao</span></label>

        {message ? <div className={saveMutation.isError || deleteMutation.isError ? "form-error" : "form-success"}>{message}</div> : null}

        <div className="form-actions">
          <button type="button" className="secondary-button" onClick={() => setFormOpen(false)}>Sair</button>
          {form.id ? <button type="button" className="danger-button" onClick={handleDelete} disabled={deleteMutation.isPending}><Trash2 size={16} /> Excluir</button> : null}
          <button type="submit" disabled={saveMutation.isPending}><Save size={16} /> {saveMutation.isPending ? "Salvando..." : "Salvar"}</button>
        </div>
      </form>
    </section>
  ) : null;

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Atendimentos" }, { label: "Medico" }]} />
      <section className="module-header">
        <div>
          <h1>Atendimento Medico</h1>
          <p>Pesquisa e gestao de atendimentos medicos.</p>
        </div>
      </section>

      <div className="toolbar-right">
        <button type="button" onClick={handleNew}><Plus size={16} /> Novo atendimento</button>
      </div>

      {atendimentoForm}

      <section className="form-panel atendimento-search-panel">
        <form className="atendimento-search-grid" onSubmit={handleSearch}>
          <label className="field">
            <select value={draftFilters.pesquisa} onChange={(event) => setDraftFilters({ ...draftFilters, pesquisa: event.target.value as AtendimentoMedicoSearchType })}>
              {pesquisaOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <span>Pesquisar por</span>
          </label>
          <label className="field"><input type="datetime-local" value={draftFilters.inicio} onChange={(event) => setDraftFilters({ ...draftFilters, inicio: event.target.value })} placeholder=" " /><span>Inicial</span></label>
          <label className="field"><input type="datetime-local" value={draftFilters.fim} onChange={(event) => setDraftFilters({ ...draftFilters, fim: event.target.value })} placeholder=" " /><span>Final</span></label>
          <label className="field">
            <select value={draftFilters.usuarioId} onChange={(event) => {
              const nextFilters = { ...draftFilters, usuarioId: event.target.value };
              setDraftFilters(nextFilters);
              setFilters(nextFilters);
            }}>
              <option value="TODOS">TODOS</option>
              {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.codinome || usuario.full_name || usuario.email}</option>)}
            </select>
            <span>Usuario</span>
          </label>
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
                <th>Convenio</th>
                <th>Associado</th>
                <th>Cadastrado</th>
                <th>Alterado</th>
              </tr>
            </thead>
            <tbody>
              {atendimentos.map((item) => (
                <tr key={item.id} className={getAtendimentoRowClass(item)} onClick={() => handleSelect(item)}>
                  <td>{item.id}</td>
                  <td><strong>{formatDateTime(item.dt_agendado)}</strong><span>{item.situacao}</span></td>
                  <td><strong>{item.nm_convenio ?? "-"}</strong><span>{item.tipo || "-"}</span></td>
                  <td><strong>{item.nm_associado ?? "-"}</strong><span>{item.nm_dependente || "-"}</span></td>
                  <td><strong>{formatDateTime(item.created_at)}</strong><span>{item.created_by_codinome || item.created_by_nome || "-"}</span></td>
                  <td><strong>{formatDateTime(item.updated_at)}</strong><span>{item.updated_by_codinome || item.updated_by_nome || "-"}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {atendimentosQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
          {!atendimentosQuery.isLoading && atendimentos.length === 0 ? <div className="empty-state">Nenhum atendimento encontrado.</div> : null}
        </div>
      </section>

    </main>
  );
}
