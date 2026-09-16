"use client";

import React, { forwardRef } from "react";

export type VarianteBotao = "primario" | "secundario" | "terciario" | "perigo";
export type TamanhoBotao = "sm" | "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * Nível de ênfase visual conforme diretriz Câmara UX:
   * - "primario": ação prioritária da tarefa (máximo 1 por grupo)
   * - "secundario": alternativa relacionada (cancelar, voltar, rascunho)
   * - "terciario": ação de apoio discreta / fantasma
   * - "perigo": ação destrutiva irreversível
   */
  variante?: VarianteBotao;
  /** Escala de tamanho do botão */
  tamanho?: TamanhoBotao;
  /** Se o botão deve preencher toda a largura disponível */
  larguraTotal?: boolean;
  /** Exibe estado de processamento com indicador visual sem quebrar o layout */
  carregando?: boolean;
  /** Texto anunciado ou exibido durante o processamento */
  textoCarregando?: string;
  /** Ícone antes do texto da ação */
  iconeInicio?: React.ReactNode;
  /** Ícone após o texto da ação */
  iconeFim?: React.ReactNode;
  /** Conteúdo textual do botão */
  children?: React.ReactNode;
}

const MAPA_CLASSES_VARIANTE: Record<VarianteBotao, string> = {
  primario: "btn-primary",
  secundario: "btn-secondary",
  terciario: "btn-tertiary",
  perigo: "btn-danger",
};

const MAPA_CLASSES_TAMANHO: Record<TamanhoBotao, string> = {
  sm: "btn-sm",
  md: "btn-md",
  lg: "btn-lg",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variante = "primario",
    tamanho = "md",
    larguraTotal = false,
    carregando = false,
    textoCarregando,
    iconeInicio,
    iconeFim,
    disabled = false,
    type = "button",
    className = "",
    children,
    ...props
  },
  ref
) {
  const classeVariante = MAPA_CLASSES_VARIANTE[variante];
  const classeTamanho = MAPA_CLASSES_TAMANHO[tamanho];
  const classeLargura = larguraTotal ? "btn-full" : "";

  const classesFinais = [classeVariante, classeTamanho, classeLargura, className]
    .filter(Boolean)
    .join(" ");

  const estaDesabilitado = disabled || carregando;

  return (
    <button
      ref={ref}
      type={type}
      disabled={estaDesabilitado}
      aria-busy={carregando ? "true" : undefined}
      aria-disabled={estaDesabilitado ? "true" : undefined}
      className={classesFinais}
      {...props}
    >
      {carregando ? (
        <>
          <span className="btn-spinner" aria-hidden="true" />
          <span>{textoCarregando || children}</span>
        </>
      ) : (
        <>
          {iconeInicio && (
            <span style={{ display: "inline-flex", alignItems: "center" }} aria-hidden="true">
              {iconeInicio}
            </span>
          )}
          <span>{children}</span>
          {iconeFim && (
            <span style={{ display: "inline-flex", alignItems: "center" }} aria-hidden="true">
              {iconeFim}
            </span>
          )}
        </>
      )}
    </button>
  );
});
