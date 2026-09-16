import { describe, it, expect } from "vitest";
import {
  TEMPLATES_CATALOGO,
  obterTemplatePorId,
} from "../src/lib/email/dados-exemplo";
import {
  gerarEmailBoasVindas,
  gerarEmailModuloLiberado,
  gerarEmailCheckinAprovado,
  gerarEmailCheckinAjuste,
  gerarEmailResgateSemafaro,
  gerarEmailFaturamentoAuditoria,
  gerarEmailLembreteCall,
  gerarEmailStatusAcesso,
} from "../src/lib/email/templates";

describe("Sistema de Templates de E-mail (ÁGUIAS ONE v2)", () => {
  it("deve conter exatamente os 8 templates canônicos no catálogo", () => {
    expect(TEMPLATES_CATALOGO).toHaveLength(8);
    const ids = TEMPLATES_CATALOGO.map((t) => t.id);
    expect(ids).toEqual([
      "boas_vindas",
      "modulo_liberado",
      "checkin_aprovado",
      "checkin_ajuste",
      "resgate_semafaro",
      "faturamento_auditoria",
      "lembrete_call",
      "status_acesso",
    ]);
  });

  it("deve renderizar e-mail de Boas-vindas com credenciais e segurança", () => {
    const email = gerarEmailBoasVindas({
      nome: "Dr. Carlos Teste",
      email: "carlos.teste@pericia.com.br",
      senhaInicial: "Aguia@2026",
      turmaNome: "Turma 2026.1",
      linkLogin: "https://sistema.aguiasone.com.br/login",
    });

    expect(email.assunto).toContain("Bem-vindo ao ÁGUIAS ONE");
    expect(email.preheader).toContain("credenciais");
    expect(email.html).toContain("Dr. Carlos Teste");
    expect(email.html).toContain("carlos.teste@pericia.com.br");
    expect(email.html).toContain("Aguia@2026");
    expect(email.html).toContain("https://sistema.aguiasone.com.br/login");
    expect(email.html).toContain("<!DOCTYPE html");
    expect(email.html).toContain("IBCAPPA");
    expect(email.textoPuro).toContain("Dr. Carlos Teste");
    expect(email.textoPuro).toContain("Aguia@2026");
  });

  it("deve renderizar e-mail de Módulo Liberado com roteiro e prazos", () => {
    const email = gerarEmailModuloLiberado({
      nome: "Dra. Mariana",
      moduloNumero: 4,
      moduloTitulo: "Presença Digital & Identidade Institucional",
      itensRoteiro: ["Criar página do escritório", "Ajustar bio no LinkedIn"],
    });

    expect(email.assunto).toContain("Módulo 4 Liberado: Presença Digital");
    expect(email.html).toContain("Módulo 4: Presença Digital & Identidade Institucional");
    expect(email.html).toContain("Criar página do escritório");
    expect(email.html).toContain("Ajustar bio no LinkedIn");
    expect(email.textoPuro).toContain("Módulo 4");
  });

  it("deve renderizar e-mail de Check-in Aprovado com parecer e congratulações", () => {
    const email = gerarEmailCheckinAprovado({
      nome: "Dr. Roberto Silva",
      moduloNumero: 1,
      moduloTitulo: "Pastas Google Drive",
      avaliadorNome: "Ana Carolina (Anjo)",
      parecerTexto: "Pastas organizadas com primor pericial.",
    });

    expect(email.assunto).toContain("✅ Check-in Aprovado: Módulo 1");
    expect(email.html).toContain("Pastas organizadas com primor pericial.");
    expect(email.html).toContain("Ana Carolina (Anjo)");
    expect(email.html).toContain("Módulo 1 Aprovado!");
  });

  it("deve renderizar e-mail de Ajuste Solicitado com tom de alerta e orientações", () => {
    const email = gerarEmailCheckinAjuste({
      nome: "Dr. Roberto Silva",
      moduloNumero: 2,
      moduloTitulo: "Agenda Pericial",
      avaliadorNome: "Prof. Edilson Aguiais",
      parecerTexto: "Defina o bloco de diligências judiciais na sexta-feira.",
    });

    expect(email.assunto).toContain("⚠️ Ajuste Solicitado no Check-in: Módulo 2");
    expect(email.html).toContain("Defina o bloco de diligências judiciais na sexta-feira.");
    expect(email.html).toContain("Prof. Edilson Aguiais");
    expect(email.html).toContain("Revisar e Reenviar Check-in");
  });

  it("deve renderizar e-mail de Resgate / Semáforo com CTA para WhatsApp do Concierge", () => {
    const email = gerarEmailResgateSemafaro({
      nome: "Dr. Roberto Silva",
      diasSemEntrega: 18,
      statusSemaforo: "vermelho",
      whatsappConcierge: "5511977771111",
    });

    expect(email.assunto).toContain("como podemos te apoiar no ÁGUIAS ONE");
    expect(email.html).toContain("18 dias");
    expect(email.html).toContain("Flávio Lopes");
    expect(email.html).toContain("wa.me/5511977771111");
    expect(email.html).toContain("Falar Diretamente com o Concierge no WhatsApp");
  });

  it("deve renderizar e-mail de Homologação de Faturamento com valor em Reais formatado", () => {
    const email = gerarEmailFaturamentoAuditoria({
      nome: "Dr. Roberto Silva",
      mesReferencia: "Abril de 2026",
      valorBruto: 68500,
      statusAuditoria: "aprovado",
      parecerAuditoria: "Honorários comprovados com notas fiscais anexadas.",
    });

    expect(email.assunto).toContain("Faturamento Homologado: Abril de 2026");
    expect(email.assunto).toContain("68.500,00");
    expect(email.html).toContain("68.500,00");
    expect(email.html).toContain("Honorários comprovados com notas fiscais anexadas.");
  });

  it("deve renderizar e-mail de Lembrete de Encontro Semanal de Quarta-feira", () => {
    const email = gerarEmailLembreteCall({
      nome: "Dra. Juliana",
      dataCallExtenso: "Hoje, 16 de Setembro",
      horario: "18:15 às 19:45",
      linkEncontro: "https://meet.google.com/agu-ias-one",
    });

    expect(email.assunto).toContain("Hoje às 18:15: Encontro ao Vivo ÁGUIAS ONE");
    expect(email.html).toContain("18:15 às 19:45");
    expect(email.html).toContain("https://meet.google.com/agu-ias-one");
  });

  it("deve renderizar e-mail de Status de Acesso com bloqueio e desbloqueio", () => {
    const emailBloqueio = gerarEmailStatusAcesso({
      nome: "Dr. Roberto",
      acao: "bloqueado",
      motivo: "Inadimplência financeira",
    });
    expect(emailBloqueio.assunto).toContain("Acesso Suspenso");
    expect(emailBloqueio.html).toContain("Inadimplência financeira");

    const emailDesbloqueio = gerarEmailStatusAcesso({
      nome: "Dr. Roberto",
      acao: "desbloqueado",
    });
    expect(emailDesbloqueio.assunto).toContain("Seu Acesso foi Reativado com Sucesso");
    expect(emailDesbloqueio.html).toContain("restabelecido com sucesso");
  });

  it("deve permitir busca no catálogo por ID", () => {
    const template = obterTemplatePorId("faturamento_auditoria");
    expect(template).toBeDefined();
    expect(template?.nome).toContain("Faturamento");

    const inexistente = obterTemplatePorId("nao_existe");
    expect(inexistente).toBeUndefined();
  });
});
