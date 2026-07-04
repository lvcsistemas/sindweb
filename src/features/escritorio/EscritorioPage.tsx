import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Search, Trash2 } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import type { Escritorio, EscritorioInsert } from "../../types/database";
import { deleteEscritorio, listEscritorios, saveEscritorio } from "./escritorioApi";

const emptyForm: EscritorioInsert = {
  razao_social: "",
  nm_fantasia: "",
  cpf_cnpj: "",
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

function onlyDigits(value: string | null | undefined) {
  return value?.replace(/\D/g, "") ?? "";
}

function formatCpfCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

export function EscritorioPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState<EscritorioInsert>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const escritoriosQuery = useQuery({ queryKey: ["escritorios", search], queryFn: () => listEscritorios(search) });
  const escritorios = escritoriosQuery.data ?? [];
  const selected = escritorios.find((item) => item.id === selectedId) ?? null;
  const formOpen = creatingNew || Boolean(selectedId);

  useEffect(() => {
    if (!selected) {
      setForm(emptyForm);
      return;
    }

    setForm({
      id: selected.id,
      razao_social: selected.razao_social,
      nm_fantasia: selected.nm_fantasia,
      cpf_cnpj: formatCpfCnpj(selected.cpf_cnpj),
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
    mutationFn: saveEscritorio,
    onSuccess: async (saved) => {
      setSelectedId(saved.id);
      setCreatingNew(false);
      setMessage("Escritório salvo com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["escritorios"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Não foi possível salvar o escritório.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEscritorio,
    onSuccess: async () => {
      setSelectedId(null);
      setCreatingNew(false);
      setForm(emptyForm);
      setMessage("Escritório excluído com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["escritorios"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Não foi possível excluir o escritório.")
  });

  const totalLabel = useMemo(() => `${escritorios.length} registro${escritorios.length === 1 ? "" : "s"}`, [escritorios.length]);

  function handleNew() {
    setSelectedId(null);
    setCreatingNew(true);
    setMessage(null);
    setForm(emptyForm);
  }

  function handleSelect(item: Escritorio) {
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

  function handleDeleteFromList(id: number, nome: string) {
    if (!window.confirm(`Deseja excluir "${nome}"?`)) return;
    deleteMutation.mutate(id);
  }

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Cadastros" }, { label: "Escritórios" }]} />
      <section className="module-header">
        <div>
          <h1>Escritórios</h1>
          <p>Cadastro de escritórios, contatos e endereços vinculados a empresas.</p>
        </div>
        <button onClick={handleNew}><Plus size={16} /> Novo</button>
      </section>

      <section className={`split-view ${formOpen ? "" : "list-only"}`}>
        <div className="list-panel">
          <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por razão, fantasia, documento ou contato" /></label>
          <div className="list-summary">{totalLabel}</div>
          <div className="record-list">
            {escritoriosQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
            {escritorios.map((item) => (
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
                  <strong>{item.razao_social}</strong>
                  <span>{formatCpfCnpj(item.cpf_cnpj)} - {item.cidade ?? "Sem cidade"} - {item.nm_contato ?? "Sem contato"}</span>
                </div>
                <button className="icon-button danger-icon" 
                  title="Excluir" 
                  onClick={(event) => {
                    event.stopPropagation();
                    handleDeleteFromList(item.id, item.razao_social);
                  }}
                  disabled={deleteMutation.isPending}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
            {!escritoriosQuery.isLoading && escritorios.length === 0 ? <div className="empty-state">Nenhum escritório encontrado.</div> : null}
          </div>
        </div>

        {formOpen ? <div className="detail-panel">
          <form className="form-panel" onSubmit={handleSubmit}>
            <label className="field">
              <input value={form.cpf_cnpj} maxLength={18} onChange={(event) => setForm({ ...form, cpf_cnpj: formatCpfCnpj(event.target.value) })} placeholder=" " required />
              <span>CPF/CNPJ</span>
            </label>

            <div className="form-grid">
              <label className="field">
                <input value={form.razao_social} maxLength={100} onChange={(event) => setForm({ ...form, razao_social: event.target.value })} placeholder=" " required />
                <span>Razão social</span>
              </label>
              <label className="field">
                <input value={form.nm_fantasia} maxLength={50} onChange={(event) => setForm({ ...form, nm_fantasia: event.target.value })} placeholder=" " required />
                <span>Nome fantasia</span>
              </label>
            </div>

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
              <button type="submit" disabled={saveMutation.isPending}><Save size={16} /> {saveMutation.isPending ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        </div> : null}
      </section>
    </main>
  );
}
