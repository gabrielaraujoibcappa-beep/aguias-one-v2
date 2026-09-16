import type React from "react";

/** Estilos compartilhados das telas de acompanhamento (tokens do v2). */
export const numeroTabular: React.CSSProperties = { fontVariantNumeric: "tabular-nums lining-nums" };

export const secao: React.CSSProperties = {
  padding: "var(--espaco-lg)",
  marginBottom: "var(--espaco-lg)",
};

export const tituloSecao: React.CSSProperties = { fontSize: "16px", fontWeight: 700, margin: "0 0 var(--espaco-md)" };

export const grelhaKpis: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
  gap: "var(--espaco-md)",
};

export const rotuloKpi: React.CSSProperties = { fontSize: "12px", color: "var(--cor-muted)", marginBottom: "2px" };

export const valorKpi: React.CSSProperties = { fontSize: "20px", fontWeight: 700, ...numeroTabular };

export const rolagemTabela: React.CSSProperties = { overflowX: "auto", width: "100%" };

export const textoMuted: React.CSSProperties = { color: "var(--cor-muted)", fontSize: "13px" };
