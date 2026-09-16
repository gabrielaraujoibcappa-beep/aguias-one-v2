import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  UploadArquivos,
  formatarBytes,
  ArquivoUploadItem,
} from "../src/components/ui/UploadArquivos";

describe("Componente UploadArquivos (Câmara UX, Carbon, USWDS e Gov.br)", () => {
  it("deve formatar bytes corretamente em KB, MB e GB", () => {
    expect(formatarBytes(0)).toBe("0 Bytes");
    expect(formatarBytes(1024)).toBe("1 KB");
    expect(formatarBytes(1024 * 1024 * 5)).toBe("5 MB");
    expect(formatarBytes(1024 * 1024 * 25)).toBe("25 MB");
  });

  it("deve renderizar requisitos visíveis antes da seleção e botão acessível", () => {
    const html = renderToStaticMarkup(
      React.createElement(UploadArquivos, {
        rotulo: "Comprovantes de Faturamento",
        descricao: "Anexe os documentos comprobatórios",
        arquivos: [],
        onChange: () => {},
        formatosPermitidos: [".png", ".jpg", ".pdf", ".zip"],
        tamanhoMaximoBytes: 25 * 1024 * 1024,
        maximoArquivos: 5,
        obrigatorio: true,
      })
    );

    // 1. Rótulo com indicador de obrigatório
    expect(html).toContain("Comprovantes de Faturamento");
    expect(html).toContain("*");

    // 2. Requisitos visíveis antes da seleção (formatos e limite de tamanho)
    expect(html).toContain("PNG, JPG, PDF, ZIP");
    expect(html).toContain("25 MB");
    expect(html).toContain("máx. 5 arquivos");

    // 3. Botão nativo acessível de seleção (caminho primário)
    expect(html).toContain("Selecionar arquivos");

    // 4. Arrastar e soltar apenas como alternativa
    expect(html).toContain("ou arraste e solte");

    // 5. Região de status acessível para leitores de tela
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-live="polite"');
  });

  it("deve listar arquivos com metadados, remoção individual e estado de erro com alerta", () => {
    const arquivosMock: ArquivoUploadItem[] = [
      {
        id: "arq-1",
        nome: "nota-fiscal-01.pdf",
        tamanhoBytes: 1024 * 1024 * 2, // 2 MB
        status: "concluido",
      },
      {
        id: "arq-2",
        nome: "arquivo-pesado.zip",
        tamanhoBytes: 1024 * 1024 * 35, // 35 MB
        status: "erro",
        mensagemErro: "Arquivo excede o limite máximo de 25 MB.",
      },
    ];

    const html = renderToStaticMarkup(
      React.createElement(UploadArquivos, {
        rotulo: "Documentos",
        arquivos: arquivosMock,
        onChange: () => {},
        onTentarNovamente: () => {},
      })
    );

    // 1. Lista estruturada WAI-ARIA
    expect(html).toContain('role="list"');
    expect(html).toContain('aria-label="Arquivos anexados"');
    expect(html).toContain('role="listitem"');

    // 2. Metadados dos arquivos
    expect(html).toContain("nota-fiscal-01.pdf");
    expect(html).toContain("2 MB");
    expect(html).toContain("arquivo-pesado.zip");
    expect(html).toContain("35 MB");

    // 3. Botões de remoção individual com nome acessível
    expect(html).toContain('aria-label="Remover arquivo nota-fiscal-01.pdf"');
    expect(html).toContain('aria-label="Remover arquivo arquivo-pesado.zip"');

    // 4. Erro com role="alert" e opção de tentar novamente
    expect(html).toContain('role="alert"');
    expect(html).toContain("Arquivo excede o limite máximo de 25 MB.");
    expect(html).toContain("Tentar novamente");
  });
});
