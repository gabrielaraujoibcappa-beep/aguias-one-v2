import { describe, it, expect, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ModalConfirmacaoDestrutiva } from "../src/components/ui/ModalConfirmacaoDestrutiva";
import { ToastDesfazer } from "../src/components/ui/ToastDesfazer";

describe("Ações Destrutivas & Confirmação (Câmara UX / WCAG 3.3.4)", () => {
  it("deve renderizar diálogo com role='alertdialog' e atributos de acessibilidade WAI-ARIA", () => {
    const html = renderToStaticMarkup(
      React.createElement(ModalConfirmacaoDestrutiva, {
        aberto: true,
        titulo: "Excluir cadastro do perito",
        objetoNome: "Dr. Roberto Silva",
        mensagem: "Esta ação é permanente e removerá todas as evidências fiscais.",
        rotuloAcao: "Excluir perito",
        rotuloCancelar: "Cancelar",
        onConfirmar: () => {},
        onCancelar: () => {},
      })
    );

    // 1. Semântica de diálogo de confirmação destrutiva
    expect(html).toContain('role="alertdialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-labelledby=');
    expect(html).toContain('aria-describedby=');

    // 2. Conteúdo e identificação clara do objeto
    expect(html).toContain("Excluir cadastro do perito");
    expect(html).toContain("Dr. Roberto Silva");
    expect(html).toContain("Esta ação é permanente e removerá todas as evidências fiscais.");
  });

  it("deve conter rótulo específico no botão de perigo (verbo + objeto) e botão seguro Cancelar", () => {
    const html = renderToStaticMarkup(
      React.createElement(ModalConfirmacaoDestrutiva, {
        aberto: true,
        titulo: "Descartar alterações da declaração",
        mensagem: "As notas fiscais selecionadas não serão salvas.",
        rotuloAcao: "Descartar alterações",
        rotuloCancelar: "Cancelar",
        onConfirmar: () => {},
        onCancelar: () => {},
      })
    );

    // Conforme Câmara UX: botão final deve ter verbo e objeto (ex: "Descartar alterações"), NUNCA "Sim" ou "OK"
    expect(html).toContain("Descartar alterações");
    expect(html).toContain("Cancelar");
    expect(html).not.toContain(">Sim<");
    expect(html).not.toContain(">OK<");
  });

  it("deve emitir aviso em desenvolvimento quando receber rótulos genéricos proibidos ('Sim', 'OK')", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    renderToStaticMarkup(
      React.createElement(ModalConfirmacaoDestrutiva, {
        aberto: true,
        titulo: "Teste de validação de rótulo",
        mensagem: "Mensagem de teste",
        rotuloAcao: "OK",
        onConfirmar: () => {},
        onCancelar: () => {},
      })
    );

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[Câmara UX]: O rótulo "OK" viola a diretriz de ações destrutivas')
    );

    warnSpy.mockRestore();
  });

  it("não deve renderizar nada quando aberto for false", () => {
    const html = renderToStaticMarkup(
      React.createElement(ModalConfirmacaoDestrutiva, {
        aberto: false,
        titulo: "Modal fechado",
        mensagem: "Não deve aparecer",
        rotuloAcao: "Excluir",
        onConfirmar: () => {},
        onCancelar: () => {},
      })
    );

    expect(html).toBe("");
  });
});

describe("Padrão Desfazer / ToastDesfazer (Câmara UX)", () => {
  it("deve renderizar notificação acessível com role='status' e aria-live='polite'", () => {
    const html = renderToStaticMarkup(
      React.createElement(ToastDesfazer, {
        visivel: true,
        mensagem: "Aluno desativado com sucesso.",
        rotuloDesfazer: "Desfazer",
        onDesfazer: () => {},
        onFechar: () => {},
      })
    );

    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
    expect(html).toContain("Aluno desativado com sucesso.");
    expect(html).toContain("Desfazer");
  });

  it("não deve renderizar nada quando visivel for false", () => {
    const html = renderToStaticMarkup(
      React.createElement(ToastDesfazer, {
        visivel: false,
        mensagem: "Invisível",
        onDesfazer: () => {},
        onFechar: () => {},
      })
    );

    expect(html).toBe("");
  });
});
