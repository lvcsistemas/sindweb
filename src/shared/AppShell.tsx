import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { ChevronRight, Circle, Folder, LogOut, UsersRound } from "lucide-react";
import { useAuth } from "../features/auth/AuthProvider";

export function AppShell() {
  const { signOut, user } = useAuth();
  const [cadastrosOpen, setCadastrosOpen] = useState(false);
  const [associadosOpen, setAssociadosOpen] = useState(false);

  return (
    <div className="app-shell">
      <aside className="sidebar">
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
          <span>{user?.email}</span>
          <button className="icon-button" onClick={() => void signOut()} aria-label="Sair"><LogOut size={18} /></button>
        </header>
        <Outlet />
      </div>
    </div>
  );
}
