import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Search, Trash2 } from "lucide-react";
import type { AssociadoDependente, AssociadoDependenteInsert, AssociadoLista } from "../../types/database";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { deleteDependente, listDependentesByAssociado, saveDependente } from "../dependentes/dependentesApi";
import { getAssociado, getFotoUrl, listAssociados } from "./associadosApi";
import { AssociadoForm } from "./AssociadoForm";

type AssociadoTab = "cadastro" | "dependentes";

const emptyDependenteForm: AssociadoDependenteInsert = {
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

export function AssociadosPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<AssociadoTab>("cadastro");
  const associadosQuery = useQuery({ queryKey: ["associados", search], queryFn: () => listAssociados(search) });
  const associadoQuery = useQuery({ queryKey: ["associado", selectedId], queryFn: () => getAssociado(selectedId!), enabled: Boolean(selectedId) });

  const associados = associadosQuery.data ?? [];

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Cadastros" }, { label: "Associados" }]} />
      <section className="module-header">
        <div>
          <h1>Associados</h1>
          <p>Cadastro inicial migrado do LSIND desktop.</p>
        </div>
        <button onClick={() => { setSelectedId(null); setActiveTab("cadastro"); }}><Plus size={16} /> Novo</button>
      </section>

      <section className="split-view">
        <div className="list-panel">
          <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, CPF ou matrícula" /></label>
          <div className="record-list">
            {associadosQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
            {associados.map((associado) => (
              <AssociadoRow key={associado.id} associado={associado} selected={associado.id === selectedId} onClick={() => { setSelectedId(associado.id); setActiveTab("cadastro"); }} />
            ))}
            {!associadosQuery.isLoading && associados.length === 0 ? <div className="empty-state">Nenhum associado encontrado.</div> : null}
          </div>
        </div>

        <div className="detail-panel">
          <div className="form-panel detail-tabs">
            <div className="tabs" role="tablist" aria-label="Associado">
              <button type="button" className={activeTab === "cadastro" ? "active" : ""} onClick={() => setActiveTab("cadastro")}>Cadastro</button>
              <button type="button" className={activeTab === "dependentes" ? "active" : ""} onClick={() => setActiveTab("dependentes")}>Dependentes</button>
            </div>
          </div>
          {activeTab === "cadastro" ? <>
            {associadoQuery.isFetching ? <div className="empty-state">Abrindo cadastro...</div> : null}
            <AssociadoForm associado={associadoQuery.data ?? null} onSaved={(id) => setSelectedId(id)} />
          </> : null}
          {activeTab === "dependentes" ? <AssociadoDependentesTab associadoId={selectedId} /> : null}
        </div>
      </section>
    </main>
  );
}

function AssociadoDependentesTab({ associadoId }: { associadoId: number | null }) {
  const queryClient = useQueryClient();
  const [selectedDependenteId, setSelectedDependenteId] = useState<number | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState<AssociadoDependenteInsert>(emptyDependenteForm);
  const [message, setMessage] = useState<string | null>(null);

  const dependentesQuery = useQuery({
    queryKey: ["associado-dependentes", associadoId],
    queryFn: () => listDependentesByAssociado(associadoId ?? 0),
    enabled: Boolean(associadoId)
  });
  const dependentes = dependentesQuery.data ?? [];
  const selected = dependentes.find((item) => item.id === selectedDependenteId) ?? null;
  const formOpen = creatingNew || Boolean(selectedDependenteId);

  useEffect(() => {
    if (!associadoId) {
      setForm(emptyDependenteForm);
      setSelectedDependenteId(null);
      setCreatingNew(false);
      return;
    }

    if (!selected) {
      setForm({ ...emptyDependenteForm, associado_id: associadoId });
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
  }, [associadoId, selected]);

  const saveMutation = useMutation({
    mutationFn: saveDependente,
    onSuccess: async (saved) => {
      setSelectedDependenteId(saved.id);
      setCreatingNew(false);
      setMessage("Dependente salvo com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["associado-dependentes", associadoId] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o dependente.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDependente,
    onSuccess: async () => {
      setSelectedDependenteId(null);
      setCreatingNew(false);
      setForm(associadoId ? { ...emptyDependenteForm, associado_id: associadoId } : emptyDependenteForm);
      setMessage("Dependente excluido com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["associado-dependentes", associadoId] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel excluir o dependente.")
  });

  function handleNew() {
    if (!associadoId) return;
    setSelectedDependenteId(null);
    setCreatingNew(true);
    setMessage(null);
    setForm({ ...emptyDependenteForm, associado_id: associadoId });
  }

  function handleSelect(item: AssociadoDependente) {
    setSelectedDependenteId(item.id);
    setCreatingNew(false);
    setMessage(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!associadoId) return;
    setMessage(null);
    saveMutation.mutate({ ...form, associado_id: associadoId });
  }

  function handleDelete() {
    if (!form.id) return;
    deleteMutation.mutate(form.id);
  }

  if (!associadoId) {
    return <div className="form-panel"><div className="empty-state tab-empty">Salve ou selecione um associado antes de cadastrar dependentes.</div></div>;
  }

  return (
    <div className="form-panel">
      <div className="related-toolbar">
        <div className="list-summary">{dependentes.length} registro{dependentes.length === 1 ? "" : "s"}</div>
        <button type="button" onClick={handleNew}><Plus size={16} /> Novo</button>
      </div>

      <div className="data-table-wrap">
        <table className="data-table clickable-rows">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Parentesco</th>
              <th>Nascimento</th>
              <th>CPF</th>
              <th>Telefone</th>
            </tr>
          </thead>
          <tbody>
            {dependentes.map((item) => (
              <tr key={item.id} onClick={() => handleSelect(item)}>
                <td>{item.nm_dependente}</td>
                <td>{item.parentesco}</td>
                <td>{item.dt_nascimento}</td>
                <td>{item.cpf ?? "-"}</td>
                <td>{item.telefone ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {dependentesQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
        {!dependentesQuery.isLoading && dependentes.length === 0 ? <div className="empty-state">Nenhum dependente vinculado.</div> : null}
      </div>

      {formOpen ? <form className="related-form" onSubmit={handleSubmit}>
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

        <label className="field"><textarea rows={3} value={form.obs ?? ""} onChange={(event) => setForm({ ...form, obs: event.target.value })} placeholder=" " /><span>Observacao</span></label>

        {message ? <div className={saveMutation.isError || deleteMutation.isError ? "form-error" : "form-success"}>{message}</div> : null}

        <div className="form-actions">
          {form.id ? <button type="button" className="danger-button" onClick={handleDelete} disabled={deleteMutation.isPending}><Trash2 size={16} /> Excluir</button> : null}
          <button type="submit" disabled={saveMutation.isPending}><Save size={16} /> {saveMutation.isPending ? "Salvando..." : "Salvar"}</button>
        </div>
      </form> : null}
    </div>
  );
}

function AssociadoRow({ associado, selected, onClick }: { associado: AssociadoLista; selected: boolean; onClick: () => void }) {
  const fotoUrl = getFotoUrl(associado.foto_path);
  return (
    <button className={`record-row ${selected ? "selected" : ""}`} onClick={onClick}>
      <div className="avatar">{fotoUrl ? <img src={fotoUrl} alt="" /> : associado.nome.slice(0, 1)}</div>
      <div>
        <strong>{associado.nome}</strong>
        <span>{associado.matricula ?? "Sem matrícula"} · {associado.empresa_nome ?? "Sem empresa"}</span>
      </div>
      <small className={associado.ativo ? "status-ok" : "status-muted"}>{associado.ativo ? "Ativo" : "Inativo"}</small>
    </button>
  );
}
