import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Search, Trash2 } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import type { AssociadoDependente, AssociadoDependenteInsert } from "../../types/database";
import { deleteDependente, listAssociadosOptions, listDependentes, saveDependente } from "./dependentesApi";

const emptyForm: AssociadoDependenteInsert = {
  associado_id: 0,
  dt_nascimento: "",
  nm_dependente: "",
  cpf: "",
  sexo: "M",
  estado_civil: "",
  parentesco: "",
  telefone: "",
  obs: ""
};

export function DependentesPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState<AssociadoDependenteInsert>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const dependentesQuery = useQuery({ queryKey: ["associados-dependentes", search], queryFn: () => listDependentes(search) });
  const associadosQuery = useQuery({ queryKey: ["associados-options"], queryFn: listAssociadosOptions });
  const dependentes = dependentesQuery.data ?? [];
  const associados = associadosQuery.data ?? [];
  const selected = dependentes.find((item) => item.id === selectedId) ?? null;
  const formOpen = creatingNew || Boolean(selectedId);
  const associadosPorId = useMemo(() => new Map(associados.map((associado) => [associado.id, associado])), [associados]);

  useEffect(() => {
    if (!selected) {
      setForm(emptyForm);
      return;
    }

    setForm({
      id: selected.id,
      associado_id: selected.associado_id,
      dt_nascimento: selected.dt_nascimento,
      nm_dependente: selected.nm_dependente,
      cpf: selected.cpf ?? "",
      sexo: selected.sexo,
      estado_civil: selected.estado_civil,
      parentesco: selected.parentesco,
      telefone: selected.telefone ?? "",
      obs: selected.obs ?? ""
    });
  }, [selected]);

  const saveMutation = useMutation({
    mutationFn: saveDependente,
    onSuccess: async (saved) => {
      setSelectedId(saved.id);
      setCreatingNew(false);
      setMessage("Dependente salvo com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["associados-dependentes"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Não foi possível salvar o dependente.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDependente,
    onSuccess: async () => {
      setSelectedId(null);
      setCreatingNew(false);
      setForm(emptyForm);
      setMessage("Dependente excluído com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["associados-dependentes"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Não foi possível excluir o dependente.")
  });

  const totalLabel = useMemo(() => `${dependentes.length} registro${dependentes.length === 1 ? "" : "s"}`, [dependentes.length]);

  function handleNew() {
    setSelectedId(null);
    setCreatingNew(true);
    setMessage(null);
    setForm(emptyForm);
  }

  function handleSelect(item: AssociadoDependente) {
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
    if (!window.confirm("Deseja excluir este dependente?")) return;
    deleteMutation.mutate(form.id);
  }

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Cadastros" }, { label: "Dependentes" }]} />
      <section className="module-header">
        <div>
          <h1>Dependentes</h1>
          <p>Cadastro de dependentes vinculados aos associados.</p>
        </div>
        <button onClick={handleNew}><Plus size={16} /> Novo</button>
      </section>

      <section className={`split-view ${formOpen ? "" : "list-only"}`}>
        <div className="list-panel">
          <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, CPF ou parentesco" /></label>
          <div className="list-summary">{totalLabel}</div>
          <div className="record-list">
            {dependentesQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
            {dependentes.map((item) => (
              <button key={item.id} className={`record-row simple ${item.id === selectedId ? "selected" : ""}`} onClick={() => handleSelect(item)}>
                <div>
                  <strong>{item.nm_dependente}</strong>
                  <span>{item.parentesco} - {associadosPorId.get(item.associado_id)?.nome ?? "Sem associado"} - {item.cpf ?? "Sem CPF"}</span>
                </div>
              </button>
            ))}
            {!dependentesQuery.isLoading && dependentes.length === 0 ? <div className="empty-state">Nenhum dependente encontrado.</div> : null}
          </div>
        </div>

        {formOpen ? <div className="detail-panel">
          <form className="form-panel" onSubmit={handleSubmit}>
            <label className="field">
              <select value={form.associado_id} onChange={(event) => setForm({ ...form, associado_id: Number(event.target.value) })} required>
                <option value={0}>Selecione</option>
                {associados.map((associado) => <option key={associado.id} value={associado.id}>{associado.nome}</option>)}
              </select>
              <span>Associado</span>
            </label>

            <div className="form-grid">
              <label className="field"><input value={form.nm_dependente} maxLength={50} onChange={(event) => setForm({ ...form, nm_dependente: event.target.value })} placeholder=" " required /><span>Nome dependente</span></label>
              <label className="field"><input type="date" value={form.dt_nascimento} onChange={(event) => setForm({ ...form, dt_nascimento: event.target.value })} placeholder=" " required /><span>Nascimento</span></label>
            </div>

            <div className="form-grid compact">
              <label className="field"><input value={form.cpf ?? ""} maxLength={11} onChange={(event) => setForm({ ...form, cpf: event.target.value })} placeholder=" " /><span>CPF</span></label>
              <label className="field">
                <select value={form.sexo} onChange={(event) => setForm({ ...form, sexo: event.target.value })}>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                </select>
                <span>Sexo</span>
              </label>
              <label className="field"><input value={form.telefone ?? ""} maxLength={11} onChange={(event) => setForm({ ...form, telefone: event.target.value })} placeholder=" " /><span>Telefone</span></label>
            </div>

            <div className="form-grid">
              <label className="field"><input value={form.estado_civil} maxLength={15} onChange={(event) => setForm({ ...form, estado_civil: event.target.value })} placeholder=" " required /><span>Estado civil</span></label>
              <label className="field"><input value={form.parentesco} maxLength={15} onChange={(event) => setForm({ ...form, parentesco: event.target.value })} placeholder=" " required /><span>Parentesco</span></label>
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
