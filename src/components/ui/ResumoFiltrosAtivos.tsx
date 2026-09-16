"use client";

import React from "react";

export interface FiltroAtivoItem {
  id: string;
  categoria: string;
  valorRotulo: string;
  onRemover?: () => void;
  removivel?: boolean;
}

export interface ResumoFiltrosAtivosProps {
  filtros: FiltroAtivoItem[];
  totalResultados?: number;
  totalGeral?: number;
  entidadeNome?: string;
  onLimparTudo?: () => void;
}

export function ResumoFiltrosAtivos({
  filtros,
  totalResultados,
  totalGeral,
  entidadeNome = "itens",
  onLimparTudo,
}: ResumoFiltrosAtivosProps) {
  if (!filtros || filtros.length === 0) {
    return null;
  }

  const temContagem = typeof totalResultados === "number";
  const contagemTexto =
    temContagem && typeof totalGeral === "number"
      ? `Exibindo ${totalResultados} de ${totalGeral} ${entidadeNome}`
      : temContagem
      ? `${totalResultados} ${entidadeNome} encontrados`
      : "";

  return (
    <div
      role="region"
      aria-label="Filtros aplicados"
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px",
        padding: "10px 14px",
        backgroundColor: "var(--cor-soft-stone)",
        borderRadius: "var(--radius-sm)",
        marginBottom: "var(--espaco-md)",
        border: "1px solid var(--cor-border-light)",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "var(--cor-slate)",
          fontFamily: "var(--font-family-mono)",
          marginRight: "4px",
        }}
      >
        Filtros Ativos:
      </span>

      {/* Chips Removíveis com Categoria e Valor */}
      {filtros.map((f) => {
        const rotuloAcessivel = `Remover filtro ${f.categoria}: ${f.valorRotulo}`;
        return (
          <span
            key={f.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#ffffff",
              border: "1px solid var(--cor-border-light)",
              borderRadius: "var(--radius-pill)",
              padding: "3px 10px 3px 12px",
              fontSize: "12px",
              color: "var(--cor-ink)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--cor-slate)" }}>{f.categoria}:</span>
            <span>{f.valorRotulo}</span>
            {f.removivel !== false && f.onRemover && (
              <button
                type="button"
                onClick={f.onRemover}
                aria-label={rotuloAcessivel}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--cor-muted)",
                  padding: "2px 4px",
                  borderRadius: "50%",
                  fontSize: "14px",
                  lineHeight: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
              >
                ×
              </button>
            )}
          </span>
        );
      })}

      {/* Ação Clara de Limpar Tudo */}
      {onLimparTudo && (
        <button
          type="button"
          onClick={onLimparTudo}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--cor-deep-green)",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            padding: "4px 8px",
            textDecoration: "underline",
            marginLeft: "auto",
          }}
        >
          Limpar filtros
        </button>
      )}

      {/* Região de Status Acessível para Contagem */}
      {contagemTexto && (
        <div
          role="status"
          aria-live="polite"
          style={{
            fontSize: "12px",
            color: "var(--cor-slate)",
            marginLeft: onLimparTudo ? "8px" : "auto",
            fontWeight: 500,
          }}
        >
          {contagemTexto}
        </div>
      )}
    </div>
  );
}
