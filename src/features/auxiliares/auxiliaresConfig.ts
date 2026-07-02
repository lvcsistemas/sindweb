export type AuxiliarGrupoConfig = {
  key: string;
  path: string;
  label: string;
};

export const AUXILIAR_GRUPOS: AuxiliarGrupoConfig[] = [
  { key: "atendimento_medico_tipo", path: "atendimento-medico-tipo", label: "Atendimento Médico Tipo" },
  { key: "convencao", path: "convencao", label: "Convenção" },
  { key: "escolaridade", path: "escolaridade", label: "Escolaridade" },
  { key: "estabelecimento", path: "estabelecimento", label: "Estabelecimento" },
  { key: "estabelecimento_tipo", path: "estabelecimento-tipo", label: "Tipo de Estabelecimento" },
  { key: "formas_pagamento", path: "formas-pagamento", label: "Formas de Pagamento" },
  { key: "funcao", path: "funcao", label: "Função" },
  { key: "locais_pagamento", path: "locais-pagamento", label: "Locais de Pagamento" },
  { key: "ramo_atividade", path: "ramo-atividade", label: "Ramo de Atividade" },
  { key: "sede", path: "sede", label: "Sede" },
  { key: "situacao", path: "situacao", label: "Situação" }
];

export function getAuxiliarGrupoByPath(path: string | undefined) {
  return AUXILIAR_GRUPOS.find((grupo) => grupo.path === path) ?? null;
}
