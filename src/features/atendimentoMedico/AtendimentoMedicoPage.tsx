import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Search, Trash2 } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import type { AtendimentoMedicoInsert, AtendimentoMedicoLista } from "../../types/database";
import { listAssociados } from "../associados/associadosApi";
import { listAtendimentoMedicoConvenios } from "../atendimentoMedicoConvenio/atendimentoMedicoConvenioApi";
import { listDependentesByAssociado } from "../dependentes/dependentesApi";
import { deleteAtendimentoMedico, listAtendimentosMedicos, saveAtendimentoMedico } from "./atendimentoMedicoApi";

const emptyForm: AtendimentoMedicoInsert = {
  created_by: 0,
  updated_by: 0,
  convenio_id: 0,
  associado_id: 0,
  dependente_id: 0,
  qtd: 0,
  dt_agendado: new Date().toISOString().slice(0, 16),
  situacao: "AGENDADO",
  tipo: "",
  obs: ""
};

function toDateTimeLocal(value: string | null | undefined) {
  return value ? value.slice(0, 16) : new Date().toISOString().slice(0, 16);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(value));
}

export function AtendimentoMedicoPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState<AtendimentoMedicoInsert>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const atendimentosQuery = useQuery({ queryKey: ["atendimento-medico", search], queryFn: () => listAtendimentosMedicos(search) });
  const conveniosQuery = useQuery({ queryKey: ["atendimento-medico-convenios", ""], queryFn: () => listAtendimentoMedicoConvenios("") });
  const associadosQuery = useQuery({ queryKey: ["associados", ""], queryFn: () => listAssociados("") });
  const dependentesQuery = useQuery({
    queryKey: ["atendimento-medico-dependentes", form.associado_id],
    queryFn: () => listDependentesByAssociado(Number(form.associado_id)),
    enabled: Boolean(form.associado_id)
  });

  const atendimentos = atendimentosQuery.data ?? [];
  const convenios = conveniosQuery.data ?? [];
  const associados = associadosQuery.data ?? [];
  const dependentes = dependentesQuery.data ?? [];
  const selected = atendimentos.find((item) => item.id === selectedId) ?? null;
  const formOpen = creatingNew || Boolean(selectedId);

  useEffect(() => {
    if (!selected) {
      setForm(emptyForm);
      return;
    }

    setForm({
      id: selected.id,
      created_by: selected.created_by,
      updated_by: selected.updated_by,
      convenio_id: selected.convenio_id,
      associado_id: selected.associado_id,
      dependente_id: selected.dependente_id,
      qtd: selected.qtd,
      dt_agendado: toDateTimeLocal(selected.dt_agendado),
      situacao: selected.situacao,
      tipo: selected.tipo,
      obs: selected.obs ?? ""
    });
  }, [selected]);

  const saveMutation = useMutation({
    mutationFn: saveAtendimentoMedico,
    onSuccess: async (saved) => {
      setSelectedId(saved.id);
      setCreatingNew(false);
      setMessage("Atendimento salvo com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["atendimento-medico"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o atendimento.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAtendimentoMedico,
    onSuccess: async () => {
      setSelectedId(null);
      setCreatingNew(false);
      setForm(emptyForm);
      setMessage("Atendimento excluido com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["atendimento-medico"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel excluir o atendimento.")
  });

  const totalLabel = useMemo(() => `${atendimentos.length} registro${atendimentos.length === 1 ? "" : "s"}`, [atendimentos.length]);

  function handleNew() {
    setSelectedId(null);
    setCreatingNew(true);
    setMessage(null);
    setForm(emptyForm);
  }

  function handleSelect(item: AtendimentoMedicoLista) {
    setSelectedId(item.id);
    setCreatingNew(false);
    setMessage(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    saveMutation.mutate(form);
  }

  function handleDelete() {
    if (!form.id) return;
    if (!window.confirm("Deseja excluir este atendimento medico?")) return;
    deleteMutation.mutate(form.id);
  }

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Atendimentos" }, { label: "Médico" }]} />
      <section className="module-header">
        <div>
          <h1>Atendimento Médico</h1>
          <p>Agendamentos e atendimentos médicos de associados e dependentes.</p>
        </div>
        <button onClick={handleNew}><Plus size={16} /> Novo</button>
      </section>

      <section className={`split-view ${formOpen ? "" : "list-only"}`}>
        <div className="list-panel">
          <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por tipo, situação ou observação" /></label>
          <div className="list-summary">{totalLabel}</div>
          <div className="record-list">
            {atendimentosQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
            {atendimentos.map((item) => (
              <button key={item.id} className={`record-row simple ${item.id === selectedId ? "selected" : ""}`} onClick={() => handleSelect(item)}>
                <div>
                  <strong>{item.associado?.nome ?? "Sem associado"}</strong>
                  <span>{formatDateTime(item.dt_agendado)} • {item.convenio?.nm_convenio ?? "Sem convênio"} • {item.situacao}</span>
                </div>
              </button>
            ))}
            {!atendimentosQuery.isLoading && atendimentos.length === 0 ? <div className="empty-state">Nenhum atendimento encontrado.</div> : null}
          </div>
        </div>

        {formOpen ? <div className="detail-panel">
          <form className="form-panel" onSubmit={handleSubmit}>
            <div className="form-grid compact">
              <label className="field">
                <select value={form.situacao} onChange={(event) => setForm({ ...form, situacao: event.target.value })} required>
                  <option value="AGENDADO">AGENDADO</option>
                  <option value="ATENDIDO">ATENDIDO</option>
                  <option value="CANCELADO">CANCELADO</option>
                </select>
                <span>Situação</span>
              </label>
              <label className="field"><input type="datetime-local" value={form.dt_agendado} onChange={(event) => setForm({ ...form, dt_agendado: event.target.value })} placeholder=" " required /><span>Agendado</span></label>
              <label className="field"><input type="number" min={0} value={form.qtd} onChange={(event) => setForm({ ...form, qtd: Number(event.target.value) })} placeholder=" " /><span>Qtd</span></label>
            </div>

            <div className="form-grid">
              <label className="field">
                <select value={form.convenio_id} onChange={(event) => setForm({ ...form, convenio_id: Number(event.target.value) })} required>
                  <option value={0}>Selecione</option>
                  {convenios.map((convenio) => <option key={convenio.id} value={convenio.id}>{convenio.nm_convenio}</option>)}
                </select>
                <span>Convênio</span>
              </label>
              <label className="field"><input value={form.tipo} maxLength={30} onChange={(event) => setForm({ ...form, tipo: event.target.value })} placeholder=" " required /><span>Tipo</span></label>
            </div>

            <div className="form-grid">
              <label className="field">
                <select value={form.associado_id} onChange={(event) => setForm({ ...form, associado_id: Number(event.target.value), dependente_id: 0 })} required>
                  <option value={0}>Selecione</option>
                  {associados.map((associado) => <option key={associado.id} value={associado.id}>{associado.nome}{associado.matricula ? ` - ${associado.matricula}` : ""}</option>)}
                </select>
                <span>Associado</span>
              </label>
              <label className="field">
                <select value={form.dependente_id} onChange={(event) => setForm({ ...form, dependente_id: Number(event.target.value) })}>
                  <option value={0}>Sem dependente</option>
                  {dependentes.map((dependente) => <option key={dependente.id} value={dependente.id}>{dependente.nm_dependente}</option>)}
                </select>
                <span>Dependente</span>
              </label>
            </div>

            <label className="field"><textarea rows={3} value={form.obs ?? ""} onChange={(event) => setForm({ ...form, obs: event.target.value })} placeholder=" " /><span>Observação</span></label>

            {message ? <div className={saveMutation.isError || deleteMutation.isError ? "form-error" : "form-success"}>{message}</div> : null}

            <div className="form-actions">
              {form.id ? <button type="button" className="danger-button" onClick={handleDelete} disabled={deleteMutation.isPending}><Trash2 size={16} /> Excluir</button> : null}
              <button type="submit" disabled={saveMutation.isPending}><Save size={16} /> {saveMutation.isPending ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        </div> : null}
      </section>
    </main>
  );
}
