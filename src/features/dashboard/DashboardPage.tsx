import { Building2, ClipboardList, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { getConfig } from "../config/configApi";

function formatDateBr(value: string | null | undefined) {
  if (!value) return "-";

  const date = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("pt-BR").format(date);
}

export function DashboardPage() {
  const configQuery = useQuery({ queryKey: ["config"], queryFn: getConfig });
  const config = configQuery.data;

  return (
    <main className="dashboard-page">
      <Breadcrumb items={[]} />
      <section className="dashboard-header">
        <div>
          <h1>Painel Principal</h1>
          <p>Visao inicial do SindWeb. Use o menu lateral para acessar os modulos do sistema.</p>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-tile dashboard-contract-tile">
          <FileText size={22} />
          <div>
            <strong>CONTRATO</strong>
            <span>{configQuery.isLoading ? "Carregando..." : formatDateBr(config?.created_at)}</span>
            <strong>VENCIMENTO</strong>
            <span>{configQuery.isLoading ? "Carregando..." : formatDateBr(config?.dt_vencimento)}</span>
          </div>
        </article>
        <article className="dashboard-tile muted">
          <Building2 size={22} />
          <div>
            <strong>Empresas</strong>
            <span>Proximo modulo de cadastro.</span>
          </div>
        </article>
        <article className="dashboard-tile muted">
          <ClipboardList size={22} />
          <div>
            <strong>Financeiro</strong>
            <span>Planejado para etapa posterior.</span>
          </div>
        </article>
      </section>
    </main>
  );
}
