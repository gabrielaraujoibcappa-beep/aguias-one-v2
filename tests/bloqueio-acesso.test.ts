import { describe, it, expect } from "vitest";
import {
  bloqueioEstaVigente,
  criarBloqueio,
  encerrarBloqueio,
  obterBloqueioVigente,
  validarNovoBloqueio,
} from "../src/lib/api/bloqueio-acesso";
import { montarFichaAluno, FonteDadosFicha } from "../src/lib/api/ficha-aluno";
import { migrarEstadoSalvo } from "../src/lib/store/sistema-store";

const HOJE = new Date("2026-09-16T12:00:00");

describe("Bloqueio de acesso ao sistema", () => {
  it("valida motivo, observação obrigatória em 'outro' e data de liberação futura", () => {
    expect(validarNovoBloqueio({ alunoId: "1", motivo: "inadimplencia" }, HOJE).valido).toBe(true);
    expect(validarNovoBloqueio({ alunoId: "1", motivo: "outro" }, HOJE).erros).toContain("observacaoInterna");
    expect(validarNovoBloqueio({ alunoId: "1", motivo: "outro", observacaoInterna: "Caso especial" }, HOJE).valido).toBe(true);
    expect(validarNovoBloqueio({ alunoId: "1", motivo: "inatividade", liberarEm: "2026-09-16" }, HOJE).erros).toContain("liberarEm");
    expect(validarNovoBloqueio({ alunoId: "1", motivo: "inatividade", liberarEm: "2026-10-01" }, HOJE).valido).toBe(true);
    expect(validarNovoBloqueio({ alunoId: "", motivo: "inadimplencia" }, HOJE).erros).toContain("alunoId");
  });

  it("cria o bloqueio com autor e data, e recusa dados inválidos", () => {
    const b = criarBloqueio({ alunoId: "1", motivo: "inadimplencia", mensagemAoAluno: "  Regularize o pagamento.  " }, "Flávio Lopes (Concierge)", HOJE);
    expect(b.alunoId).toBe("1");
    expect(b.bloqueadoPor).toBe("Flávio Lopes (Concierge)");
    expect(b.bloqueadoEm).toBe(HOJE.toISOString());
    expect(b.mensagemAoAluno).toBe("Regularize o pagamento.");
    expect(b.desbloqueadoEm).toBeUndefined();

    expect(() => criarBloqueio({ alunoId: "1", motivo: "outro" }, "Admin", HOJE)).toThrow();
  });

  it("considera vigente até ser encerrado ou até a data de liberação automática", () => {
    const semPrazo = criarBloqueio({ alunoId: "1", motivo: "conduta" }, "Admin", HOJE);
    expect(bloqueioEstaVigente(semPrazo, HOJE)).toBe(true);
    expect(bloqueioEstaVigente(semPrazo, new Date("2030-01-01"))).toBe(true);

    const comPrazo = criarBloqueio({ alunoId: "1", motivo: "inatividade", liberarEm: "2026-09-20" }, "Admin", HOJE);
    expect(bloqueioEstaVigente(comPrazo, new Date("2026-09-19T23:59:00"))).toBe(true);
    expect(bloqueioEstaVigente(comPrazo, new Date("2026-09-20T00:00:00"))).toBe(false);

    const encerrado = encerrarBloqueio(semPrazo, "Ana Carolina (Anjo)", "Regularizado", new Date("2026-09-17T10:00:00"));
    expect(bloqueioEstaVigente(encerrado, new Date("2026-09-18"))).toBe(false);
    expect(encerrado.desbloqueadoPor).toBe("Ana Carolina (Anjo)");
    expect(encerrado.observacaoDesbloqueio).toBe("Regularizado");

    expect(bloqueioEstaVigente(undefined)).toBe(false);
    expect(obterBloqueioVigente({ "1": comPrazo }, "1", HOJE)?.id).toBe(comPrazo.id);
    expect(obterBloqueioVigente({ "1": comPrazo }, "2", HOJE)).toBeUndefined();
  });

  it("aparece na ficha do aluno como alerta crítico com o motivo", () => {
    const bloqueio = criarBloqueio({ alunoId: "1", motivo: "inadimplencia", observacaoInterna: "Boleto de agosto em aberto" }, "Coordenação UniBCAPPA (Admin)", HOJE);
    const fonte: FonteDadosFicha = {
      alunos: [{ id: "1", nome: "Dr. Roberto Silva", email: "r@x.com", whatsapp: "(11) 99999-0000", cpf: "1", areaPericial: "Contábil", turmaId: "t", status: "ativo" }],
      turmas: [],
      alunosSemaforo: [],
      entregas: [],
      modulos: [],
      faturamentos: [],
      metasFaturamentoAlunos: {},
      bloqueiosAcesso: { "1": bloqueio },
      historicoBloqueios: [bloqueio],
    };
    const ficha = montarFichaAluno(fonte, "1", 2026);
    expect(ficha?.administrativo.bloqueioAcesso?.id).toBe(bloqueio.id);
    expect(ficha?.administrativo.historicoBloqueios).toHaveLength(1);
    expect(ficha?.alertas[0].nivel).toBe("critico");
    expect(ficha?.alertas[0].titulo).toBe("Acesso ao sistema bloqueado");
    expect(ficha?.alertas[0].detalhe).toContain("Inadimplência");
  });

  it("estados salvos antigos ganham as estruturas de bloqueio vazias", () => {
    const migrado = migrarEstadoSalvo({ metasFaturamentoAlunos: { "1": 240000 }, faturamentos: [] });
    expect(migrado.bloqueiosAcesso).toEqual({});
    expect(migrado.historicoBloqueios).toEqual([]);
  });
});
