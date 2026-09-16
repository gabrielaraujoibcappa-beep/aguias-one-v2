/**
 * Decisões em aberto do SPEC diagnóstico (§16) e da divergência §5.3 × §13.1,
 * implementadas com a recomendação do spec e trocáveis por variável de ambiente
 * (servidor) sem mexer no código. [A CONFIRMAR — Edilson]
 */

export type ReguaMes6 = "media_entrada" | "meta_declarada";
export type BaseMes6 = "matricula" | "primeira_quarta";

function lerEnv(nome: string): string | undefined {
  return typeof process !== "undefined" ? process.env?.[nome] : undefined;
}

/**
 * §16.2 — Régua do mês 6: média dos meses 4–6 comparada à média de entrada
 * (recomendação do playbook) ou à meta_6m que o aluno declarou.
 */
export const REGUA_MES6: ReguaMes6 = lerEnv("REGUA_MES6") === "meta_declarada" ? "meta_declarada" : "media_entrada";

/** §16.3 — Mês 6 conta da matrícula (padrão) ou da primeira quarta da turma (turmas.data_inicio). */
export const BASE_MES6: BaseMes6 = lerEnv("BASE_MES6") === "primeira_quarta" ? "primeira_quarta" : "matricula";

/** §16.1 — Anjo lê faturamento com log (recomendado). "false" reduz a leitura ao score acima/igual/abaixo. */
export const ANJO_LE_FATURAMENTO = lerEnv("ANJO_LE_FATURAMENTO") !== "false";

/** §16.4 — Frases ICP: uso interno. Anúncio só com autorização pontual do Edilson (fora do sistema). */
export const FRASES_SO_USO_INTERNO = true;

/**
 * §5.3 × §13.1 — A Persona A (1 peça, 3 trabalhos, preço inventado) é o caso típico
 * "nada de pé". O teste de aceite §13.1 manda classificá-la como A_nada, mas a tabela
 * §5.3 dizia trabalhos_6m ≤ 2. Vale o aceite: limite 3.
 */
export const LIMITE_TRABALHOS_A_NADA = Number(lerEnv("LIMITE_TRABALHOS_A_NADA") ?? 3) || 3;

/** Dias até o mês 6 (180 = 6 × 30). */
export const DIAS_MES6 = 180;

/** Início da contagem do mês 6 conforme BASE_MES6. */
export function inicioContagemMes6(matriculadoEm: string, turmaInicio: string | null | undefined, base: BaseMes6 = BASE_MES6): Date {
  if (base === "primeira_quarta" && turmaInicio) return new Date(`${turmaInicio.slice(0, 10)}T18:15:00-03:00`);
  return new Date(matriculadoEm);
}

export function dataMes6(matriculadoEm: string, turmaInicio?: string | null, base: BaseMes6 = BASE_MES6): Date {
  return new Date(inicioContagemMes6(matriculadoEm, turmaInicio, base).getTime() + DIAS_MES6 * 24 * 60 * 60 * 1000);
}
