import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, Save, Search, UserRound } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { listUsuarios, saveUsuario, type UsuarioPayload, type UsuarioRow } from "./usuariosApi";

const emptyForm: UsuarioPayload = {
  email: "",
  password: "",
  full_name: "",
  codinome: ""
};

export function UsuariosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<UsuarioPayload>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const usuariosQuery = useQuery({ queryKey: ["usuarios"], queryFn: listUsuarios });
  const usuarios = usuariosQuery.data ?? [];
  const selectedUser = usuarios.find((usuario) => usuario.id === selectedId) ?? null;

  useEffect(() => {
    if (!selectedUser) {
      setForm(emptyForm);
      return;
    }

    setForm({
      id: selectedUser.id,
      email: selectedUser.email ?? "",
      password: "",
      full_name: selectedUser.full_name ?? "",
      codinome: selectedUser.codinome ?? ""
    });
  }, [selectedUser]);

  const filteredUsuarios = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return usuarios;

    return usuarios.filter((usuario) => {
      const text = `${usuario.email ?? ""} ${usuario.full_name ?? ""} ${usuario.codinome ?? ""}`.toLowerCase();
      return text.includes(term);
    });
  }, [usuarios, search]);

  const saveMutation = useMutation({
    mutationFn: saveUsuario,
    onSuccess: async (id) => {
      setSelectedId(id);
      setMessage("Usuario salvo com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setForm((current) => ({ ...current, id, password: "" }));
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o usuario.")
  });

  function handleNew() {
    setSelectedId(null);
    setMessage(null);
    setForm(emptyForm);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    saveMutation.mutate({
      ...form,
      email: form.email.trim(),
      full_name: form.full_name?.trim(),
      codinome: form.codinome?.trim(),
      password: form.password?.trim() || undefined
    });
  }

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Cadastros" }, { label: "Usuários" }, { label: "Cadastro" }]} />
      <section className="module-header">
        <div>
          <h1>Usuários</h1>
          <p>Cadastro de acesso ao SindWeb.</p>
        </div>
        <button onClick={handleNew}><Plus size={16} /> Novo</button>
      </section>

      <section className="split-view">
        <div className="list-panel">
          <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, e-mail ou codinome" /></label>
          <div className="record-list">
            {usuariosQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
            {filteredUsuarios.map((usuario) => (
              <UsuarioRowView key={usuario.id} usuario={usuario} selected={usuario.id === selectedId} onClick={() => setSelectedId(usuario.id)} />
            ))}
            {!usuariosQuery.isLoading && filteredUsuarios.length === 0 ? <div className="empty-state">Nenhum usuário encontrado.</div> : null}
          </div>
        </div>

        <div className="detail-panel">
          <form className="form-panel" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label>
                E-mail
                <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
              </label>
              <label>
                Senha {form.id ? "(opcional)" : ""}
                <input type="password" value={form.password ?? ""} onChange={(event) => setForm({ ...form, password: event.target.value })} required={!form.id} minLength={6} autoComplete="new-password" />
              </label>
              <label>
                Nome
                <input value={form.full_name ?? ""} onChange={(event) => setForm({ ...form, full_name: event.target.value })} />
              </label>
              <label>
                Codinome
                <input value={form.codinome ?? ""} onChange={(event) => setForm({ ...form, codinome: event.target.value })} />
              </label>
            </div>

            {message ? <div className={saveMutation.isError ? "form-error" : "form-success"}>{message}</div> : null}

            <div className="form-actions">
              <button type="submit" disabled={saveMutation.isPending}><Save size={16} /> {saveMutation.isPending ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        </div>
      </section>
    </main>
  );
}

function UsuarioRowView({ usuario, selected, onClick }: { usuario: UsuarioRow; selected: boolean; onClick: () => void }) {
  const label = usuario.full_name || usuario.email || "Usuário";

  return (
    <button className={`record-row ${selected ? "selected" : ""}`} onClick={onClick}>
      <div className="avatar"><UserRound size={19} /></div>
      <div>
        <strong>{label}</strong>
        <span>{usuario.email ?? "Sem e-mail"}</span>
      </div>
      <small className="status-muted">Acesso</small>
    </button>
  );
}
