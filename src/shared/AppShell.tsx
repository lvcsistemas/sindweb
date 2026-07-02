import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { BriefcaseBusiness, Building2, ChevronRight, Coins, FileText, Folder, Handshake, ListTree, LogOut, Menu, Stethoscope, UserCog, UsersRound } from "lucide-react";
import { useAuth } from "../features/auth/AuthProvider";
import { AUXILIAR_GRUPOS } from "../features/auxiliares/auxiliaresConfig";

export function AppShell() {
  const { signOut, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cadastrosOpen, setCadastrosOpen] = useState(false);
  const [atendimentosOpen, setAtendimentosOpen] = useState(false);
  const [financeiroOpen, setFinanceiroOpen] = useState(false);
  const [auxiliaresOpen, setAuxiliaresOpen] = useState(false);

  return (
    <div className={`app-shell ${sidebarOpen ? "sidebar-open" : "sidebar-closed"}`}>
      <aside className="sidebar" aria-hidden={!sidebarOpen}>
        <div className="brand">SindWeb</div>
        <nav className="side-nav">
          <div className="nav-group">
            <button className="nav-toggle" onClick={() => setCadastrosOpen((open) => !open)} aria-expanded={cadastrosOpen}>
              <ChevronRight className="nav-chevron" size={16} />
              <Folder size={18} /> Cadastros
            </button>
            {cadastrosOpen ? (
              <div className="nav-subgroup">
                <NavLink className="nav-leaf direct" to="/associados"><UsersRound size={17} /> Associados</NavLink>
                <NavLink className="nav-leaf direct" to="/atendimento-medico-convenios"><Stethoscope size={17} /> Atendimento Médico Convênios</NavLink>
                <NavLink className="nav-leaf direct" to="/atendimento-medico-especialidades"><Stethoscope size={17} /> Atendimento Médico Especialidades</NavLink>
                <NavLink className="nav-leaf direct" to="/cnae"><FileText size={17} /> CNAE</NavLink>
                <NavLink className="nav-leaf direct" to="/escritorios"><Building2 size={17} /> Escritórios</NavLink>
                <NavLink className="nav-leaf direct" to="/contribuicao"><Coins size={17} /> Contribuições</NavLink>
                <NavLink className="nav-leaf direct" to="/usuarios"><UserCog size={17} /> Usuários</NavLink>
              </div>
            ) : null}
          </div>
          <div className="nav-group">
            <button className="nav-toggle" onClick={() => setAtendimentosOpen((open) => !open)} aria-expanded={atendimentosOpen}>
              <ChevronRight className="nav-chevron" size={16} />
              <Handshake size={18} /> Atendimentos
            </button>
            {atendimentosOpen ? <div className="nav-subgroup empty-state small">Sem itens cadastrados.</div> : null}
          </div>
          <div className="nav-group">
            <button className="nav-toggle" onClick={() => setFinanceiroOpen((open) => !open)} aria-expanded={financeiroOpen}>
              <ChevronRight className="nav-chevron" size={16} />
              <BriefcaseBusiness size={18} /> Financeiro
            </button>
            {financeiroOpen ? <div className="nav-subgroup empty-state small">Sem itens cadastrados.</div> : null}
          </div>
          <div className="nav-group">
            <button className="nav-toggle" onClick={() => setAuxiliaresOpen((open) => !open)} aria-expanded={auxiliaresOpen}>
              <ChevronRight className="nav-chevron" size={16} />
              <ListTree size={18} /> Auxiliares
            </button>
            {auxiliaresOpen ? (
              <div className="nav-subgroup">
                {AUXILIAR_GRUPOS.map((grupo) => (
                  <NavLink key={grupo.key} className="nav-leaf direct" to={`/auxiliares/${grupo.path}`}>{grupo.label}</NavLink>
                ))}
              </div>
            ) : null}
          </div>
        </nav>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <button className="icon-button menu-button" onClick={() => setSidebarOpen((open) => !open)} aria-label={sidebarOpen ? "Fechar menu lateral" : "Abrir menu lateral"} aria-expanded={sidebarOpen}>
            <Menu size={20} />
          </button>
          <span className="topbar-spacer" />
          <span>{user?.email}</span>
          <button className="icon-button" onClick={() => void signOut()} aria-label="Sair"><LogOut size={18} /></button>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
