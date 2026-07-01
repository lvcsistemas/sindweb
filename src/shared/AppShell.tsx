import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { NavLink, Outlet } from "react-router-dom";
import { ChevronRight, Circle, Folder, LogOut, ShieldCheck, UsersRound } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../features/auth/AuthProvider";

const supabaseUnsafe = supabase as any;

export function AppShell() {
  const { signOut, user } = useAuth();
  const queryClient = useQueryClient();
  const [claiming, setClaiming] = useState(false);
  const [claimMessage, setClaimMessage] = useState<string | null>(null);
  const [cadastrosOpen, setCadastrosOpen] = useState(false);
  const [associadosOpen, setAssociadosOpen] = useState(false);

  async function claimFirstAdmin() {
    setClaiming(true);
    setClaimMessage(null);

    try {
      const { error } = await supabaseUnsafe.rpc("claim_first_admin");
      if (error) throw error;
      await queryClient.invalidateQueries();
      setClaimMessage("Administrador inicial ativado. Você já pode usar os cadastros.");
    } catch (error) {
      setClaimMessage(error instanceof Error ? error.message : "Não foi possível ativar o administrador inicial.");
    } finally {
      setClaiming(false);
    }
  }

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
          <button className="secondary-button compact-button" onClick={() => void claimFirstAdmin()} disabled={claiming}>
            <ShieldCheck size={16} /> {claiming ? "Ativando..." : "Ativar admin inicial"}
          </button>
          <span>{user?.email}</span>
          <button className="icon-button" onClick={() => void signOut()} aria-label="Sair"><LogOut size={18} /></button>
        </header>
        {claimMessage ? <div className="system-message">{claimMessage}</div> : null}
        <Outlet />
      </div>
    </div>
  );
}
