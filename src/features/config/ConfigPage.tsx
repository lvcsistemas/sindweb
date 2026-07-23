import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Breadcrumb } from "../../shared/Breadcrumb";
import type { ConfigUpdate } from "../../types/database";
import { getConfig, saveConfig } from "./configApi";

const emptyForm: ConfigUpdate = {
  ultima_matricula: 0
};

export function ConfigPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ConfigUpdate>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const configQuery = useQuery({ queryKey: ["config"], queryFn: getConfig });

  useEffect(() => {
    if (!configQuery.data) return;
    setForm({ ultima_matricula: configQuery.data.ultima_matricula });
  }, [configQuery.data]);

  const saveMutation = useMutation({
    mutationFn: saveConfig,
    onSuccess: async (saved) => {
      setForm({ ultima_matricula: saved.ultima_matricula });
      setMessage("Configuracoes salvas com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["config"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar as configuracoes.")
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    saveMutation.mutate(form);
  }

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Config" }]} />
      <section className="module-header">
        <div>
          <h1>Config</h1>
          <p>Configuracoes gerais do sistema.</p>
        </div>
      </section>

      <section className="single-form-view">
        <form className="form-panel" onSubmit={handleSubmit}>
          {configQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}

          <label className="field">
            <input
              type="number"
              min={0}
              step={1}
              value={form.ultima_matricula}
              onChange={(event) => setForm({ ...form, ultima_matricula: Number(event.target.value) })}
              placeholder=" "
              required
            />
            <span>Ultima Matricula</span>
          </label>

          {message ? <div className={saveMutation.isError ? "form-error" : "form-success"}>{message}</div> : null}

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={() => navigate("/")}><LogOut size={16} /> Sair</button>
            <button type="submit" disabled={saveMutation.isPending || configQuery.isLoading}><Save size={16} /> {saveMutation.isPending ? "Salvando..." : "Salvar"}</button>
          </div>
        </form>
      </section>
    </main>
  );
}
