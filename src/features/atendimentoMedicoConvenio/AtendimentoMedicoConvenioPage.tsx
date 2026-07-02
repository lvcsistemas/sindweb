import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Search, Trash2 } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import type { AtendimentoMedicoConvenio, AtendimentoMedicoConvenioInsert } from "../../types/database";
import { deleteAtendimentoMedicoConvenio, listAtendimentoMedicoConvenios, saveAtendimentoMedicoConvenio } from "./atendimentoMedicoConvenioApi";

const emptyForm: AtendimentoMedicoConvenioInsert = {
  ativo: "S",
  tipo_pessoa: "J",
  nm_convenio: "",
  nm_responsavel: "",
  cpf_cnpj: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "RJ",
  cep: "",
  tel1: "",
  tel2: "",
  tel3: "",
  obs: ""
};

export function AtendimentoMedicoConvenioPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState<AtendimentoMedicoConvenioInsert>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const conveniosQuery = useQuery({ queryKey: ["atendimento-medico-convenios", search], queryFn: () => listAtendimentoMedicoConvenios(search) });
  const convenios = conveniosQuery.data ?? [];
  const selected = convenios.find((item) => item.id === selectedId) ?? null;
  const formOpen = creatingNew || Boolean(selectedId);

  useEffect(() => {
    if (!selected) {
      setForm(emptyForm);
      return;
    }

    setForm({
      id: selected.id,
      ativo: selected.ativo,
      tipo_pessoa: selected.tipo_pessoa,
      nm_convenio: selected.nm_convenio,
      nm_responsavel: selected.nm_responsavel ?? "",
      cpf_cnpj: selected.cpf_cnpj,
      endereco: selected.endereco ?? "",
      numero: selected.numero ?? "",
      complemento: selected.complemento ?? "",
      bairro: selected.bairro ?? "",
      cidade: selected.cidade ?? "",
      uf: selected.uf,
      cep: selected.cep ?? "",
      tel1: selected.tel1 ?? "",
      tel2: selected.tel2 ?? "",
      tel3: selected.tel3 ?? "",
      obs: selected.obs ?? ""
    });
  }, [selected]);

  const saveMutation = useMutation({
    mutationFn: saveAtendimentoMedicoConvenio,
    onSuccess: async (saved) => {
      setSelectedId(saved.id);
      setCreatingNew(false);
      setMessage("Cadastro salvo com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["atendimento-medico-convenios"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o cadastro.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAtendimentoMedicoConvenio,
    onSuccess: async () => {
      setSelectedId(null);
      setCreatingNew(false);
      setForm(emptyForm);
      setMessage("Cadastro excluido com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["atendimento-medico-convenios"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel excluir o cadastro.")
  });

  const totalLabel = useMemo(() => `${convenios.length} registro${convenios.length === 1 ? "" : "s"}`, [convenios.length]);

  function handleNew() {
    setSelectedId(null);
    setCreatingNew(true);
    setMessage(null);
    setForm(emptyForm);
  }

  function handleSelect(item: AtendimentoMedicoConvenio) {
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
          <p>Tabela auxiliar de convênios, responsáveis e contatos para atendimento médico.</p>
        </div>
        <button onClick={handleNew}><Plus size={16} /> Novo</button>
      </section>

      <section className={`split-view ${formOpen ? "" : "list-only"}`}>
        <div className="list-panel">
          <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, responsável ou documento" /></label>
          <div className="list-summary">{totalLabel}</div>
          <div className="record-list">
            {conveniosQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
            {convenios.map((item) => (
              <button key={item.id} className={`record-row simple ${item.id === selectedId ? "selected" : ""}`} onClick={() => handleSelect(item)}>
                <div>
                  <strong>{item.nm_convenio}</strong>
                  <span>{item.cpf_cnpj} · {item.cidade ?? "Sem cidade"} · {item.ativo === "S" ? "Ativo" : "Inativo"}</span>
                </div>
              </button>
            ))}
            {!conveniosQuery.isLoading && convenios.length === 0 ? <div className="empty-state">Nenhum cadastro encontrado.</div> : null}
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
                <select value={form.tipo_pessoa} onChange={(event) => setForm({ ...form, tipo_pessoa: event.target.value })}>
                  <option value="J">Jurídica</option>
                  <option value="F">Física</option>
                </select>
                <span>Tipo pessoa</span>
              </label>
              <label className="field">
                <input value={form.cpf_cnpj} maxLength={14} onChange={(event) => setForm({ ...form, cpf_cnpj: event.target.value })} placeholder=" " required />
                <span>CPF/CNPJ</span>
              </label>
            </div>

            <div className="form-grid">
              <label className="field">
                <input value={form.nm_convenio} maxLength={50} onChange={(event) => setForm({ ...form, nm_convenio: event.target.value })} placeholder=" " required />
                <span>Nome convênio</span>
              </label>
              <label className="field">
                <input value={form.nm_responsavel ?? ""} maxLength={50} onChange={(event) => setForm({ ...form, nm_responsavel: event.target.value })} placeholder=" " />
                <span>Responsável</span>
              </label>
            </div>

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

            <div className="form-grid compact">
              <label className="field"><input value={form.cep ?? ""} maxLength={10} onChange={(event) => setForm({ ...form, cep: event.target.value })} placeholder=" " /><span>CEP</span></label>
              <label className="field"><input value={form.tel1 ?? ""} maxLength={11} onChange={(event) => setForm({ ...form, tel1: event.target.value })} placeholder=" " /><span>Telefone 1</span></label>
              <label className="field"><input value={form.tel2 ?? ""} maxLength={11} onChange={(event) => setForm({ ...form, tel2: event.target.value })} placeholder=" " /><span>Telefone 2</span></label>
            </div>

            <label className="field"><input value={form.tel3 ?? ""} maxLength={11} onChange={(event) => setForm({ ...form, tel3: event.target.value })} placeholder=" " /><span>Telefone 3</span></label>
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
