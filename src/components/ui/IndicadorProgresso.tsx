"use client";

import React from "react";

export interface IndicadorProgressoProps {
  /**
   * Modo do indicador conforme diretriz Câmara UX:
   * - "determinado": quando o total e o progresso atual são conhecidos. Exibe porcentagem real.
   * - "indeterminado": quando o tempo ou etapas são imprevisíveis. Não inventa números falsos.
   */
  modo?: "determinado" | "indeterminado";
  /** Valor atual do progresso (0 a 100) no modo determinado */
  valor?: number;
  /** Valor máximo (padrão: 100) */
  maximo?: number;
  /** Rótulo acessível da barra de progresso */
  rotulo?: string;
  /** Texto descritivo falado por leitores de tela (ex: "4 de 10 módulos concluídos (40%)") */
  textoAcessivel?: string;
  /** Se deve exibir o valor percentual visível ao lado da barra */
  mostrarPorcentagem?: boolean;
  /** Formato de apresentação textual (ex: "4 de 10 módulos") */
  descricaoVisual?: string;
  /** Altura da barra em pixels (padrão: 8px) */
  altura?: number;
  /** Estilo personalizado */
  className?: string;
}

export function IndicadorProgresso({
  modo = "determinado",
  valor = 0,
  maximo = 100,
  rotulo = "Progresso",
  textoAcessivel,
  mostrarPorcentagem = true,
  descricaoVisual,
  altura = 8,
  className,
}: IndicadorProgressoProps) {
  const isDeterminado = modo === "determinado";
  const porcentagemCalculada = isDeterminado
    ? Math.min(100, Math.max(0, Math.round((valor / maximo) * 100)))
    : 0;

  const ariaValueText =
    textoAcessivel ||
    (isDeterminado
      ? `${porcentagemCalculada}% concluído${descricaoVisual ? ` (${descricaoVisual})` : ""}`
      : "Operação em andamento, aguarde");

  return (
    <div
      className={className}
      style={{
        width: "100%",
        fontFamily: "var(--font-family-ui)",
      }}
    >
      {/* Cabeçalho do Indicador: Rótulo e Informação Visual de Progresso */}
      {(rotulo || descricaoVisual || (isDeterminado && mostrarPorcentagem)) && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "13px",
            marginBottom: "6px",
            color: "var(--cor-ink, #111827)",
          }}
        >
          {rotulo && <span style={{ fontWeight: 600 }}>{rotulo}</span>}

          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
            {descricaoVisual && (
              <span style={{ color: "var(--cor-muted, #6b7280)", fontSize: "12px" }}>
                {descricaoVisual}
              </span>
            )}
            {isDeterminado && mostrarPorcentagem && (
              <span
                style={{
                  fontWeight: 700,
                  color: "var(--cor-action-vibrant, #0052ff)",
                  fontSize: "13px",
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {porcentagemCalculada}%
              </span>
            )}
          </div>
        </div>
      )}

      {/* Trilha do Progresso (W3C ARIA progressbar) */}
      <div
        role="progressbar"
        aria-label={rotulo}
        aria-valuemin={isDeterminado ? 0 : undefined}
        aria-valuemax={isDeterminado ? maximo : undefined}
        aria-valuenow={isDeterminado ? valor : undefined}
        aria-valuetext={ariaValueText}
        style={{
          width: "100%",
          height: `${altura}px`,
          backgroundColor: "var(--cor-soft-stone, #f0f2f5)",
          borderRadius: "var(--radius-pill, 9999px)",
          overflow: "hidden",
          position: "relative",
          boxShadow: "inset 0 1px 2px rgba(0, 0, 0, 0.06)",
        }}
      >
        {isDeterminado ? (
          /* Barra de Progresso Determinada */
          <div
            style={{
              height: "100%",
              width: `${porcentagemCalculada}%`,
              background: "linear-gradient(90deg, #0052ff 0%, #00c2ff 100%)",
              borderRadius: "var(--radius-pill, 9999px)",
              transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            }}
          />
        ) : (
          /* Barra de Progresso Indeterminada (Animação Fluida Sem Números Falsos) */
          <div
            className="progresso-indeterminado-barra"
            style={{
              height: "100%",
              width: "40%",
              background: "linear-gradient(90deg, #0052ff 0%, #00c2ff 100%)",
              borderRadius: "var(--radius-pill, 9999px)",
              position: "absolute",
            }}
          />
        )}
      </div>
    </div>
  );
}
