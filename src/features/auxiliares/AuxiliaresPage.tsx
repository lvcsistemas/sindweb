import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Search, Trash2 } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import type { Auxiliar, AuxiliarInsert } from "../../types/database";
import { deleteAuxiliar, listAuxiliares, saveAuxiliar } from "./auxiliaresApi";
import { getAuxiliarGrupoByPath } from "./auxiliaresConfig";

function emptyForm(grupo: string): AuxiliarInsert {
  return {
    grupo,
    nome: "",
    ativo: "S",
    ordem: 0
  };
}

export function AuxiliaresPage() {
  const { grupoPath } = useParams();
  const grupoConfig = getAuxiliarGrupoByPath(grupoPath);
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState<AuxiliarInsert>(() => emptyForm(grupoConfig?.key ?? ""));
  const [message, setMessage] = useState<string | null>(null);
  const nomeRef = useRef<HTMLInputElement>(null);
  const novoBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (creatingNew) {
      nomeRef.current?.focus();
    }
  }, [creatingNew]);

  useEffect(() => {
    if (!grupoConfig) return;
    setSelectedId(null);
    setCreatingNew(false);
    setMessage(null);
    setForm(emptyForm(grupoConfig.key));
  }, [grupoConfig]);

  const auxiliaresQuery = useQuery({
    queryKey: ["auxiliares", grupoConfig?.key, search],
    queryFn: () => listAuxiliares(grupoConfig!.key, search),
    enabled: Boolean(grupoConfig)
  });

  const auxiliares = auxiliaresQuery.data ?? [];
  const selected = auxiliares.find((item) => item.id === selectedId) ?? null;
  const formOpen = creatingNew || Boolean(selectedId);

  useEffect(() => {
    if (!grupoConfig) return;
    if (!selected) {
      setForm(emptyForm(grupoConfig.key));
      return;
    }

    setForm({
      id: selected.id,
      grupo: selected.grupo,
      nome: selected.nome,
      ativo: selected.ativo,
      ordem: selected.ordem
    });
  }, [selected, grupoConfig]);

  const saveMutation = useMutation({
    mutationFn: saveAuxiliar,
    onSuccess: async (saved) => {
      setSelectedId(saved.id);
      setCreatingNew(false);
      setMessage("Auxiliar salvo com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["auxiliares", grupoConfig?.key] });
      novoBtnRef.current?.focus();
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Não foi possível salvar o auxiliar.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAuxiliar,
    onSuccess: async () => {
      setSelectedId(null);
      setCreatingNew(false);
      setForm(emptyForm(grupoConfig!.key));
      setMessage("Auxiliar excluído com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["auxiliares", grupoConfig?.key] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Não foi possível excluir o auxiliar.")
  });

  const totalLabel = useMemo(() => `${auxiliares.length} registro${auxiliares.length === 1 ? "" : "s"}`, [auxiliares.length]);

  if (!grupoConfig) {
    return <Navigate to="/" replace />;
  }

  function handleNew() {
    setSelectedId(null);
    setCreatingNew(true);
    setMessage(null);
    setForm(emptyForm(grupoConfig!.key));
  }

  function handleSelect(item: Auxiliar) {
    setSelectedId(item.id);
    setCreatingNew(false);
    setMessage(null);
  }

  function handleDeleteFromList(id: number, nome: string) {
    if (!window.confirm(`Deseja excluir "${nome}"?`)) return;
    deleteMutation.mutate(id);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    saveMutation.mutate({ ...form, grupo: grupoConfig!.key });
  }

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Auxiliares" }, { label: grupoConfig.label }]} />
      <section className="module-header">
        <div>
          <h1>{grupoConfig.label}</h1>
          <p>Cadastro auxiliar para carregar seleções do sistema.</p>
        </div>
        <button ref={novoBtnRef} onClick={handleNew}><Plus size={16} /> Novo</button>
      </section>

      <section className={`split-view ${formOpen ? "" : "list-only"}`}>
        <div className="list-panel">
          <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome" /></label>
          <div className="list-summary">{totalLabel}</div>
          <div className="record-list">
            {auxiliaresQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
            {auxiliares.map((item) => (
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
                  <strong>{item.nome}</strong>
                  <span>Ordem {item.ordem} · {item.ativo === "S" ? "Ativo" : "Inativo"}</span>
                </div>
                <button className="icon-button danger-icon" 
                  title="Excluir" 
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteFromList(item.id, item.nome);
                  }}
                  disabled={deleteMutation.isPending}>
                  <Trash2 size={16} />
                </button>
              </div>

            ))}
            {!auxiliaresQuery.isLoading && auxiliares.length === 0 ? <div className="empty-state">Nenhum auxiliar encontrado.</div> : null}
          </div>
        </div>

        {formOpen ? <div className="detail-panel">
          <form className="form-panel" onSubmit={handleSubmit}>
            <div className="form-grid compact">
              <label className="field">
                <select value={form.ativo} onChange={(event) => setForm({ ...form, ativo: event.target.value })}>
                  <option value="S">Ativo</option>
                  <option value="N">Inativo</option>
                </select>
                <span>Status</span>
              </label>
              <label className="field">
                <input type="number" value={form.ordem} onChange={(event) => setForm({ ...form, ordem: Number(event.target.value) })} placeholder=" " />
                <span>Ordem</span>
              </label>
            </div>
            <label className="field">
              <input ref={nomeRef} value={form.nome} maxLength={100} onChange={(event) => setForm({ ...form, nome: event.target.value })} placeholder=" " required />
              <span>Nome</span>
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
