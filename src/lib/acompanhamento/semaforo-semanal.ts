/**
 * Histórico semanal do semáforo (tabela semaforo_semanal). Funções puras.
 * Semana = segunda-feira, no fuso de Brasília.
 */
export type CorSemaforo = "verde" | "amarelo" | "vermelho";

export interface FotoSemana {
  semana: string; // YYYY-MM-DD (segunda)
  cor: CorSemaforo;
  motivo?: string | null;
}

const DIA_MS = 24 * 60 * 60 * 1000;

/** Data civil (YYYY-MM-DD) em America/Sao_Paulo. */
function dataCivilSaoPaulo(data: Date): string {
  const partes = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(data);
  const v = (t: string) => partes.find((p) => p.type === t)?.value ?? "";
  return `${v("year")}-${v("month")}-${v("day")}`;
}

/** Segunda-feira da semana da data, em America/Sao_Paulo. */
export function inicioSemana(data: Date | string = new Date()): string {
  const civil = dataCivilSaoPaulo(new Date(data));
  const d = new Date(`${civil}T00:00:00Z`);
  const diaSemana = d.getUTCDay(); // 0 = domingo
  const recuo = diaSemana === 0 ? 6 : diaSemana - 1;
  return new Date(d.getTime() - recuo * DIA_MS).toISOString().slice(0, 10);
}

const maisRecentePrimeiro = (h: FotoSemana[]) => [...h].sort((a, b) => b.semana.localeCompare(a.semana));

/** Semanas vermelhas cujo início cai nos últimos 28 dias (inclui a semana corrente). */
export function vermelhos28d(historico: FotoSemana[], agora: Date = new Date()): number {
  const hoje = new Date(`${dataCivilSaoPaulo(agora)}T00:00:00Z`).getTime();
  const limite = hoje - 28 * DIA_MS;
  return historico.filter((f) => {
    const t = new Date(`${f.semana}T00:00:00Z`).getTime();
    return f.cor === "vermelho" && t > limite && t <= hoje;
  }).length;
}

/** As duas semanas mais recentes registradas são vermelhas e consecutivas. */
export function vermelhoDuplo(historico: FotoSemana[]): boolean {
  const [a, b] = maisRecentePrimeiro(historico);
  if (!a || !b || a.cor !== "vermelho" || b.cor !== "vermelho") return false;
  const diff = new Date(`${a.semana}T00:00:00Z`).getTime() - new Date(`${b.semana}T00:00:00Z`).getTime();
  return diff === 7 * DIA_MS;
}

/** Semanas vermelhas seguidas a partir da mais recente. */
export function semanasVermelhasSeguidas(historico: FotoSemana[]): number {
  const ordenado = maisRecentePrimeiro(historico);
  let n = 0;
  for (let i = 0; i < ordenado.length; i++) {
    if (ordenado[i].cor !== "vermelho") break;
    if (i > 0) {
      const diff =
        new Date(`${ordenado[i - 1].semana}T00:00:00Z`).getTime() - new Date(`${ordenado[i].semana}T00:00:00Z`).getTime();
      if (diff !== 7 * DIA_MS) break;
    }
    n++;
  }
  return n;
}

/** Até 52 semanas, da mais antiga para a mais recente. */
export function ultimas52(historico: FotoSemana[]): FotoSemana[] {
  return maisRecentePrimeiro(historico).slice(0, 52).reverse();
}
