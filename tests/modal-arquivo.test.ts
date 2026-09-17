import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ModalArquivo, formatoDoArquivo } from "../src/components/ui/ModalArquivo";
import { VisualizadorEntrega } from "../src/components/equipe/VisualizadorEntrega";
import { EntregaPendente } from "../src/lib/api/auditoria";

const entrega: EntregaPendente = {
  id: "c1",
  alunoNome: "Mentorada de Exemplo",
  moduloTitulo: "Módulo 2 — Presença Digital",
  links: [{ rotulo: "Site", url: "https://perito.com.br" }],
  arquivos: [{ rotulo: "Print da pasta", path: "aluno-1/2026-09/abc.png", nome: "print.png" }],
  status: "aguardando_avaliacao",
  enviadoEm: "2026-09-16T12:00:00Z",
};

const abrir = (nome: string, path = "aluno-1/2026-09/abc.png") =>
  renderToStaticMarkup(
    React.createElement(ModalArquivo, { arquivo: { nome, path }, bucket: "evidencias", onFechar: () => {} })
  );

describe("formatoDoArquivo", () => {
  it("classifica imagem, pdf e outros", () => {
    expect(formatoDoArquivo("print.PNG")).toBe("imagem");
    expect(formatoDoArquivo("foto.jpeg")).toBe("imagem");
    expect(formatoDoArquivo("laudo.pdf")).toBe("pdf");
    expect(formatoDoArquivo("comprovantes.zip")).toBe("outro");
  });
});

describe("ModalArquivo", () => {
  it("não renderiza nada sem arquivo", () => {
    const html = renderToStaticMarkup(
      React.createElement(ModalArquivo, { arquivo: null, bucket: "evidencias", onFechar: () => {} })
    );
    expect(html).toBe("");
  });

  it("mostra imagem pela rota protegida de arquivos", () => {
    const html = abrir("print.png");
    expect(html).toContain('role="dialog"');
    expect(html).toContain("/api/arquivos?bucket=evidencias&amp;path=aluno-1%2F2026-09%2Fabc.png");
    expect(html).toContain("<img");
    expect(html).toContain("Baixar arquivo");
  });

  it("mostra PDF em quadro embutido", () => {
    const html = abrir("laudo.pdf");
    expect(html).toContain("<iframe");
    expect(html).toContain("Documento: laudo.pdf");
  });

  it("orienta o download quando o formato não abre na tela", () => {
    const html = abrir("comprovantes.zip");
    expect(html).not.toContain("<iframe");
    expect(html).toContain("Baixe o arquivo para conferir");
  });
});

describe("VisualizadorEntrega", () => {
  it("usa botão de visualizar, não link direto para o arquivo", () => {
    const html = renderToStaticMarkup(
      React.createElement(VisualizadorEntrega, {
        entrega,
        onAprovar: () => {},
        onSolicitarAjuste: () => {},
        onVoltar: () => {},
      })
    );
    expect(html).toContain("Visualizar Arquivo");
    expect(html).not.toContain("#download-");
    // o arquivo só é buscado ao abrir o modal
    expect(html).not.toContain("/api/arquivos?");
  });
});

describe("Comprovantes de faturamento", () => {
  const declaracao = {
    id: "d1",
    matriculaId: "mat-1",
    alunoId: "u1",
    mesReferencia: "2026-09-01",
    valorBruto: 18500,
    comprovantes: [{ nome: "extrato.pdf", path: "aluno-1/2026-09/extrato.pdf", tipo: "arquivo" as const }],
    statusAuditoria: "pendente" as const,
    criadoEm: "2026-09-16T12:00:00Z",
  };

  it("fila da equipe abre o comprovante em modal, sem link direto", async () => {
    const { FilaAuditoriaFaturamento } = await import("../src/components/equipe/FilaAuditoriaFaturamento");
    const html = renderToStaticMarkup(
      React.createElement(FilaAuditoriaFaturamento, {
        declaracoes: [declaracao],
        nomesAlunos: { u1: "Mentorada de Exemplo" },
        metas: { u1: 240000 },
        modo: "pendentes" as const,
        onAprovar: () => {},
        onSolicitarAjuste: () => {},
        onAbrirAluno: () => {},
      })
    );
    expect(html).toContain("Ver arquivo");
    expect(html).not.toContain("/api/arquivos?");
  });

  it("histórico do mentorado abre o comprovante em modal", async () => {
    const { TabelaHistoricoFaturamento } = await import("../src/components/faturamento/TabelaHistoricoFaturamento");
    const html = renderToStaticMarkup(
      React.createElement(TabelaHistoricoFaturamento, { historico: [declaracao] })
    );
    expect(html).toContain("Ver Arquivo");
    expect(html).not.toContain("/api/arquivos?");
  });
});
