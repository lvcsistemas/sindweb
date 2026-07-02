import { FormEvent, useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Camera, Plus, Save, Search, UserRound } from "lucide-react";
import { Breadcrumb } from "../../shared/Breadcrumb";
import { getUsuarioFotoUrl, listUsuarios, saveUsuario, type UsuarioPayload, type UsuarioRow, uploadUsuarioFoto } from "./usuariosApi";

const emptyForm: UsuarioPayload = {
  email: "",
  password: "",
  full_name: "",
  codinome: "",
  avatar_path: null
};

export function UsuariosPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creatingNew, setCreatingNew] = useState(false);
  const [form, setForm] = useState<UsuarioPayload>(emptyForm);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const usuariosQuery = useQuery({ queryKey: ["usuarios"], queryFn: listUsuarios });
  const usuarios = usuariosQuery.data ?? [];
  const selectedUser = usuarios.find((usuario) => usuario.id === selectedId) ?? null;
  const formOpen = creatingNew || Boolean(selectedId);

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
      codinome: selectedUser.codinome ?? "",
      avatar_path: selectedUser.avatar_path
    });
    setPhotoFile(null);
  }, [selectedUser]);

  useEffect(() => {
    if (!photoFile) {
      setPhotoPreview(getUsuarioFotoUrl(form.avatar_path));
      return;
    }

    const previewUrl = URL.createObjectURL(photoFile);
    setPhotoPreview(previewUrl);
    return () => URL.revokeObjectURL(previewUrl);
  }, [form.avatar_path, photoFile]);

  const filteredUsuarios = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return usuarios;

    return usuarios.filter((usuario) => {
      const text = `${usuario.email ?? ""} ${usuario.full_name ?? ""} ${usuario.codinome ?? ""}`.toLowerCase();
      return text.includes(term);
    });
  }, [usuarios, search]);

  const saveMutation = useMutation({
    mutationFn: async (values: UsuarioPayload) => {
      const id = await saveUsuario(values);
      if (!photoFile) return id;

      const avatarPath = await uploadUsuarioFoto(id, photoFile);
      await saveUsuario({ ...values, id, password: undefined, avatar_path: avatarPath });
      return id;
    },
    onSuccess: async (id) => {
      setSelectedId(id);
      setCreatingNew(false);
      setPhotoFile(null);
      setMessage("Usuario salvo com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["usuarios"] });
      setForm((current) => ({ ...current, id, password: "" }));
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o usuario.")
  });

  function handleNew() {
    setSelectedId(null);
    setCreatingNew(true);
    setMessage(null);
    setPhotoFile(null);
    setForm(emptyForm);
  }

  function handleSelectUser(id: string) {
    setSelectedId(id);
    setCreatingNew(false);
    setMessage(null);
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

      <section className={`split-view ${formOpen ? "" : "list-only"}`}>
        <div className="list-panel">
          <label className="search-box"><Search size={16} /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar por nome, e-mail ou codinome" /></label>
          <div className="record-list">
            {usuariosQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
            {filteredUsuarios.map((usuario) => (
              <UsuarioRowView key={usuario.id} usuario={usuario} selected={usuario.id === selectedId} onClick={() => handleSelectUser(usuario.id)} />
            ))}
            {!usuariosQuery.isLoading && filteredUsuarios.length === 0 ? <div className="empty-state">Nenhum usuário encontrado.</div> : null}
          </div>
        </div>

        {formOpen ? <div className="detail-panel">
          <form className="form-panel" onSubmit={handleSubmit}>
            <div className="form-grid">
              <label className="field">
                <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder=" " required />
                <span>E-mail</span>
              </label>
              <label className="field">
                <input type="password" value={form.password ?? ""} onChange={(event) => setForm({ ...form, password: event.target.value })} required={!form.id} minLength={6} autoComplete="new-password" placeholder=" " />
                <span>Senha {form.id ? "(opcional)" : ""}</span>
              </label>
              <label className="field">
                <input value={form.full_name ?? ""} onChange={(event) => setForm({ ...form, full_name: event.target.value })} placeholder=" " />
                <span>Nome</span>
              </label>
              <label className="field">
                <input value={form.codinome ?? ""} onChange={(event) => setForm({ ...form, codinome: event.target.value })} placeholder=" " />
                <span>Codinome</span>
              </label>
            </div>

            <div className="photo-field">
              <div className="avatar large">{photoPreview ? <img src={photoPreview} alt="" /> : <UserRound size={30} />}</div>
              <label className="secondary-button">
                <Camera size={16} /> Foto do usuario
                <input type="file" accept="image/*" onChange={(event) => setPhotoFile(event.target.files?.[0] ?? null)} />
              </label>
            </div>

            {message ? <div className={saveMutation.isError ? "form-error" : "form-success"}>{message}</div> : null}

            <div className="form-actions">
              <button type="submit" disabled={saveMutation.isPending}><Save size={16} /> {saveMutation.isPending ? "Salvando..." : "Salvar"}</button>
            </div>
          </form>
        </div> : null}
      </section>
    </main>
  );
}

function UsuarioRowView({ usuario, selected, onClick }: { usuario: UsuarioRow; selected: boolean; onClick: () => void }) {
  const label = usuario.full_name || usuario.email || "Usuário";
  const avatarUrl = getUsuarioFotoUrl(usuario.avatar_path);

  return (
    <button className={`record-row ${selected ? "selected" : ""}`} onClick={onClick}>
      <div className="avatar">{avatarUrl ? <img src={avatarUrl} alt="" /> : <UserRound size={19} />}</div>
      <div>
        <strong>{label}</strong>
        <span>{usuario.email ?? "Sem e-mail"}</span>
      </div>
      <small className="status-muted">Acesso</small>
    </button>
  );
}
