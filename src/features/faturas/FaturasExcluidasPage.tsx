import { FormEvent, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { listFaturasExcluidas, type FaturaFilters } from "./faturasApi";

const currentYear = new Date().getFullYear();

function dateOnly(date: Date) {
  return date.toISOString().slice(0, 10);
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

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const date = new Date(value);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  }).format(date);
}

function formatDocumento(value: string | null | undefined) {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (digits.length === 11) return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  if (digits.length === 14) return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  return value ?? "-";
}

type FaturasExcluidasFilters = Omit<FaturaFilters, "situacao">;

export function FaturasExcluidasPage() {
  const [filters, setFilters] = useState<FaturasExcluidasFilters>({ sacadoTipo: "TODOS", inicio: monthStart(), fim: yearEnd(), valor: "" });
  const [draftFilters, setDraftFilters] = useState<FaturasExcluidasFilters>(filters);
  const faturasQuery = useQuery({ queryKey: ["faturas-excluidas", filters], queryFn: () => listFaturasExcluidas(filters) });

  const faturas = faturasQuery.data ?? [];
  const totalLabel = useMemo(() => `${faturas.length} registro${faturas.length === 1 ? "" : "s"}`, [faturas.length]);

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFilters(draftFilters);
  }

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Financeiro" }, { label: "Faturas Excluidas" }]} />
      <section className="module-header">
        <div>
          <h1>Faturas Excluidas</h1>
          <p>Consulta de faturas canceladas com data e usuario responsavel.</p>
        </div>
      </section>

      <section className="form-panel atendimento-search-panel">
        <form className="atendimento-search-grid homologacao-search-grid" onSubmit={handleSearch}>
          <label className="field"><select value={draftFilters.sacadoTipo} onChange={(event) => setDraftFilters({ ...draftFilters, sacadoTipo: event.target.value as FaturaFilters["sacadoTipo"] })}><option value="TODOS">TODOS</option><option value="ASSOCIADO">ASSOCIADO</option><option value="EMPRESA">EMPRESA</option></select><span>Tipo sacado</span></label>
          <label className="field"><input type="date" value={draftFilters.inicio} onChange={(event) => setDraftFilters({ ...draftFilters, inicio: event.target.value })} placeholder=" " /><span>Exclusao inicial</span></label>
          <label className="field"><input type="date" value={draftFilters.fim} onChange={(event) => setDraftFilters({ ...draftFilters, fim: event.target.value })} placeholder=" " /><span>Exclusao final</span></label>
          <label className="field"><input value={draftFilters.valor} onChange={(event) => setDraftFilters({ ...draftFilters, valor: event.target.value })} placeholder=" " /><span>Valor procurado</span></label>
          <button type="submit"><Search size={16} /> Pesquisar</button>
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
                <th>Contribuicao</th>
                <th>Competencia</th>
                <th>Vencimento</th>
                <th className="numeric-cell">Valor</th>
                <th>Excluida em</th>
                <th>Usuario</th>
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
                  <td className="numeric-cell">{formatCurrency(item.valor_total)}</td>
                  <td>{formatDateTime(item.cancelada_em)}</td>
                  <td>{item.cancelada_por_codinome || item.cancelada_por_nome || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {faturasQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
          {!faturasQuery.isLoading && faturas.length === 0 ? <div className="empty-state">Nenhuma fatura excluida encontrada.</div> : null}
        </div>
      </section>
    </main>
  );
}
