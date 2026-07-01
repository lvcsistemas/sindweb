import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ChevronRight, Circle, Folder, LogOut, Menu, UsersRound } from "lucide-react";
import { useAuth } from "../features/auth/AuthProvider";

export function AppShell() {
  const { signOut, user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [cadastrosOpen, setCadastrosOpen] = useState(false);
  const [associadosOpen, setAssociadosOpen] = useState(false);

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
                <button className="nav-toggle nested" onClick={() => setAssociadosOpen((open) => !open)} aria-expanded={associadosOpen}>
                  <ChevronRight className="nav-chevron" size={16} />
                  <UsersRound size={17} /> Associados
                </button>
                {associadosOpen ? <NavLink className="nav-leaf" to="/associados"><Circle size={10} /> Cadastro</NavLink> : null}
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
