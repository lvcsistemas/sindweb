import type { Banco, Config, Contribuicao, Fatura } from "../../types/database";

type SacadoBoleto = {
  nome: string | null;
  documento: string | null;
  endereco: string | null;
  numero: string | null;
  complemento: string | null;
  bairro: string | null;
  cidade: string | null;
  uf: string | null;
  cep: string | null;
};

export type BoletoItauData = {
  fatura: Fatura;
  banco: Banco;
  contribuicao: Contribuicao;
  config: Config;
  sacado: SacadoBoleto;
  nossoNumero: string;
  linhaDigitavel: string;
  codigoBarras: string;
};

type BoletoGerado = {
  nossoNumero: string;
  linhaDigitavel: string;
  codigoBarras: string;
  proximoNossoNumero: number;
};

const ITAU_BANCO = "341";
const MOEDA_REAL = "9";
const CARTEIRAS_DAC_SIMPLES = new Set(["126", "131", "146", "150", "168"]);

function onlyDigits(value: string | number | null | undefined) {
  return String(value ?? "").replace(/\D/g, "");
}

function leftPad(value: string | number, size: number) {
  return onlyDigits(value).padStart(size, "0").slice(-size);
}

function currencyToBarcodeValue(value: number | string | null | undefined) {
  return String(Math.round(Number(value || 0) * 100)).padStart(10, "0").slice(-10);
}

function parseDateOnly(value: string) {
  const [year, month, day] = value.slice(0, 10).split("-").map(Number);
  return new Date(year, month - 1, day);
}

function daysBetween(start: Date, end: Date) {
  const oneDay = 24 * 60 * 60 * 1000;
  return Math.round((end.getTime() - start.getTime()) / oneDay);
}

export function fatorVencimento(dateValue: string) {
  const date = parseDateOnly(dateValue);
  const resetDate = new Date(2025, 1, 22);
  if (date >= resetDate) return String(1000 + daysBetween(resetDate, date)).padStart(4, "0");
  const baseDate = new Date(1997, 9, 7);
  return String(daysBetween(baseDate, date)).padStart(4, "0");
}

export function modulo10(value: string) {
  const digits = onlyDigits(value).split("").reverse();
  const sum = digits.reduce((total, digit, index) => {
    const product = Number(digit) * (index % 2 === 0 ? 2 : 1);
    return total + Math.floor(product / 10) + (product % 10);
  }, 0);
  const dac = 10 - (sum % 10);
  return dac === 10 ? 0 : dac;
}

export function modulo11CodigoBarras(value: string) {
  const digits = onlyDigits(value).split("").reverse();
  const sum = digits.reduce((total, digit, index) => total + Number(digit) * ((index % 8) + 2), 0);
  const dac = 11 - (sum % 11);
  return dac === 0 || dac === 1 || dac === 10 || dac === 11 ? 1 : dac;
}

function splitConta(contaNumero: string, agencia: string) {
  const digits = onlyDigits(contaNumero);
  const conta = digits.length > 5 ? digits.slice(0, 5) : leftPad(digits, 5);
  const dac = digits.length > 5 ? digits.slice(5, 6) : String(modulo10(`${agencia}${conta}`));
  return { conta, dac };
}

function formatLinha(campo: string) {
  return `${campo.slice(0, 5)}.${campo.slice(5)}`;
}

export function gerarDadosBoletoItau(fatura: Fatura, banco: Banco): BoletoGerado {
  if (leftPad(banco.banco_numero, 3) !== ITAU_BANCO) throw new Error("A geração de boleto implementada é exclusiva para o Banco Itaú 341.");
  if (!banco.carteira) throw new Error("Informe a carteira no cadastro do banco.");
  if (!banco.agencia_numero) throw new Error("Informe a agência no cadastro do banco.");
  if (!banco.conta_numero) throw new Error("Informe a conta no cadastro do banco.");

  const carteira = leftPad(banco.carteira, 3);
  const agencia = leftPad(banco.agencia_numero, 4);
  const { conta, dac: contaDac } = splitConta(banco.conta_numero, agencia);
  const proximo = Number(banco.nosso_numero_proximo || 0);
  const inicio = Number(banco.nosso_numero_inicio || 0);
  const fim = Number(banco.nosso_numero_fim || 0);
  if (!Number.isFinite(proximo) || proximo < inicio || proximo > fim) throw new Error("Próximo nosso número fora da faixa configurada no banco.");

  const numero = leftPad(proximo, 8);
  const sequenciaNossoNumero = CARTEIRAS_DAC_SIMPLES.has(carteira) ? `${carteira}${numero}` : `${agencia}${conta}${carteira}${numero}`;
  const nossoNumeroDac = String(modulo10(sequenciaNossoNumero));
  const fator = fatorVencimento(fatura.dt_vencimento);
  const valor = currencyToBarcodeValue(fatura.valor_total);
  const campoLivre = `${carteira}${numero}${nossoNumeroDac}${agencia}${conta}${contaDac}000`;
  const semDac = `${ITAU_BANCO}${MOEDA_REAL}${fator}${valor}${campoLivre}`;
  const dacCodigoBarras = String(modulo11CodigoBarras(semDac));
  const codigoBarras = `${ITAU_BANCO}${MOEDA_REAL}${dacCodigoBarras}${fator}${valor}${campoLivre}`;

  const campo1Base = `${ITAU_BANCO}${MOEDA_REAL}${campoLivre.slice(0, 5)}`;
  const campo2Base = campoLivre.slice(5, 15);
  const campo3Base = campoLivre.slice(15, 25);
  const campo1 = `${campo1Base}${modulo10(campo1Base)}`;
  const campo2 = `${campo2Base}${modulo10(campo2Base)}`;
  const campo3 = `${campo3Base}${modulo10(campo3Base)}`;
  const linhaDigitavel = `${formatLinha(campo1)} ${formatLinha(campo2)} ${formatLinha(campo3)} ${dacCodigoBarras} ${fator}${valor}`;

  return {
    nossoNumero: `${carteira}/${numero}-${nossoNumeroDac}`,
    linhaDigitavel,
    codigoBarras,
    proximoNossoNumero: proximo + 1
  };
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char] || char));
}

function formatDate(value: string | null | undefined) {
  if (!value) return "";
  const [year, month, day] = value.slice(0, 10).split("-");
  return `${day}/${month}/${year}`;
}

function formatCurrency(value: number | string | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
}

function formatDocumento(value: string | null | undefined) {
  const digits = onlyDigits(value);
  if (digits.length === 11) return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, "$1.$2.$3-$4");
  if (digits.length === 14) return digits.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
  return value ?? "";
}

function joinText(values: Array<string | null | undefined>, separator = " ") {
  return values.map((item) => item?.trim()).filter(Boolean).join(separator);
}

function barcodeSvg(code: string) {
  const patterns: Record<string, string> = {
    "0": "00110",
    "1": "10001",
    "2": "01001",
    "3": "11000",
    "4": "00101",
    "5": "10100",
    "6": "01100",
    "7": "00011",
    "8": "10010",
    "9": "01010"
  };
  const narrow = 1;
  const wide = 3;
  let x = 0;
  const rects: string[] = [];
  const draw = (width: number, black: boolean) => {
    if (black) rects.push(`<rect x="${x}" y="0" width="${width}" height="52" />`);
    x += width;
  };

  draw(narrow, true);
  draw(narrow, false);
  draw(narrow, true);
  draw(narrow, false);

  for (let i = 0; i < code.length; i += 2) {
    const bars = patterns[code[i]];
    const spaces = patterns[code[i + 1]];
    for (let j = 0; j < 5; j += 1) {
      draw(bars[j] === "1" ? wide : narrow, true);
      draw(spaces[j] === "1" ? wide : narrow, false);
    }
  }

  draw(wide, true);
  draw(narrow, false);
  draw(narrow, true);

  return `<svg class="barcode" viewBox="0 0 ${x} 52" preserveAspectRatio="none" aria-label="Código de barras">${rects.join("")}</svg>`;
}

export function buildBoletoItauHtml(data: BoletoItauData) {
  const beneficiarioNome = data.config.razao_social || data.config.nm_fantasia || "";
  const beneficiarioEndereco = joinText([
    data.config.endereco,
    data.config.numero,
    data.config.complemento,
    data.config.bairro,
    data.config.cidade,
    data.config.uf,
    data.config.cep
  ], ", ");
  const sacadoEndereco = joinText([
    data.sacado.endereco,
    data.sacado.numero,
    data.sacado.complemento,
    data.sacado.bairro,
    data.sacado.cidade,
    data.sacado.uf,
    data.sacado.cep
  ], ", ");
  const agenciaConta = `${leftPad(data.banco.agencia_numero, 4)} / ${leftPad(data.banco.conta_numero, 5)}`;
  const documento = `${data.fatura.id}/${String(data.fatura.competencia_mes).padStart(2, "0")}${data.fatura.competencia_ano}`;
  const instrucoes = joinText([
    data.contribuicao.instrucao,
    data.banco.multa_percentual ? `Após o vencimento cobrar multa de ${data.banco.multa_percentual}%.` : null,
    data.banco.juros_dia_percentual ? `Juros de ${data.banco.juros_dia_percentual}% ao dia.` : null
  ], "\n");

  return `<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <title>Boleto Itaú ${escapeHtml(data.fatura.id)}</title>
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; padding: 16px; color: #111; background: #fff; font-family: Arial, Helvetica, sans-serif; font-size: 11px; }
    .boleto { width: 190mm; max-width: 100%; margin: 0 auto; }
    .linha-digitavel { font-size: 17px; font-weight: 700; letter-spacing: 0.4px; text-align: right; }
    .bank-row { display: grid; grid-template-columns: 48mm 24mm 1fr; align-items: center; border-bottom: 2px solid #111; min-height: 12mm; }
    .bank-name { font-size: 20px; font-weight: 800; }
    .bank-code { border-left: 2px solid #111; border-right: 2px solid #111; text-align: center; font-size: 18px; font-weight: 800; padding: 3px; }
    .grid { display: grid; grid-template-columns: 1fr 38mm; border-bottom: 1px solid #111; }
    .left-grid { display: grid; grid-template-columns: repeat(4, 1fr); }
    .cell { min-height: 11mm; border-right: 1px solid #111; padding: 2px 4px; }
    .cell.full { grid-column: 1 / -1; }
    .cell.double { grid-column: span 2; }
    .cell.triple { grid-column: span 3; }
    .label { display: block; font-size: 8px; color: #333; text-transform: uppercase; margin-bottom: 2px; }
    .value { font-size: 11px; font-weight: 700; white-space: pre-line; }
    .right-column .cell { border-right: 0; border-left: 1px solid #111; }
    .right-column .value { text-align: right; font-size: 12px; }
    .instructions { min-height: 30mm; }
    .barcode { width: 103mm; height: 13mm; margin-top: 8mm; }
    .cut { border: 0; border-top: 1px dashed #777; margin: 10mm 0 4mm; }
    .receipt { border: 1px solid #111; padding: 4px 6px; margin-bottom: 8mm; }
    .receipt h2 { margin: 0 0 4px; font-size: 14px; }
    @media print {
      body { padding: 0; }
      .boleto { width: 190mm; }
    }
  </style>
</head>
<body>
  <div class="boleto">
    <section class="receipt">
      <h2>Recibo do Pagador</h2>
      <div><strong>Beneficiário:</strong> ${escapeHtml(beneficiarioNome)} - ${escapeHtml(formatDocumento(data.config.cpf_cnpj))}</div>
      <div><strong>Pagador:</strong> ${escapeHtml(data.sacado.nome)} - ${escapeHtml(formatDocumento(data.sacado.documento))}</div>
      <div><strong>Documento:</strong> ${escapeHtml(documento)} &nbsp; <strong>Vencimento:</strong> ${escapeHtml(formatDate(data.fatura.dt_vencimento))} &nbsp; <strong>Valor:</strong> ${escapeHtml(formatCurrency(data.fatura.valor_total))}</div>
      <div><strong>Linha digitável:</strong> ${escapeHtml(data.linhaDigitavel)}</div>
    </section>

    <hr class="cut">

    <section>
      <div class="bank-row">
        <div class="bank-name">Itaú</div>
        <div class="bank-code">341-7</div>
        <div class="linha-digitavel">${escapeHtml(data.linhaDigitavel)}</div>
      </div>

      <div class="grid">
        <div class="left-grid">
          <div class="cell full"><span class="label">Local de pagamento</span><span class="value">ATÉ O VENCIMENTO, PAGUE EM QUALQUER BANCO OU CORRESPONDENTE NÃO BANCÁRIO.</span></div>
          <div class="cell full"><span class="label">Beneficiário</span><span class="value">${escapeHtml(beneficiarioNome)} - ${escapeHtml(formatDocumento(data.config.cpf_cnpj))}\n${escapeHtml(beneficiarioEndereco)}</span></div>
          <div class="cell"><span class="label">Data documento</span><span class="value">${escapeHtml(formatDate(data.fatura.dt_emissao))}</span></div>
          <div class="cell"><span class="label">Número documento</span><span class="value">${escapeHtml(documento)}</span></div>
          <div class="cell"><span class="label">Espécie doc.</span><span class="value">DM</span></div>
          <div class="cell"><span class="label">Aceite</span><span class="value">N</span></div>
          <div class="cell full instructions"><span class="label">Instruções de responsabilidade do beneficiário</span><span class="value">${escapeHtml(instrucoes)}</span></div>
          <div class="cell full"><span class="label">Pagador</span><span class="value">${escapeHtml(data.sacado.nome)} - ${escapeHtml(formatDocumento(data.sacado.documento))}\n${escapeHtml(sacadoEndereco)}</span></div>
        </div>
        <div class="right-column">
          <div class="cell"><span class="label">Vencimento</span><span class="value">${escapeHtml(formatDate(data.fatura.dt_vencimento))}</span></div>
          <div class="cell"><span class="label">Agência / Código beneficiário</span><span class="value">${escapeHtml(agenciaConta)}</span></div>
          <div class="cell"><span class="label">Nosso número</span><span class="value">${escapeHtml(data.nossoNumero)}</span></div>
          <div class="cell"><span class="label">Carteira</span><span class="value">${escapeHtml(data.banco.carteira)}</span></div>
          <div class="cell"><span class="label">Valor documento</span><span class="value">${escapeHtml(formatCurrency(data.fatura.valor_total))}</span></div>
          <div class="cell"><span class="label">Desconto / abatimento</span><span class="value"></span></div>
          <div class="cell"><span class="label">Mora / multa</span><span class="value"></span></div>
          <div class="cell"><span class="label">Valor cobrado</span><span class="value"></span></div>
        </div>
      </div>
      ${barcodeSvg(data.codigoBarras)}
    </section>
  </div>
  <script>window.addEventListener("load", () => { window.print(); });</script>
</body>
</html>`;
}
