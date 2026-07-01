import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save, Upload } from "lucide-react";
import type { Associado } from "../../types/database";
import { associadoSchema, type AssociadoFormValues } from "./associadosSchema";
import { listEmpresas, listLookup, saveAssociado, uploadAssociadoFoto } from "./associadosApi";

const defaultValues: AssociadoFormValues = {
  ativo: true,
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

function toInputDate(value: string | null) {
  return value ? value.slice(0, 10) : "";
}

function toValues(associado: Associado | null): AssociadoFormValues {
  if (!associado) return defaultValues;
  return {
    ...defaultValues,
    ...associado,
    data_categoria: toInputDate(associado.data_categoria),
    data_nascimento: toInputDate(associado.data_nascimento),
    data_admissao: toInputDate(associado.data_admissao),
    data_situacao: toInputDate(associado.data_situacao),
    data_ficha: toInputDate(associado.data_ficha),
    salario: associado.salario ?? 0
  };
}

export function AssociadoForm({ associado, onSaved }: { associado: Associado | null; onSaved: (id: number) => void }) {
  const queryClient = useQueryClient();
  const [savedId, setSavedId] = useState<number | null>(associado?.id ?? null);
  const { data: empresas = [] } = useQuery({ queryKey: ["empresas"], queryFn: listEmpresas });
  const lookupKinds = ["situacao", "local_trabalho", "local_pagamento", "escolaridade", "funcao"];
  const lookups = Object.fromEntries(lookupKinds.map((kind) => [kind, useQuery({ queryKey: ["lookup", kind], queryFn: () => listLookup(kind) }).data ?? []]));

  const form = useForm<AssociadoFormValues>({ resolver: zodResolver(associadoSchema), defaultValues: toValues(associado) });

  useEffect(() => {
    form.reset(toValues(associado));
    setSavedId(associado?.id ?? null);
  }, [associado, form]);

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

  return (
    <form className="form-panel" onSubmit={form.handleSubmit((values) => saveMutation.mutate(values))}>
      <div className="form-grid compact">
        <label className="check"><input type="checkbox" {...form.register("ativo")} /> Ativo</label>
        <label>Matrícula<input {...form.register("matricula")} /></label>
        <label>CPF<input {...form.register("cpf")} /></label>
      </div>
      <label>Nome do associado<input {...form.register("nome")} /></label>
      <div className="form-grid">
        <label>Empresa<select {...form.register("empresa_id", { setValueAs: (value) => value ? Number(value) : null })}><option value="">Selecione</option>{empresas.map((empresa) => <option key={empresa.id} value={empresa.id}>{empresa.nome_fantasia}</option>)}</select></label>
        <label>Situação<select {...form.register("situacao_id", { setValueAs: (value) => value ? Number(value) : null })}><option value="">Selecione</option>{lookups.situacao.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      </div>
      <div className="form-grid">
        <label>Local trabalho<select {...form.register("local_trabalho_id", { setValueAs: (value) => value ? Number(value) : null })}><option value="">Selecione</option>{lookups.local_trabalho.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
        <label>Local pagamento<select {...form.register("local_pagamento_id", { setValueAs: (value) => value ? Number(value) : null })}><option value="">Selecione</option>{lookups.local_pagamento.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      </div>
      <div className="form-grid compact">
        <label>Nascimento<input type="date" {...form.register("data_nascimento")} /></label>
        <label>Admissão<input type="date" {...form.register("data_admissao")} /></label>
        <label>Categoria<input type="date" {...form.register("data_categoria")} /></label>
      </div>
      <div className="form-grid">
        <label>Telefone<input {...form.register("tel1")} /></label>
        <label>E-mail<input {...form.register("email")} /></label>
      </div>
      <div className="form-grid compact">
        <label>RG<input {...form.register("rg")} /></label>
        <label>Sexo<select {...form.register("sexo")}><option value="">Selecione</option><option value="M">Masculino</option><option value="F">Feminino</option></select></label>
        <label>Salário<input type="number" step="0.01" {...form.register("salario")} /></label>
      </div>
      <label>Endereço<input {...form.register("endereco")} /></label>
      <div className="form-grid compact">
        <label>Bairro<input {...form.register("bairro")} /></label>
        <label>Cidade<input {...form.register("cidade")} /></label>
        <label>UF<input maxLength={2} {...form.register("uf")} /></label>
      </div>
      <label>Observação<textarea rows={3} {...form.register("observacao")} /></label>
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
