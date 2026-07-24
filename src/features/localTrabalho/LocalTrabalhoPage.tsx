import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Search, Trash2 } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import type { LocalTrabalho, LocalTrabalhoInsert } from "../../types/database";
import { deleteLocalTrabalho, listLocaisTrabalho, saveLocalTrabalho } from "./localTrabalhoApi";

const emptyForm: LocalTrabalhoInsert = {
  nome: "",
  email: "",
  tel1: "",
  tel2: "",
  nm_contato: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "RJ",
  cep: "",
  obs: ""
};

export function LocalTrabalhoPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState<LocalTrabalhoInsert>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const locaisQuery = useQuery({ queryKey: ["locais-trabalho", search], queryFn: () => listLocaisTrabalho(search) });
  const locais = locaisQuery.data ?? [];
  const selected = locais.find((item) => item.id === selectedId) ?? null;
  const formOpen = creatingNew || Boolean(selectedId);

  useEffect(() => {
    if (!selected) {
      setForm(emptyForm);
      return;
    }

    setForm({
      id: selected.id,
      nome: selected.nome,
      email: selected.email ?? "",
      tel1: selected.tel1 ?? "",
      tel2: selected.tel2 ?? "",
      nm_contato: selected.nm_contato ?? "",
      endereco: selected.endereco ?? "",
      numero: selected.numero ?? "",
      complemento: selected.complemento ?? "",
      bairro: selected.bairro ?? "",
      cidade: selected.cidade ?? "",
      uf: selected.uf,
      cep: selected.cep ?? "",
      obs: selected.obs ?? ""
    });
  }, [selected]);

  const saveMutation = useMutation({
    mutationFn: saveLocalTrabalho,
    onSuccess: async (saved) => {
      setSelectedId(saved.id);
      setCreatingNew(false);
      setMessage("Local de trabalho salvo com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["locais-trabalho"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Não foi possível salvar o local de trabalho.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteLocalTrabalho,
    onSuccess: async () => {
      setSelectedId(null);
      setCreatingNew(false);
      setForm(emptyForm);
      setMessage("Local de trabalho excluído com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["locais-trabalho"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Não foi possível excluir o local de trabalho.")
  });

  const totalLabel = useMemo(() => `${locais.length} registro${locais.length === 1 ? "" : "s"}`, [locais.length]);

  function handleNew() {
    setSelectedId(null);
    setCreatingNew(true);
    setMessage(null);
    setForm(emptyForm);
  }

  function handleSelect(item: LocalTrabalho) {
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
    if (!window.confirm("Deseja excluir este local de trabalho?")) return;
    deleteMutation.mutate(form.id);
  }

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Cadastros" }, { label: "Local de Trabalho" }]} />
      <section className="module-header">
        <div>
          <h1>Local de Trabalho</h1>
          <p>Cadastro de locais de trabalho, contatos e endereços.</p>
        </div>
        <button onClick={handleNew}><Plus size={16} /> Novo</button>
      </section>

      <section className={`split-view ${formOpen ? "" : "list-only"}`}>
        <div className="list-panel">
          <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, e-mail, contato ou cidade" /></label>
          <div className="list-summary">{totalLabel}</div>
          <div className="record-list">
            {locaisQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
            {locais.map((item) => (
              <button key={item.id} className={`record-row simple ${item.id === selectedId ? "selected" : ""}`} onClick={() => handleSelect(item)}>
                <div>
                  <strong>{item.nome}</strong>
                  <span>{item.cidade ?? "Sem cidade"} - {item.nm_contato ?? "Sem contato"} - {item.tel1 ?? "Sem telefone"}</span>
                </div>
              </button>
            ))}
            {!locaisQuery.isLoading && locais.length === 0 ? <div className="empty-state">Nenhum local de trabalho encontrado.</div> : null}
          </div>
        </div>

        {formOpen ? <div className="detail-panel">
          <form className="form-panel" onSubmit={handleSubmit}>
            <label className="field">
              <input value={form.nome} maxLength={50} onChange={(event) => setForm({ ...form, nome: event.target.value })} placeholder=" " required />
              <span>Nome</span>
            </label>

            <div className="form-grid compact">
              <label className="field"><input type="email" value={form.email ?? ""} maxLength={100} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder=" " /><span>E-mail</span></label>
              <label className="field"><input value={form.tel1 ?? ""} maxLength={11} onChange={(event) => setForm({ ...form, tel1: event.target.value })} placeholder=" " /><span>Telefone 1</span></label>
              <label className="field"><input value={form.tel2 ?? ""} maxLength={11} onChange={(event) => setForm({ ...form, tel2: event.target.value })} placeholder=" " /><span>Telefone 2</span></label>
            </div>

            <label className="field"><input value={form.nm_contato ?? ""} maxLength={50} onChange={(event) => setForm({ ...form, nm_contato: event.target.value })} placeholder=" " /><span>Contato</span></label>

            <div className="form-grid compact">
              <label className="field"><input value={form.endereco ?? ""} maxLength={50} onChange={(event) => setForm({ ...form, endereco: event.target.value })} placeholder=" " /><span>Endereço</span></label>
              <label className="field"><input value={form.numero ?? ""} maxLength={15} onChange={(event) => setForm({ ...form, numero: event.target.value })} placeholder=" " /><span>Número</span></label>
              <label className="field"><input value={form.complemento ?? ""} maxLength={30} onChange={(event) => setForm({ ...form, complemento: event.target.value })} placeholder=" " /><span>Complemento</span></label>
            </div>

            <div className="form-grid compact">
              <label className="field"><input value={form.bairro ?? ""} maxLength={30} onChange={(event) => setForm({ ...form, bairro: event.target.value })} placeholder=" " /><span>Bairro</span></label>
              <label className="field"><input value={form.cidade ?? ""} maxLength={30} onChange={(event) => setForm({ ...form, cidade: event.target.value })} placeholder=" " /><span>Cidade</span></label>
              <label className="field"><input value={form.uf} maxLength={2} onChange={(event) => setForm({ ...form, uf: event.target.value.toUpperCase() })} placeholder=" " /><span>UF</span></label>
            </div>

            <label className="field"><input value={form.cep ?? ""} maxLength={10} onChange={(event) => setForm({ ...form, cep: event.target.value })} placeholder=" " /><span>CEP</span></label>
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
