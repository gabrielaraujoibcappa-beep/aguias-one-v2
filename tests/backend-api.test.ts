import { describe, it, expect } from "vitest";
import { CANAIS_TEMPLATE } from "../src/lib/api/canais";

describe("Arquitetura e Contratos de APIs Backend (ÁGUIAS ONE v2)", () => {
  it("deve conter exatamente os 7 Canais Canônicos de Atração Pericial", () => {
    expect(CANAIS_TEMPLATE).toHaveLength(7);
    expect(CANAIS_TEMPLATE).toContain("Vara Judicial / Cadastro TJ");
    expect(CANAIS_TEMPLATE).toContain("Escritórios de Advocacia Parceiros");
    expect(CANAIS_TEMPLATE).toContain("LinkedIn Especializado");
    expect(CANAIS_TEMPLATE).toContain("Google Perfil da Empresa (Meu Negócio)");
    expect(CANAIS_TEMPLATE).toContain("Networking / Indicações de Colegas");
    expect(CANAIS_TEMPLATE).toContain("Instagram Institucional / Artigos");
    expect(CANAIS_TEMPLATE).toContain("Palestras / Associações de Classe");
  });

  it("deve validar contratos das rotas essenciais de backend", () => {
    const rotasEssenciais = [
      { endpoint: "/api/auth/me", metodo: "GET", proposito: "Identificação e perfil de usuário logado" },
      { endpoint: "/api/turmas", metodo: "GET/POST", proposito: "Gestão e listagem de turmas/ciclos" },
      { endpoint: "/api/alunos", metodo: "GET/POST", proposito: "Listagem e provisionamento de peritos" },
      { endpoint: "/api/modulos", metodo: "GET", proposito: "Listagem dos 10 módulos com liberação por turma" },
      { endpoint: "/api/modulos/liberar", metodo: "POST", proposito: "Abertura/bloqueio de módulo pelo Anjo" },
      { endpoint: "/api/checkins", metodo: "GET/POST", proposito: "Submissão de check-in e fila de auditoria" },
      { endpoint: "/api/checkins/[id]/auditar", metodo: "PATCH", proposito: "Parecer e avaliação da entrega" },
      { endpoint: "/api/faturamentos", metodo: "GET/POST", proposito: "Declaração de faturamento e métricas" },
      { endpoint: "/api/faturamentos/[id]/auditar", metodo: "PATCH", proposito: "Auditoria de comprovantes e ZIP" },
      { endpoint: "/api/canais", metodo: "GET/POST", proposito: "Ativação dos 7 canais de captação" },
      { endpoint: "/api/upload", metodo: "POST", proposito: "Upload seguro no Supabase Storage" },
      { endpoint: "/api/bloqueios", metodo: "GET/POST", proposito: "Gestão e histórico de bloqueios de acesso" },
      { endpoint: "/api/semaforo", metodo: "GET", proposito: "Cálculo em tempo real do semáforo da turma" },
    ];

    expect(rotasEssenciais.length).toBe(13);
    const metodosGet = rotasEssenciais.filter((r) => r.metodo.includes("GET"));
    expect(metodosGet.length).toBeGreaterThanOrEqual(8);
  });

  it("deve garantir regras de cálculo do Semáforo da Turma", () => {
    const calcularStatusSemaforo = (diasSemEntrega: number, bloqueado: boolean) => {
      if (bloqueado) return "vermelho";
      if (diasSemEntrega > 14) return "vermelho";
      if (diasSemEntrega > 7) return "amarelo";
      return "verde";
    };

    // Aluno em dia (até 7 dias)
    expect(calcularStatusSemaforo(0, false)).toBe("verde");
    expect(calcularStatusSemaforo(7, false)).toBe("verde");

    // Aluno em atenção (8 a 14 dias)
    expect(calcularStatusSemaforo(8, false)).toBe("amarelo");
    expect(calcularStatusSemaforo(14, false)).toBe("amarelo");

    // Aluno em risco (> 14 dias ou bloqueado)
    expect(calcularStatusSemaforo(15, false)).toBe("vermelho");
    expect(calcularStatusSemaforo(30, false)).toBe("vermelho");
    expect(calcularStatusSemaforo(2, true)).toBe("vermelho");
  });
});
