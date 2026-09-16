import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  validarCriacaoUsuario,
  gerarMensagemAcessoWhatsApp,
  DadosCriacaoUsuario,
} from "../src/lib/api/alunos";
import { ModalAluno } from "../src/components/admin/ModalAluno";

describe("Criação de Usuários pelo Administrador (ÁGUIAS ONE v2)", () => {
  it("deve rejeitar cadastro sem senha ou com senha curta (< 6 caracteres)", () => {
    const resSemSenha = validarCriacaoUsuario({
      nome: "Dr. Roberto Silva",
      email: "roberto@pericia.com.br",
      whatsapp: "11987654321",
      turmaId: "turma-1",
      senha: "",
    } as Partial<DadosCriacaoUsuario>);

    expect(resSemSenha.valido).toBe(false);
    expect(resSemSenha.erros).toContain("senha");

    const resSenhaCurta = validarCriacaoUsuario({
      nome: "Dr. Roberto Silva",
      email: "roberto@pericia.com.br",
      whatsapp: "11987654321",
      turmaId: "turma-1",
      senha: "123",
    } as Partial<DadosCriacaoUsuario>);

    expect(resSenhaCurta.valido).toBe(false);
    expect(resSenhaCurta.erros).toContain("senha");
  });

  it("deve aceitar dados válidos com senha forte e campos obrigatórios", () => {
    const resValido = validarCriacaoUsuario({
      nome: "Dra. Patrícia Oliveira",
      email: "patricia@pericia.com.br",
      whatsapp: "(11) 98888-7777",
      turmaId: "turma-2026.1",
      senha: "Aguia@2026",
      papel: "mentorado",
      status: "ativo",
    });

    expect(resValido.valido).toBe(true);
    expect(resValido.erros.length).toBe(0);
  });

  it("deve gerar mensagem de boas-vindas completa para WhatsApp com credenciais", () => {
    const msg = gerarMensagemAcessoWhatsApp({
      nome: "Dr. Roberto Silva",
      email: "roberto@pericia.com.br",
      senha: "Aguia@2026",
      linkAcesso: "http://localhost:3000/login",
    });

    // 1. Saudação e menção ao programa
    expect(msg).toContain("Olá, Dr. Roberto Silva!");
    expect(msg).toContain("ÁGUIAS ONE");

    // 2. Link, login e senha
    expect(msg).toContain("http://localhost:3000/login");
    expect(msg).toContain("roberto@pericia.com.br");
    expect(msg).toContain("Aguia@2026");

    // 3. Suporte do Concierge
    expect(msg).toContain("Concierge");
  });

  it("deve renderizar campos de Senha Inicial e Papel no ModalAluno para o administrador", () => {
    const html = renderToStaticMarkup(
      React.createElement(ModalAluno, {
        aberto: true,
        alunoInicial: null, // modo criação
        turmas: [{ id: "t1", nome: "Águias ONE 2026.1" }],
        onSalvar: () => {},
        onFechar: () => {},
      })
    );

    // 1. Título de criação de conta
    expect(html).toContain("Criar Nova Conta de Usuário");

    // 2. Campo de senha inicial e botão de gerar senha
    expect(html).toContain("Senha Inicial de Acesso *");
    expect(html).toContain("Gerar Senha Forte");

    // 3. Campo de papel com opções RBAC
    expect(html).toContain("Papel no Sistema *");
    expect(html).toContain("Mentorado (Perito)");
    expect(html).toContain("Concierge da Turma");
    expect(html).toContain("Anjo &amp; Auditoria");

    // 4. Botões com hierarquia Câmara UX
    expect(html).toContain("Criar Conta de Acesso");
    expect(html).toContain("Cancelar");
    expect(html).toContain("btn-primary");
    expect(html).toContain("btn-secondary");
  });
});
