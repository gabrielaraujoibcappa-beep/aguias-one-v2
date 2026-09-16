/**
 * Régua do mês 6 (SPEC diagnóstico §9 job, §10.4; playbook do Anjo §2.2).
 * Função pura: recebe o placar de entrada, a meta e os faturamentos declarados.
 */
import type { ReguaMes6 } from "@/lib/diagnostico/parametros";

export type Comparativo = "acima" | "igual" | "abaixo";

export const TOLERANCIA_COMPARATIVO = 0.05;
export const JANELA_DIAS_MES6 = 7;

export interface FaturamentoDeclarado {
  mesReferencia: string; // YYYY-MM-01
  valorBruto: number; // reais
}

export interface EntradaMes6 {
  mediaEntradaCentavos: number | null;
  metaCentavos: number | null;
  faturamentos: FaturamentoDeclarado[];
  /** Data em que o mês 6 fecha (dataMes6). */
  dataBase: Date;
  regua: ReguaMes6;
  placarNaoSei?: boolean;
}

export interface ResultadoMes6 {
  meses: string[]; // 3 meses avaliados, YYYY-MM-01, do mais antigo ao mais recente
  media3m: number | null; // centavos
  reguaCentavos: number | null;
  regua: ReguaMes6;
  comparativo: Comparativo | null;
  naoSei: boolean;
  sessaoObrigatoria: boolean;
  motivos: string[];
}

const refMes = (d: Date) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;

/** 3 últimos meses fechados até a data base (o mês da data base ainda não fechou). */
export function mesesAvaliados(dataBase: Date): string[] {
  const ano = dataBase.getUTCFullYear();
  const mes = dataBase.getUTCMonth();
  return [3, 2, 1].map((n) => refMes(new Date(Date.UTC(ano, mes - n, 1))));
}

/** Compara com tolerância de ±5% sobre a referência. */
export function comparar(valor: number | null, referencia: number | null, tolerancia = TOLERANCIA_COMPARATIVO): Comparativo | null {
  if (valor === null || referencia === null) return null;
  if (referencia === 0) return valor === 0 ? "igual" : "acima";
  const delta = (valor - referencia) / referencia;
  if (delta > tolerancia) return "acima";
  if (delta < -tolerancia) return "abaixo";
  return "igual";
}

export function mediaCentavos(valoresReais: number[]): number | null {
  if (!valoresReais.length) return null;
  return Math.round((valoresReais.reduce((a, b) => a + b, 0) / valoresReais.length) * 100);
}

export function avaliarMes6(e: EntradaMes6): ResultadoMes6 {
  const meses = mesesAvaliados(e.dataBase);
  const porMes = new Map(e.faturamentos.map((f) => [f.mesReferencia.slice(0, 7), Number(f.valorBruto)]));
  const declarados = meses.map((m) => porMes.get(m.slice(0, 7))).filter((v): v is number => typeof v === "number" && Number.isFinite(v));

  const media3m = mediaCentavos(declarados);
  const naoSei = declarados.length === 0;
  const reguaCentavos = e.regua === "meta_declarada" ? e.metaCentavos ?? null : e.mediaEntradaCentavos ?? null;
  const comparativo = comparar(media3m, reguaCentavos);

  const motivos: string[] = [];
  if (naoSei) motivos.push("Sem faturamento declarado nos meses 4–6 (não sei)");
  if (e.placarNaoSei) motivos.push("Placar de entrada marcado como “não sei”");
  if (reguaCentavos === null && !e.placarNaoSei) motivos.push("Sem régua de comparação");
  if (comparativo === "abaixo") motivos.push("Média dos meses 4–6 abaixo da régua");

  return {
    meses,
    media3m,
    reguaCentavos,
    regua: e.regua,
    comparativo,
    naoSei,
    sessaoObrigatoria: naoSei || !!e.placarNaoSei || reguaCentavos === null || comparativo === "abaixo",
    motivos,
  };
}

/** Dias até o mês 6 (negativo = já passou). */
export function diasAte(data: Date, agora = new Date()): number {
  return Math.ceil((data.getTime() - agora.getTime()) / (24 * 60 * 60 * 1000));
}

/** Entrou na janela do mês 6: faltam ≤ 7 dias ou já passou. */
export function naJanelaMes6(data: Date, agora = new Date()): boolean {
  return diasAte(data, agora) <= JANELA_DIAS_MES6;
}
