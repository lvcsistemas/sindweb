import { Building2, ClipboardList, UsersRound } from "lucide-react";

export function DashboardPage() {
  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <h1>Painel Principal</h1>
          <p>Visão inicial do SindWeb. Use o menu lateral para acessar os módulos do sistema.</p>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="dashboard-tile">
          <UsersRound size={22} />
          <div>
            <strong>Associados</strong>
            <span>Cadastro inicial disponível.</span>
          </div>
        </article>
        <article className="dashboard-tile muted">
          <Building2 size={22} />
          <div>
            <strong>Empresas</strong>
            <span>Próximo módulo de cadastro.</span>
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
