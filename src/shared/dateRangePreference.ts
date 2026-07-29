const atendimentoDateRangeKey = "sindweb:atendimento-medico:date-range";

export type AtendimentoDateRangePreference = {
  inicio: string;
  fim: string;
};

function isDateTimeLocalValue(value: string | null | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value));
}

export function getAtendimentoDateRangePreference() {
  try {
    const raw = window.localStorage.getItem(atendimentoDateRangeKey);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as Partial<AtendimentoDateRangePreference>;
    const inicio = parsed.inicio;
    const fim = parsed.fim;
    if (!isDateTimeLocalValue(inicio) || !isDateTimeLocalValue(fim)) return null;

    return { inicio, fim } satisfies AtendimentoDateRangePreference;
  } catch {
    return null;
  }
}

export function setAtendimentoDateRangePreference(range: AtendimentoDateRangePreference) {
  if (!isDateTimeLocalValue(range.inicio) || !isDateTimeLocalValue(range.fim)) return;
  window.localStorage.setItem(atendimentoDateRangeKey, JSON.stringify(range));
}

export function applyAtendimentoDateRangePreference<T extends AtendimentoDateRangePreference>(fallback: T): T {
  const stored = getAtendimentoDateRangePreference();
  return stored ? { ...fallback, ...stored } : fallback;
}
