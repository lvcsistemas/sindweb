import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Search } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import type { AtendimentoMedicoExame, AtendimentoMedicoExameInsert } from "../../types/database";
import { ATENDIMENTO_MEDICO_EXAME_TIPOS, listAtendimentoMedicoExames, saveAtendimentoMedicoExame } from "./atendimentoMedicoExamesApi";

const emptyForm: AtendimentoMedicoExameInsert = {
  tipo: "FEZES/URINA",
  exame: ""
};

export function AtendimentoMedicoExamesPage() {
  const queryClient = useQueryClient();
  const exameRef = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [lastTipo, setLastTipo] = useState(emptyForm.tipo);
  const [form, setForm] = useState<AtendimentoMedicoExameInsert>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const examesQuery = useQuery({ queryKey: ["atendimento-medico-exames", search], queryFn: () => listAtendimentoMedicoExames(search) });
  const exames = examesQuery.data ?? [];
  const selected = exames.find((item) => item.id === selectedId) ?? null;
  const formOpen = creatingNew || Boolean(selectedId);

  useEffect(() => {
    if (!selected) {
      setForm({ ...emptyForm, tipo: lastTipo });
      return;
    }

    setForm({
      id: selected.id,
      tipo: selected.tipo,
      exame: selected.exame
    });
    setLastTipo(selected.tipo);
  }, [selected, lastTipo]);

  useEffect(() => {
    if (formOpen) {
      exameRef.current?.focus();
      exameRef.current?.select();
    }
  }, [formOpen, selectedId, creatingNew]);

  const saveMutation = useMutation({
    mutationFn: saveAtendimentoMedicoExame,
    onSuccess: async (saved) => {
      setLastTipo(saved.tipo);
      setSelectedId(null);
      setCreatingNew(false);
      setSearch(saved.tipo);
      setForm({ ...emptyForm, tipo: saved.tipo });
      setMessage("Exame salvo com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["atendimento-medico-exames"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o exame.")
  });

  const totalLabel = useMemo(() => `${exames.length} registro${exames.length === 1 ? "" : "s"}`, [exames.length]);

  function handleNew() {
    const tipo = form.tipo || lastTipo || emptyForm.tipo;
    setSelectedId(null);
    setCreatingNew(true);
    setMessage(null);
    setForm({ ...emptyForm, tipo });
  }

  function handleSelect(item: AtendimentoMedicoExame) {
    setSelectedId(item.id);
    setCreatingNew(false);
    setMessage(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    saveMutation.mutate({ ...form, exame: form.exame.toUpperCase() });
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
              <select value={form.tipo} onChange={(event) => {
                setLastTipo(event.target.value);
                setForm({ ...form, tipo: event.target.value });
              }}>
                {ATENDIMENTO_MEDICO_EXAME_TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
              <span>Tipo</span>
            </label>
            <label className="field">
              <input ref={exameRef} value={form.exame} maxLength={100} onChange={(event) => setForm({ ...form, exame: event.target.value.toUpperCase() })} placeholder=" " required />
              <span>Exame</span>
            </label>

            {message ? <div className={saveMutation.isError ? "form-error" : "form-success"}>{message}</div> : null}

            <div className="form-actions">
              <button type="submit" disabled={saveMutation.isPending}><Save size={16} /> {saveMutation.isPending ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        </div> : null}
      </section>
    </main>
  );
}
