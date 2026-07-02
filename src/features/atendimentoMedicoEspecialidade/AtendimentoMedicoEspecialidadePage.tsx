import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Search, Trash2 } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import type { AtendimentoMedicoEspecialidade, AtendimentoMedicoEspecialidadeInsert } from "../../types/database";
import {
  ATENDIMENTO_MEDICO_ESPECIALIDADE_TIPOS,
  deleteAtendimentoMedicoEspecialidade,
  listAtendimentoMedicoEspecialidades,
  saveAtendimentoMedicoEspecialidade
} from "./atendimentoMedicoEspecialidadeApi";

const emptyForm: AtendimentoMedicoEspecialidadeInsert = {
  tipo: "ESPECIALIDADE",
  nm_especialidade: ""
};

export function AtendimentoMedicoEspecialidadePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState<AtendimentoMedicoEspecialidadeInsert>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const especialidadesQuery = useQuery({ queryKey: ["atendimento-medico-especialidades", search], queryFn: () => listAtendimentoMedicoEspecialidades(search) });
  const especialidades = especialidadesQuery.data ?? [];
  const selected = especialidades.find((item) => item.id === selectedId) ?? null;
  const formOpen = creatingNew || Boolean(selectedId);

  useEffect(() => {
    if (!selected) {
      setForm(emptyForm);
      return;
    }

    setForm({
      id: selected.id,
      tipo: selected.tipo,
      nm_especialidade: selected.nm_especialidade
    });
  }, [selected]);

  const saveMutation = useMutation({
    mutationFn: saveAtendimentoMedicoEspecialidade,
    onSuccess: async (saved) => {
      setSelectedId(saved.id);
      setCreatingNew(false);
      setMessage("Especialidade salva com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["atendimento-medico-especialidades"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar a especialidade.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAtendimentoMedicoEspecialidade,
    onSuccess: async () => {
      setSelectedId(null);
      setCreatingNew(false);
      setForm(emptyForm);
      setMessage("Especialidade excluida com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["atendimento-medico-especialidades"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel excluir a especialidade.")
  });

  const totalLabel = useMemo(() => `${especialidades.length} registro${especialidades.length === 1 ? "" : "s"}`, [especialidades.length]);

  function handleNew() {
    setSelectedId(null);
    setCreatingNew(true);
    setMessage(null);
    setForm(emptyForm);
  }

  function handleSelect(item: AtendimentoMedicoEspecialidade) {
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
    deleteMutation.mutate(form.id);
  }

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Cadastros" }, { label: "Atendimento Médico Especialidades" }]} />
      <section className="module-header">
        <div>
          <h1>Atendimento Médico Especialidades</h1>
          <p>Tabela auxiliar de tipos e especialidades para atendimento médico.</p>
        </div>
        <button onClick={handleNew}><Plus size={16} /> Novo</button>
      </section>

      <section className={`split-view ${formOpen ? "" : "list-only"}`}>
        <div className="list-panel">
          <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por tipo ou especialidade" /></label>
          <div className="list-summary">{totalLabel}</div>
          <div className="record-list">
            {especialidadesQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
            {especialidades.map((item) => (
              <button key={item.id} className={`record-row simple ${item.id === selectedId ? "selected" : ""}`} onClick={() => handleSelect(item)}>
                <div>
                  <strong>{item.nm_especialidade}</strong>
                  <span>{item.tipo}</span>
                </div>
              </button>
            ))}
            {!especialidadesQuery.isLoading && especialidades.length === 0 ? <div className="empty-state">Nenhuma especialidade encontrada.</div> : null}
          </div>
        </div>

        {formOpen ? <div className="detail-panel">
          <form className="form-panel" onSubmit={handleSubmit}>
            <label className="field">
              <select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })}>
                {ATENDIMENTO_MEDICO_ESPECIALIDADE_TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
              <span>Tipo</span>
            </label>
            <label className="field">
              <input value={form.nm_especialidade} maxLength={50} onChange={(event) => setForm({ ...form, nm_especialidade: event.target.value })} placeholder=" " required />
              <span>Nome da especialidade</span>
            </label>

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
