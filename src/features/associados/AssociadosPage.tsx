import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search } from "lucide-react";
import type { AssociadoLista } from "../../types/database";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { getAssociado, getFotoUrl, listAssociados } from "./associadosApi";
import { AssociadoForm } from "./AssociadoForm";

export function AssociadosPage() {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const associadosQuery = useQuery({ queryKey: ["associados", search], queryFn: () => listAssociados(search) });
  const associadoQuery = useQuery({ queryKey: ["associado", selectedId], queryFn: () => getAssociado(selectedId!), enabled: Boolean(selectedId) });

  const associados = associadosQuery.data ?? [];

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Cadastros" }, { label: "Associados" }]} />
      <section className="module-header">
        <div>
          <h1>Associados</h1>
          <p>Cadastro inicial migrado do LSIND desktop.</p>
        </div>
        <button onClick={() => setSelectedId(null)}><Plus size={16} /> Novo</button>
      </section>

      <section className="split-view">
        <div className="list-panel">
          <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, CPF ou matrícula" /></label>
          <div className="record-list">
            {associadosQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
            {associados.map((associado) => (
              <AssociadoRow key={associado.id} associado={associado} selected={associado.id === selectedId} onClick={() => setSelectedId(associado.id)} />
            ))}
            {!associadosQuery.isLoading && associados.length === 0 ? <div className="empty-state">Nenhum associado encontrado.</div> : null}
          </div>
        </div>

        <div className="detail-panel">
          {associadoQuery.isFetching ? <div className="empty-state">Abrindo cadastro...</div> : null}
          <AssociadoForm associado={associadoQuery.data ?? null} onSaved={(id) => setSelectedId(id)} />
        </div>
      </section>
    </main>
  );
}

function AssociadoRow({ associado, selected, onClick }: { associado: AssociadoLista; selected: boolean; onClick: () => void }) {
  const fotoUrl = getFotoUrl(associado.foto_path);

  return (
    <button className={`record-row ${selected ? "selected" : ""}`} onClick={onClick}>
      <div className="avatar">{fotoUrl ? <img src={fotoUrl} alt="" /> : associado.nome.slice(0, 1)}</div>
      <div>
        <strong>{associado.nome}</strong>
        <span>{associado.matricula ?? "Sem matrícula"} · {associado.empresa_nome ?? "Sem empresa"}</span>
      </div>
      <small className={associado.ativo ? "status-ok" : "status-muted"}>{associado.ativo ? "Ativo" : "Inativo"}</small>
    </button>
  );
}
