import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Landmark, Plus, Save, Search } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import type { Banco, BancoInsert } from "../../types/database";
import { getBancoLogotipoUrl, listBancos, saveBanco, uploadBancoLogotipo } from "./bancosApi";

const emptyForm: BancoInsert = {
  ativo: "S",
  banco_numero: "",
  banco_nome: "",
  agencia_numero: "",
  conta_numero: "",
  telefone: "",
  nome_gerente: "",
  logotipo_path: null,
  nosso_numero_inicio: 1,
  nosso_numero_fim: 999999999,
  nosso_numero_proximo: 1,
  codigo_cedente: "",
  carteira: "",
  padrao_retorno: "FEBRABAN240",
  tx_bancaria: 0,
  multa_percentual: 0,
  juros_dia_percentual: 0,
  desconto_percentual: 0,
  outros_acrescimos: 0
};

function onlyDigits(value: string | null | undefined) {
  return value?.replace(/\D/g, "") ?? "";
}

function formatTelefone(value: string | null | undefined) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }
  return digits.replace(/^(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
}

export function BancosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState<BancoInsert>(emptyForm);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const bancosQuery = useQuery({ queryKey: ["bancos", search], queryFn: () => listBancos(search) });
  const bancos = bancosQuery.data ?? [];
  const selected = bancos.find((item) => item.id === selectedId) ?? null;
  const formOpen = creatingNew || Boolean(selectedId);
  const totalLabel = useMemo(() => `${bancos.length} registro${bancos.length === 1 ? "" : "s"}`, [bancos.length]);

  useEffect(() => {
    if (!selected) {
      setForm(emptyForm);
      setLogoPreview(null);
      return;
    }

    setForm({
      id: selected.id,
      ativo: selected.ativo,
      banco_numero: selected.banco_numero,
      banco_nome: selected.banco_nome,
      agencia_numero: selected.agencia_numero,
      conta_numero: selected.conta_numero,
      telefone: formatTelefone(selected.telefone),
      nome_gerente: selected.nome_gerente ?? "",
      logotipo_path: selected.logotipo_path,
      nosso_numero_inicio: selected.nosso_numero_inicio,
      nosso_numero_fim: selected.nosso_numero_fim,
      nosso_numero_proximo: selected.nosso_numero_proximo,
      codigo_cedente: selected.codigo_cedente ?? "",
      carteira: selected.carteira ?? "",
      padrao_retorno: selected.padrao_retorno,
      tx_bancaria: selected.tx_bancaria,
      multa_percentual: selected.multa_percentual,
      juros_dia_percentual: selected.juros_dia_percentual,
      desconto_percentual: selected.desconto_percentual,
      outros_acrescimos: selected.outros_acrescimos
    });
    setLogoPreview(getBancoLogotipoUrl(selected.logotipo_path));
  }, [selected]);

  useEffect(() => {
    if (!logoFile) return;
    const url = URL.createObjectURL(logoFile);
    setLogoPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [logoFile]);

  const saveMutation = useMutation({
    mutationFn: async (values: BancoInsert) => {
      const saved = await saveBanco(values);
      if (!logoFile) return saved;
      const logotipoPath = await uploadBancoLogotipo(saved.id, logoFile);
      return saveBanco({ ...values, id: saved.id, logotipo_path: logotipoPath });
    },
    onSuccess: async (saved) => {
      setSelectedId(saved.id);
      setCreatingNew(false);
      setLogoFile(null);
      setMessage("Banco salvo com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["bancos"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o banco.")
  });

  function handleNew() {
    setSelectedId(null);
    setCreatingNew(true);
    setLogoFile(null);
    setLogoPreview(null);
    setMessage(null);
    setForm(emptyForm);
  }

  function handleSelect(item: Banco) {
    setSelectedId(item.id);
    setCreatingNew(false);
    setLogoFile(null);
    setMessage(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    saveMutation.mutate(form);
  }

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Financeiro" }, { label: "Bancos" }]} />
      <section className="module-header">
        <div>
          <h1>Bancos</h1>
          <p>Contas bancárias e regras de cobrança para emissão de faturas.</p>
        </div>
        <button onClick={handleNew}><Plus size={16} /> Novo</button>
      </section>

      <section className={`split-view ${formOpen ? "" : "list-only"}`}>
        <div className="list-panel">
          <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por banco, agência, conta ou gerente" /></label>
          <div className="list-summary">{totalLabel}</div>
          <div className="record-list">
            {bancosQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
            {bancos.map((item) => (
              <button key={item.id} className={`record-row ${item.id === selectedId ? "selected" : ""}`} onClick={() => handleSelect(item)}>
                <div className="avatar">{getBancoLogotipoUrl(item.logotipo_path) ? <img src={getBancoLogotipoUrl(item.logotipo_path) ?? ""} alt="" /> : <Landmark size={19} />}</div>
                <div>
                  <strong>{item.banco_numero} - {item.banco_nome}</strong>
                  <span>Ag {item.agencia_numero} - Conta {item.conta_numero}</span>
                </div>
              </button>
            ))}
            {!bancosQuery.isLoading && bancos.length === 0 ? <div className="empty-state">Nenhum banco encontrado.</div> : null}
          </div>
        </div>

        {formOpen ? <div className="detail-panel">
          <form className="form-panel" onSubmit={handleSubmit}>
            <div className="photo-field">
              <div className="avatar large">{logoPreview ? <img src={logoPreview} alt="" /> : <Landmark size={28} />}</div>
              <label className="secondary-button">
                Logotipo
                <input type="file" accept="image/*" onChange={(event) => setLogoFile(event.target.files?.[0] ?? null)} />
              </label>
            </div>

            <div className="form-grid compact">
              <label className="field"><select value={form.ativo} onChange={(event) => setForm({ ...form, ativo: event.target.value })}><option value="S">SIM</option><option value="N">NÃO</option></select><span>Ativo</span></label>
              <label className="field"><input value={form.banco_numero} maxLength={10} onChange={(event) => setForm({ ...form, banco_numero: onlyDigits(event.target.value) })} placeholder=" " required /><span>Número banco</span></label>
              <label className="field"><select value={form.padrao_retorno} onChange={(event) => setForm({ ...form, padrao_retorno: event.target.value })}><option value="FEBRABAN240">FEBRABAN240</option><option value="CNAB400">CNAB400</option></select><span>Padrão retorno</span></label>
            </div>

            <label className="field"><input value={form.banco_nome} maxLength={80} onChange={(event) => setForm({ ...form, banco_nome: event.target.value.toUpperCase() })} placeholder=" " required /><span>Nome banco</span></label>

            <div className="form-grid compact">
              <label className="field"><input value={form.agencia_numero} maxLength={20} onChange={(event) => setForm({ ...form, agencia_numero: event.target.value })} placeholder=" " required /><span>Agência</span></label>
              <label className="field"><input value={form.conta_numero} maxLength={30} onChange={(event) => setForm({ ...form, conta_numero: event.target.value })} placeholder=" " required /><span>Conta</span></label>
              <label className="field"><input value={form.codigo_cedente ?? ""} maxLength={30} onChange={(event) => setForm({ ...form, codigo_cedente: event.target.value })} placeholder=" " /><span>Código cedente</span></label>
            </div>

            <div className="form-grid compact">
              <label className="field"><input value={form.carteira ?? ""} maxLength={20} onChange={(event) => setForm({ ...form, carteira: event.target.value })} placeholder=" " /><span>Carteira</span></label>
              <label className="field"><input value={form.telefone ?? ""} maxLength={15} onChange={(event) => setForm({ ...form, telefone: formatTelefone(event.target.value) })} placeholder=" " /><span>Telefone</span></label>
              <label className="field"><input value={form.nome_gerente ?? ""} maxLength={80} onChange={(event) => setForm({ ...form, nome_gerente: event.target.value.toUpperCase() })} placeholder=" " /><span>Gerente</span></label>
            </div>

            <div className="form-grid compact">
              <label className="field"><input type="number" min={0} value={form.nosso_numero_inicio} onChange={(event) => setForm({ ...form, nosso_numero_inicio: Number(event.target.value) })} placeholder=" " /><span>Início nosso número</span></label>
              <label className="field"><input type="number" min={0} value={form.nosso_numero_fim} onChange={(event) => setForm({ ...form, nosso_numero_fim: Number(event.target.value) })} placeholder=" " /><span>Fim nosso número</span></label>
              <label className="field"><input type="number" min={0} value={form.nosso_numero_proximo} onChange={(event) => setForm({ ...form, nosso_numero_proximo: Number(event.target.value) })} placeholder=" " /><span>Próximo nosso número</span></label>
            </div>

            <div className="form-grid compact">
              <label className="field"><input className="currency-input" type="number" min={0} step="0.01" value={form.tx_bancaria} onChange={(event) => setForm({ ...form, tx_bancaria: Number(event.target.value) })} placeholder=" " /><span>Taxa bancária</span></label>
              <label className="field"><input className="currency-input" type="number" min={0} step="0.0001" value={form.multa_percentual} onChange={(event) => setForm({ ...form, multa_percentual: Number(event.target.value) })} placeholder=" " /><span>% Multa</span></label>
              <label className="field"><input className="currency-input" type="number" min={0} step="0.0001" value={form.juros_dia_percentual} onChange={(event) => setForm({ ...form, juros_dia_percentual: Number(event.target.value) })} placeholder=" " /><span>% Juros dia</span></label>
            </div>

            <div className="form-grid">
              <label className="field"><input className="currency-input" type="number" min={0} step="0.0001" value={form.desconto_percentual} onChange={(event) => setForm({ ...form, desconto_percentual: Number(event.target.value) })} placeholder=" " /><span>% Desconto</span></label>
              <label className="field"><input className="currency-input" type="number" min={0} step="0.01" value={form.outros_acrescimos} onChange={(event) => setForm({ ...form, outros_acrescimos: Number(event.target.value) })} placeholder=" " /><span>Outros acréscimos</span></label>
            </div>

            {message ? <div className={saveMutation.isError ? "form-error" : "form-success"}>{message}</div> : null}

            <div className="form-actions">
              <button type="submit" disabled={saveMutation.isPending}><Save size={16} /> {saveMutation.isPending ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        </div> : null}
      </section>
    </main>
  );
}
