import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { AppShell } from "./shared/AppShell";
import { AuthProvider } from "./features/auth/AuthProvider";
import { LoginPage } from "./features/auth/LoginPage";
import { ProtectedRoute } from "./features/auth/ProtectedRoute";
import { AssociadosPage } from "./features/associados/AssociadosPage";
import { AtendimentoMedicoConvenioPage } from "./features/atendimentoMedicoConvenio/AtendimentoMedicoConvenioPage";
import { AtendimentoMedicoEspecialidadePage } from "./features/atendimentoMedicoEspecialidade/AtendimentoMedicoEspecialidadePage";
import { AuxiliaresPage } from "./features/auxiliares/AuxiliaresPage";
import { CnaePage } from "./features/cnae/CnaePage";
import { ConfigPage } from "./features/config/ConfigPage";
import { ContribuicaoPage } from "./features/contribuicao/ContribuicaoPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { EmpresaPage } from "./features/empresa/EmpresaPage";
import { EscritorioPage } from "./features/escritorio/EscritorioPage";
import { LocalTrabalhoPage } from "./features/localTrabalho/LocalTrabalhoPage";
import { UsuariosPage } from "./features/usuarios/UsuariosPage";
import "./styles.css";

const queryClient = new QueryClient();

const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: "associados", element: <AssociadosPage /> },
      { path: "empresas", element: <EmpresaPage /> },
      { path: "atendimento-medico-convenios", element: <AtendimentoMedicoConvenioPage /> },
      { path: "atendimento-medico-especialidades", element: <AtendimentoMedicoEspecialidadePage /> },
      { path: "auxiliares/:grupoPath", element: <AuxiliaresPage /> },
      { path: "cnae", element: <CnaePage /> },
      { path: "config", element: <ConfigPage /> },
      { path: "contribuicao", element: <ContribuicaoPage /> },
      { path: "escritorios", element: <EscritorioPage /> },
      { path: "local-trabalho", element: <LocalTrabalhoPage /> },
      { path: "usuarios", element: <UsuariosPage /> }
    ]
  }
]);

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
