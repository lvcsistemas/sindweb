import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Search, Trash2 } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import type { AtendimentoMedicoExame, AtendimentoMedicoExameInsert } from "../../types/database";
import { ATENDIMENTO_MEDICO_EXAME_TIPOS, deleteAtendimentoMedicoExame, listAtendimentoMedicoExames, saveAtendimentoMedicoExame } from "./atendimentoMedicoExamesApi";

const emptyForm: AtendimentoMedicoExameInsert = {
  tipo: "FEZES/URINA",
  exame: ""
};

export function AtendimentoMedicoExamesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState<AtendimentoMedicoExameInsert>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const examesQuery = useQuery({ queryKey: ["atendimento-medico-exames", search], queryFn: () => listAtendimentoMedicoExames(search) });
  const exames = examesQuery.data ?? [];
  const selected = exames.find((item) => item.id === selectedId) ?? null;
  const formOpen = creatingNew || Boolean(selectedId);

  useEffect(() => {
    if (!selected) {
      setForm(emptyForm);
      return;
    }

    setForm({
      id: selected.id,
      tipo: selected.tipo,
      exame: selected.exame
    });
  }, [selected]);

  const saveMutation = useMutation({
    mutationFn: saveAtendimentoMedicoExame,
    onSuccess: async (saved) => {
      setSelectedId(saved.id);
      setCreatingNew(false);
      setMessage("Exame salvo com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["atendimento-medico-exames"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o exame.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAtendimentoMedicoExame,
    onSuccess: async () => {
      setSelectedId(null);
      setCreatingNew(false);
      setForm(emptyForm);
      setMessage("Exame excluido com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["atendimento-medico-exames"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel excluir o exame.")
  });

  const totalLabel = useMemo(() => `${exames.length} registro${exames.length === 1 ? "" : "s"}`, [exames.length]);

  function handleNew() {
    setSelectedId(null);
    setCreatingNew(true);
    setMessage(null);
    setForm(emptyForm);
  }

  function handleSelect(item: AtendimentoMedicoExame) {
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
    if (!window.confirm(`Deseja excluir "${form.exame}"?`)) return;
    deleteMutation.mutate(form.id);
  }

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Cadastros" }, { label: "Atendimento Medico Exames" }]} />
      <section className="module-header">
        <div>
          <h1>Atendimento Medico Exames</h1>
          <p>Cadastro de exames utilizados no atendimento medico.</p>
        </div>
        <button onClick={handleNew}><Plus size={16} /> Novo</button>
      </section>

      <section className={`split-view ${formOpen ? "" : "list-only"}`}>
        <div className="list-panel">
          <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por tipo ou exame" /></label>
          <div className="list-summary">{totalLabel}</div>
          <div className="record-list">
            {examesQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
            {exames.map((item) => (
              <button key={item.id} className={`record-row simple ${item.id === selectedId ? "selected" : ""}`} onClick={() => handleSelect(item)}>
                <div>
                  <strong>{item.exame}</strong>
                  <span>{item.tipo}</span>
                </div>
              </button>
            ))}
            {!examesQuery.isLoading && exames.length === 0 ? <div className="empty-state">Nenhum exame encontrado.</div> : null}
          </div>
        </div>

        {formOpen ? <div className="detail-panel">
          <form className="form-panel" onSubmit={handleSubmit}>
            <label className="field">
              <select value={form.tipo} onChange={(event) => setForm({ ...form, tipo: event.target.value })}>
                {ATENDIMENTO_MEDICO_EXAME_TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
              <span>Tipo</span>
            </label>
            <label className="field">
              <input value={form.exame} maxLength={100} onChange={(event) => setForm({ ...form, exame: event.target.value })} placeholder=" " required />
              <span>Exame</span>
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
