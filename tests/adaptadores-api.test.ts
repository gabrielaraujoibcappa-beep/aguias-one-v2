import { describe, it, expect } from "vitest";
import {
  mapearBloqueios,
  mapearCanais,
  mapearCheckinProprio,
  mapearEntrega,
  mapearFaturamento,
  mapearSemaforo,
  mapearTurma,
} from "../src/lib/api/adaptadores";

// Formatos exatamente como as rotas /api devolvem hoje

describe("Adaptadores: respostas reais da API para o formato das telas", () => {
  it("faturamento: aluno, comprovante e auditoria vêm da API", () => {
    const f = mapearFaturamento({
      id: "f-uuid",
      matriculaId: "m-uuid",
      alunoId: "u-uuid",
      alunoNome: "Dr. Carlos Teste",
      alunoEmail: "carlos@x.com",
      mesReferencia: "2026-08-01",
      valorBruto: 18500,
      storageZipPath: "u-uuid/faturamentos/1788_extrato.zip",
      statusAuditoria: "ajuste_solicitado",
      parecerAuditoria: "Extrato ilegível",
      auditadoEm: "2026-09-02T10:00:00Z",
      criadoEm: "2026-09-01T09:00:00Z",
    });

    expect(f).toEqual({
      id: "f-uuid",
      matriculaId: "m-uuid",
      alunoId: "u-uuid",
      mesReferencia: "2026-08-01",
      valorBruto: 18500,
      comprovantes: [{ nome: "1788_extrato.zip", path: "u-uuid/faturamentos/1788_extrato.zip", tipo: "zip" }],
      statusAuditoria: "ajuste_solicitado",
      parecerAuditoria: "Extrato ilegível",
      auditadoEm: "2026-09-02T10:00:00Z",
      criadoEm: "2026-09-01T09:00:00Z",
    });
  });

  it("faturamento sem comprovante não inventa arquivo", () => {
    const f = mapearFaturamento({ id: "f", matriculaId: "m", alunoId: "u", mesReferencia: "2026-07-01", valorBruto: 100, storageZipPath: null, statusAuditoria: "pendente" });
    expect(f.comprovantes).toEqual([]);
    expect(f.parecerAuditoria).toBeUndefined();
  });

  it("entrega: separa links e arquivos das evidências e usa a data de envio", () => {
    const e = mapearEntrega({
      id: "c-uuid",
      status: "aguardando_avaliacao",
      alunoNome: "Dr. Carlos Teste",
      alunoEmail: "carlos@x.com",
      moduloNumero: 2,
      moduloTitulo: "Nomenclatura de Arquivos",
      travou: "",
      duvidaCall: "Como nomear laudos?",
      parecerTexto: "",
      dataEnvio: "2026-09-15T14:30:00Z",
      evidencias: [
        { id: "e1", tipo: "link", rotulo: "Site no ar", valor_url: "https://perito.com.br", storage_path: null, nome_arquivo: null },
        { id: "e2", tipo: "arquivo", rotulo: "Print das pastas", valor_url: null, storage_path: "u/evid/pastas.png", nome_arquivo: "pastas.png" },
      ],
    });

    expect(e).toEqual({
      id: "c-uuid",
      alunoNome: "Dr. Carlos Teste",
      alunoEmail: "carlos@x.com",
      moduloTitulo: "Módulo 2 — Nomenclatura de Arquivos",
      links: [{ rotulo: "Site no ar", url: "https://perito.com.br" }],
      arquivos: [{ rotulo: "Print das pastas", path: "u/evid/pastas.png", nome: "pastas.png" }],
      travou: undefined,
      duvidaCall: "Como nomear laudos?",
      status: "aguardando_avaliacao",
      parecerTexto: undefined,
      enviadoEm: "2026-09-15T14:30:00Z",
    });
  });

  it("semáforo: cor, módulo, entrega da semana e resgate a partir dos campos da API", () => {
    const base = {
      id: "u-uuid",
      matriculaId: "m-uuid",
      nome: "Dr. Carlos Teste",
      email: "carlos@x.com",
      whatsapp: "(11) 90000-0000",
      ultimoModuloConcluido: "Módulo 1",
      motivoSemaforo: "16 dias sem submeter check-in (em risco)",
    };

    const emRisco = mapearSemaforo({ ...base, statusSemaforo: "vermelho", diasSemEntrega: 16, vermelhos28d: 2 });
    expect(emRisco).toEqual({
      id: "u-uuid",
      matriculaId: "m-uuid",
      nome: "Dr. Carlos Teste",
      whatsapp: "(11) 90000-0000",
      semaforoAtual: "vermelho",
      historicoSemaforos: ["vermelho"],
      motivoSemaforo: "16 dias sem submeter check-in (em risco)",
      moduloAtual: "Módulo 1",
      checkinEntregue: false,
      precisaResgate: true,
      vermelhos28d: 2,
    });

    const regular = mapearSemaforo({ ...base, statusSemaforo: "verde", diasSemEntrega: 3, vermelhos28d: 0 });
    expect(regular.checkinEntregue).toBe(true);
    expect(regular.precisaResgate).toBe(false);

    const umaSemanaVermelha = mapearSemaforo({ ...base, statusSemaforo: "vermelho", diasSemEntrega: 20, vermelhos28d: 1 });
    expect(umaSemanaVermelha.precisaResgate).toBe(false);
  });

  it("turma: total de matriculados vem de totalAlunos", () => {
    expect(
      mapearTurma({ id: "t", codigo: "POS.ONE.2026.1", nome: "Turma 2026.1", dataInicio: "2026-03-01", dataFim: null, horarioEncontro: "Quartas", limiteVagas: 40, status: "em_andamento", totalAlunos: 12, alunosAtivos: 11 })
    ).toEqual({
      id: "t",
      codigo: "POS.ONE.2026.1",
      nome: "Turma 2026.1",
      dataInicio: "2026-03-01",
      dataFim: undefined,
      horarioEncontro: "Quartas",
      limiteVagas: 40,
      totalMatriculados: 12,
      status: "em_andamento",
    });
  });

  it("bloqueios: linhas do banco viram vigentes por aluno e histórico", () => {
    const linhaAtiva = {
      id: "b1",
      usuario_id: "u-uuid",
      motivo: "inadimplencia",
      observacoes: "Boleto de agosto",
      status: "ativo",
      bloqueado_por: "Coordenação",
      bloqueado_em: "2026-09-10T12:00:00Z",
      desbloqueado_por: null,
      desbloqueado_em: null,
      justificativa_desbloqueio: null,
    };
    const linhaEncerrada = {
      ...linhaAtiva,
      id: "b0",
      motivo: "motivo livre antigo",
      status: "encerrado",
      bloqueado_em: "2026-08-01T12:00:00Z",
      desbloqueado_por: "Flávio",
      desbloqueado_em: "2026-08-05T12:00:00Z",
      justificativa_desbloqueio: "Pago",
    };

    const { vigentes, historico } = mapearBloqueios({ bloqueiosVigentes: { "u-uuid": linhaAtiva }, historico: [linhaAtiva, linhaEncerrada] });

    expect(vigentes["u-uuid"]).toEqual({
      id: "b1",
      alunoId: "u-uuid",
      motivo: "inadimplencia",
      observacaoInterna: "Boleto de agosto",
      bloqueadoPor: "Coordenação",
      bloqueadoEm: "2026-09-10T12:00:00Z",
      desbloqueadoPor: undefined,
      desbloqueadoEm: undefined,
      observacaoDesbloqueio: undefined,
    });
    expect(historico).toHaveLength(2);
    expect(historico[1].motivo).toBe("outro");
    expect(historico[1].desbloqueadoEm).toBe("2026-08-05T12:00:00Z");
  });

  it("check-in do próprio aluno: linha crua do banco vira entrega com nome do aluno da sessão", () => {
    const e = mapearCheckinProprio(
      {
        id: "c-uuid",
        status: "aprovado",
        travou: null,
        duvida_call: "",
        parecer_texto: "Tudo certo",
        enviado_em: "2026-09-10T12:00:00Z",
        modulos: { numero: 1, titulo: "Árvore de Pastas" },
        checkin_evidencias: [{ tipo: "link", rotulo: "Drive", valor_url: "https://drive.google.com/x", storage_path: null, nome_arquivo: null }],
      },
      { nome: "Dr. Carlos Teste", email: "carlos@x.com" }
    );
    expect(e).toEqual({
      id: "c-uuid",
      alunoNome: "Dr. Carlos Teste",
      alunoEmail: "carlos@x.com",
      moduloTitulo: "Módulo 1 — Árvore de Pastas",
      links: [{ rotulo: "Drive", url: "https://drive.google.com/x" }],
      arquivos: [],
      travou: undefined,
      duvidaCall: undefined,
      status: "aprovado",
      parecerTexto: "Tudo certo",
      enviadoEm: "2026-09-10T12:00:00Z",
    });
  });

  it("canais: nomes e ordem vêm do servidor", () => {
    const canais = mapearCanais([
      { id: "c1", nome: "Vara Judicial / Cadastro TJ", status: "ativo", url: "https://tj.jus.br", atualizadoEm: "2026-09-01T00:00:00Z" },
      { id: "canal-2", nome: "Escritórios de Advocacia Parceiros", status: "nao_iniciado", url: "", atualizadoEm: null },
    ]);
    expect(canais).toEqual([
      { id: "c1", nome: "Vara Judicial / Cadastro TJ", ordem: 1, status: "ativo", url: "https://tj.jus.br", atualizadoEm: "2026-09-01T00:00:00Z" },
      { id: "canal-2", nome: "Escritórios de Advocacia Parceiros", ordem: 2, status: "nao_iniciado", url: undefined, atualizadoEm: undefined },
    ]);
  });
});
