"use client";

import React from "react";

export type AlinhamentoButtonGroup = "direita" | "esquerda" | "centro" | "justificado";

export interface ButtonGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  /**
   * Alinhamento dos botões conforme diretriz Câmara UX:
   * - "direita": padrão para fluxos de conclusão e formulários (ações no canto direito)
   * - "esquerda": para barras de navegação ou filtros
   * - "centro": para banners e diálogos centrados
   * - "justificado": distribui espaço entre extremidades (ex: voltar à esquerda, salvar à direita)
   */
  alinhamento?: AlinhamentoButtonGroup;
  /** Se deve empilhar verticalmente em telas móveis */
  responsivo?: boolean;
  /** Rótulo acessível para o grupo de botões */
  ariaLabel?: string;
  /** Conteúdo dos botões */
  children?: React.ReactNode;
}

const MAPA_ALINHAMENTO: Record<AlinhamentoButtonGroup, string> = {
  direita: "btn-group-right",
  esquerda: "btn-group-left",
  centro: "btn-group-center",
  justificado: "btn-group-justified",
};

export function ButtonGroup({
  alinhamento = "direita",
  responsivo = true,
  ariaLabel,
  className = "",
  children,
  ...props
}: ButtonGroupProps) {
  const classeAlinhamento = MAPA_ALINHAMENTO[alinhamento];
  const classeResponsiva = responsivo ? "btn-group-responsive" : "";

  const classesFinais = ["btn-group", classeAlinhamento, classeResponsiva, className]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      role={ariaLabel ? "group" : undefined}
      aria-label={ariaLabel}
      className={classesFinais}
      {...props}
    >
      {children}
    </div>
  );
}
