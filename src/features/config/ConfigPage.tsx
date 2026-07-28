import { FormEvent, useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Breadcrumb } from "../../shared/Breadcrumb";
import type { ConfigUpdate } from "../../types/database";
import { consultarCep } from "../empresa/empresaApi";
import { getConfig, saveConfig } from "./configApi";

function onlyDigits(value: string | null | undefined) {
  return value?.replace(/\D/g, "") ?? "";
}

function formatCpfCnpj(value: string | null | undefined) {
  const digits = onlyDigits(value).slice(0, 14);

  if (digits.length <= 11) {
    return digits
      .replace(/^(\d{3})(\d)/, "$1.$2")
      .replace(/^(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
      .replace(/\.(\d{3})(\d)/, ".$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
}

function formatCep(value: string | null | undefined) {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.replace(/^(\d{5})(\d)/, "$1-$2");
}

function formatTelefone(value: string | null | undefined) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 10) {
    return digits
      .replace(/^(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{4})(\d)/, "$1-$2");
  }

  return digits
    .replace(/^(\d{2})(\d)/, "($1) $2")
    .replace(/(\d{5})(\d)/, "$1-$2");
}

const emptyForm: ConfigUpdate = {
  cpf_cnpj: "",
  dt_vencimento: "",
  razao_social: "",
  nm_fantasia: "",
  nm_diretor: "",
  email: "",
  telefone: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "RJ",
  obs: "",
  ultima_matricula: 0,
  qtd_exames: 0,
  qtd_consultas: 0
};

export function ConfigPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<ConfigUpdate>(emptyForm);
  const [message, setMessage] = useState<string | null>(null);

  const configQuery = useQuery({ queryKey: ["config"], queryFn: getConfig });

  useEffect(() => {
    if (!configQuery.data) return;
    setForm({
      cpf_cnpj: formatCpfCnpj(configQuery.data.cpf_cnpj),
      dt_vencimento: configQuery.data.dt_vencimento ?? "",
      razao_social: configQuery.data.razao_social ?? "",
      nm_fantasia: configQuery.data.nm_fantasia ?? "",
      nm_diretor: configQuery.data.nm_diretor ?? "",
      email: configQuery.data.email ?? "",
      telefone: formatTelefone(configQuery.data.telefone),
      cep: formatCep(configQuery.data.cep),
      endereco: configQuery.data.endereco ?? "",
      numero: configQuery.data.numero ?? "",
      complemento: configQuery.data.complemento ?? "",
      bairro: configQuery.data.bairro ?? "",
      cidade: configQuery.data.cidade ?? "",
      uf: configQuery.data.uf ?? "RJ",
      obs: configQuery.data.obs ?? "",
      ultima_matricula: configQuery.data.ultima_matricula,
      qtd_exames: configQuery.data.qtd_exames,
      qtd_consultas: configQuery.data.qtd_consultas
    });
  }, [configQuery.data]);

  const cepMutation = useMutation({
    mutationFn: consultarCep,
    onSuccess: (data) => {
      setForm((current) => {
        if (current.endereco?.trim()) return current;

        return {
          ...current,
          cep: formatCep(data.cep),
          endereco: data.street ?? current.endereco,
          bairro: data.neighborhood ?? current.bairro,
          cidade: data.city ?? current.cidade,
          uf: data.state ?? current.uf
        };
      });
    }
  });

  const saveMutation = useMutation({
    mutationFn: saveConfig,
    onSuccess: async (saved) => {
      setForm({
        cpf_cnpj: formatCpfCnpj(saved.cpf_cnpj),
        dt_vencimento: saved.dt_vencimento ?? "",
        razao_social: saved.razao_social ?? "",
        nm_fantasia: saved.nm_fantasia ?? "",
        nm_diretor: saved.nm_diretor ?? "",
        email: saved.email ?? "",
        telefone: formatTelefone(saved.telefone),
        cep: formatCep(saved.cep),
        endereco: saved.endereco ?? "",
        numero: saved.numero ?? "",
        complemento: saved.complemento ?? "",
        bairro: saved.bairro ?? "",
        cidade: saved.cidade ?? "",
        uf: saved.uf ?? "RJ",
        obs: saved.obs ?? "",
        ultima_matricula: saved.ultima_matricula,
        qtd_exames: saved.qtd_exames,
        qtd_consultas: saved.qtd_consultas
      });
      setMessage("Configuracoes salvas com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["config"] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar as configuracoes.")
  });

  function handleCepBlur() {
    const digits = onlyDigits(form.cep);
    if (digits.length !== 8 || form.endereco?.trim()) return;
    cepMutation.mutate(digits);
  }

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

      <section className="single-form-view config-form-view">
        <form className="form-panel" onSubmit={handleSubmit}>
          {configQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}

          <div className="form-grid config-identificacao-grid">
            <label className="field"><input value={form.cpf_cnpj ?? ""} maxLength={18} onChange={(event) => setForm({ ...form, cpf_cnpj: formatCpfCnpj(event.target.value) })} placeholder=" " /><span>CPF/CNPJ</span></label>
            <label className="field"><input type="date" value={form.dt_vencimento ?? ""} onChange={(event) => setForm({ ...form, dt_vencimento: event.target.value })} placeholder=" " /><span>Data de Vencimento</span></label>
          </div>

          <div className="form-grid">
            <label className="field"><input value={form.razao_social ?? ""} onChange={(event) => setForm({ ...form, razao_social: event.target.value })} placeholder=" " /><span>Razao Social</span></label>
            <label className="field"><input value={form.nm_fantasia ?? ""} onChange={(event) => setForm({ ...form, nm_fantasia: event.target.value })} placeholder=" " /><span>Nome Fantasia</span></label>
          </div>

          <div className="form-grid compact">
            <label className="field"><input value={form.nm_diretor ?? ""} onChange={(event) => setForm({ ...form, nm_diretor: event.target.value })} placeholder=" " /><span>Nome Diretor</span></label>
            <label className="field"><input type="email" value={form.email ?? ""} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder=" " /><span>Email</span></label>
            <label className="field"><input value={form.telefone ?? ""} maxLength={15} onChange={(event) => setForm({ ...form, telefone: formatTelefone(event.target.value) })} placeholder=" " /><span>Telefone</span></label>
          </div>

          <div className="form-grid residence-cep-grid">
            <label className="field"><input value={form.cep ?? ""} maxLength={9} onBlur={handleCepBlur} onChange={(event) => setForm({ ...form, cep: formatCep(event.target.value) })} placeholder=" " /><span>CEP</span></label>
          </div>

          <div className="form-grid residence-address-grid">
            <label className="field"><input value={form.endereco ?? ""} onChange={(event) => setForm({ ...form, endereco: event.target.value })} placeholder=" " /><span>Endereco</span></label>
            <label className="field"><input value={form.numero ?? ""} onChange={(event) => setForm({ ...form, numero: event.target.value })} placeholder=" " /><span>Numero</span></label>
            <label className="field"><input value={form.complemento ?? ""} onChange={(event) => setForm({ ...form, complemento: event.target.value })} placeholder=" " /><span>Complemento</span></label>
          </div>

          <div className="form-grid residence-city-grid">
            <label className="field"><input value={form.bairro ?? ""} onChange={(event) => setForm({ ...form, bairro: event.target.value })} placeholder=" " /><span>Bairro</span></label>
            <label className="field"><input value={form.cidade ?? ""} onChange={(event) => setForm({ ...form, cidade: event.target.value })} placeholder=" " /><span>Cidade</span></label>
            <label className="field"><input value={form.uf ?? ""} maxLength={2} onChange={(event) => setForm({ ...form, uf: event.target.value.toUpperCase() })} placeholder=" " /><span>UF</span></label>
          </div>

          <label className="field"><textarea rows={4} value={form.obs ?? ""} onChange={(event) => setForm({ ...form, obs: event.target.value })} placeholder=" " /><span>Obs</span></label>

          <div className="form-grid compact">
            <label className="field"><input type="number" min={0} step={1} value={form.ultima_matricula ?? 0} onChange={(event) => setForm({ ...form, ultima_matricula: Number(event.target.value) })} placeholder=" " required /><span>Ultima Matricula</span></label>
            <label className="field"><input type="number" min={0} step={1} value={form.qtd_exames ?? 0} onChange={(event) => setForm({ ...form, qtd_exames: Number(event.target.value) })} placeholder=" " /><span>Quantidade de Exames</span></label>
            <label className="field"><input type="number" min={0} step={1} value={form.qtd_consultas ?? 0} onChange={(event) => setForm({ ...form, qtd_consultas: Number(event.target.value) })} placeholder=" " /><span>Quantidade de Consultas</span></label>
          </div>

          {message ? <div className={saveMutation.isError ? "form-error" : "form-success"}>{message}</div> : null}
          {cepMutation.isError ? <div className="form-error">{cepMutation.error instanceof Error ? cepMutation.error.message : "Nao foi possivel consultar esse CEP."}</div> : null}

          <div className="form-actions">
            <button type="button" className="secondary-button" onClick={() => navigate("/")}><LogOut size={16} /> Sair</button>
            <button type="submit" disabled={saveMutation.isPending || configQuery.isLoading}><Save size={16} /> {saveMutation.isPending ? "Salvando..." : "Salvar"}</button>
          </div>
        </form>
      </section>
    </main>
  );
}
