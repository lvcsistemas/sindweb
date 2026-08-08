import { FormEvent, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, FileText, Search, Trash2 } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { listAssociados } from "../associados/associadosApi";
import { listBancos } from "../bancos/bancosApi";
import { listContribuicoes } from "../contribuicao/contribuicaoApi";
import { listEmpresasCadastro } from "../empresa/empresaApi";
import { listAuxiliares } from "../auxiliares/auxiliaresApi";
import { baixarFaturaManual, cancelarFatura, gerarFaturas, listFaturas, type BaixaManualPayload, type FaturaFilters, type GerarFaturasPayload } from "./faturasApi";

const currentYear = new Date().getFullYear();
const currentMonth = new Date().getMonth() + 1;

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
}

function todayLocalDateOnly() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function onlyDigits(value: string) {
  return value.replace(/\D/g, "");
}

function parseCurrency(value: string) {
  return Number(onlyDigits(value) || 0) / 100;
}

function monthStart() {
  const date = new Date();
  date.setDate(1);
  return dateOnly(date);
}

function yearEnd() {
  return `${currentYear}-12-31`;
}

function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function formatDocumento(value: string | null | undefined) {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (digits.length === 11) return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  if (digits.length === 14) return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  return value ?? "-";
}

export function FaturasPage() {
  const queryClient = useQueryClient();
  const [filters, setFilters] = useState<FaturaFilters>({ sacadoTipo: "TODOS", situacao: "TODOS", inicio: monthStart(), fim: yearEnd(), valor: "" });
  const [draftFilters, setDraftFilters] = useState<FaturaFilters>(filters);
  const [form, setForm] = useState<GerarFaturasPayload>({
    sacadoTipo: "ASSOCIADO",
    escopo: "TODOS",
    sacadoId: 0,
    contribuicaoId: 0,
    bancoId: 0,
    ateMes: 12,
    ateAno: currentYear
  });
  const [sacadoSearch, setSacadoSearch] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [baixaForm, setBaixaForm] = useState<BaixaManualPayload | null>(null);

  const faturasQuery = useQuery({ queryKey: ["faturas", filters], queryFn: () => listFaturas(filters) });
  const contribuicoesQuery = useQuery({ queryKey: ["contribuicoes", ""], queryFn: () => listContribuicoes("") });
  const bancosQuery = useQuery({ queryKey: ["bancos", ""], queryFn: () => listBancos("") });
  const formasPagamentoQuery = useQuery({ queryKey: ["auxiliares", "formas_pagamento"], queryFn: () => listAuxiliares("formas_pagamento", "") });
  const associadosQuery = useQuery({ queryKey: ["faturas-associados", sacadoSearch], queryFn: () => listAssociados(sacadoSearch), enabled: form.escopo === "ESPECIFICO" && form.sacadoTipo === "ASSOCIADO" });
  const empresasQuery = useQuery({ queryKey: ["faturas-empresas", sacadoSearch], queryFn: () => listEmpresasCadastro(sacadoSearch), enabled: form.escopo === "ESPECIFICO" && form.sacadoTipo === "EMPRESA" });

  const faturas = faturasQuery.data ?? [];
  const contribuicoes = contribuicoesQuery.data ?? [];
  const bancos = bancosQuery.data ?? [];
  const formasPagamento = (formasPagamentoQuery.data ?? []).filter((item) => item.ativo === "S");
  const associados = associadosQuery.data ?? [];
  const empresas = empresasQuery.data ?? [];
  const totalLabel = useMemo(() => `${faturas.length} registro${faturas.length === 1 ? "" : "s"}`, [faturas.length]);

  const gerarMutation = useMutation({
    mutationFn: async (values: GerarFaturasPayload) => {
      if (!values.contribuicaoId) throw new Error("Selecione a contribuição.");
      if (!values.bancoId) throw new Error("Selecione o banco.");
      if (values.escopo === "ESPECIFICO" && !values.sacadoId) throw new Error("Selecione o sacado.");
      if (values.ateAno < currentYear || (values.ateAno === currentYear && values.ateMes < currentMonth)) {
        throw new Error("O mês/ano final deve ser igual ou posterior ao mês atual.");
      }
      return gerarFaturas(values);
    },
    onSuccess: async (result) => {
      setMessage(`Faturas geradas: ${result.geradas}. Já existentes: ${result.ignoradas}.`);
      await queryClient.invalidateQueries({ queryKey: ["faturas"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel gerar as faturas.")
  });

  const cancelarMutation = useMutation({
    mutationFn: cancelarFatura,
    onSuccess: async () => {
      setMessage("Fatura enviada para Faturas Excluidas.");
      await queryClient.invalidateQueries({ queryKey: ["faturas"] });
      await queryClient.invalidateQueries({ queryKey: ["faturas-excluidas"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel excluir a fatura.")
  });

  const baixarMutation = useMutation({
    mutationFn: baixarFaturaManual,
    onSuccess: async () => {
      setBaixaForm(null);
      setMessage("Baixa manual registrada com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["faturas"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel baixar a fatura.")
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    gerarMutation.mutate(form);
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters(draftFilters);
  }

  function handleCancelar(id: number) {
    if (!window.confirm("Confirma excluir esta fatura? Ela ficara disponivel em Faturas Excluidas.")) return;
    setMessage(null);
    cancelarMutation.mutate(id);
  }

  function handleBaixaManual(id: number) {
    const fatura = faturas.find((item) => item.id === id);
    if (!fatura) return;
    setMessage(null);
    setBaixaForm({
      id,
      dtPagamento: fatura.dt_pagamento ?? todayLocalDateOnly(),
      formaPagamentoId: fatura.forma_pagamento_id ?? formasPagamento[0]?.id ?? 0,
      valorRecebido: Number(fatura.valor_recebido ?? fatura.valor_total ?? 0)
    });
  }

  function handleBaixaSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!baixaForm) return;
    setMessage(null);
    baixarMutation.mutate(baixaForm);
  }

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Financeiro" }, { label: "Emissão de Faturas" }]} />
      <section className="module-header">
        <div>
          <h1>Emissão de Faturas</h1>
          <p>Geração de cobranças por contribuição, sacado e competência.</p>
        </div>
      </section>

      <section className="form-panel">
        <form className="form-panel embedded-form" onSubmit={handleSubmit}>
          <div className="form-grid compact">
            <label className="field"><select value={form.sacadoTipo} onChange={(event) => setForm({ ...form, sacadoTipo: event.target.value as "ASSOCIADO" | "EMPRESA", sacadoId: 0 })}><option value="ASSOCIADO">ASSOCIADO</option><option value="EMPRESA">EMPRESA</option></select><span>Tipo sacado</span></label>
            <label className="field"><select value={form.escopo} onChange={(event) => setForm({ ...form, escopo: event.target.value as "TODOS" | "ESPECIFICO", sacadoId: 0 })}><option value="TODOS">TODOS</option><option value="ESPECIFICO">ESPECÍFICO</option></select><span>Escopo</span></label>
            <label className="field"><select value={form.contribuicaoId} onChange={(event) => setForm({ ...form, contribuicaoId: Number(event.target.value) })}><option value={0}>Selecione</option>{contribuicoes.map((item) => <option key={item.id} value={item.id}>{item.tipo} - {item.nm_contribuicao}</option>)}</select><span>Contribuição</span></label>
          </div>

          <div className="form-grid compact">
            <label className="field"><select value={form.bancoId} onChange={(event) => setForm({ ...form, bancoId: Number(event.target.value) })}><option value={0}>Selecione</option>{bancos.map((item) => <option key={item.id} value={item.id}>{item.banco_numero} - {item.banco_nome} - Ag {item.agencia_numero} - Conta {item.conta_numero}</option>)}</select><span>Banco</span></label>
            <label className="field"><input type="number" min={1} max={12} value={form.ateMes} onChange={(event) => setForm({ ...form, ateMes: Number(event.target.value) })} placeholder=" " /><span>Até mês</span></label>
            <label className="field"><input type="number" min={currentYear} value={form.ateAno} onChange={(event) => setForm({ ...form, ateAno: Number(event.target.value) })} placeholder=" " /><span>Até ano</span></label>
          </div>

          {form.escopo === "ESPECIFICO" ? (
            <div className="form-grid">
              <label className="field"><input value={sacadoSearch} onChange={(event) => setSacadoSearch(event.target.value)} placeholder=" " /><span>{form.sacadoTipo === "ASSOCIADO" ? "Buscar associado" : "Buscar empresa"}</span></label>
              <label className="field">
                <select value={form.sacadoId} onChange={(event) => setForm({ ...form, sacadoId: Number(event.target.value) })}>
                  <option value={0}>Selecione</option>
                  {form.sacadoTipo === "ASSOCIADO"
                    ? associados.map((item) => <option key={item.id} value={item.id}>{item.nome} - {formatDocumento(item.cpf)}</option>)
                    : empresas.map((item) => <option key={item.id} value={item.id}>{item.nm_fantasia} - {formatDocumento(item.cei_cnpj)}</option>)}
                </select>
                <span>Sacado</span>
              </label>
            </div>
          ) : null}

          {message ? <div className={gerarMutation.isError ? "form-error" : "form-success"}>{message}</div> : null}

          <div className="form-actions faturas-generate-actions">
            <button type="submit" disabled={gerarMutation.isPending}><FileText size={16} /> {gerarMutation.isPending ? "Gerando..." : "Gerar Faturas"}</button>
            <button type="submit" form="faturas-search-form"><Search size={16} /> Pesquisar</button>
          </div>
        </form>
      </section>

      <section className="form-panel atendimento-search-panel">
        <form id="faturas-search-form" className="atendimento-search-grid faturas-search-grid" onSubmit={handleSearch}>
          <label className="field"><select value={draftFilters.sacadoTipo} onChange={(event) => setDraftFilters({ ...draftFilters, sacadoTipo: event.target.value as FaturaFilters["sacadoTipo"] })}><option value="TODOS">TODOS</option><option value="ASSOCIADO">ASSOCIADO</option><option value="EMPRESA">EMPRESA</option></select><span>Tipo sacado</span></label>
          <label className="field"><select value={draftFilters.situacao} onChange={(event) => setDraftFilters({ ...draftFilters, situacao: event.target.value as FaturaFilters["situacao"] })}><option value="TODOS">TODOS</option><option value="ABERTA">ABERTA</option><option value="PAGA">PAGA</option></select><span>Situação</span></label>
          <label className="field"><input type="date" value={draftFilters.inicio} onChange={(event) => setDraftFilters({ ...draftFilters, inicio: event.target.value })} placeholder=" " /><span>Vencimento inicial</span></label>
          <label className="field"><input type="date" value={draftFilters.fim} onChange={(event) => setDraftFilters({ ...draftFilters, fim: event.target.value })} placeholder=" " /><span>Vencimento final</span></label>
          <label className="field"><input value={draftFilters.valor} onChange={(event) => setDraftFilters({ ...draftFilters, valor: event.target.value })} placeholder=" " /><span>Valor procurado</span></label>
        </form>
      </section>

      <section className="form-panel">
        <div className="list-summary">{totalLabel}</div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Sacado</th>
                <th>Contribuição</th>
                <th>Competência</th>
                <th>Vencimento</th>
                <th>Pagamento</th>
                <th>Banco</th>
                <th className="numeric-cell">Valor</th>
                <th>Situação</th>
                <th className="numeric-cell">Ações</th>
              </tr>
            </thead>
            <tbody>
              {faturas.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td><strong>{item.sacado_tipo === "ASSOCIADO" ? item.associado_nome : item.empresa_nome}</strong><span>{item.sacado_tipo} - {formatDocumento(item.sacado_tipo === "ASSOCIADO" ? item.associado_documento : item.empresa_documento)}</span></td>
                  <td><strong>{item.contribuicao_tipo}</strong><span>{item.nm_contribuicao}</span></td>
                  <td>{String(item.competencia_mes).padStart(2, "0")}/{item.competencia_ano}</td>
                  <td>{formatDate(item.dt_vencimento)}</td>
                  <td><strong>{formatDate(item.dt_pagamento)}</strong><span>{item.forma_pagamento_nome ?? "-"}</span></td>
                  <td><strong>{item.banco_numero} - {item.banco_nome}</strong><span>Ag {item.agencia_numero} - Conta {item.conta_numero}</span></td>
                  <td className="numeric-cell"><strong>{formatCurrency(item.valor_total)}</strong><span>{item.valor_recebido ? `Recebido ${formatCurrency(item.valor_recebido)}` : "Recebido -"}</span></td>
                  <td>{item.situacao}</td>
                  <td className="numeric-cell">
                    <div className="row-actions">
                      <button type="button" className="icon-button" title="Baixa manual" onClick={() => handleBaixaManual(item.id)} disabled={baixarMutation.isPending || item.situacao === "PAGA"}>
                        <CheckCircle2 size={16} />
                      </button>
                      <button type="button" className="icon-button danger-icon" title="Excluir" onClick={() => handleCancelar(item.id)} disabled={cancelarMutation.isPending}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {faturasQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
          {!faturasQuery.isLoading && faturas.length === 0 ? <div className="empty-state">Nenhuma fatura encontrada.</div> : null}
        </div>
      </section>

      {baixaForm ? <div className="modal-backdrop" role="presentation">
        <form className="modal-panel modal-form" role="dialog" aria-modal="true" aria-label="Baixa manual da fatura" onSubmit={handleBaixaSubmit}>
          <div>
            <h2>Baixa Manual</h2>
            <p>Informe os dados da liquidação da fatura.</p>
          </div>

          <div className="form-grid compact">
            <label className="field">
              <input type="date" value={baixaForm.dtPagamento} onChange={(event) => setBaixaForm({ ...baixaForm, dtPagamento: event.target.value })} placeholder=" " required />
              <span>Pagamento</span>
            </label>
            <label className="field">
              <select value={baixaForm.formaPagamentoId} onChange={(event) => setBaixaForm({ ...baixaForm, formaPagamentoId: Number(event.target.value) })} required>
                <option value={0}>Selecione</option>
                {formasPagamento.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}
              </select>
              <span>Forma de Pagamento</span>
            </label>
            <label className="field">
              <input className="currency-input" value={formatCurrency(baixaForm.valorRecebido)} onChange={(event) => setBaixaForm({ ...baixaForm, valorRecebido: parseCurrency(event.target.value) })} placeholder=" " required />
              <span>Valor Recebido</span>
            </label>
          </div>

          <div className="modal-actions">
            <button type="button" className="secondary-button" onClick={() => setBaixaForm(null)}>Cancelar</button>
            <button type="submit" disabled={baixarMutation.isPending}>{baixarMutation.isPending ? "Salvando..." : "Salvar Baixa"}</button>
          </div>
        </form>
      </div> : null}
    </main>
  );
}
