import { Building2, FileText, UsersRound }  from "lucide-react";
import { useQuery }                         from "@tanstack/react-query";
import { Breadcrumb }                       from "../../shared/Breadcrumb";
import { getConfig }                        from "../config/configApi";
import { countAssociados, countEmpresas }   from "./dashboardApi";

function formatDateBr(value: string | null | undefined) {
  if (!value) return "-";
  const date = value.includes("T") ? new Date(value) : new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR").format(value ?? 0);
}

export function DashboardPage() {
  const configQuery     = useQuery({ queryKey: ["config"], queryFn: getConfig });
  const empresasQuery   = useQuery({ queryKey: ["dashboard-empresas-count"], queryFn: countEmpresas });
  const associadosQuery = useQuery({ queryKey: ["dashboard-associados-count"], queryFn: countAssociados });
  const config          = configQuery.data;

  return (
    <main className="dashboard-page">
      <Breadcrumb items={[]} />

      <section className="dashboard-grid">
        <article className="dashboard-tile dashboard-info-tile">
          <FileText size={22} />
          <div>
            <strong>CONTRATO</strong>
            <span>{configQuery.isLoading ? "Carregando..." : formatDateBr(config?.created_at)}</span>
            <strong>VENCIMENTO</strong>
            <span>{configQuery.isLoading ? "Carregando..." : formatDateBr(config?.dt_vencimento)}</span>
          </div>
        </article>
        <article className="dashboard-tile dashboard-info-tile muted">
          <Building2 size={22} />
          <div>
            <strong>EMPRESAS</strong>
            <span>{empresasQuery.isLoading ? "Carregando..." : formatNumber(empresasQuery.data)}</span>
          </div>
        </article>
        <article className="dashboard-tile dashboard-info-tile muted">
          <UsersRound size={22} />
          <div>
            <strong>ASSOCIADOS</strong>
            <span>{associadosQuery.isLoading ? "Carregando..." : formatNumber(associadosQuery.data)}</span>
            <strong>ULTIMA MATRICULA</strong>
            <span>{configQuery.isLoading ? "Carregando..." : formatNumber(config?.ultima_matricula)}</span>
          </div>
        </article>
      </section>
    </main>
  );
}
