import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Building2, Camera, Plus, Save, Search, Trash2 } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import type { EmpresaCadastro, EmpresaCadastroInsert } from "../../types/database";
import { listUsuarios } from "../usuarios/usuariosApi";
import { deleteEmpresaCadastro, getEmpresaLogoUrl, listEmpresasCadastro, saveEmpresaCadastro, uploadEmpresaLogo } from "./empresaApi";

type EmpresaTab = "dados" | "associados" | "contribuicoes" | "financeiro";

function onlyDigits(value: string | null | undefined) {
  return value?.replace(/\D/g, "") ?? "";
}

function formatCnpj(value: string) {
  const digits = onlyDigits(value).slice(0, 14);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatCei(value: string) {
  const digits = onlyDigits(value).slice(0, 12);
  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{5})(\d)/, ".$1/$2");
}

function formatCeiCnpj(value: string, tipo: number) {
  return tipo === 2 ? formatCei(value) : formatCnpj(value);
}

const emptyForm: EmpresaCadastroInsert = {
  user_resp_id: "",
  estabelecimento_id: 1,
  estabelecimento_tipo_id: 1,
  escritorio_id: 0,
  ramo_atividade_id: 0,
  convencao_id: 0,
  cnae_id: 0,
  tipo_cei_cnpj: 1,
  dt_inicio_atividades: "",
  ativo: "S",
  razao_social: "",
  nm_fantasia: "",
  cei_cnpj: "",
  insc_estadual: "",
  nm_contato1: "",
  nm_contato2: "",
  nm_contato3: "",
  email1: "",
  email2: "",
  email3: "",
  tel1: "",
  tel2: "",
  tel3: "",
  site: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "RJ",
  cep: "",
  capital_social: 0,
  logo_path: null,
  obs: ""
};

export function EmpresaPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<EmpresaTab>("dados");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState<EmpresaCadastroInsert>(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const empresasQuery = useQuery({ queryKey: ["empresas-cadastro", search], queryFn: () => listEmpresasCadastro(search) });
  const usuariosQuery = useQuery({ queryKey: ["usuarios"], queryFn: listUsuarios });
  const empresas = empresasQuery.data ?? [];
  const usuarios = usuariosQuery.data ?? [];
  const selected = empresas.find((item) => item.id === selectedId) ?? null;
  const formOpen = creatingNew || Boolean(selectedId);

  useEffect(() => {
    if (!selected) {
      setForm(emptyForm);
      return;
    }

    setForm({
      id: selected.id,
      user_resp_id: selected.user_resp_id,
      estabelecimento_id: selected.estabelecimento_id,
      estabelecimento_tipo_id: selected.estabelecimento_tipo_id,
      escritorio_id: selected.escritorio_id,
      ramo_atividade_id: selected.ramo_atividade_id,
      convencao_id: selected.convencao_id,
      cnae_id: selected.cnae_id,
      tipo_cei_cnpj: selected.tipo_cei_cnpj,
      dt_inicio_atividades: selected.dt_inicio_atividades ?? "",
      ativo: selected.ativo,
      razao_social: selected.razao_social,
      nm_fantasia: selected.nm_fantasia,
      cei_cnpj: formatCeiCnpj(selected.cei_cnpj, selected.tipo_cei_cnpj),
      insc_estadual: selected.insc_estadual ?? "",
      nm_contato1: selected.nm_contato1 ?? "",
      nm_contato2: selected.nm_contato2 ?? "",
      nm_contato3: selected.nm_contato3 ?? "",
      email1: selected.email1 ?? "",
      email2: selected.email2 ?? "",
      email3: selected.email3 ?? "",
      tel1: selected.tel1 ?? "",
      tel2: selected.tel2 ?? "",
      tel3: selected.tel3 ?? "",
      site: selected.site ?? "",
      endereco: selected.endereco ?? "",
      numero: selected.numero ?? "",
      complemento: selected.complemento ?? "",
      bairro: selected.bairro ?? "",
      cidade: selected.cidade ?? "",
      uf: selected.uf,
      cep: selected.cep ?? "",
      capital_social: selected.capital_social,
      logo_path: selected.logo_path,
      obs: selected.obs ?? ""
    });
    setLogoFile(null);
  }, [selected]);

  useEffect(() => {
    if (!logoFile) {
      setLogoPreview(getEmpresaLogoUrl(form.logo_path));
      return;
    }

    const previewUrl = URL.createObjectURL(logoFile);
    setLogoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [form.logo_path, logoFile]);

  const saveMutation = useMutation({
    mutationFn: async (values: EmpresaCadastroInsert) => {
      const saved = await saveEmpresaCadastro(values);
      if (!logoFile) return saved;

      const logoPath = await uploadEmpresaLogo(saved.id, logoFile);
      return saveEmpresaCadastro({ ...values, id: saved.id, logo_path: logoPath });
    },
    onSuccess: async (saved) => {
      setSelectedId(saved.id);
      setCreatingNew(false);
      setLogoFile(null);
      setMessage("Empresa salva com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["empresas-cadastro"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar a empresa.")
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEmpresaCadastro,
    onSuccess: async () => {
      setSelectedId(null);
      setCreatingNew(false);
      setForm(emptyForm);
      setMessage("Empresa excluida com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["empresas-cadastro"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel excluir a empresa.")
  });

  const totalLabel = useMemo(() => `${empresas.length} registro${empresas.length === 1 ? "" : "s"}`, [empresas.length]);

  function handleNew() {
    setSelectedId(null);
    setCreatingNew(true);
    setActiveTab("dados");
    setMessage(null);
    setLogoFile(null);
    setForm(emptyForm);
  }

  function handleSelect(item: EmpresaCadastro) {
    setSelectedId(item.id);
    setCreatingNew(false);
    setActiveTab("dados");
    setMessage(null);
    setLogoFile(null);
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

  function handleTipoCeiCnpjChange(value: number) {
    setForm({ ...form, tipo_cei_cnpj: value, cei_cnpj: formatCeiCnpj(form.cei_cnpj, value) });
  }

  function handleCeiCnpjChange(value: string) {
    setForm({ ...form, cei_cnpj: formatCeiCnpj(value, form.tipo_cei_cnpj) });
  }

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Cadastros" }, { label: "Empresas" }]} />
      <section className="module-header">
        <div>
          <h1>Empresas</h1>
          <p>Cadastro de empresas, documentos, contatos e dados comerciais.</p>
        </div>
        <button onClick={handleNew}><Plus size={16} /> Novo</button>
      </section>

      <section className={`split-view ${formOpen ? "" : "list-only"}`}>
        <div className="list-panel">
          <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por razao, fantasia, CNPJ ou cidade" /></label>
          <div className="list-summary">{totalLabel}</div>
          <div className="record-list">
            {empresasQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
            {empresas.map((item) => (
              <button key={item.id} className={`record-row ${item.id === selectedId ? "selected" : ""}`} onClick={() => handleSelect(item)}>
                <div className="avatar">{getEmpresaLogoUrl(item.logo_path) ? <img src={getEmpresaLogoUrl(item.logo_path) ?? ""} alt="" /> : <Building2 size={19} />}</div>
                <div>
                  <strong>{item.nm_fantasia}</strong>
                  <span>{item.razao_social} - {item.cei_cnpj} - {item.cidade ?? "Sem cidade"}</span>
                </div>
                <small className={item.ativo === "S" ? "status-ok" : "status-muted"}>{item.ativo === "S" ? "Ativa" : "Inativa"}</small>
              </button>
            ))}
            {!empresasQuery.isLoading && empresas.length === 0 ? <div className="empty-state">Nenhuma empresa encontrada.</div> : null}
          </div>
        </div>

        {formOpen ? <div className="detail-panel">
          <form className="form-panel" onSubmit={handleSubmit}>
            <div className="tabs" role="tablist" aria-label="Empresa">
              <button type="button" className={activeTab === "dados" ? "active" : ""} onClick={() => setActiveTab("dados")}>Dados</button>
              <button type="button" className={activeTab === "associados" ? "active" : ""} onClick={() => setActiveTab("associados")}>Associados</button>
              <button type="button" className={activeTab === "contribuicoes" ? "active" : ""} onClick={() => setActiveTab("contribuicoes")}>Contribuições</button>
              <button type="button" className={activeTab === "financeiro" ? "active" : ""} onClick={() => setActiveTab("financeiro")}>Financeiro</button>
            </div>

            {activeTab === "dados" ? <>
              <div className="form-grid compact">
                <label className="field">
                  <select value={form.ativo} onChange={(event) => setForm({ ...form, ativo: event.target.value })}>
                    <option value="S">Ativa</option>
                    <option value="N">Inativa</option>
                  </select>
                  <span>Status</span>
                </label>
                <label className="field">
                  <select value={form.tipo_cei_cnpj} onChange={(event) => handleTipoCeiCnpjChange(Number(event.target.value))}>
                    <option value={1}>CNPJ</option>
                    <option value={2}>CEI</option>
                  </select>
                  <span>Tipo CEI/CNPJ</span>
                </label>
                <label className="field"><input value={form.cei_cnpj} maxLength={form.tipo_cei_cnpj === 2 ? 15 : 18} onChange={(event) => handleCeiCnpjChange(event.target.value)} placeholder=" " required /><span>CEI/CNPJ</span></label>
              </div>

              <div className="form-grid compact">
                <label className="field"><input type="date" value={form.dt_inicio_atividades ?? ""} onChange={(event) => setForm({ ...form, dt_inicio_atividades: event.target.value })} placeholder=" " /><span>Inicio atividades</span></label>
                <label className="field"><input value={form.insc_estadual ?? ""} maxLength={25} onChange={(event) => setForm({ ...form, insc_estadual: event.target.value })} placeholder=" " /><span>Inscricao estadual</span></label>
                <label className="field"><input className="currency-input" type="number" min={0} step="0.01" value={form.capital_social} onChange={(event) => setForm({ ...form, capital_social: Number(event.target.value) })} placeholder=" " /><span>Capital social</span></label>
              </div>

              <div className="form-grid">
                <label className="field"><input value={form.razao_social} maxLength={100} onChange={(event) => setForm({ ...form, razao_social: event.target.value })} placeholder=" " required /><span>Razao social</span></label>
                <label className="field"><input value={form.nm_fantasia} maxLength={50} onChange={(event) => setForm({ ...form, nm_fantasia: event.target.value })} placeholder=" " required /><span>Nome fantasia</span></label>
              </div>

              <div className="photo-field">
                <div className="avatar large">{logoPreview ? <img src={logoPreview} alt="" /> : <Building2 size={30} />}</div>
                <label className="secondary-button">
                  <Camera size={16} /> Logomarca
                  <input type="file" accept="image/*" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
                </label>
              </div>

              <div className="form-grid compact">
                <label className="field">
                  <select value={form.user_resp_id} onChange={(event) => setForm({ ...form, user_resp_id: event.target.value })}>
                    <option value="">Selecione</option>
                    {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.full_name || usuario.codinome || usuario.email}</option>)}
                  </select>
                  <span>Usuario responsavel</span>
                </label>
                <label className="field"><input type="number" min={0} value={form.estabelecimento_id} onChange={(event) => setForm({ ...form, estabelecimento_id: Number(event.target.value) })} placeholder=" " /><span>Estabelecimento</span></label>
                <label className="field">
                  <select value={form.estabelecimento_tipo_id} onChange={(event) => setForm({ ...form, estabelecimento_tipo_id: Number(event.target.value) })}>
                    <option value={1}>FILIAL</option>
                    <option value={2}>OUTROS</option>
                    <option value={3}>PRINCIPAL</option>
                    <option value={4}>UNICO</option>
                  </select>
                  <span>Tipo estabelecimento</span>
                </label>
              </div>

              <div className="form-grid compact">
                <label className="field"><input type="number" min={0} value={form.escritorio_id} onChange={(event) => setForm({ ...form, escritorio_id: Number(event.target.value) })} placeholder=" " /><span>Escritorio</span></label>
                <label className="field"><input type="number" min={0} value={form.ramo_atividade_id} onChange={(event) => setForm({ ...form, ramo_atividade_id: Number(event.target.value) })} placeholder=" " /><span>Ramo atividade</span></label>
                <label className="field"><input type="number" min={0} value={form.convencao_id} onChange={(event) => setForm({ ...form, convencao_id: Number(event.target.value) })} placeholder=" " /><span>Convencao</span></label>
              </div>

              <label className="field"><input type="number" min={0} value={form.cnae_id} onChange={(event) => setForm({ ...form, cnae_id: Number(event.target.value) })} placeholder=" " /><span>CNAE</span></label>

              <div className="form-grid compact">
                <label className="field"><input value={form.nm_contato1 ?? ""} maxLength={40} onChange={(event) => setForm({ ...form, nm_contato1: event.target.value })} placeholder=" " /><span>Contato 1</span></label>
                <label className="field"><input type="email" value={form.email1 ?? ""} maxLength={100} onChange={(event) => setForm({ ...form, email1: event.target.value })} placeholder=" " /><span>E-mail 1</span></label>
                <label className="field"><input value={form.tel1 ?? ""} maxLength={11} onChange={(event) => setForm({ ...form, tel1: event.target.value })} placeholder=" " /><span>Telefone 1</span></label>
              </div>

              <div className="form-grid compact">
                <label className="field"><input value={form.nm_contato2 ?? ""} maxLength={40} onChange={(event) => setForm({ ...form, nm_contato2: event.target.value })} placeholder=" " /><span>Contato 2</span></label>
                <label className="field"><input type="email" value={form.email2 ?? ""} maxLength={100} onChange={(event) => setForm({ ...form, email2: event.target.value })} placeholder=" " /><span>E-mail 2</span></label>
                <label className="field"><input value={form.tel2 ?? ""} maxLength={11} onChange={(event) => setForm({ ...form, tel2: event.target.value })} placeholder=" " /><span>Telefone 2</span></label>
              </div>

              <div className="form-grid compact">
                <label className="field"><input value={form.nm_contato3 ?? ""} maxLength={40} onChange={(event) => setForm({ ...form, nm_contato3: event.target.value })} placeholder=" " /><span>Contato 3</span></label>
                <label className="field"><input type="email" value={form.email3 ?? ""} maxLength={100} onChange={(event) => setForm({ ...form, email3: event.target.value })} placeholder=" " /><span>E-mail 3</span></label>
                <label className="field"><input value={form.tel3 ?? ""} maxLength={11} onChange={(event) => setForm({ ...form, tel3: event.target.value })} placeholder=" " /><span>Telefone 3</span></label>
              </div>

              <label className="field"><input value={form.site ?? ""} maxLength={100} onChange={(event) => setForm({ ...form, site: event.target.value })} placeholder=" " /><span>Site</span></label>

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

              <label className="field"><input value={form.cep ?? ""} maxLength={10} onChange={(event) => setForm({ ...form, cep: event.target.value })} placeholder=" " /><span>CEP</span></label>
              <label className="field"><textarea rows={3} value={form.obs ?? ""} onChange={(event) => setForm({ ...form, obs: event.target.value })} placeholder=" " /><span>Observacao</span></label>
            </> : null}

            {activeTab === "associados" ? <div className="empty-state tab-empty">Nenhum associado vinculado nesta tela.</div> : null}
            {activeTab === "contribuicoes" ? <div className="empty-state tab-empty">Nenhuma contribuição vinculada nesta tela.</div> : null}
            {activeTab === "financeiro" ? <div className="empty-state tab-empty">Nenhum lançamento financeiro vinculado nesta tela.</div> : null}

            {message ? <div className={saveMutation.isError || deleteMutation.isError ? "form-error" : "form-success"}>{message}</div> : null}

            <div className="form-actions">
              {form.id ? <button type="button" className="danger-button" onClick={handleDelete} disabled={deleteMutation.isPending}><Trash2 size={16} /> Excluir</button> : null}
              {activeTab === "dados" ? <button type="submit" disabled={saveMutation.isPending}><Save size={16} /> {saveMutation.isPending ? "Salvando..." : "Salvar"}</button> : null}
            </div>
          </form>
        </div> : null}
      </section>
    </main>
  );
}
