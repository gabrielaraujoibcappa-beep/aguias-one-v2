import { describe, it, expect } from "vitest";
import { montarFichaAluno, localizarSemaforoDoAluno, localizarEntregasDoAluno, FonteDadosFicha, CONTEXTOS_OPERACIONAIS } from "../src/lib/api/ficha-aluno";
import { FATURAMENTOS_HISTORICO_MOCK, METAS_FATURAMENTO_ALUNOS_MOCK } from "../src/lib/api/faturamento";
import { ALUNOS_SEMAFORO_MOCK } from "../src/lib/api/turma-semaforo";
import { ENTREGAS_MOCK } from "../src/lib/api/auditoria";
import { MODULOS_PADRAO_AGUIAS_ONE } from "../src/lib/api/modulos-liberacao";
import { CANAIS_INICIAIS_MOCK } from "../src/lib/api/canais";
import { AlunoCadastro } from "../src/lib/api/alunos";

const ALUNOS: AlunoCadastro[] = [
  { id: "1", nome: "Dr. Roberto Silva", email: "roberto.silva@pericia.com.br", whatsapp: "(11) 98765-4321", cpf: "123.456.789-00", areaPericial: "Contábil", turmaId: "turma-2026.1", turmaNome: "Águias ONE — Turma 2026.1", status: "ativo" },
  { id: "3", nome: "Dr. André Martins", email: "andre.martins@pericia.com.br", whatsapp: "(31) 97766-5544", turmaId: "turma-2026.1", turmaNome: "Águias ONE — Turma 2026.1", status: "trancado" },
];

const FONTE: FonteDadosFicha = {
  alunos: ALUNOS,
  turmas: [{ id: "turma-2026.1", codigo: "POS.ONE.2026.1", nome: "Águias ONE — Turma 2026.1", dataInicio: "2026-03-01", horarioEncontro: "Quartas, 18:15 às 19:45", limiteVagas: 40, totalMatriculados: 38, status: "em_andamento" }],
  alunosSemaforo: ALUNOS_SEMAFORO_MOCK,
  entregas: ENTREGAS_MOCK,
  modulos: MODULOS_PADRAO_AGUIAS_ONE,
  faturamentos: FATURAMENTOS_HISTORICO_MOCK,
  metasFaturamentoAlunos: METAS_FATURAMENTO_ALUNOS_MOCK,
  canais: CANAIS_INICIAIS_MOCK,
  alunoAtualId: "1",
};

describe("Ficha do mentorado (consolidação de tudo que o sistema sabe sobre o aluno)", () => {
  it("cruza cadastro, semáforo e entregas mesmo com fontes que só têm nome ou id derivado", () => {
    const semaforo = localizarSemaforoDoAluno(ALUNOS[0], ALUNOS_SEMAFORO_MOCK);
    expect(semaforo?.id).toBe("aluno-1");

    const entregas = localizarEntregasDoAluno(ALUNOS[0], ENTREGAS_MOCK);
    expect(entregas.map((e) => e.id)).toEqual(["ent-1"]);
  });

  it("monta a ficha completa do aluno da sessão, com canais e documentos de todas as origens", () => {
    const ficha = montarFichaAluno(FONTE, "1", 2026);
    expect(ficha).not.toBeNull();
    if (!ficha) return;

    expect(ficha.dadosPessoais.cpf).toBe("123.456.789-00");
    expect(ficha.academico.turma?.codigo).toBe("POS.ONE.2026.1");
    expect(ficha.academico.semaforo?.semaforoAtual).toBe("amarelo");
    expect(ficha.academico.resumoEntregas).toEqual({ aprovadas: 0, aguardando: 1, ajustes: 0 });
    expect(ficha.academico.modulosLiberados.length).toBeGreaterThan(0);

    expect(ficha.administrativo.metaAnual).toBe(240000);
    expect(ficha.administrativo.progresso.realizadoAcumulado).toBe(26000);
    expect(ficha.administrativo.faturamentos.map((f) => f.mesReferencia)).toEqual(["2026-08-01", "2026-07-01"]);
    expect(ficha.administrativo.pendentesAuditoria).toBe(1);

    // 2 comprovantes de faturamento + 2 prints de check-in
    expect(ficha.administrativo.documentos).toHaveLength(4);
    expect(ficha.administrativo.documentos.filter((d) => d.tipo === "comprovante")).toHaveLength(2);

    expect(ficha.canais).toBeDefined();
  });

  it("não inventa dados: campos ausentes ficam indefinidos e canais só aparecem para o aluno da sessão", () => {
    const ficha = montarFichaAluno(FONTE, "3", 2026);
    if (!ficha) throw new Error("ficha nula");

    expect(ficha.dadosPessoais.cpf).toBeUndefined();
    expect(ficha.dadosPessoais.areaPericial).toBeUndefined();
    expect(ficha.canais).toBeUndefined();
    expect(ficha.academico.entregas).toHaveLength(0);
  });

  it("gera alertas ordenados por severidade para situações que exigem atenção", () => {
    const ficha = montarFichaAluno(FONTE, "3", 2026);
    if (!ficha) throw new Error("ficha nula");

    const titulos = ficha.alertas.map((a) => a.titulo);
    expect(titulos).toContain("Matrícula trancada");
    expect(titulos).toContain("Resgate necessário");
    expect(titulos).toContain("Check-in da semana não entregue");
    expect(titulos).toContain("1 declaração(ões) de faturamento com ajuste solicitado");
    expect(titulos).toContain("Abaixo de 50% da meta anual");
    expect(titulos.some((t) => t.startsWith("Cadastro incompleto"))).toBe(true);

    // Críticos primeiro
    expect(ficha.alertas[0].nivel).toBe("critico");
    const niveis = ficha.alertas.map((a) => a.nivel);
    const primeiroInfo = niveis.indexOf("info");
    const ultimoCritico = niveis.lastIndexOf("critico");
    expect(ultimoCritico).toBeLessThan(primeiroInfo);
  });

  it("retorna null para aluno inexistente e reconhece os contextos operacionais", () => {
    expect(montarFichaAluno(FONTE, "999", 2026)).toBeNull();
    expect(CONTEXTOS_OPERACIONAIS["metas-faturamento"].retornoHref).toBe("/painel/faturamento");
    expect(CONTEXTOS_OPERACIONAIS["inexistente"]).toBeUndefined();
  });
});
