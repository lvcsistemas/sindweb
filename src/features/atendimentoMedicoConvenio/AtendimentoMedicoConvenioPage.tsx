import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Search, Trash2 } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import type { AtendimentoMedicoConvenio, AtendimentoMedicoConvenioInsert } from "../../types/database";
import { listAtendimentoMedicoEspecialidades } from "../atendimentoMedicoEspecialidade/atendimentoMedicoEspecialidadeApi";
import { addConvenioEspecialidade, deleteConvenioEspecialidade, listAtendimentoMedicoConvenios, listConvenioEspecialidades, saveAtendimentoMedicoConvenio } from "./atendimentoMedicoConvenioApi";

type ConvenioTab = "dados" | "especialidades";

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
  const [activeTab, setActiveTab] = useState<ConvenioTab>("dados");
  const [form, setForm] = useState<AtendimentoMedicoConvenioInsert>(emptyForm);
  const [selectedEspecialidadeId, setSelectedEspecialidadeId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [especialidadeMessage, setEspecialidadeMessage] = useState<string | null>(null);

  const conveniosQuery = useQuery({ queryKey: ["atendimento-medico-convenios", search], queryFn: () => listAtendimentoMedicoConvenios(search) });
  const especialidadesQuery = useQuery({ queryKey: ["atendimento-medico-especialidades-options"], queryFn: () => listAtendimentoMedicoEspecialidades("") });
  const convenioEspecialidadesQuery = useQuery({
    queryKey: ["atendimento-medico-convenio-especialidades", selectedId],
    queryFn: () => listConvenioEspecialidades(Number(selectedId)),
    enabled: Boolean(selectedId)
  });

  const convenios = conveniosQuery.data ?? [];
  const especialidades = especialidadesQuery.data ?? [];
  const convenioEspecialidades = convenioEspecialidadesQuery.data ?? [];
  const selected = convenios.find((item) => item.id === selectedId) ?? null;
  const formOpen = creatingNew || Boolean(selectedId);

  const especialidadesDisponiveis = useMemo(() => {
    const vinculadas = new Set(convenioEspecialidades.map((item) => item.especialidade_id));
    return especialidades.filter((item) => !vinculadas.has(item.id));
  }, [especialidades, convenioEspecialidades]);

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

  useEffect(() => {
    if (!especialidadesDisponiveis.some((item) => String(item.id) === selectedEspecialidadeId)) {
      setSelectedEspecialidadeId(especialidadesDisponiveis[0]?.id ? String(especialidadesDisponiveis[0].id) : "");
    }
  }, [especialidadesDisponiveis, selectedEspecialidadeId]);

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

  const addEspecialidadeMutation = useMutation({
    mutationFn: ({ convenioId, especialidadeId }: { convenioId: number; especialidadeId: number }) => addConvenioEspecialidade(convenioId, especialidadeId),
    onSuccess: async () => {
      setEspecialidadeMessage("Especialidade adicionada com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["atendimento-medico-convenio-especialidades", selectedId] });
    },
    onError: (error) => setEspecialidadeMessage(error instanceof Error ? error.message : "Nao foi possivel adicionar a especialidade.")
  });

  const deleteEspecialidadeMutation = useMutation({
    mutationFn: deleteConvenioEspecialidade,
    onSuccess: async () => {
      setEspecialidadeMessage("Especialidade removida com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["atendimento-medico-convenio-especialidades", selectedId] });
    },
    onError: (error) => setEspecialidadeMessage(error instanceof Error ? error.message : "Nao foi possivel remover a especialidade.")
  });

  const totalLabel = useMemo(() => `${convenios.length} registro${convenios.length === 1 ? "" : "s"}`, [convenios.length]);

  function handleNew() {
    setSelectedId(null);
    setCreatingNew(true);
    setActiveTab("dados");
    setMessage(null);
    setEspecialidadeMessage(null);
    setForm(emptyForm);
  }

  function handleSelect(item: AtendimentoMedicoConvenio) {
    setSelectedId(item.id);
    setCreatingNew(false);
    setActiveTab("dados");
    setMessage(null);
    setEspecialidadeMessage(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    saveMutation.mutate(form);
  }

  function handleAddEspecialidade() {
    if (!selectedId || !selectedEspecialidadeId) return;
    setEspecialidadeMessage(null);
    addEspecialidadeMutation.mutate({ convenioId: selectedId, especialidadeId: Number(selectedEspecialidadeId) });
  }

  function handleDeleteEspecialidade(id: number, nome: string) {
    if (!window.confirm(`Deseja excluir "${nome}" deste convenio?`)) return;
    setEspecialidadeMessage(null);
    deleteEspecialidadeMutation.mutate(id);
  }

  function renderDadosTab() {
    return (
      <form className="related-form convenio-dados-form" onSubmit={handleSubmit}>
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
              <option value="J">Juridica</option>
              <option value="F">Fisica</option>
            </select>
            <span>Tipo Pessoa</span>
          </label>
          <label className="field">
            <input value={form.cpf_cnpj} maxLength={14} onChange={(event) => setForm({ ...form, cpf_cnpj: event.target.value })} placeholder=" " required />
            <span>CPF/CNPJ</span>
          </label>
        </div>

        <div className="form-grid">
          <label className="field">
            <input value={form.nm_convenio} maxLength={50} onChange={(event) => setForm({ ...form, nm_convenio: event.target.value })} placeholder=" " required />
            <span>Nome Convenio</span>
          </label>
          <label className="field">
            <input value={form.nm_responsavel ?? ""} maxLength={50} onChange={(event) => setForm({ ...form, nm_responsavel: event.target.value })} placeholder=" " />
            <span>Responsavel</span>
          </label>
        </div>

        <div className="form-grid compact">
          <label className="field"><input value={form.endereco ?? ""} maxLength={50} onChange={(event) => setForm({ ...form, endereco: event.target.value })} placeholder=" " /><span>Endereco</span></label>
          <label className="field"><input value={form.numero ?? ""} maxLength={15} onChange={(event) => setForm({ ...form, numero: event.target.value })} placeholder=" " /><span>Numero</span></label>
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
        <label className="field"><textarea rows={3} value={form.obs ?? ""} onChange={(event) => setForm({ ...form, obs: event.target.value })} placeholder=" " /><span>Observacao</span></label>

        {message ? <div className={saveMutation.isError ? "form-error" : "form-success"}>{message}</div> : null}

        <div className="form-actions">
          <button type="submit" disabled={saveMutation.isPending}><Save size={16} /> {saveMutation.isPending ? "Salvando..." : "Salvar"}</button>
        </div>
      </form>
    );
  }

  function renderEspecialidadesTab() {
    if (!selectedId) {
      return <div className="empty-state tab-empty">Salve ou selecione um convenio antes de adicionar especialidades.</div>;
    }

    return (
      <section className="related-form">
        <div className="related-toolbar">
          <label className="field">
            <select value={selectedEspecialidadeId} onChange={(event) => setSelectedEspecialidadeId(event.target.value)} disabled={especialidadesDisponiveis.length === 0}>
              {especialidadesDisponiveis.length === 0 ? <option value="">Nenhuma especialidade disponivel</option> : null}
              {especialidadesDisponiveis.map((item) => <option key={item.id} value={item.id}>{item.tipo} - {item.nm_especialidade}</option>)}
            </select>
            <span>Especialidade</span>
          </label>
          <button type="button" onClick={handleAddEspecialidade} disabled={!selectedEspecialidadeId || addEspecialidadeMutation.isPending}><Plus size={16} /> Adicionar</button>
        </div>

        {especialidadeMessage ? <div className={addEspecialidadeMutation.isError || deleteEspecialidadeMutation.isError ? "form-error" : "form-success"}>{especialidadeMessage}</div> : null}

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Especialidade</th>
                <th className="numeric-cell">Excluir</th>
              </tr>
            </thead>
            <tbody>
              {convenioEspecialidades.map((item) => (
                <tr key={item.id}>
                  <td>{item.especialidade?.tipo ?? "-"}</td>
                  <td>{item.especialidade?.nm_especialidade ?? "-"}</td>
                  <td className="numeric-cell">
                    <button type="button" className="icon-button danger-icon" title="Excluir" onClick={() => handleDeleteEspecialidade(item.id, item.especialidade?.nm_especialidade ?? "especialidade")} disabled={deleteEspecialidadeMutation.isPending}>
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {convenioEspecialidadesQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
          {!convenioEspecialidadesQuery.isLoading && convenioEspecialidades.length === 0 ? <div className="empty-state">Nenhuma especialidade vinculada.</div> : null}
        </div>
      </section>
    );
  }

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Cadastros" }, { label: "Atendimento Medico Convenios" }]} />
      <section className="module-header">
        <div>
          <h1>Atendimento Medico Convenios</h1>
          <p>Tabela auxiliar de convenios, responsaveis e contatos para atendimento medico.</p>
        </div>
        <button onClick={handleNew}><Plus size={16} /> Novo</button>
      </section>

      <section className={`split-view ${formOpen ? "" : "list-only"}`}>
        <div className="list-panel">
          <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, responsavel ou documento" /></label>
          <div className="list-summary">{totalLabel}</div>
          <div className="record-list">
            {conveniosQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
            {convenios.map((item) => (
              <button key={item.id} className={`record-row simple ${item.id === selectedId ? "selected" : ""}`} onClick={() => handleSelect(item)}>
                <div>
                  <strong>{item.nm_convenio}</strong>
                  <span>{item.cpf_cnpj} - {item.cidade ?? "Sem cidade"} - {item.ativo === "S" ? "Ativo" : "Inativo"}</span>
                </div>
              </button>
            ))}
            {!conveniosQuery.isLoading && convenios.length === 0 ? <div className="empty-state">Nenhum cadastro encontrado.</div> : null}
          </div>
        </div>

        {formOpen ? <div className="detail-panel">
          <div className="form-panel">
            <div className="tabs">
              <button type="button" className={activeTab === "dados" ? "active" : ""} onClick={() => setActiveTab("dados")}>DADOS</button>
              <button type="button" className={activeTab === "especialidades" ? "active" : ""} onClick={() => setActiveTab("especialidades")} disabled={!selectedId}>ESPECIALIDADES</button>
            </div>
            {activeTab === "dados" ? renderDadosTab() : renderEspecialidadesTab()}
          </div>
        </div> : null}
      </section>
    </main>
  );
}
