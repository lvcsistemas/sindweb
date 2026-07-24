import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Search, Trash2 } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import type { ContribuicaoInsert, Contribuicao } from "../../types/database";
import { deleteContribuicao, listContribuicoes, saveContribuicao } from "./contribuicaoApi";

const emptyForm: ContribuicaoInsert = {
  tipo: "",
  nm_contribuicao: "",
  dia_vencimento: 1,
  instrucao: "",
  valor_base: 0
};

export function ContribuicaoPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState<ContribuicaoInsert>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const contribuicoesQuery = useQuery({ queryKey: ["contribuicoes", search], queryFn: () => listContribuicoes(search) });
  const contribuicoes = contribuicoesQuery.data ?? [];
  const selected = contribuicoes.find((item) => item.id === selectedId) ?? null;
  const formOpen = creatingNew || Boolean(selectedId);

  useEffect(() => {
    if (!selected) {
      setForm(emptyForm);
      return;
    }

    setForm({
      id: selected.id,
      tipo: selected.tipo,
      nm_contribuicao: selected.nm_contribuicao,
      dia_vencimento: selected.dia_vencimento,
      instrucao: selected.instrucao ?? "",
      valor_base: selected.valor_base
    });
  }, [selected]);

  const saveMutation = useMutation({
    mutationFn: saveContribuicao,
    onSuccess: async (saved) => {
      setSelectedId(saved.id);
      setCreatingNew(false);
      setMessage("Contribuicao salva com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["contribuicoes"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar a contribuicao.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteContribuicao,
    onSuccess: async () => {
      setSelectedId(null);
      setCreatingNew(false);
      setForm(emptyForm);
      setMessage("Contribuicao excluida com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["contribuicoes"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel excluir a contribuicao.")
  });

  const totalLabel = useMemo(() => `${contribuicoes.length} registro${contribuicoes.length === 1 ? "" : "s"}`, [contribuicoes.length]);

  function handleNew() {
    setSelectedId(null);
    setCreatingNew(true);
    setMessage(null);
    setForm(emptyForm);
  }

  function handleSelect(item: Contribuicao) {
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
    if (!window.confirm("Deseja excluir esta contribuição?")) return;
    deleteMutation.mutate(form.id);
  }

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Cadastros" }, { label: "Contribuições" }]} />
      <section className="module-header">
        <div>
          <h1>Contribuições</h1>
          <p>Tabela auxiliar para tipos de contribuição e valores base.</p>
        </div>
        <button onClick={handleNew}><Plus size={16} /> Novo</button>
      </section>

      <section className={`split-view ${formOpen ? "" : "list-only"}`}>
        <div className="list-panel">
          <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por tipo ou nome" /></label>
          <div className="list-summary">{totalLabel}</div>
          <div className="record-list">
            {contribuicoesQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
            {contribuicoes.map((item) => (
              <button key={item.id} className={`record-row simple ${item.id === selectedId ? "selected" : ""}`} onClick={() => handleSelect(item)}>
                <div>
                  <strong>{item.tipo} - {item.nm_contribuicao}</strong>
                  <span>Dia {item.dia_vencimento} · R$ {Number(item.valor_base).toFixed(2)}</span>
                </div>
              </button>
            ))}
            {!contribuicoesQuery.isLoading && contribuicoes.length === 0 ? <div className="empty-state">Nenhuma contribuição encontrada.</div> : null}
          </div>
        </div>

        {formOpen ? <div className="detail-panel">
          <form className="form-panel" onSubmit={handleSubmit}>
            <div className="form-grid compact">
              <label className="field">
                <input value={form.tipo} maxLength={3} onChange={(event) => setForm({ ...form, tipo: event.target.value.toUpperCase() })} placeholder=" " required />
                <span>Tipo</span>
              </label>
              <label className="field">
                <input type="number" min={1} max={31} value={form.dia_vencimento} onChange={(event) => setForm({ ...form, dia_vencimento: Number(event.target.value) })} placeholder=" " required />
                <span>Dia vencimento</span>
              </label>
              <label className="field">
                <input type="number" min={0} step="0.01" value={form.valor_base} onChange={(event) => setForm({ ...form, valor_base: Number(event.target.value) })} placeholder=" " required />
                <span>Valor base</span>
              </label>
            </div>
            <label className="field">
              <input value={form.nm_contribuicao} maxLength={50} onChange={(event) => setForm({ ...form, nm_contribuicao: event.target.value })} placeholder=" " required />
              <span>Nome da contribuição</span>
            </label>
            <label className="field">
              <input value={form.instrucao ?? ""} maxLength={100} onChange={(event) => setForm({ ...form, instrucao: event.target.value })} placeholder=" " />
              <span>Instrução</span>
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
