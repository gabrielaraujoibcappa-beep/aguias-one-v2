import { describe, it, expect } from "vitest";
import { PECAS_DE_PE, PayloadDiagnostico, chaveMes } from "../src/lib/diagnostico/campos";
import {
  ajustarSemaforoPorDiagnostico,
  calcularScores,
  deveCongelar,
  diagnosticoAtrasado,
  filtrarParaPapel,
  mesesReferencia,
  prazoCorrecao,
  respostaGenerica,
  sanearPayload,
  scoresDeCard,
  validarEnvio,
} from "../src/lib/diagnostico/regras";

type Mes = Partial<Record<"pericia" | "at" | "escritorio" | "outro", number>>;

/** Personas fictícias (SPEC §13 — sem nomes reais da Turma 1). Valores em reais. */
function persona(opts: {
  meses: Mes[];
  fonte?: string;
  papel: string;
  estrutura: string;
  trabalhos: number;
  pecas: number;
  preco?: string;
  origem?: string[];
  origens?: number;
  pagou?: string[];
  anos?: string;
  aperta?: string;
  caixa?: boolean;
}): PayloadDiagnostico {
  const p: PayloadDiagnostico = {
    crc_ativo: true,
    papel_principal: opts.papel,
    estrutura: opts.estrutura,
    uf: "SP",
    trabalhos_6m: opts.trabalhos,
    pagou_casa: opts.pagou ?? ["nada"],
    largou_12m: ["nada"],
    ultima_vez_organizou: "Em junho tentei montar a pasta. Ficou a meia.",
    forca_push: "mes_nao_repete",
    forca_pull: "ordem_pronta",
    forca_anxiety: "parcela_900",
    forca_habit: "esperar_nomeacao",
    job_frase: "Quando o mês fecha no zero, eu preciso de uma porta nova.",
    horas_semana_reais: 6,
    melhor_faixa: "noite",
    meta_6m: 800000,
    parcela_aperta: opts.aperta ?? "nao",
    frase_sabado: "Sábado eu ainda estou no laudo.",
    frase_preco: "Tenho que ver e te falo.",
    frase_sozinho: "Não aguento folha de pagamento.",
  };
  if (opts.anos) p.anos_casa = opts.anos;
  if (opts.trabalhos > 0) {
    p.ultimo_origem = opts.origem ?? ["indicacao_advogado"];
    p.ultimo_preco_escrito = opts.preco ?? "inventei_na_hora";
    p.origens_distintas_6m = opts.origens ?? 1;
  }
  PECAS_DE_PE.forEach((peca, i) => (p[peca.valor] = i < opts.pecas));
  if (opts.caixa !== undefined) p["peca.caixa"] = opts.caixa;
  opts.meses.forEach((m, i) => {
    for (const [parte, reais] of Object.entries(m)) p[chaveMes(i + 1, parte as any)] = reais * 100;
    p[chaveMes(i + 1, "fonte")] = opts.fonte ?? "extrato";
  });
  return p;
}

describe("Placar de entrada — scores (SPEC §5 e §13)", () => {
  it("1. Persona A: iniciante, risco alto", () => {
    const p = persona({
      meses: [0, 1200, 2800, 0, 900, 1600].map((v) => ({ pericia: v })),
      papel: "pericia_judicial",
      estrutura: "sozinho",
      trabalhos: 3,
      pecas: 1,
      preco: "inventei_na_hora",
      origem: ["indicacao_advogado"],
    });
    expect(validarEnvio(p)).toBeNull();
    const s = calcularScores(p);
    expect(s.icp_segmento).toBe("A_iniciante");
    expect(s.risco_parcela).toBe("alto");
    expect(s.media_6m_bruta).toBe(108333);
    expect(s.pct_pericia).toBe(100);
    // §13.1 prevalece sobre a tabela §5.3 (LIMITE_TRABALHOS_A_NADA = 3)
    expect(s.anjo_tipo_t0).toBe("A_nada");
  });

  it("1b. Com 4 trabalhos e preço inventado vira C_vendeu_sem_sobrar", () => {
    const p = persona({
      meses: [0, 1200, 2800, 0, 900, 1600].map((v) => ({ pericia: v })),
      papel: "pericia_judicial",
      estrutura: "sozinho",
      trabalhos: 4,
      pecas: 1,
    });
    expect(calcularScores(p).anjo_tipo_t0).toBe("C_vendeu_sem_sobrar");
  });

  it("2. Contador-bico com flag E (aluno da casa)", () => {
    const p = persona({
      meses: Array.from({ length: 6 }, () => ({ escritorio: 4000, pericia: 2000 })),
      papel: "escritorio_contabil",
      estrutura: "sozinho",
      trabalhos: 5,
      pecas: 3,
      pagou: ["comunidade"],
      anos: "2_a_4",
    });
    expect(validarEnvio(p)).toBeNull();
    const s = calcularScores(p);
    expect(s.icp_segmento).toBe("B_contador_bico");
    expect(s.flag_e_aluno_casa).toBe(true);
    expect(s.fit_one).toBe("sim");
  });

  it("3. Perito-solo de 9 mil", () => {
    const p = persona({
      meses: Array.from({ length: 6 }, () => ({ pericia: 9000 })),
      papel: "pericia_judicial",
      estrutura: "sozinho",
      trabalhos: 8,
      pecas: 5,
      preco: "sim_antes",
      origens: 3,
      origem: ["google", "cliente_antigo"],
      caixa: true, // 5 primeiras peças + conta PJ = 6
    });
    const s = calcularScores(p);
    expect(s.icp_segmento).toBe("C_perito_solo");
    expect(s.flag_e_aluno_casa).toBe(false);
    expect(s.pecas_de_pe).toBe(6);
    expect(s.risco_parcela).toBe("baixo");
  });

  it("4. Dono de escritório com folha: D e fit_one=nao", () => {
    const p = persona({
      meses: Array.from({ length: 6 }, () => ({ escritorio: 16000, pericia: 4000 })),
      papel: "escritorio_contabil",
      estrutura: "equipe_folha",
      trabalhos: 20,
      pecas: 7,
    });
    const s = calcularScores(p);
    expect(s.pct_escritorio).toBe(80);
    expect(s.icp_segmento).toBe("D_escritorio");
    expect(s.fit_one).toBe("nao");
  });

  it("5. Placar todo 'não sei' com a flag marcada: envia com 0 meses", () => {
    const p = persona({
      meses: Array.from({ length: 6 }, () => ({})),
      papel: "pericia_judicial",
      estrutura: "sozinho",
      trabalhos: 0,
      pecas: 0,
    });
    for (let n = 1; n <= 6; n++) p[chaveMes(n, "fonte")] = "nao_sei";
    p.placar_nao_sei = true;
    expect(validarEnvio(p)).toBeNull();
    const s = calcularScores(p);
    expect(s.n_meses_preenchidos).toBe(0);
    expect(s.media_6m_bruta).toBeNull();
    expect(s.placar_nao_sei).toBe(true);
    expect(s.anjo_tipo_t0).toBe("A_nada");
  });

  it("média ≥ R$ 20 mil marca fit_one=nao (candidato a Águias)", () => {
    const p = persona({
      meses: Array.from({ length: 6 }, () => ({ pericia: 21000 })),
      papel: "pericia_judicial",
      estrutura: "sozinho",
      trabalhos: 10,
      pecas: 8,
    });
    expect(calcularScores(p).fit_one).toBe("nao");
  });
});

describe("Placar de entrada — validação e saneamento", () => {
  const base = () =>
    persona({
      meses: Array.from({ length: 6 }, () => ({ pericia: 3000 })),
      papel: "pericia_judicial",
      estrutura: "sozinho",
      trabalhos: 3,
      pecas: 2,
    });

  it("aceite 2: menos de 3 meses e sem placar_nao_sei → erro no campo mes_*", () => {
    const p = base();
    for (let n = 3; n <= 6; n++) {
      delete p[chaveMes(n, "pericia")];
      delete p[chaveMes(n, "fonte")];
    }
    expect(validarEnvio(p)?.campo).toBe("mes_*");
  });

  it("valor > 0 sem fonte é recusado", () => {
    const p = base();
    delete p[chaveMes(2, "fonte")];
    expect(validarEnvio(p)?.campo).toBe("mes_2.fonte");
  });

  it("campo condicional só é exigido quando visível", () => {
    const p = base();
    p.papel_principal = "outro";
    expect(validarEnvio(p)?.campo).toBe("papel_outro");
    p.papel_principal = "pericia_judicial";
    expect(validarEnvio(p)).toBeNull();
  });

  it("trabalhos_6m = 0 pula origem e preço", () => {
    const p = base();
    p.trabalhos_6m = 0;
    delete p.ultimo_origem;
    delete p.ultimo_preco_escrito;
    delete p.origens_distintas_6m;
    expect(validarEnvio(p)).toBeNull();
  });

  it("frases com menos de 12 caracteres são recusadas", () => {
    const p = base();
    p.frase_preco = "Caro.";
    expect(validarEnvio(p)?.campo).toBe("frase_preco");
  });

  it("recusa 'sempre', 'nunca', 'pretendo' em ultima_vez_organizou", () => {
    expect(respostaGenerica("Nunca sentei para isso.")).toBe(true);
    expect(respostaGenerica("Pretendo organizar no mês que vem")).toBe(true);
    expect(respostaGenerica("Em junho tentei montar a pasta e parei.")).toBe(false);
  });

  it("sanearPayload descarta chaves desconhecidas, tipos errados e sobrescreve mes_N.ref", () => {
    const limpo = sanearPayload(
      {
        crc_ativo: "sim",
        estrutura: "sozinho",
        papel_principal: "astronauta",
        "mes_1.pericia": "150000",
        "mes_1.ref": "1999-01-01",
        "mes_1.fonte": "chute",
        frase_sabado: "  texto exato  ",
        scores: { icp_segmento: "C_perito_solo" },
        ultimo_origem: ["google", "google", "instagram", "site", "nao_lembro", "whatsapp_ativo"],
      },
      "2026-09-15T12:00:00Z"
    );
    expect(limpo.crc_ativo).toBeUndefined();
    expect(limpo.estrutura).toBe("sozinho");
    expect(limpo.papel_principal).toBeUndefined();
    expect(limpo["mes_1.pericia"]).toBe(150000);
    expect(limpo["mes_1.fonte"]).toBeUndefined();
    expect(limpo["mes_1.ref"]).toBe("2026-03-01");
    expect(limpo.frase_sabado).toBe("  texto exato  ");
    expect(limpo).not.toHaveProperty("scores");
    expect(limpo.ultimo_origem).toEqual(["google", "instagram", "nao_lembro"]);
  });

  it("meses de referência: matrícula 15/09/2026 → mar a ago/2026", () => {
    expect(mesesReferencia("2026-09-15T10:00:00Z")).toEqual([
      "2026-03-01",
      "2026-04-01",
      "2026-05-01",
      "2026-06-01",
      "2026-07-01",
      "2026-08-01",
    ]);
  });
});

describe("Placar de entrada — visibilidade por papel (aceites 3 e 5)", () => {
  const p = persona({
    meses: Array.from({ length: 6 }, () => ({ pericia: 5000, at: 1000 })),
    papel: "pericia_judicial",
    estrutura: "sozinho",
    trabalhos: 4,
    pecas: 5,
  });
  const s = calcularScores(p);

  it("concierge não recebe frases, forças, mix de receita nem segmento", () => {
    const v = filtrarParaPapel("concierge", p, s);
    for (const k of ["job_frase", "frase_sabado", "frase_preco", "frase_sozinho", "ultima_vez_organizou", "forca_push", "pagou_casa"]) {
      expect(v.payload).not.toHaveProperty(k);
    }
    expect(v.payload).not.toHaveProperty("mes_1.pericia");
    expect(v.payload["mes_1.fonte"]).toBe("extrato");
    expect(v.scores).not.toHaveProperty("icp_segmento");
    expect(v.scores).not.toHaveProperty("pct_pericia");
    expect(v.scores.media_6m_bruta).toBe(600000);
  });

  it("anjo lê número e peças, sem frases e sem fit_one", () => {
    const v = filtrarParaPapel("anjo", p, s);
    expect(v.payload).not.toHaveProperty("job_frase");
    expect(v.payload["mes_1.pericia"]).toBe(500000);
    expect(v.payload["peca.placar"]).toBe(true);
    expect(v.scores).not.toHaveProperty("fit_one");
    expect(v.scores.icp_segmento).toBeDefined();
    expect(v.contemDinheiro).toBe(true);
  });

  it("mentor e admin leem tudo", () => {
    expect(filtrarParaPapel("mentor", p, s).payload.job_frase).toBe(p.job_frase);
    expect(filtrarParaPapel("admin", p, s).scores.fit_one).toBe("sim");
  });

  it("mentorado não vê segmento, fit nem tipo do Anjo", () => {
    const v = filtrarParaPapel("mentorado", p, s);
    expect(Object.keys(v.scores)).toEqual(["media_6m_bruta"]);
  });

  it("cards de lista nunca carregam dinheiro nem frases", () => {
    for (const papel of ["concierge", "anjo", "mentor"] as const) {
      const card = scoresDeCard(papel, s);
      expect(card).not.toHaveProperty("media_6m_bruta");
      expect(card).not.toHaveProperty("job_statement");
    }
    expect(scoresDeCard("concierge", s)).not.toHaveProperty("risco_parcela");
    expect(scoresDeCard("anjo", s)).not.toHaveProperty("fit_one");
  });
});

describe("Placar de entrada — ciclo de vida (§6)", () => {
  it("prazo de correção: 7 dias ou a primeira quarta, o que vier primeiro", () => {
    expect(prazoCorrecao("2026-09-10T12:00:00Z", "2026-09-23").toISOString()).toBe("2026-09-17T12:00:00.000Z");
    expect(prazoCorrecao("2026-09-20T12:00:00Z", "2026-09-23").toISOString()).toBe("2026-09-24T02:59:59.000Z");
    // Turma já começou antes do envio: só os 7 dias
    expect(prazoCorrecao("2026-10-01T12:00:00Z", "2026-09-23").toISOString()).toBe("2026-10-08T12:00:00.000Z");
  });

  it("aceite 7: congela depois do prazo", () => {
    expect(deveCongelar("enviado", "2026-09-10T12:00:00Z", null, new Date("2026-09-18T12:00:00Z"))).toBe(true);
    expect(deveCongelar("enviado", "2026-09-10T12:00:00Z", null, new Date("2026-09-16T12:00:00Z"))).toBe(false);
    expect(deveCongelar("rascunho", null, null, new Date("2026-12-01"))).toBe(false);
  });

  it("atrasado após 48h em rascunho", () => {
    const agora = new Date("2026-09-18T13:00:00Z");
    expect(diagnosticoAtrasado("rascunho", "2026-09-16T12:00:00Z", agora)).toBe(true);
    expect(diagnosticoAtrasado("rascunho", "2026-09-17T12:00:00Z", agora)).toBe(false);
    expect(diagnosticoAtrasado("enviado", "2026-09-01T12:00:00Z", agora)).toBe(false);
  });

  it("aceite 8: semana 1 sem placar enviado não fecha verde", () => {
    expect(ajustarSemaforoPorDiagnostico("verde", false, true, false)).toBe("amarelo");
    expect(ajustarSemaforoPorDiagnostico("verde", false, false, true)).toBe("vermelho");
    expect(ajustarSemaforoPorDiagnostico("verde", true, true, true)).toBe("verde");
  });
});
