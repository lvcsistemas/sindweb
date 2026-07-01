import { NavLink, Outlet } from "react-router-dom";
import { LogOut, UsersRound } from "lucide-react";
import { useAuth } from "../features/auth/AuthProvider";

export function AppShell() {
  const { signOut, user } = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">SindWeb</div>
        <nav>
          <NavLink to="/associados"><UsersRound size={18} /> Associados</NavLink>
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
