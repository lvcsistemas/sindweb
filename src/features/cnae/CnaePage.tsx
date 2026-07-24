import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Search, Trash2 } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import type { Cnae, CnaeInsert } from "../../types/database";
import { deleteCnae, listCnaes, saveCnae } from "./cnaeApi";

const emptyForm: CnaeInsert = {
  codigo_cnae: "",
  descricao: ""
};

export function CnaePage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState<CnaeInsert>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const cnaesQuery = useQuery({ queryKey: ["cnaes", search], queryFn: () => listCnaes(search) });
  const cnaes = cnaesQuery.data ?? [];
  const selected = cnaes.find((item) => item.id === selectedId) ?? null;
  const formOpen = creatingNew || Boolean(selectedId);

  useEffect(() => {
    if (!selected) {
      setForm(emptyForm);
      return;
    }

    setForm({
      id: selected.id,
      codigo_cnae: selected.codigo_cnae,
      descricao: selected.descricao
    });
  }, [selected]);

  const saveMutation = useMutation({
    mutationFn: saveCnae,
    onSuccess: async (saved) => {
      setSelectedId(saved.id);
      setCreatingNew(false);
      setMessage("CNAE salvo com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["cnaes"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o CNAE.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCnae,
    onSuccess: async () => {
      setSelectedId(null);
      setCreatingNew(false);
      setForm(emptyForm);
      setMessage("CNAE excluido com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["cnaes"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel excluir o CNAE.")
  });

  const totalLabel = useMemo(() => `${cnaes.length} registro${cnaes.length === 1 ? "" : "s"}`, [cnaes.length]);

  function handleNew() {
    setSelectedId(null);
    setCreatingNew(true);
    setMessage(null);
    setForm(emptyForm);
  }

  function handleSelect(item: Cnae) {
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
    if (!window.confirm("Deseja excluir este CNAE?")) return;
    deleteMutation.mutate(form.id);
  }

  function handleDeleteFromList(id: number, nome: string) {
    if (!window.confirm(`Deseja excluir "${nome}"?`)) return;
    deleteMutation.mutate(id);
  }

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Cadastros" }, { label: "CNAE" }]} />
      <section className="module-header">
        <div>
          <h1>CNAE</h1>
          <p>Cadastro auxiliar de códigos CNAE e descrições.</p>
        </div>
        <button onClick={handleNew}><Plus size={16} /> Novo</button>
      </section>

      <section className={`split-view ${formOpen ? "" : "list-only"}`}>
        <div className="list-panel">
          <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por código ou descrição" /></label>
          <div className="list-summary">{totalLabel}</div>
          <div className="record-list">
            {cnaesQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
            {cnaes.map((item) => (
              <div key={item.id} 
                className={`record-row my-action ${item.id === selectedId ? "selected" : ""}`} 
                onClick={() => handleSelect(item)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    handleSelect(item);
                  }
                }}>
                <div>
                  <strong>{item.codigo_cnae}</strong>
                  <span>{item.descricao}</span>
                </div>
                <button className="icon-button danger-icon" 
                  title="Excluir" 
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteFromList(item.id, item.codigo_cnae);
                  }}
                  disabled={deleteMutation.isPending}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {!cnaesQuery.isLoading && cnaes.length === 0 ? <div className="empty-state">Nenhum CNAE encontrado.</div> : null}
          </div>
        </div>

        {formOpen ? <div className="detail-panel">
          <form className="form-panel" onSubmit={handleSubmit}>
            <label className="field">
              <input value={form.codigo_cnae} maxLength={20} onChange={(event) => setForm({ ...form, codigo_cnae: event.target.value })} placeholder=" " required />
              <span>Código CNAE</span>
            </label>
            <label className="field">
              <input value={form.descricao} maxLength={150} onChange={(event) => setForm({ ...form, descricao: event.target.value })} placeholder=" " required />
              <span>Descrição</span>
            </label>

            {message ? <div className={saveMutation.isError || deleteMutation.isError ? "form-error" : "form-success"}>{message}</div> : null}

            <div className="form-actions">
              <button type="submit" disabled={saveMutation.isPending}><Save size={16} /> {saveMutation.isPending ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        </div> : null}
      </section>
    </main>
  );
}
