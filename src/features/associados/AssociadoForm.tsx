import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Minus, Plus, Save, Upload } from "lucide-react";
import type { Associado } from "../../types/database";
import { associadoSchema, type AssociadoFormValues } from "./associadosSchema";
import { listAuxiliaresOptions, listEmpresas, listLookup, saveAssociado, uploadAssociadoFoto } from "./associadosApi";

const defaultValues: AssociadoFormValues = {
  ativo: true,
  gerar_matricula: false,
  nome: "",
  cpf: "",
  matricula: "",
  matricula_empresa: "",
  empresa_id: null,
  situacao_id: null,
  local_trabalho_id: null,
  local_pagamento_id: null,
  escolaridade_id: null,
  funcao_id: null,
  data_categoria: "",
  data_nascimento: "",
  data_admissao: "",
  data_situacao: "",
  data_ficha: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  uf: "",
  cep: "",
  tel1: "",
  tel2: "",
  tel3: "",
  email: "",
  rg: "",
  sexo: "",
  estado_civil: "",
  pis: "",
  ctps: "",
  ctps_serie: "",
  salario: 0,
  posto_trabalho: "",
  masterclin: "",
  observacao: "",
  foto_path: null
};

const detalheCards = ["Residência", "Contatos", "Identificação", "Classe"] as const;
type DetalheCard = typeof detalheCards[number];

function toInputDate(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function onlyDigits(value: string | null | undefined) {
  return value?.replace(/\D/g, "") ?? "";
}

function formatCep(value: string) {
  const digits = onlyDigits(value).slice(0, 8);
  return digits.length > 5 ? `${digits.slice(0, 5)}-${digits.slice(5)}` : digits;
}

function formatTelefone(value: string) {
  const digits = onlyDigits(value).slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

function toValues(associado: Associado | null): AssociadoFormValues {
  if (!associado) return defaultValues;
  return {
    id: associado.id,
    ativo: associado.ativo,
    gerar_matricula: false,
    nome: associado.nome,
    cpf: associado.cpf,
    matricula: associado.matricula ?? "",
    matricula_empresa: associado.matricula_empresa ?? "",
    empresa_id: associado.empresa_id,
    situacao_id: associado.situacao_id,
    local_trabalho_id: associado.local_trabalho_id,
    local_pagamento_id: associado.local_pagamento_id,
    escolaridade_id: associado.escolaridade_id,
    funcao_id: associado.funcao_id,
    data_categoria: toInputDate(associado.data_categoria),
    data_nascimento: toInputDate(associado.data_nascimento),
    data_admissao: toInputDate(associado.data_admissao),
    data_situacao: toInputDate(associado.data_situacao),
    data_ficha: toInputDate(associado.data_ficha),
    endereco: associado.endereco ?? "",
    numero: associado.numero ?? "",
    complemento: associado.complemento ?? "",
    bairro: associado.bairro ?? "",
    cidade: associado.cidade ?? "",
    uf: associado.uf ?? "",
    cep: associado.cep ?? "",
    tel1: associado.tel1 ?? "",
    tel2: associado.tel2 ?? "",
    tel3: associado.tel3 ?? "",
    email: associado.email ?? "",
    rg: associado.rg ?? "",
    sexo: associado.sexo ?? "",
    estado_civil: associado.estado_civil ?? "",
    pis: associado.pis ?? "",
    ctps: associado.ctps ?? "",
    ctps_serie: associado.ctps_serie ?? "",
    salario: associado.salario ?? 0,
    posto_trabalho: associado.posto_trabalho ?? "",
    masterclin: associado.masterclin ?? "",
    observacao: associado.observacao ?? "",
    foto_path: associado.foto_path
  };
}

export function AssociadoForm({ associado, onSaved }: { associado: Associado | null; onSaved: (id: number) => void }) {
  const queryClient = useQueryClient();
  const [savedId, setSavedId] = useState<number | null>(associado?.id ?? null);
  const [openCards, setOpenCards] = useState<Record<DetalheCard, boolean>>({
    Residência: false,
    Contatos: false,
    Identificação: false,
    Classe: false
  });
  const { data: empresas = [] } = useQuery({ queryKey: ["empresas"], queryFn: listEmpresas });
  const { data: situacoes = [] } = useQuery({ queryKey: ["auxiliares", "situacao"], queryFn: () => listAuxiliaresOptions("situacao") });
  const { data: locaisTrabalho = [] } = useQuery({ queryKey: ["lookup", "local_trabalho"], queryFn: () => listLookup("local_trabalho") });
  const { data: locaisPagamento = [] } = useQuery({ queryKey: ["lookup", "local_pagamento"], queryFn: () => listLookup("local_pagamento") });

  const form = useForm<AssociadoFormValues>({ resolver: zodResolver(associadoSchema), defaultValues: toValues(associado) });
  const isNew = !associado?.id;
  const gerarMatricula = form.watch("gerar_matricula");

  useEffect(() => {
    form.reset(toValues(associado));
    setSavedId(associado?.id ?? null);
  }, [associado, form]);

  useEffect(() => {
    if (isNew && gerarMatricula) {
      form.setValue("matricula", "");
    }
  }, [form, gerarMatricula, isNew]);

  const saveMutation = useMutation({
    mutationFn: saveAssociado,
    onSuccess: async (id) => {
      setSavedId(id);
      await queryClient.invalidateQueries({ queryKey: ["associados"] });
      await queryClient.invalidateQueries({ queryKey: ["associado", id] });
      onSaved(id);
    }
  });

  const photoMutation = useMutation({
    mutationFn: ({ id, file }: { id: number; file: File }) => uploadAssociadoFoto(id, file),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["associados"] });
      if (savedId) await queryClient.invalidateQueries({ queryKey: ["associado", savedId] });
    }
  });

  const errorList = useMemo(() => Object.values(form.formState.errors).map((error) => error.message).filter(Boolean), [form.formState.errors]);
  const cepField = form.register("cep");

  async function handleCepBlur() {
    const cep = onlyDigits(form.getValues("cep"));
    const enderecoAtual = String(form.getValues("endereco") ?? "").trim();
    if (cep.length !== 8 || enderecoAtual) return;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!response.ok) return;
      const data = await response.json() as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
      if (data.erro) return;

      form.setValue("cep", formatCep(cep), { shouldDirty: true });
      if (data.logradouro) form.setValue("endereco", data.logradouro.toUpperCase(), { shouldDirty: true });
      if (data.bairro) form.setValue("bairro", data.bairro.toUpperCase(), { shouldDirty: true });
      if (data.localidade) form.setValue("cidade", data.localidade.toUpperCase(), { shouldDirty: true });
      if (data.uf) form.setValue("uf", data.uf.toUpperCase(), { shouldDirty: true });
    } catch {
      // Consulta de CEP e apenas uma ajuda; o preenchimento manual continua livre.
    }
  }

  return (
    <form className="form-panel" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
      <div className={`form-grid associado-status-grid ${isNew ? "" : "existing"}`}>
        <label className="field"><input {...form.register("matricula")} placeholder=" " disabled={isNew && gerarMatricula} /><span>Matrícula</span></label>
        {isNew ? <label className="check"><input type="checkbox" {...form.register("gerar_matricula")} /> Gerar Matricula?</label> : null}
        <label className="field"><select {...form.register("situacao_id", { setValueAs: (value) => value ? Number(value) : null })}><option value="">Selecione</option>{situacoes.map((item) => <option key={item.id} value={item.id}>{item.nome}</option>)}</select><span>Situação</span></label>
        <label className="field"><input type="date" {...form.register("data_situacao")} placeholder=" " /><span>Data Situação</span></label>
      </div>
      <div className="form-grid">
        <label className="field"><input {...form.register("nome")} placeholder=" " /><span>Nome do Associado</span></label>
        <label className="field"><input {...form.register("cpf")} placeholder=" " /><span>CPF</span></label>
      </div>
      <div className="form-grid">
        <label className="field"><select {...form.register("empresa_id", { setValueAs: (value) => value ? Number(value) : null })}><option value="">Selecione</option>{empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome_fantasia}</option>)}</select><span>Empresa</span></label>
      </div>
      <div className="form-grid">
        <label className="field"><select {...form.register("local_trabalho_id", { setValueAs: (value) => value ? Number(value) : null })}><option value="">Selecione</option>{locaisTrabalho.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><span>Local Trabalho</span></label>
        <label className="field"><select {...form.register("local_pagamento_id", { setValueAs: (value) => value ? Number(value) : null })}><option value="">Selecione</option>{locaisPagamento.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select><span>Local Pagamento</span></label>
      </div>
      <div className="form-grid compact">
        <label className="field"><input type="date" {...form.register("data_nascimento")} placeholder=" " /><span>Nascimento</span></label>
        <label className="field"><input type="date" {...form.register("data_admissao")} placeholder=" " /><span>Admissão</span></label>
        <label className="field"><input type="date" {...form.register("data_categoria")} placeholder=" " /><span>Categoria</span></label>
      </div>
      <div className="form-grid compact">
        <label className="field"><input {...form.register("rg")} placeholder=" " /><span>RG</span></label>
        <label className="field"><select {...form.register("sexo")}><option value="">Selecione</option><option value="M">Masculino</option><option value="F">Feminino</option></select><span>Sexo</span></label>
        <label className="field"><input type="number" step="0.01" {...form.register("salario")} placeholder=" " /><span>Salário</span></label>
      </div>
      <label className="field"><textarea rows={3} {...form.register("observacao")} placeholder=" " /><span>Observação</span></label>
      <div className="detail-card-stack">
        {detalheCards.map((card) => {
          const isOpen = openCards[card];
          return (
            <section className="detail-card" key={card}>
              <div className="detail-card-title">
                <strong>{card}</strong>
                <button type="button" className="icon-button" aria-label={isOpen ? `Fechar ${card}` : `Abrir ${card}`} onClick={() => setOpenCards((current) => ({ ...current, [card]: !current[card] }))}>
                  {isOpen ? <Minus size={16} /> : <Plus size={16} />}
                </button>
              </div>
              {isOpen ? <div className="detail-card-body">
                {card === "Residência" ? <>
                  <div className="form-grid residence-cep-grid">
                    <label className="field">
                      <input
                        {...cepField}
                        maxLength={9}
                        placeholder=" "
                        onChange={(event) => form.setValue("cep", formatCep(event.target.value), { shouldDirty: true })}
                        onBlur={(event) => { void cepField.onBlur(event); void handleCepBlur(); }}
                      />
                      <span>CEP</span>
                    </label>
                  </div>
                  <div className="form-grid residence-address-grid">
                    <label className="field"><input {...form.register("endereco")} placeholder=" " /><span>Endereço</span></label>
                    <label className="field"><input {...form.register("numero")} placeholder=" " /><span>Número</span></label>
                    <label className="field"><input {...form.register("complemento")} placeholder=" " /><span>Complemento</span></label>
                  </div>
                  <div className="form-grid residence-city-grid">
                    <label className="field"><input {...form.register("bairro")} placeholder=" " /><span>Bairro</span></label>
                    <label className="field"><input {...form.register("cidade")} placeholder=" " /><span>Cidade</span></label>
                    <label className="field"><input maxLength={2} {...form.register("uf")} placeholder=" " /><span>UF</span></label>
                  </div>
                </> : null}
                {card === "Contatos" ? <>
                  <div className="form-grid contatos-phone-grid">
                    <label className="field"><input value={form.watch("tel1") ?? ""} maxLength={15} onChange={(event) => form.setValue("tel1", formatTelefone(event.target.value), { shouldDirty: true })} placeholder=" " /><span>Telefone 1</span></label>
                    <label className="field"><input value={form.watch("tel2") ?? ""} maxLength={15} onChange={(event) => form.setValue("tel2", formatTelefone(event.target.value), { shouldDirty: true })} placeholder=" " /><span>Telefone 2</span></label>
                    <label className="field"><input value={form.watch("tel3") ?? ""} maxLength={15} onChange={(event) => form.setValue("tel3", formatTelefone(event.target.value), { shouldDirty: true })} placeholder=" " /><span>Telefone 3</span></label>
                  </div>
                  <div className="form-grid contatos-email-grid">
                    <label className="field"><input {...form.register("email")} placeholder=" " /><span>E-mail</span></label>
                  </div>
                </> : null}
              </div> : null}
            </section>
          );
        })}
      </div>
      {errorList.length ? <div className="form-error">{errorList.join(" ")}</div> : null}
      {saveMutation.error ? <div className="form-error">{saveMutation.error.message}</div> : null}
      {photoMutation.error ? <div className="form-error">{photoMutation.error.message}</div> : null}
      <div className="form-actions">
        <label className={`secondary-button ${!savedId ? "disabled" : ""}`}><Upload size={16} /> Foto<input type="file" accept="image/*" disabled={!savedId} onChange={(event) => { const file = event.target.files?.[0]; if (file && savedId) photoMutation.mutate({ id: savedId, file }); }} /></label>
        <button type="submit" disabled={saveMutation.isPending}><Save size={16} /> {saveMutation.isPending ? "Salvando..." : "Salvar"}</button>
      </div>
    </form>
  );
}
