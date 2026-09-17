"use client";

import React from "react";

export type VarianteCarregamento = "pagina" | "tabela" | "cartoes" | "formulario";

export interface EstadoCarregandoProps {
  /** O que está sendo carregado, na voz da tela: "Carregando {texto}…" */
  texto?: string;
  /** Estrutura esperada do conteúdo; o esqueleto imita o que vai aparecer. */
  variante?: VarianteCarregamento;
  /** Quantidade de linhas ou cartões do esqueleto. */
  itens?: number;
}

const BARRA: React.CSSProperties = { borderRadius: "var(--radius-xs)", backgroundColor: "var(--cor-soft-stone)" };

function Barra({ largura, altura = 14 }: { largura: string; altura?: number }) {
  return <div className="esqueleto" style={{ ...BARRA, width: largura, height: `${altura}px` }} />;
}

/**
 * Espera com estrutura conhecida: mostra o esqueleto do conteúdo em vez de tela
 * branca ou de um giro sem contexto (Câmara UX — estados de carregamento).
 * O texto é anunciado por leitor de tela sem mover o foco.
 */
export function EstadoCarregando({ texto = "os dados", variante = "pagina", itens = 3 }: EstadoCarregandoProps) {
  const linhas = Array.from({ length: itens });

  return (
    <div
      role="status"
      aria-busy="true"
      aria-live="polite"
      style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-md)", padding: "var(--espaco-xl)", maxWidth: "1100px", margin: "0 auto", width: "100%" }}
    >
      <span className="sr-only">Carregando {texto}…</span>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }} aria-hidden="true">
        <Barra largura="240px" altura={26} />
        <Barra largura="360px" altura={14} />
      </div>

      {variante === "cartoes" && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--espaco-md)" }} aria-hidden="true">
          {linhas.map((_, i) => (
            <div key={i} className="card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <Barra largura="60%" altura={12} />
              <Barra largura="45%" altura={24} />
            </div>
          ))}
        </div>
      )}

      {variante === "tabela" && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "12px" }} aria-hidden="true">
          <Barra largura="100%" altura={16} />
          {linhas.map((_, i) => (
            <Barra key={i} largura={i % 2 === 0 ? "100%" : "92%"} />
          ))}
        </div>
      )}

      {variante === "formulario" && (
        <div className="card" style={{ display: "flex", flexDirection: "column", gap: "14px" }} aria-hidden="true">
          {linhas.map((_, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <Barra largura="140px" altura={12} />
              <Barra largura="100%" altura={38} />
            </div>
          ))}
        </div>
      )}

      {variante === "pagina" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--espaco-md)" }} aria-hidden="true">
            {[0, 1, 2].map((i) => (
              <div key={i} className="card" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <Barra largura="60%" altura={12} />
                <Barra largura="45%" altura={24} />
              </div>
            ))}
          </div>
          <div className="card" style={{ display: "flex", flexDirection: "column", gap: "12px" }} aria-hidden="true">
            {linhas.map((_, i) => (
              <Barra key={i} largura={i % 2 === 0 ? "100%" : "88%"} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
