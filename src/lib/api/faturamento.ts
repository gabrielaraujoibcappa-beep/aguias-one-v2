export interface ComprovanteItem {
  nome: string;
  path: string;
  tipo: "zip" | "arquivo";
}

export interface DeclaracaoFaturamento {
  id?: string;
  matriculaId: string;
  mesReferencia: string; // YYYY-MM-01
  valorBruto: number;
  comprovantes: ComprovanteItem[];
  criadoEm?: string;
}

const EXTENSOES_PERMITIDAS = [".zip", ".pdf", ".png", ".jpg", ".jpeg"];

export function validarComprovanteFaturamento(nomeArquivo: string): { valido: boolean; motivo?: string } {
  const lower = nomeArquivo.toLowerCase();
  const permitido = EXTENSOES_PERMITIDAS.some((ext) => lower.endsWith(ext));

  if (!permitido) {
    return {
      valido: false,
      motivo: "Formato inválido. Apenas .zip, .pdf, .png e .jpg são aceitos.",
    };
  }

  return { valido: true };
}

export function formatarMoedaReal(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor).replace(/\u00a0/g, " ");
}

export const formatarMoedaBRL = formatarMoedaReal;

export const FATURAMENTOS_HISTORICO_MOCK: DeclaracaoFaturamento[] = [
  {
    id: "fat-1",
    matriculaId: "mat-1",
    mesReferencia: "2026-08-01",
    valorBruto: 14200.0,
    comprovantes: [
      { nome: "extrato_e_recibos_agosto.zip", path: "faturamentos/extrato_agosto.zip", tipo: "zip" },
    ],
    criadoEm: "2026-09-02T10:00:00Z",
  },
  {
    id: "fat-2",
    matriculaId: "mat-1",
    mesReferencia: "2026-07-01",
    valorBruto: 11800.0,
    comprovantes: [
      { nome: "comprovante_julho.pdf", path: "faturamentos/comp_julho.pdf", tipo: "arquivo" },
    ],
    criadoEm: "2026-08-03T11:30:00Z",
  },
];

// ---------------------------------------------------------------------------
// Meta de faturamento anual (dividida em 12 metas mensais iguais)
// ---------------------------------------------------------------------------

export const META_FATURAMENTO_ANUAL_PADRAO = 240000; // R$ 20.000 por mês

export const MESES_ABREVIADOS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

export interface ProgressoMes {
  mes: number; // 1..12
  rotulo: string; // "Jan".."Dez"
  realizado: number;
  meta: number;
  percentual: number; // realizado / meta * 100, sem teto
  declarado: boolean; // houve ao menos uma declaração no mês
}

export interface ProgressoMetaAnual {
  ano: number;
  metaAnual: number;
  metaMensal: number;
  meses: ProgressoMes[];
  realizadoAcumulado: number;
  restante: number;
  percentualAnual: number;
  mesesDeclarados: number;
  mediaMensalDeclarada: number;
  mesesAcimaDaMeta: number;
}

export function calcularMetaMensal(metaAnual: number): number {
  return metaAnual > 0 ? metaAnual / 12 : 0;
}

/**
 * Consolida as declarações de um ano contra a meta anual.
 * Declarações do mesmo mês são somadas. Meses sem declaração ficam com realizado 0.
 */
export function calcularProgressoMetaAnual(
  faturamentos: DeclaracaoFaturamento[],
  metaAnual: number,
  ano: number
): ProgressoMetaAnual {
  const metaMensal = calcularMetaMensal(metaAnual);
  const porMes = new Map<number, number>();

  for (const f of faturamentos) {
    const [anoRef, mesRef] = f.mesReferencia.split("-").map(Number);
    if (anoRef !== ano || !mesRef || mesRef < 1 || mesRef > 12) continue;
    porMes.set(mesRef, (porMes.get(mesRef) ?? 0) + (Number(f.valorBruto) || 0));
  }

  const meses: ProgressoMes[] = MESES_ABREVIADOS.map((rotulo, idx) => {
    const mes = idx + 1;
    const realizado = porMes.get(mes) ?? 0;
    return {
      mes,
      rotulo,
      realizado,
      meta: metaMensal,
      percentual: metaMensal > 0 ? (realizado / metaMensal) * 100 : 0,
      declarado: porMes.has(mes),
    };
  });

  const realizadoAcumulado = meses.reduce((soma, m) => soma + m.realizado, 0);
  const mesesDeclarados = meses.filter((m) => m.declarado).length;

  return {
    ano,
    metaAnual,
    metaMensal,
    meses,
    realizadoAcumulado,
    restante: Math.max(metaAnual - realizadoAcumulado, 0),
    percentualAnual: metaAnual > 0 ? (realizadoAcumulado / metaAnual) * 100 : 0,
    mesesDeclarados,
    mediaMensalDeclarada: mesesDeclarados > 0 ? realizadoAcumulado / mesesDeclarados : 0,
    mesesAcimaDaMeta: meses.filter((m) => m.declarado && m.realizado >= metaMensal && metaMensal > 0).length,
  };
}

/** Anos presentes nas declarações, mais o ano informado, em ordem decrescente. */
export function listarAnosDisponiveis(faturamentos: DeclaracaoFaturamento[], anoAtual: number): number[] {
  const anos = new Set<number>([anoAtual]);
  for (const f of faturamentos) {
    const ano = Number(f.mesReferencia.split("-")[0]);
    if (ano) anos.add(ano);
  }
  return Array.from(anos).sort((a, b) => b - a);
}
