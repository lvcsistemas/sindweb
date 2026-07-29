import { FormEvent, useEffect, useMemo, useState }              from "react";
import { useMutation, useQuery, useQueryClient }                from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Minus, Plus, Printer, Save, Search } from "lucide-react";
import { Breadcrumb }                                           from "../../shared/Breadcrumb";
import { applyAtendimentoDateRangePreference, getAtendimentoDateRangePreference, setAtendimentoDateRangePreference } from "../../shared/dateRangePreference";
import type { AtendimentoMedicoExame, AtendimentoMedicoInsert, AtendimentoMedicoItemInsert, AtendimentoMedicoLista } from "../../types/database";
import { listAssociados }                                       from "../associados/associadosApi";
import { listAtendimentoMedicoConvenios, listConvenioEspecialidades } from "../atendimentoMedicoConvenio/atendimentoMedicoConvenioApi";
import { listAtendimentoMedicoExamesByTipos }                   from "../atendimentoMedicoExames/atendimentoMedicoExamesApi";
import { listAuxiliares }                                       from "../auxiliares/auxiliaresApi";
import { getConfig }                                            from "../config/configApi";
import { listDependentesByAssociado }                           from "../dependentes/dependentesApi";
import { listUsuarios }                                         from "../usuarios/usuariosApi";
import { getAtendimentoAssociadoResumo, listAtendimentoMedicoItens, listAtendimentosAssociadoMes, listAtendimentosMedicos, replaceAtendimentoMedicoItens, saveAtendimentoMedico, type AtendimentoAssociadoResumo, type AtendimentoMedicoFilters, type AtendimentoMedicoSearchType } from "./atendimentoMedicoApi";

type AtendimentoFormTab = "atendimento" | "consultas";

const exameModalTipos = ["ULTRASSONOGRAFIA", "RADIOLOGIA", "OUTROS"];
const exameSangueModalTipos = ["SANGUE", "FEZES/URINA"];
const situacoesAtendimentoAlerta = new Set(["DESFILIADO", "DEMITIDO", "BLOQUEADO"]);
const situacoesAtendimentoBloqueio = new Set(["DESFILIADO", "DEMITIDO"]);

const pesquisaOptions: Array<{ value: AtendimentoMedicoSearchType; label: string }> = [
  { value: "T",                 label: "TODOS" },
  { value: "CADASTRO",          label: "DATA: CADASTRO" },
  { value: "ID ATENDIMENTO",    label: "ID: ATENDIMENTO" },
  { value: "ID ASSOCIADO",      label: "ID: ASSOCIADO" },
  { value: "ID CONVENIO",       label: "ID: CONVENIO" },
  { value: "ID DEPENDENTE",     label: "ID: DEPENDENTE" },
  { value: "NM ASSOCIADO",      label: "NOME: ASSOCIADO" },
  { value: "NM DEPENDENTE",     label: "NOME: DEPENDENTE" },
  { value: "NM CONVENIO",       label: "NOME: CONVENIO" },
  { value: "AGENDADO",          label: "SITUACAO: AGENDADO" },
  { value: "ATENDIDO",          label: "SITUACAO: ATENDIDO" },
  { value: "CANCELADO",         label: "SITUACAO: CANCELADO" },
  { value: "AURICULOTERAPIA",   label: "TIPO: AURICULOTERAPIA" },
  { value: "CARDIOLOGIA",       label: "TIPO: CARDIOLOGIA" },
  { value: "CLINICO GERAL",     label: "TIPO: CLINICO GERAL" },
  { value: "CONSULTA",          label: "TIPO: CONSULTA" },
  { value: "EXAME",             label: "TIPO: EXAME" },
  { value: "EXAME DE SANGUE",   label: "TIPO: EXAME DE SANGUE" },
  { value: "FISIOTERAPIA",      label: "TIPO: FISIOTERAPIA" },
  { value: "FONOAUDIOLOGIA",    label: "TIPO: FONOAUDIOLOGIA" },
  { value: "MASSOTERAPIA",      label: "TIPO: MASSOTERAPIA" },
  { value: "ODONTOLOGIA",       label: "TIPO: ODONTOLOGIA" },
  { value: "PSICOLOGIA",        label: "TIPO: PSICOLOGIA" }
];

function localDateTimeValue(date = new Date()) {
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function toDateTimeLocal(value: string | null | undefined) {
  return value ? value.slice(0, 16) : "";
}

function todayAt(time: "start" | "end") {
  const date = new Date();
  date.setHours(time === "start" ? 0 : 23, time === "start" ? 0 : 59, 0, 0);
  return localDateTimeValue(date);
}

function datePart(value: string | null | undefined) {
  return toDateTimeLocal(value).slice(0, 10);
}

function timePart(value: string | null | undefined) {
  return toDateTimeLocal(value).slice(11, 16);
}

function combineDateTime(date: string, time: string) {
  const now = localDateTimeValue();
  return `${date || datePart(now)}T${time || timePart(now)}`;
}

function dateToInputValue(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function monthStartFromValue(value: string | null | undefined) {
  const selectedDate = datePart(value);
  if (selectedDate) {
    const [year, month] = selectedDate.split("-").map(Number);
    return new Date(year, month - 1, 1);
  }
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function shiftMonth(month: Date, amount: number) {
  return new Date(month.getFullYear(), month.getMonth() + amount, 1);
}

function buildCalendarDays(month: Date) {
  const firstDay = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const days: Array<Date | null> = Array.from({ length: firstDay }, () => null);
  for (let day = 1; day <= daysInMonth; day += 1) {
    days.push(new Date(month.getFullYear(), month.getMonth(), day));
  }
  while (days.length % 7 !== 0) days.push(null);
  return days;
}

function weekDayLabel(date: string) {
  if (!date) return "";
  const [year, month, day] = date.split("-").map(Number);
  const parsed = new Date(year, month - 1, day);
  if (Number.isNaN(parsed.getTime())) return "";
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(parsed);
}

function formatDateTime(value: string | null | undefined) {
  if (!value) return "-";
  const [date = "", time = ""] = value.slice(0, 19).split("T");
  const [year, month, day] = date.split("-");
  return `${day}/${month}/${year} ${time}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "-";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function calculateAge(value: string | null | undefined) {
  if (!value) return "-";
  const birth = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(birth.getTime())) return "-";
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age -= 1;
  return `${age}`;
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function printValue(value: string | number | null | undefined, fallback = "") {
  return escapeHtml(value ?? fallback);
}

function formatPhone(value: string | null | undefined) {
  const digits = value?.replace(/\D/g, "") ?? "";
  if (!digits) return "";
  if (digits.length <= 10) return digits.replace(/^(\d{2})(\d{4})(\d{0,4}).*/, "($1) $2-$3").replace(/-$/, "");
  return digits.replace(/^(\d{2})(\d{5})(\d{0,4}).*/, "($1) $2-$3").replace(/-$/, "");
}

function joinText(parts: Array<string | null | undefined>, separator = " ") {
  return parts.filter((part) => part && part.trim()).join(separator);
}

function printItemTipo(tipo: string | null | undefined) {
  return tipo?.toUpperCase() === "SANGUE" ? "EXAME DE SANGUE" : tipo ?? "";
}

function getAtendimentoLimitKind(tipo: string | null | undefined) {
  const normalized = tipo?.trim().toUpperCase() ?? "";
  if (normalized === "CONSULTA") return "consulta";
  if (normalized.includes("EXAME")) return "exame";
  return null;
}

function getAtendimentoRowClass(item: AtendimentoMedicoLista) {
  const situacao = item.situacao?.toUpperCase();
  const agendado = new Date(toDateTimeLocal(item.dt_agendado));
  if (situacao === "CANCELADO") return "atendimento-row canceled";
  if (situacao === "ATENDIDO") return "atendimento-row completed";
  if (situacao === "AGENDADO" && !Number.isNaN(agendado.getTime()) && new Date() > agendado) return "atendimento-row overdue";
  return "atendimento-row scheduled";
}

function emptyFilters(): AtendimentoMedicoFilters {
  return applyAtendimentoDateRangePreference({ pesquisa: "T", inicio: todayAt("start"), fim: todayAt("end"), usuarioId: "TODOS", valor: "" });
}

function newEmptyForm(): AtendimentoMedicoInsert {
  const preferredRange = getAtendimentoDateRangePreference();
  return {
    created_by: null,
    updated_by: null,
    created_by_legacy: null,
    updated_by_legacy: null,
    convenio_id: 0,
    associado_id: 0,
    dependente_id: 0,
    qtd: 0,
    dt_agendado: preferredRange?.inicio ?? localDateTimeValue(),
    situacao: "AGENDADO",
    tipo: "CONSULTA",
    obs: ""
  };
}

export function AtendimentoMedicoPage() {
  const queryClient                           = useQueryClient();
  const [filters, setFilters]                 = useState<AtendimentoMedicoFilters>(emptyFilters);
  const [draftFilters, setDraftFilters]       = useState<AtendimentoMedicoFilters>(emptyFilters);
  const [selectedId, setSelectedId]           = useState<number | null>(null);
  const [formOpen, setFormOpen]               = useState(false);
  const [activeFormTab, setActiveFormTab]     = useState<AtendimentoFormTab>("atendimento");
  const [associadoCardOpen, setAssociadoCardOpen] = useState(false);
  const [form, setForm]                       = useState<AtendimentoMedicoInsert>(newEmptyForm);
  const [atendimentoItens, setAtendimentoItens] = useState<AtendimentoMedicoItemInsert[]>([]);
  const [itensModalOpen, setItensModalOpen]   = useState(false);
  const [modalSelectedDescricoes, setModalSelectedDescricoes] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth]     = useState(() => monthStartFromValue(localDateTimeValue()));
  const [associadoSearch, setAssociadoSearch] = useState("");
  const [message, setMessage]                 = useState<string | null>(null);
  const [lastSituacaoAlertKey, setLastSituacaoAlertKey] = useState<string | null>(null);
  const isConsulta      = form.tipo?.toUpperCase() === "CONSULTA";
  const isExame         = form.tipo?.toUpperCase() === "EXAME";
  const isExameSangue   = form.tipo?.toUpperCase() === "EXAME DE SANGUE";
  const activeExameTipos = isExameSangue ? exameSangueModalTipos : exameModalTipos;
  const isExamePicker   = isExame || isExameSangue;
  const showItensPicker = isConsulta || isExamePicker;

  const atendimentosQuery   = useQuery({ queryKey: ["atendimento-medico", filters], queryFn: () => listAtendimentosMedicos(filters) });
  const conveniosQuery      = useQuery({ queryKey: ["atendimento-medico-convenios", ""], queryFn: () => listAtendimentoMedicoConvenios("") });
  const configQuery         = useQuery({ queryKey: ["config"], queryFn: getConfig });
  const tiposQuery          = useQuery({ queryKey: ["auxiliares", "atendimento_medico_tipo"], queryFn: () => listAuxiliares("atendimento_medico_tipo", "") });
  const associadosQuery     = useQuery({ queryKey: ["atendimento-medico-associados", associadoSearch], queryFn: () => listAssociados(associadoSearch), enabled: formOpen });
  const usuariosQuery       = useQuery({ queryKey: ["usuarios"], queryFn: listUsuarios });
  const associadoResumoQuery = useQuery({
    queryKey: ["atendimento-associado-resumo", form.associado_id],
    queryFn: () => getAtendimentoAssociadoResumo(Number(form.associado_id)),
    enabled: Boolean(form.associado_id)
  });
  const associadoAtendimentosMesQuery = useQuery({
    queryKey: ["atendimento-associado-mes", form.associado_id],
    queryFn: () => listAtendimentosAssociadoMes(Number(form.associado_id)),
    enabled: Boolean(form.associado_id)
  });
  const dependentesQuery    = useQuery({
    queryKey: ["atendimento-medico-dependentes", form.associado_id],
    queryFn: () => listDependentesByAssociado(Number(form.associado_id)),
    enabled: Boolean(form.associado_id)
  });
  const atendimentoItensQuery = useQuery({
    queryKey: ["atendimento-medico-itens", selectedId],
    queryFn: () => listAtendimentoMedicoItens(Number(selectedId)),
    enabled: Boolean(selectedId) && formOpen
  });
  const convenioEspecialidadesQuery = useQuery({
    queryKey: ["atendimento-medico-convenio-especialidades-modal", form.convenio_id],
    queryFn: () => listConvenioEspecialidades(Number(form.convenio_id)),
    enabled: itensModalOpen && form.tipo?.toUpperCase() === "CONSULTA" && Boolean(form.convenio_id)
  });
  const examesModalQuery = useQuery({
    queryKey: ["atendimento-medico-exames-modal", activeExameTipos],
    queryFn: () => listAtendimentoMedicoExamesByTipos(activeExameTipos),
    enabled: itensModalOpen && isExamePicker
  });

  const atendimentos    = atendimentosQuery.data    ?? [];
  const convenios       = conveniosQuery.data       ?? [];
  const tipos           = tiposQuery.data           ?? [];
  const associados      = associadosQuery.data      ?? [];
  const usuarios        = usuariosQuery.data        ?? [];
  const associadoResumo = associadoResumoQuery.data ?? null;
  const associadoAtendimentosMes = associadoAtendimentosMesQuery.data ?? [];
  const dependentes     = dependentesQuery.data     ?? [];
  const convenioEspecialidades = convenioEspecialidadesQuery.data ?? [];
  const examesModal     = examesModalQuery.data     ?? [];
  const config          = configQuery.data           ?? null;
  const selected        = atendimentos.find((item) => item.id === selectedId) ?? null;
  const groupedExames   = useMemo(() => activeExameTipos.map((tipo) => ({
    tipo,
    itens: examesModal.filter((item) => item.tipo === tipo)
  })), [activeExameTipos, examesModal]);
  const visibleAtendimentoItens = useMemo(() => {
    if (isExamePicker) return atendimentoItens.filter((item) => activeExameTipos.includes(item.tipo));
    if (isConsulta) return atendimentoItens.filter((item) => item.tipo === "ESPECIALIDADE");
    return [];
  }, [activeExameTipos, atendimentoItens, isConsulta, isExamePicker]);
  const calendarDays    = useMemo(() => buildCalendarDays(calendarMonth), [calendarMonth]);
  const calendarTitle   = useMemo(() => new Intl.DateTimeFormat("pt-BR", { month: "long", year: "numeric" }).format(calendarMonth), [calendarMonth]);
  const selectedDate    = datePart(form.dt_agendado);
  const todayDate       = dateToInputValue(new Date());
  const associadoSituacaoAlerta = associadoResumo?.situacao?.trim().toUpperCase() ?? "";
  const shouldHighlightAtendimentoForm = formOpen && situacoesAtendimentoAlerta.has(associadoSituacaoAlerta);
  const associadoOptions = useMemo(() => {
    if (!form.associado_id || associados.some((associado) => associado.id === form.associado_id)) return associados;
    return [{ id: form.associado_id, nome: selected?.nm_associado ?? `Associado #${form.associado_id}`, matricula: selected?.matricula ?? null }, ...associados];
  }, [associados, form.associado_id, selected?.matricula, selected?.nm_associado]);

  function openFormForAtendimento(item: AtendimentoMedicoLista) {
    setForm({
      id: item.id,
      created_by: item.created_by,
      updated_by: item.updated_by,
      created_by_legacy: item.created_by_legacy,
      updated_by_legacy: item.updated_by_legacy,
      convenio_id: item.convenio_id,
      associado_id: item.associado_id,
      dependente_id: item.dependente_id,
      qtd: item.qtd,
      dt_agendado: toDateTimeLocal(item.dt_agendado),
      situacao: item.situacao,
      tipo: item.tipo,
      obs: item.obs ?? ""
    });
    setAssociadoSearch(item.nm_associado ?? "");
    setCalendarMonth(monthStartFromValue(item.dt_agendado));
    setActiveFormTab("atendimento");
    setAssociadoCardOpen(false);
    setFormOpen(true);
  }

  useEffect(() => {
    if (!selected) return;
    openFormForAtendimento(selected);
  }, [selected]);

  useEffect(() => {
    if (!selectedId) return;
    if (!atendimentoItensQuery.data) return;

    setAtendimentoItens(atendimentoItensQuery.data.map((item) => ({
      id: item.id,
      atendimento_id: item.atendimento_id,
      tipo: item.tipo,
      descricao: item.descricao
    })));
  }, [atendimentoItensQuery.data, selectedId]);

  useEffect(() => {
    if (!formOpen || !form.associado_id || !associadoSituacaoAlerta) return;
    if (!situacoesAtendimentoAlerta.has(associadoSituacaoAlerta)) return;

    const alertKey = `${form.associado_id}-${associadoSituacaoAlerta}`;
    if (lastSituacaoAlertKey === alertKey) return;

    window.alert(`O Associado encontra-se: ${associadoSituacaoAlerta} e não poderá ser atendido.`);
    setLastSituacaoAlertKey(alertKey);
  }, [associadoSituacaoAlerta, form.associado_id, formOpen, lastSituacaoAlertKey]);

  const saveMutation = useMutation({
    mutationFn: async (values: AtendimentoMedicoInsert) => {
      const tipo = values.tipo?.trim().toUpperCase() ?? "";
      const agendado = values.dt_agendado ? new Date(values.dt_agendado) : null;

      if (!Number(values.associado_id)) {
        throw new Error("Selecione o associado antes de salvar o atendimento.");
      }

      if (!tipo) {
        throw new Error("Selecione o tipo antes de salvar o atendimento.");
      }

      if (!Number(values.convenio_id)) {
        throw new Error("Selecione o convenio antes de salvar o atendimento.");
      }

      if (!agendado || Number.isNaN(agendado.getTime())) {
        throw new Error("Informe a data do agendamento antes de salvar o atendimento.");
      }

      if (agendado < new Date()) {
        throw new Error("A data do agendamento nao pode ser menor que a data atual.");
      }

      if (situacoesAtendimentoBloqueio.has(associadoSituacaoAlerta)) {
        throw new Error(`O Associado encontra-se: ${associadoSituacaoAlerta} e nao podera ser atendido.`);
      }

      if (["CONSULTA", "EXAME", "EXAME DE SANGUE"].includes(tipo) && visibleAtendimentoItens.length === 0) {
        throw new Error("Informe pelo menos uma especialidade/exame antes de salvar o atendimento.");
      }

      const limitKind = getAtendimentoLimitKind(values.tipo);
      const limite = limitKind === "consulta" ? Number(config?.qtd_consultas ?? 0) : limitKind === "exame" ? Number(config?.qtd_exames ?? 0) : 0;

      if (limitKind && limite > 0) {
        const atendimentosDoMes = await queryClient.fetchQuery({
          queryKey: ["atendimento-associado-mes", values.associado_id],
          queryFn: () => listAtendimentosAssociadoMes(Number(values.associado_id))
        });
        const totalUsado = atendimentosDoMes.filter((item) => {
          if (item.id === values.id) return false;
          return getAtendimentoLimitKind(item.tipo) === limitKind;
        }).length;

        if (totalUsado >= limite) {
          throw new Error(`Limite de ${limitKind === "consulta" ? "consultas" : "exames"} do associado atingido no mes corrente. Permitido: ${limite}.`);
        }
      }

      const saved = await saveAtendimentoMedico(values);
      await replaceAtendimentoMedicoItens(saved.id, showItensPicker ? visibleAtendimentoItens : []);
      return saved;
    },
    onSuccess: async (saved) => {
      setSelectedId(saved.id);
      setFormOpen(false);
      setMessage("Atendimento salvo com sucesso.");
      await queryClient.invalidateQueries({ queryKey: ["atendimento-medico"] });
      await queryClient.invalidateQueries({ queryKey: ["atendimento-medico-itens", saved.id] });
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "Nao foi possivel salvar o atendimento.")
  });

  const totalLabel = useMemo(() => `${atendimentos.length} registro${atendimentos.length === 1 ? "" : "s"}`, [atendimentos.length]);

  function handleNew() {
    setSelectedId(null);
    setAssociadoSearch("");
    setMessage(null);
    setAtendimentoItens([]);
    setModalSelectedDescricoes([]);
    setItensModalOpen(false);
    const nextForm = newEmptyForm();
    setForm(nextForm);
    setCalendarMonth(monthStartFromValue(nextForm.dt_agendado));
    setActiveFormTab("atendimento");
    setAssociadoCardOpen(false);
    setFormOpen(true);
  }

  async function handleSelect(item: AtendimentoMedicoLista) {
    setSelectedId(item.id);
    openFormForAtendimento(item);
    setAtendimentoItens([]);
    setMessage(null);
    try {
      const itens = await queryClient.fetchQuery({
        queryKey: ["atendimento-medico-itens", item.id],
        queryFn: () => listAtendimentoMedicoItens(item.id)
      });
      setAtendimentoItens(itens.map((atendimentoItem) => ({
        id: atendimentoItem.id,
        atendimento_id: atendimentoItem.atendimento_id,
        tipo: atendimentoItem.tipo,
        descricao: atendimentoItem.descricao
      })));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Nao foi possivel carregar as especialidades/exames.");
    }
  }

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAtendimentoDateRangePreference({ inicio: draftFilters.inicio, fim: draftFilters.fim });
    setFilters(draftFilters);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    saveMutation.mutate(form);
  }

  function handleOpenItensModal() {
    setModalSelectedDescricoes(atendimentoItens
      .filter((item) => isExamePicker ? activeExameTipos.includes(item.tipo) : item.tipo === "ESPECIALIDADE")
      .map((item) => item.descricao));
    setItensModalOpen(true);
  }

  function toggleModalItem(descricao: string) {
    setModalSelectedDescricoes((current) => current.includes(descricao) ? current.filter((item) => item !== descricao) : [...current, descricao]);
  }

  function handleConfirmItensModal() {
    const selectedSet = new Set(modalSelectedDescricoes);
    const nextItens = isExamePicker
      ? examesModal
        .filter((item) => selectedSet.has(item.exame))
        .map((item) => ({
          atendimento_id: Number(form.id || 0),
          tipo: item.tipo,
          descricao: item.exame
        }))
      : convenioEspecialidades
        .filter((item) => item.especialidade?.nome && selectedSet.has(item.especialidade.nome))
        .map((item) => ({
        atendimento_id: Number(form.id || 0),
        tipo: "ESPECIALIDADE",
        descricao: item.especialidade!.nome
      }));
    setAtendimentoItens((current) => [
      ...current.filter((item) => isExamePicker ? !activeExameTipos.includes(item.tipo) : item.tipo !== "ESPECIALIDADE"),
      ...nextItens
    ]);
    setItensModalOpen(false);
  }

  function handlePrintGuia() {
    if (!form.id) return;

    const convenio = convenios.find((item) => item.id === Number(form.convenio_id));
    const dependente = dependentes.find((item) => item.id === Number(form.dependente_id));
    const associadoNome = selected?.nm_associado ?? associadoOptions.find((item) => item.id === Number(form.associado_id))?.nome ?? "";
    const pacienteItensTitulo = isConsulta ? "ESPECIALIDADES MEDICAS" : "EXAMES";
    const convenioEndereco = joinText([
      convenio?.endereco,
      convenio?.numero,
      convenio?.complemento,
      convenio?.bairro,
      convenio?.cidade,
      convenio?.uf
    ], ", ");
    const telefonesAssociado = joinText([
      formatPhone(associadoResumo?.tel1),
      formatPhone(associadoResumo?.tel2),
      formatPhone(associadoResumo?.tel3)
    ], " / ");
    const itensRows = visibleAtendimentoItens.length
      ? visibleAtendimentoItens.map((item) => `<tr><td>${printValue(printItemTipo(item.tipo))}</td><td>${printValue(item.descricao)}</td></tr>`).join("")
      : `<tr><td>&nbsp;</td><td>&nbsp;</td></tr>`;
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
      setMessage("Nao foi possivel abrir a janela de impressao. Verifique o bloqueador de pop-ups.");
      return;
    }

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Atendimento ${printValue(form.id)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 4px 6px; color: #111; background: #fff; font-family: Tahoma, Arial, sans-serif; font-size: 12px; }
    .brand { width: 90%; height: 58px; margin: 0 auto 4px; display: flex; align-items: center; justify-content: center; border: 1px solid #222; font-size: 22px; font-weight: 700; letter-spacing: 2px; }
    hr { border: 0; border-top: 1px solid #222; margin: 5px 0; }
    .title { text-align: center; font-weight: 700; font-size: 13px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { padding: 2px 3px; vertical-align: top; text-align: left; }
    th { font-weight: 700; }
    .right { text-align: right; }
    .center { text-align: center; }
    .bordered td, .bordered th { border: 1px solid #222; height: 22px; }
    .stamp { width: 300px; height: 170px; border: 1px solid #222; float: right; display: flex; align-items: flex-start; justify-content: center; padding-top: 8px; margin-top: 8px; font-size: 11px; }
    .emissao { clear: both; padding-top: 14px; text-align: center; font-size: 11px; }
    .signature { width: 50%; margin-top: 28px; text-align: center; font-size: 10px; }
    @media print {
      body { padding: 0; }
    }
  </style>
</head>
<body>
  <div class="brand">SINTA</div>
  <hr>
  <div class="title">GUIA DE ENCAMINHAMENTO MEDICO AMBULATORIAL N&ordm; ${printValue(form.id)}</div>
  <hr>
  <table>
    <tr><th>ID</th><th>ASSOCIADO</th><th class="right">IDADE</th><th class="center">SEXO</th><th>TELEFONE</th></tr>
    <tr>
      <td>${printValue(form.associado_id)}</td>
      <td>${printValue(associadoNome)}</td>
      <td class="right">${printValue(calculateAge(associadoResumo?.data_nascimento))}</td>
      <td class="center">${printValue(associadoResumo?.sexo)}</td>
      <td>${printValue(telefonesAssociado)}</td>
    </tr>
    <tr><th>ID</th><th>DEPENDENTE</th><th class="right">IDADE</th><th class="center">SEXO</th><th>PARENTESCO</th></tr>
    <tr>
      <td>${dependente ? printValue(dependente.id) : ""}</td>
      <td>${dependente ? printValue(dependente.nm_dependente) : ""}</td>
      <td class="right">${dependente ? printValue(calculateAge(dependente.dt_nascimento)) : ""}</td>
      <td class="center">${dependente ? printValue(dependente.sexo) : ""}</td>
      <td>${dependente ? printValue(dependente.parentesco) : ""}</td>
    </tr>
  </table>
  <hr>
  <table>
    <tr><th>CONVENIO</th><th>TELEFONE</th><th>ENDERECO</th></tr>
    <tr>
      <td>${printValue(convenio?.nm_convenio)}</td>
      <td>${printValue(joinText([formatPhone(convenio?.tel1), formatPhone(convenio?.tel2), formatPhone(convenio?.tel3)], " / "))}</td>
      <td>${printValue(convenioEndereco)}</td>
    </tr>
  </table>
  <hr>
  <table>
    <tr><th>OBSERVACAO</th></tr>
    <tr><td>${printValue(form.obs)}</td></tr>
  </table>
  <hr>
  <table><tr><th class="center" colspan="2">${pacienteItensTitulo}</th></tr></table>
  <table class="bordered"><tr><th style="width: 28%;">TIPO</th><th>ESPECIALIDADE/EXAME</th></tr>${itensRows}</table>
  <table class="bordered" style="margin-top: 4px;"><tr><th class="center">OBSERVACOES</th></tr><tr><td>&nbsp;</td></tr></table>
  <div class="stamp">CARIMBO E ASSINATURA DO MEDICO</div>
  <div class="emissao">EMISSAO: ${printValue(formatDateTime(localDateTimeValue()))}&nbsp;&nbsp;&nbsp;REALIZACAO: ${printValue(formatDateTime(form.dt_agendado))}</div>
  <div class="signature">_______________________<br>ASSINATURA DO SINDICATO</div>
  <div class="signature">_______________________<br>ASSINATURA DO PACIENTE</div>
  <script>
    window.onload = function () {
      window.focus();
      window.print();
    };
  </script>
</body>
</html>`;

    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
  }

  function renderAssociadoResumoCard(resumo: AtendimentoAssociadoResumo | null) {
    if (!form.associado_id) return null;

    return (
      <section className="detail-card atendimento-associado-card">
        <div className="detail-card-title">
          <strong>Dados do Associado</strong>
          <button type="button" className="icon-button" onClick={() => setAssociadoCardOpen((open) => !open)} aria-label={associadoCardOpen ? "Recolher dados do associado" : "Expandir dados do associado"}>
            {associadoCardOpen ? <Minus size={16} /> : <Plus size={16} />}
          </button>
        </div>
        {associadoCardOpen ? <div className="detail-card-body">
          {associadoResumoQuery.isLoading ? <div className="empty-state">Carregando dados do associado...</div> : null}
          {!associadoResumoQuery.isLoading && resumo ? <>
            <div className="info-grid associado-info-grid">
              <div><span>Matrícula</span><strong>{resumo.matricula ?? "-"}</strong></div>
              <div><span>Situação</span><strong>{resumo.situacao ?? "-"}</strong></div>
              <div><span>Data de Filiação</span><strong>{formatDate(resumo.data_filiacao)}</strong></div>
              <div><span>Idade</span><strong>{calculateAge(resumo.data_nascimento)}</strong></div>
              <div><span>Telefone 1</span><strong>{resumo.tel1 ?? "-"}</strong></div>
              <div><span>Telefone 2</span><strong>{resumo.tel2 ?? "-"}</strong></div>
              <div><span>Consultas no Mês</span><strong>{resumo.consultas_mes}</strong></div>
              <div><span>Exames no Mês</span><strong>{resumo.exames_mes}</strong></div>
              <div><span>Empresa</span><strong>{resumo.empresa_id ? `${resumo.empresa_id} - ${resumo.empresa_nome ?? "-"}` : "-"}</strong></div>
              <div><span>Convenção</span><strong>{resumo.convencao ?? "-"}</strong></div>
              <div><span>Local Pagamento</span><strong>{resumo.local_pagamento ?? "-"}</strong></div>
              <div className="info-wide"><span>Observação</span><strong>{resumo.observacao ?? "-"}</strong></div>
            </div>

            <div className="data-table-wrap">
              <table className="data-table associado-contribuicoes-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Contribuição</th>
                    <th>Data de Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {resumo.contribuicoes.map((item) => (
                    <tr key={item.id}>
                      <td>{item.contribuicao?.tipo ?? "-"}</td>
                      <td>{item.contribuicao?.nm_contribuicao ?? "-"}</td>
                      <td>{formatDate(item.dt_pg)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {resumo.contribuicoes.length === 0 ? <div className="empty-state">Nenhuma contribuição cadastrada.</div> : null}
            </div>
          </> : null}
          {!associadoResumoQuery.isLoading && associadoResumoQuery.isError ? <div className="form-error">Não foi possível carregar os dados do associado.</div> : null}
        </div> : null}
      </section>
    );
  }

  function renderConsultasExamesTab() {
    if (!form.associado_id) {
      return <div className="empty-state tab-empty atendimento-full-grid">Selecione um associado para consultar os atendimentos do mês.</div>;
    }

    return (
      <div className="related-panel atendimento-full-grid">
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Agendado</th>
                <th>Situação</th>
                <th>Tipo</th>
                <th>Convênio</th>
                <th>Paciente</th>
              </tr>
            </thead>
            <tbody>
              {associadoAtendimentosMes.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>{formatDateTime(item.dt_agendado)}</td>
                  <td>{item.situacao}</td>
                  <td>{item.tipo}</td>
                  <td>{item.nm_convenio ?? "-"}</td>
                  <td>{item.nm_dependente ? `Dependente: ${item.nm_dependente}` : `Associado: ${item.nm_associado ?? "-"}`}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {associadoAtendimentosMesQuery.isLoading ? <div className="empty-state">Carregando consultas e exames...</div> : null}
          {!associadoAtendimentosMesQuery.isLoading && associadoAtendimentosMes.length === 0 ? <div className="empty-state">Nenhum atendimento encontrado no mês corrente.</div> : null}
        </div>
      </div>
    );
  }

  const atendimentoForm = formOpen ? (
    <section className={`detail-panel atendimento-form-panel${shouldHighlightAtendimentoForm ? " atendimento-form-panel-alert" : ""}`}>
      <form className="form-panel" onSubmit={handleSubmit}>
        <div className="tabs atendimento-full-grid">
          <button type="button" className={activeFormTab === "atendimento" ? "active" : ""} onClick={() => setActiveFormTab("atendimento")}>Atendimento</button>
          <button type="button" className={activeFormTab === "consultas" ? "active" : ""} onClick={() => setActiveFormTab("consultas")}>Consultas/Exames</button>
        </div>

        {activeFormTab === "atendimento" ? <>
        <div className="atendimento-top-layout atendimento-full-grid">
        <div className="atendimento-form-header">
          <div className="mini-calendar" aria-label="Calendario do mes">
            <div className="mini-calendar-nav">
              <button type="button" className="icon-button" onClick={() => setCalendarMonth((month) => shiftMonth(month, -1))} aria-label="Mes anterior"><ChevronLeft size={16} /></button>
              <strong>{calendarTitle}</strong>
              <button type="button" className="icon-button" onClick={() => setCalendarMonth((month) => shiftMonth(month, 1))} aria-label="Proximo mes"><ChevronRight size={16} /></button>
            </div>
            <div className="mini-calendar-weekdays">
              {["D", "S", "T", "Q", "Q", "S", "S"].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
            </div>
            <div className="mini-calendar-grid">
              {calendarDays.map((day, index) => {
                const value = day ? dateToInputValue(day) : "";
                const className = [
                  "mini-calendar-day",
                  value === selectedDate ? "selected" : "",
                  value === todayDate ? "today" : ""
                ].filter(Boolean).join(" ");
                return day ? (
                  <button key={value} type="button" className={className} onClick={() => setForm({ ...form, dt_agendado: combineDateTime(value, timePart(form.dt_agendado)) })}>{day.getDate()}</button>
                ) : <span key={`empty-${index}`} className="mini-calendar-empty" />;
              })}
            </div>
          </div>
        </div>

        <div className="atendimento-top-fields">
        <div className="form-grid atendimento-agendamento-grid">
          <label className="field"><input type="date" value={datePart(form.dt_agendado)} onChange={(event) => {
            setForm({ ...form, dt_agendado: combineDateTime(event.target.value, timePart(form.dt_agendado)) });
            setCalendarMonth(monthStartFromValue(event.target.value));
          }} placeholder=" " required /><span>Agendamento</span></label>
          <label className="field"><input type="time" value={timePart(form.dt_agendado)} onChange={(event) => setForm({ ...form, dt_agendado: combineDateTime(datePart(form.dt_agendado), event.target.value) })} placeholder=" " required /><span>Hora</span></label>
          <div className="weekday-label">{weekDayLabel(datePart(form.dt_agendado))}</div>
          <label className="field">
            <select value={form.situacao} onChange={(event) => setForm({ ...form, situacao: event.target.value })} required>
              <option value="AGENDADO">AGENDADO</option>
              <option value="ATENDIDO">ATENDIDO</option>
              <option value="CANCELADO">CANCELADO</option>
            </select>
            <span>Status</span>
          </label>
        </div>

        <div className="form-grid atendimento-tipo-grid">
          <label className="field">
            <select value={form.tipo} onChange={(event) => {
              setForm({ ...form, tipo: event.target.value });
              setModalSelectedDescricoes([]);
              setItensModalOpen(false);
            }} required>
              <option value="">Selecione</option>
              {tipos.map((tipo) => <option key={tipo.id} value={tipo.nome}>{tipo.nome}</option>)}
            </select>
            <span>Tipo</span>
          </label>
          <label className="field">
            <select value={form.convenio_id} onChange={(event) => {
              setForm({ ...form, convenio_id: Number(event.target.value) });
              setAtendimentoItens((current) => current.filter((item) => item.tipo !== "ESPECIALIDADE"));
              setModalSelectedDescricoes([]);
            }} required>
              <option value={0}>Selecione</option>
              {convenios.map((convenio) => <option key={convenio.id} value={convenio.id}>{convenio.nm_convenio}</option>)}
            </select>
            <span>Convênio</span>
          </label>
        </div>

        <div className="form-grid atendimento-associado-grid">
          <label className="field"><input value={associadoSearch} onChange={(event) => setAssociadoSearch(event.target.value)} placeholder=" " /><span>Buscar associado</span></label>
          <label className="field">
            <select value={form.associado_id} onChange={(event) => setForm({ ...form, associado_id: Number(event.target.value), dependente_id: 0 })} required>
              <option value={0}>Selecione</option>
              {associadoOptions.map((associado) => <option key={associado.id} value={associado.id}>{associado.nome}{associado.matricula ? ` - ${associado.matricula}` : ""}</option>)}
            </select>
            <span>Associado</span>
          </label>
        </div>

        <div className="form-grid atendimento-full-grid">
          {renderAssociadoResumoCard(associadoResumo)}
        </div>

        <div className="form-grid atendimento-full-grid">
          <label className="field">
            <select value={form.dependente_id} onChange={(event) => setForm({ ...form, dependente_id: Number(event.target.value) })}>
              <option value={0}>Sem dependente</option>
              {dependentes.map((dependente) => <option key={dependente.id} value={dependente.id}>{dependente.nm_dependente}</option>)}
            </select>
            <span>Dependente</span>
          </label>
        </div>
        </div>
        </div>

        <div className="form-grid atendimento-full-grid">
          <label className="field">
            <textarea rows={3} value={form.obs ?? ""} onChange={(event) => setForm({ ...form, obs: event.target.value })} placeholder=" " /><span>Observação</span>
          </label>
        </div>
        
        {showItensPicker ? (
          <section className="related-panel atendimento-full-grid">
            <div className="related-toolbar">
              <strong>Especialidades/Exames</strong>
              <button type="button" onClick={handleOpenItensModal} disabled={isConsulta && !form.convenio_id}>
                <Plus size={16} /> Especialidades/Exames
              </button>
            </div>
            <div className="data-table-wrap">
              <table className="data-table atendimento-itens-table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Especialidade/Exame</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleAtendimentoItens.map((item) => (
                    <tr key={`${item.tipo}-${item.descricao}`}>
                      <td>{item.tipo}</td>
                      <td>{item.descricao}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {visibleAtendimentoItens.length === 0 ? <div className="empty-state">Nenhuma especialidade/exame selecionado.</div> : null}
            </div>
          </section>
        ) : null}
        {message ? <div className={saveMutation.isError ? "form-error" : "form-success"}>{message}</div> : null}

        <div className="form-actions atendimento-full-grid">
          {form.id ? <button type="button" className="secondary-button" onClick={handlePrintGuia}><Printer size={16} /> Imprimir Guia</button> : null}
          <button type="button" className="secondary-button" onClick={() => setFormOpen(false)}>Sair</button>
          <button type="submit" disabled={saveMutation.isPending}><Save size={16} /> {saveMutation.isPending ? "Salvando..." : "Salvar"}</button>
        </div>
        </> : renderConsultasExamesTab()}
      </form>
      {itensModalOpen ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="atendimento-itens-title">
          <section className="modal-panel atendimento-itens-modal">
            <h2 id="atendimento-itens-title">Especialidades/Exames</h2>
            {isConsulta && !form.convenio_id ? <div className="empty-state">Selecione um convênio antes de escolher as especialidades.</div> : null}
            {isConsulta && form.convenio_id ? (
              <div className="modal-form">
                {convenioEspecialidadesQuery.isLoading ? <div className="empty-state">Carregando especialidades...</div> : null}
                {!convenioEspecialidadesQuery.isLoading && convenioEspecialidades.length === 0 ? <div className="empty-state">Nenhuma especialidade vinculada a este convênio.</div> : null}
                {convenioEspecialidades.map((item) => (
                  <label key={item.id} className="check-row">
                    <input type="checkbox" checked={modalSelectedDescricoes.includes(item.especialidade?.nome ?? "")} onChange={() => toggleModalItem(item.especialidade?.nome ?? "")} />
                    <span>{item.especialidade?.nome ?? "Especialidade sem nome"}</span>
                  </label>
                ))}
              </div>
            ) : null}
            {isExamePicker ? (
              <div className="modal-form">
                {examesModalQuery.isLoading ? <div className="empty-state">Carregando exames...</div> : null}
                {!examesModalQuery.isLoading && examesModal.length === 0 ? <div className="empty-state">Nenhum exame encontrado para os tipos configurados.</div> : null}
                {groupedExames.map((grupo) => (
                  <section key={grupo.tipo} className="modal-section">
                    <h3>{grupo.tipo}</h3>
                    {grupo.itens.length === 0 ? <div className="empty-state small">Nenhum item cadastrado.</div> : null}
                    {grupo.itens.map((item: AtendimentoMedicoExame) => (
                      <label key={item.id} className="check-row">
                        <input type="checkbox" checked={modalSelectedDescricoes.includes(item.exame)} onChange={() => toggleModalItem(item.exame)} />
                        <span>{item.exame}</span>
                      </label>
                    ))}
                  </section>
                ))}
              </div>
            ) : null}
            <div className="modal-actions">
              <button type="button" className="secondary-button" onClick={() => setItensModalOpen(false)}>Cancelar</button>
              <button type="button" onClick={handleConfirmItensModal} disabled={(isConsulta && !form.convenio_id) || convenioEspecialidadesQuery.isLoading || examesModalQuery.isLoading}>OK</button>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  ) : null;

  return (
    <main className="module-page">
      <Breadcrumb items={[{ label: "Atendimentos" }, { label: "Medico" }]} />
      <section className="module-header">
        <div>
          <h1>Atendimento Médico</h1>
          <p>Pesquisa e gestão de atendimentos.</p>
        </div>
      </section>

      {!formOpen ? (
        <>
          <div className="toolbar-right">
            <button type="button" onClick={handleNew}><Plus size={16} /> Novo Atendimento</button>
          </div>

          <section className="form-panel atendimento-search-panel">
            <form className="atendimento-search-grid" onSubmit={handleSearch}>
              <label className="field">
                <select value={draftFilters.pesquisa} onChange={(event) => setDraftFilters({ ...draftFilters, pesquisa: event.target.value as AtendimentoMedicoSearchType })}>
                  {pesquisaOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <span>Pesquisar por</span>
              </label>
              <label className="field"><input type="datetime-local" value={draftFilters.inicio} onChange={(event) => {
                const nextFilters = { ...draftFilters, inicio: event.target.value };
                setDraftFilters(nextFilters);
                setAtendimentoDateRangePreference({ inicio: nextFilters.inicio, fim: nextFilters.fim });
              }} placeholder=" " /><span>Inicial</span></label>
              <label className="field"><input type="datetime-local" value={draftFilters.fim} onChange={(event) => {
                const nextFilters = { ...draftFilters, fim: event.target.value };
                setDraftFilters(nextFilters);
                setAtendimentoDateRangePreference({ inicio: nextFilters.inicio, fim: nextFilters.fim });
              }} placeholder=" " /><span>Final</span></label>
              <label className="field">
                <select value={draftFilters.usuarioId} onChange={(event) => {
                  const nextFilters = { ...draftFilters, usuarioId: event.target.value };
                  setDraftFilters(nextFilters);
                  setFilters(nextFilters);
                }}>
                  <option value="TODOS">TODOS</option>
                  {usuarios.map((usuario) => <option key={usuario.id} value={usuario.id}>{usuario.codinome || usuario.full_name || usuario.email}</option>)}
                </select>
                <span>Usuario</span>
              </label>
              <label className="field"><input value={draftFilters.valor} onChange={(event) => setDraftFilters({ ...draftFilters, valor: event.target.value })} placeholder=" " /><span>Valor procurado</span></label>
              <button type="submit"><Search size={16} /> Pesquisar</button>
            </form>
          </section>

          <section className="form-panel">
            <div className="list-summary">{totalLabel}</div>
            <div className="data-table-wrap">
              <table className="data-table clickable-rows">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Agendado</th>
                    <th>Convênio</th>
                    <th>Associado</th>
                    <th>Cadastrado</th>
                    <th>Alterado</th>
                  </tr>
                </thead>
                <tbody>
                  {atendimentos.map((item) => (
                    <tr key={item.id} className={getAtendimentoRowClass(item)} onClick={() => handleSelect(item)}>
                      <td>{item.id}</td>
                      <td><strong>{formatDateTime(item.dt_agendado)}</strong><span>{item.situacao}</span></td>
                      <td><strong>{item.nm_convenio ?? "-"}</strong><span>{item.tipo || "-"}</span></td>
                      <td><strong>{item.nm_associado ?? "-"}</strong><span>{item.nm_dependente || "-"}</span></td>
                      <td><strong>{formatDateTime(item.created_at)}</strong><span>{item.created_by_codinome || item.created_by_nome || "-"}</span></td>
                      <td><strong>{formatDateTime(item.updated_at)}</strong><span>{item.updated_by_codinome || item.updated_by_nome || "-"}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {atendimentosQuery.isLoading ? <div className="empty-state">Carregando...</div> : null}
              {!atendimentosQuery.isLoading && atendimentos.length === 0 ? <div className="empty-state">Nenhum atendimento encontrado.</div> : null}
            </div>
          </section>
        </>
      ) : null}

      {atendimentoForm}
    </main>
  );
}
