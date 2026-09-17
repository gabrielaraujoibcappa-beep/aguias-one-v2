/**
 * Placar de entrada — regras de servidor: saneamento, validação, scores,
 * filtro por papel e ciclo de vida. Funções puras (testadas em tests/diagnostico.test.ts).
 * Fonte: SPEC-DIAGNOSTICO-E-ACOMPANHAMENTO.md §4–§6 e §8.
 */
import type { PapelUsuario } from "@/lib/auth/roles";
import {
  BLOCOS,
  CAMPOS_FRASE,
  CampoDiagnostico,
  FONTES_MES,
  NUM_MESES_PLACAR,
  PARCELAS_MES,
  PECAS_DE_PE,
  PayloadDiagnostico,
  TODOS_CAMPOS,
  chaveMes,
  chavesPermitidas,
} from "./campos";
import { LIMITE_TRABALHOS_A_NADA } from "./parametros";

export type StatusDiagnostico = "rascunho" | "enviado" | "congelado";

export type IcpSegmento = "A_iniciante" | "B_contador_bico" | "C_perito_solo" | "D_escritorio";
export type AnjoTipoT0 = "A_nada" | "B_estrutura_sem_venda" | "C_vendeu_sem_sobrar" | "indefinido";
export type RiscoParcela = "alto" | "medio" | "baixo";

export interface ScoresDiagnostico {
  media_6m_bruta: number | null;
  maior_mes: number | null;
  menor_mes: number | null;
  instabilidade: number | null;
  pct_pericia: number;
  pct_at: number;
  pct_escritorio: number;
  pct_outro: number;
  n_meses_preenchidos: number;
  media_informada_de_memoria: boolean;
  placar_nao_sei: boolean;
  pecas_de_pe: number;
  icp_segmento: IcpSegmento | null;
  flag_e_aluno_casa: boolean;
  fit_one: "sim" | "nao";
  anjo_tipo_t0: AnjoTipoT0;
  risco_parcela: RiscoParcela;
  job_statement: string | null;
}

export interface ErroDiagnostico {
  codigo: string;
  mensagem: string;
  campo?: string;
}

export const DIAS_CORRECAO = 7;
export const HORAS_ATRASO = 48;
export const MIN_MESES_PLACAR = 3;
export const MIN_MOTIVO = 10;

// ---------------------------------------------------------------------------
// Meses de referência
// ---------------------------------------------------------------------------

/** 6 meses calendário anteriores à matrícula, do mais antigo (mes_1) ao mais recente (mes_6). YYYY-MM-01. */
export function mesesReferencia(matriculadoEm: string | Date): string[] {
  const base = new Date(matriculadoEm);
  const ano = base.getUTCFullYear();
  const mes = base.getUTCMonth();
  const refs: string[] = [];
  for (let n = NUM_MESES_PLACAR; n >= 1; n--) {
    const d = new Date(Date.UTC(ano, mes - n, 1));
    refs.push(`${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`);
  }
  return refs;
}

// ---------------------------------------------------------------------------
// Saneamento (rascunho): descarta chaves desconhecidas e tipos errados
// ---------------------------------------------------------------------------

const CAMPO_POR_ID = new Map(TODOS_CAMPOS.map((c) => [c.id, c]));
const PARTES_CENTAVOS = new Set<string>(PARCELAS_MES);

function inteiroOuNulo(v: unknown, min = 0, max = Number.MAX_SAFE_INTEGER): number | null {
  if (v === null || v === undefined || v === "") return null;
  const n = typeof v === "number" ? v : Number(v);
  if (!Number.isFinite(n)) return null;
  const i = Math.round(n);
  return i < min || i > max ? null : i;
}

function sanearCampo(campo: CampoDiagnostico, v: unknown): PayloadDiagnostico[string] {
  switch (campo.tipo) {
    case "bool":
      return typeof v === "boolean" ? v : undefined;
    case "texto":
      // Guardar exato: sem trim interno, sem correção. Só corta no limite.
      return typeof v === "string" ? v.slice(0, campo.maxChars ?? 280) : undefined;
    case "enum":
      return typeof v === "string" && campo.opcoes?.some((o) => o.valor === v) ? v : undefined;
    case "multi": {
      if (!Array.isArray(v)) return undefined;
      const validos = Array.from(new Set(v.filter((x) => typeof x === "string" && campo.opcoes?.some((o) => o.valor === x))));
      return campo.maxSelecoes ? validos.slice(0, campo.maxSelecoes) : validos;
    }
    case "inteiro":
      return inteiroOuNulo(v, campo.min ?? 0, campo.max) ?? undefined;
    case "centavos":
      return inteiroOuNulo(v, 0) ?? undefined;
  }
}

/** Mantém só campo_id conhecidos com valor do tipo certo. `mes_N.ref` é sempre do sistema. */
export function sanearPayload(entrada: unknown, matriculadoEm?: string | Date): PayloadDiagnostico {
  const bruto = entrada && typeof entrada === "object" && !Array.isArray(entrada) ? (entrada as Record<string, unknown>) : {};
  const permitidas = chavesPermitidas();
  const saida: PayloadDiagnostico = {};

  for (const [chave, valor] of Object.entries(bruto)) {
    if (!permitidas.has(chave) || chave.endsWith(".ref")) continue;
    let limpo: PayloadDiagnostico[string];
    const campo = CAMPO_POR_ID.get(chave);
    if (campo) {
      limpo = sanearCampo(campo, valor);
    } else if (chave === "placar_nao_sei") {
      limpo = typeof valor === "boolean" ? valor : undefined;
    } else {
      const parte = chave.split(".")[1];
      if (PARTES_CENTAVOS.has(parte)) limpo = inteiroOuNulo(valor, 0) ?? undefined;
      else if (parte === "fonte") limpo = FONTES_MES.includes(valor as any) ? (valor as string) : undefined;
    }
    if (limpo !== undefined) saida[chave] = limpo;
  }

  if (matriculadoEm) {
    mesesReferencia(matriculadoEm).forEach((ref, i) => (saida[chaveMes(i + 1, "ref")] = ref));
  }
  return saida;
}

// ---------------------------------------------------------------------------
// Placar (bloco 2)
// ---------------------------------------------------------------------------

interface MesPlacar {
  n: number;
  valores: Record<(typeof PARCELAS_MES)[number], number | null>;
  total: number | null;
  fonte: string | null;
}

export function lerMeses(p: PayloadDiagnostico): MesPlacar[] {
  const meses: MesPlacar[] = [];
  for (let n = 1; n <= NUM_MESES_PLACAR; n++) {
    const valores = {} as MesPlacar["valores"];
    let total: number | null = null;
    for (const parte of PARCELAS_MES) {
      const v = p[chaveMes(n, parte)];
      valores[parte] = typeof v === "number" ? v : null;
      if (typeof v === "number") total = (total ?? 0) + v;
    }
    const fonte = p[chaveMes(n, "fonte")];
    meses.push({ n, valores, total, fonte: typeof fonte === "string" ? fonte : null });
  }
  return meses;
}

/** Mês conta no placar quando tem algum valor (0 é valor) e a fonte não é "não sei". */
const mesPreenchido = (m: MesPlacar) => m.total !== null && m.fonte !== null && m.fonte !== "nao_sei";

// ---------------------------------------------------------------------------
// Validação de envio
// ---------------------------------------------------------------------------

export function campoVisivel(campo: CampoDiagnostico, p: PayloadDiagnostico): boolean {
  return !campo.mostrarSe || campo.mostrarSe(p);
}

function vazio(v: PayloadDiagnostico[string]): boolean {
  return v === undefined || v === null || v === "" || (Array.isArray(v) && v.length === 0);
}

/** Valida o payload saneado para envio. Devolve o primeiro erro (ordem do formulário) ou null. */
export function validarEnvio(p: PayloadDiagnostico): ErroDiagnostico | null {
  for (const bloco of BLOCOS) {
    if (bloco.numero === 2) {
      const erro = validarPlacar(p);
      if (erro) return erro;
      continue;
    }
    for (const campo of bloco.campos) {
      if (!campoVisivel(campo, p)) continue;
      const v = p[campo.id];
      if (campo.obrigatorio && vazio(v)) {
        return { codigo: "campo_obrigatorio", mensagem: `Responda: ${campo.rotulo}`, campo: campo.id };
      }
      if (campo.tipo === "texto" && typeof v === "string" && campo.minChars && v.trim().length < campo.minChars) {
        return {
          codigo: "texto_curto",
          mensagem: `Escreva pelo menos ${campo.minChars} caracteres.`,
          campo: campo.id,
        };
      }
      if (campo.id === "ultima_vez_organizou" && typeof v === "string" && respostaGenerica(v)) {
        return {
          codigo: "resposta_generica",
          mensagem: "Conte uma vez específica: o que fez e quando. “Sempre”, “nunca” ou “pretendo” não servem.",
          campo: campo.id,
        };
      }
      if (campo.tipo === "centavos" && campo.min && typeof v === "number" && v < campo.min) {
        return { codigo: "valor_invalido", mensagem: `Informe um valor para: ${campo.rotulo}`, campo: campo.id };
      }
    }
  }
  return null;
}

/** Recusa “sempre”, “nunca”, “pretendo” como resposta inteira (Mom Test: só passado concreto). */
export function respostaGenerica(texto: string): boolean {
  const t = texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z\s]/g, " ")
    .trim();
  const palavras = t.split(/\s+/).filter(Boolean);
  if (palavras.length === 0) return true;
  if (/^(sempre|nunca|pretendo)\b/.test(t) && palavras.length <= 6) return true;
  return false;
}

function validarPlacar(p: PayloadDiagnostico): ErroDiagnostico | null {
  const meses = lerMeses(p);
  for (const m of meses) {
    const algumPositivo = PARCELAS_MES.some((parte) => (m.valores[parte] ?? 0) > 0);
    if (algumPositivo && !m.fonte) {
      return {
        codigo: "fonte_obrigatoria",
        mensagem: "Diga de onde tirou o número deste mês.",
        campo: chaveMes(m.n, "fonte"),
      };
    }
  }
  const preenchidos = meses.filter(mesPreenchido).length;
  if (preenchidos < MIN_MESES_PLACAR && p.placar_nao_sei !== true) {
    return {
      codigo: "placar_incompleto",
      mensagem: `Preencha pelo menos ${MIN_MESES_PLACAR} dos 6 meses ou marque que não sabe o placar.`,
      campo: "mes_*",
    };
  }
  return null;
}

// ---------------------------------------------------------------------------
// Scores (§5)
// ---------------------------------------------------------------------------

const lista = (v: PayloadDiagnostico[string]): string[] => (Array.isArray(v) ? v : []);
const num = (v: PayloadDiagnostico[string]): number => (typeof v === "number" ? v : 0);

export function calcularScores(p: PayloadDiagnostico): ScoresDiagnostico {
  const meses = lerMeses(p);
  const validos = meses.filter(mesPreenchido);
  const totais = validos.map((m) => m.total as number);
  const soma = totais.reduce((a, b) => a + b, 0);
  const media = validos.length ? Math.round(soma / validos.length) : null;
  const maior = totais.length ? Math.max(...totais) : null;
  const menor = totais.length ? Math.min(...totais) : null;

  const somaParte = (parte: (typeof PARCELAS_MES)[number]) =>
    validos.reduce((acc, m) => acc + (m.valores[parte] ?? 0), 0);
  const pct = (parte: (typeof PARCELAS_MES)[number]) => (soma > 0 ? Math.round((somaParte(parte) / soma) * 100) : 0);

  const pctPericia = pct("pericia");
  const pctAt = pct("at");
  const pctEscritorio = pct("escritorio");
  const pctOutro = pct("outro");

  const papel = p.papel_principal;
  const estrutura = p.estrutura;
  const trabalhos = num(p.trabalhos_6m);
  const pecas = PECAS_DE_PE.filter((peca) => p[peca.valor] === true).length;

  // 5.1 icp_segmento — primeira regra que casar
  let segmento: IcpSegmento | null = null;
  const pctPericiaAt = pctPericia + pctAt;
  if (papel === "escritorio_contabil" && pctEscritorio >= 70 && estrutura === "equipe_folha") {
    segmento = "D_escritorio";
  } else if (
    (papel === "escritorio_contabil" || papel === "clt_mais_bico") &&
    pctPericiaAt >= 10 &&
    pctPericiaAt <= 70
  ) {
    segmento = "B_contador_bico";
  } else if (
    (papel === "pericia_judicial" || papel === "assistente_tecnico") &&
    media !== null &&
    media >= 600000 &&
    estrutura !== "equipe_folha"
  ) {
    segmento = "C_perito_solo";
  } else if ((media !== null && media < 500000) || trabalhos <= 2) {
    segmento = "A_iniciante";
  }

  const pagou = lista(p.pagou_casa);
  const flagE =
    ["comunidade", "premium", "pos", "mentoria_aguias"].some((x) => pagou.includes(x)) &&
    (p.anos_casa === "2_a_4" || p.anos_casa === "mais_4");

  // 5.2 fit_one
  const fit: "sim" | "nao" = estrutura === "equipe_folha" || (media !== null && media >= 2000000) ? "nao" : "sim";

  // 5.3 anjo_tipo_t0
  const origens = lista(p.ultimo_origem);
  const origemSoNomeacaoIndicacao =
    origens.length > 0 && origens.every((o) => o === "nomeacao_juiz" || o === "indicacao_advogado");
  let tipo: AnjoTipoT0 = "indefinido";
  if (pecas <= 2 && trabalhos <= LIMITE_TRABALHOS_A_NADA) {
    tipo = "A_nada";
  } else if (pecas >= 4 && (num(p.origens_distintas_6m) <= 1 || origemSoNomeacaoIndicacao)) {
    tipo = "B_estrutura_sem_venda";
  } else if (trabalhos >= 3 && (p.ultimo_preco_escrito !== "sim_antes" || p["peca.caixa"] === false)) {
    tipo = "C_vendeu_sem_sobrar";
  }

  // 5.4 risco_parcela
  let risco: RiscoParcela = "baixo";
  if ((media !== null && media < 400000) || p.parcela_aperta === "aperta_muito") risco = "alto";
  else if (p.parcela_aperta === "aperta_mas_cabe") risco = "medio";

  return {
    media_6m_bruta: media,
    maior_mes: maior,
    menor_mes: menor,
    instabilidade: maior !== null && menor !== null ? maior - menor : null,
    pct_pericia: pctPericia,
    pct_at: pctAt,
    pct_escritorio: pctEscritorio,
    pct_outro: pctOutro,
    n_meses_preenchidos: validos.length,
    media_informada_de_memoria: meses.filter((m) => m.fonte === "memoria").length >= 3,
    placar_nao_sei: p.placar_nao_sei === true,
    pecas_de_pe: pecas,
    icp_segmento: segmento,
    flag_e_aluno_casa: flagE,
    fit_one: fit,
    anjo_tipo_t0: tipo,
    risco_parcela: risco,
    job_statement: typeof p.job_frase === "string" ? p.job_frase : null,
  };
}

// ---------------------------------------------------------------------------
// Visibilidade por papel (§3, §7, §8 ler_diagnostico)
// ---------------------------------------------------------------------------

const CAMPOS_ICP = new Set(TODOS_CAMPOS.filter((c) => c.consumo === "icp").map((c) => c.id));
const FRASES = new Set<string>(CAMPOS_FRASE);

const SCORES_CONCIERGE: (keyof ScoresDiagnostico)[] = [
  "media_6m_bruta",
  "maior_mes",
  "menor_mes",
  "n_meses_preenchidos",
  "placar_nao_sei",
  "pecas_de_pe",
  "anjo_tipo_t0",
];

export interface VisaoDiagnostico {
  payload: PayloadDiagnostico;
  scores: Partial<ScoresDiagnostico>;
  /** A leitura inclui números de faturamento. */
  contemDinheiro: boolean;
}

/**
 * Filtra payload e scores para o papel.
 * - mentorado: o próprio payload; dos scores só a média (a UI mostra depois de preencher).
 * - concierge: sem campos ICP (frases, forças, histórico na casa) e sem mix de receita/segmento.
 * - anjo: sem campos ICP; scores sem fit_one e sem job_statement.
 * - mentor/admin: tudo.
 */
export function filtrarParaPapel(
  papel: PapelUsuario,
  payload: PayloadDiagnostico,
  scores: Partial<ScoresDiagnostico> | null
): VisaoDiagnostico {
  const s = scores ?? {};
  if (papel === "mentor" || papel === "admin") {
    return { payload, scores: s, contemDinheiro: true };
  }
  if (papel === "mentorado") {
    const visao: Partial<ScoresDiagnostico> = {};
    if (s.media_6m_bruta !== undefined) visao.media_6m_bruta = s.media_6m_bruta;
    return { payload, scores: visao, contemDinheiro: false };
  }

  const semIcp: PayloadDiagnostico = {};
  for (const [k, v] of Object.entries(payload)) {
    if (CAMPOS_ICP.has(k) || FRASES.has(k)) continue;
    semIcp[k] = v;
  }

  if (papel === "concierge") {
    const visao: Partial<ScoresDiagnostico> = {};
    for (const k of SCORES_CONCIERGE) if (k in s) (visao as any)[k] = s[k];
    // Concierge vê média/maior/menor, mas não o mix por mês
    for (const k of Object.keys(semIcp)) {
      if (/^mes_\d\.(pericia|at|escritorio|outro)$/.test(k)) delete semIcp[k];
    }
    return { payload: semIcp, scores: visao, contemDinheiro: true };
  }

  // anjo
  const { fit_one: _fit, job_statement: _job, ...visaoAnjo } = s;
  return { payload: semIcp, scores: visaoAnjo, contemDinheiro: true };
}

/** Scores exibidos nos cards de lista (sem dinheiro, sem frases). */
export function scoresDeCard(papel: PapelUsuario, s: Partial<ScoresDiagnostico> | null): Partial<ScoresDiagnostico> {
  if (!s) return {};
  const base: Partial<ScoresDiagnostico> = {
    anjo_tipo_t0: s.anjo_tipo_t0,
    pecas_de_pe: s.pecas_de_pe,
    placar_nao_sei: s.placar_nao_sei,
  };
  if (papel === "concierge") return base;
  const anjo = {
    ...base,
    icp_segmento: s.icp_segmento,
    flag_e_aluno_casa: s.flag_e_aluno_casa,
    risco_parcela: s.risco_parcela,
  };
  if (papel === "anjo") return anjo;
  return { ...anjo, fit_one: s.fit_one };
}

// ---------------------------------------------------------------------------
// Ciclo de vida (§6)
// ---------------------------------------------------------------------------

/**
 * Prazo de correção pelo aluno: 7 dias após o envio ou a primeira quarta da turma
 * (data_inicio), o que vier primeiro. Se a turma já começou antes do envio, vale só os 7 dias.
 */
export function prazoCorrecao(enviadoEm: string | Date, inicioTurma?: string | Date | null): Date {
  const envio = new Date(enviadoEm);
  const seteDias = new Date(envio.getTime() + DIAS_CORRECAO * 24 * 60 * 60 * 1000);
  if (!inicioTurma) return seteDias;
  // data_inicio é DATE: considera o fim do dia do encontro (23:59:59 UTC-3 ≈ 02:59:59Z seguinte)
  const inicio = new Date(`${String(inicioTurma).slice(0, 10)}T23:59:59-03:00`);
  if (inicio.getTime() <= envio.getTime()) return seteDias;
  return inicio.getTime() < seteDias.getTime() ? inicio : seteDias;
}

export function deveCongelar(
  status: StatusDiagnostico,
  enviadoEm: string | null,
  inicioTurma: string | null | undefined,
  agora = new Date()
): boolean {
  return status === "enviado" && !!enviadoEm && agora.getTime() > prazoCorrecao(enviadoEm, inicioTurma).getTime();
}

/** Sem envio T+48h após a matrícula. Vai para o resgate (Adelayne), não para o Anjo. */
export function diagnosticoAtrasado(
  status: StatusDiagnostico | null | undefined,
  matriculadoEm: string | null | undefined,
  agora = new Date()
): boolean {
  if (status && status !== "rascunho") return false;
  if (!matriculadoEm) return false;
  return agora.getTime() - new Date(matriculadoEm).getTime() > HORAS_ATRASO * 60 * 60 * 1000;
}

type Cor = "verde" | "amarelo" | "vermelho";

/**
 * Semana 1 (§6): sem placar enviado não fecha verde. Amarelo se só faltou o
 * placar; vermelho se, fechada a semana 1, também não há check-in.
 */
export function ajustarSemaforoPorDiagnostico(
  cor: Cor,
  diagnosticoEnviado: boolean,
  temCheckin: boolean,
  semana1Encerrada: boolean
): Cor {
  if (diagnosticoEnviado) return cor;
  if (!temCheckin && semana1Encerrada) return "vermelho";
  return cor === "verde" ? "amarelo" : cor;
}

export function segmentoMudou(a: Partial<ScoresDiagnostico> | null, b: Partial<ScoresDiagnostico>): boolean {
  return (a?.icp_segmento ?? null) !== (b.icp_segmento ?? null);
}
