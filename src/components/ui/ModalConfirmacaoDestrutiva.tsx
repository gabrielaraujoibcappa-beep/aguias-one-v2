"use client";

import React, { useEffect, useRef, useId } from "react";
import { IconAlertTriangle, IconTrash, IconX } from "@/components/ui/Icons";

export interface ModalConfirmacaoDestrutivaProps {
  /** Indica se o diálogo modal está aberto */
  aberto: boolean;
  /** Título específico da ação destrutiva (ex: "Excluir aluno da turma") */
  titulo: string;
  /** Explicação detalhada da consequência e do alcance da ação */
  mensagem: React.ReactNode;
  /** Identificador opcional do objeto afetado (ex: "Dr. Roberto Silva") */
  objetoNome?: string;
  /**
   * Rótulo específico no botão de confirmação destrutiva.
   * Conforme diretriz Câmara UX: deve conter verbo e objeto (ex: "Excluir aluno", "Descartar alterações").
   * NUNCA use "Sim", "OK" ou "Confirmar".
   */
  rotuloAcao: string;
  /** Rótulo do botão seguro de cancelamento (padrão: "Cancelar") */
  rotuloCancelar?: string;
  /** Ícone visual de perigo */
  tipoIcone?: "alerta" | "lixeira";
  /** Estado de processamento durante a exclusão */
  carregando?: boolean;
  /** Função de callback ao confirmar a destruição */
  onConfirmar: () => void | Promise<void>;
  /** Função de callback ao cancelar */
  onCancelar: () => void;
  /** Referência opcional do elemento disparador para devolução de foco */
  elementoDisparadorRef?: React.RefObject<HTMLElement | null>;
}

const ROTULOS_PROIBIDOS = ["sim", "ok", "confirmar", "confirm", "yes"];

export function ModalConfirmacaoDestrutiva({
  aberto,
  titulo,
  mensagem,
  objetoNome,
  rotuloAcao,
  rotuloCancelar = "Cancelar",
  tipoIcone = "lixeira",
  carregando = false,
  onConfirmar,
  onCancelar,
  elementoDisparadorRef,
}: ModalConfirmacaoDestrutivaProps) {
  const idBase = useId();
  const idTitulo = `modal-destrutivo-title-${idBase}`;
  const idDesc = `modal-destrutivo-desc-${idBase}`;

  const dialogRef = useRef<HTMLDivElement>(null);
  const botaoCancelarRef = useRef<HTMLButtonElement>(null);
  const ultimoElementoFocadoRef = useRef<HTMLElement | null>(null);

  // Validação em desenvolvimento contra rótulos genéricos proibidos pela Câmara UX
  if (process.env.NODE_ENV !== "production") {
    const rotuloNormalizado = rotuloAcao.trim().toLowerCase();
    if (ROTULOS_PROIBIDOS.includes(rotuloNormalizado)) {
      console.warn(
        `[Câmara UX]: O rótulo "${rotuloAcao}" viola a diretriz de ações destrutivas. Use verbos e objetos específicos como "Excluir aluno" ou "Descartar alterações".`
      );
    }
  }

  // Captura do foco anterior e posicionamento inicial no botão Cancelar (menos destrutivo)
  useEffect(() => {
    if (aberto) {
      ultimoElementoFocadoRef.current = (elementoDisparadorRef?.current ||
        (typeof document !== "undefined" ? (document.activeElement as HTMLElement) : null)) as HTMLElement | null;

      // Prioridade WCAG APG: o foco inicial entra na opção menos destrutiva (Cancelar)
      const timer = setTimeout(() => {
        if (botaoCancelarRef.current) {
          botaoCancelarRef.current.focus();
        }
      }, 30);

      return () => clearTimeout(timer);
    } else {
      // Devolve o foco ao fechar
      if (ultimoElementoFocadoRef.current && typeof ultimoElementoFocadoRef.current.focus === "function") {
        ultimoElementoFocadoRef.current.focus();
      }
    }
  }, [aberto, elementoDisparadorRef]);

  // Bloqueio de tecla Escape e Trap de foco (ciclo de Tab/Shift+Tab)
  useEffect(() => {
    if (!aberto) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (!carregando) {
          e.preventDefault();
          onCancelar();
        }
        return;
      }

      if (e.key === "Tab" && dialogRef.current) {
        const focaveis = dialogRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focaveis.length === 0) return;

        const primeiro = focaveis[0];
        const ultimo = focaveis[focaveis.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === primeiro) {
            e.preventDefault();
            ultimo.focus();
          }
        } else {
          if (document.activeElement === ultimo) {
            e.preventDefault();
            primeiro.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aberto, carregando, onCancelar]);

  if (!aberto) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(10, 10, 11, 0.72)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "var(--espaco-md, 16px)",
      }}
      onClick={(e) => {
        // Clicar fora fecha com segurança apenas se não estiver carregando
        if (e.target === e.currentTarget && !carregando) {
          onCancelar();
        }
      }}
    >
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        aria-describedby={idDesc}
        style={{
          backgroundColor: "#ffffff",
          color: "var(--cor-ink, #111827)",
          width: "100%",
          maxWidth: "480px",
          borderRadius: "var(--radius-md, 12px)",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          border: "1px solid var(--cor-border-light, #e5e7eb)",
          padding: "24px",
          position: "relative",
          animation: "fadeInModal 0.18s ease-out",
        }}
      >
        {/* Botão de Fechar no Canto Superior Direito */}
        <button
          type="button"
          onClick={onCancelar}
          disabled={carregando}
          aria-label="Fechar diálogo de confirmação"
          style={{
            position: "absolute",
            top: "16px",
            right: "16px",
            background: "none",
            border: "none",
            cursor: carregando ? "not-allowed" : "pointer",
            color: "var(--cor-muted, #6b7280)",
            padding: "4px",
            borderRadius: "var(--radius-xs, 4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <IconX size={18} />
        </button>

        {/* Cabeçalho com Ícone de Destaque de Perigo */}
        <div style={{ display: "flex", gap: "16px", alignItems: "flex-start", marginBottom: "16px" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "50%",
              backgroundColor: "#fef2f2",
              color: "#dc2626",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              border: "1px solid #fee2e2",
            }}
            aria-hidden="true"
          >
            {tipoIcone === "lixeira" ? <IconTrash size={22} /> : <IconAlertTriangle size={22} />}
          </div>

          <div style={{ flex: 1, paddingRight: "16px" }}>
            <h2
              id={idTitulo}
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#111827",
                margin: "0 0 6px 0",
                lineHeight: 1.3,
              }}
            >
              {titulo}
            </h2>

            {objetoNome && (
              <div
                style={{
                  display: "inline-block",
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: "#f3f4f6",
                  color: "#1f2937",
                  padding: "2px 8px",
                  borderRadius: "4px",
                  marginBottom: "8px",
                }}
              >
                Item: {objetoNome}
              </div>
            )}

            <div
              id={idDesc}
              style={{
                fontSize: "14px",
                color: "#4b5563",
                lineHeight: 1.5,
              }}
            >
              {mensagem}
            </div>
          </div>
        </div>

        {/* Barra de Ações: Cancelar (Seguro / Menos Destrutivo) + Ação Destrutiva */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            gap: "12px",
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #f3f4f6",
          }}
        >
          {/* Botão Cancelar (Recebe foco inicial) */}
          <button
            ref={botaoCancelarRef}
            type="button"
            onClick={onCancelar}
            disabled={carregando}
            style={{
              padding: "9px 18px",
              fontSize: "14px",
              fontWeight: 500,
              color: "#374151",
              backgroundColor: "#f9fafb",
              border: "1px solid #d1d5db",
              borderRadius: "var(--radius-xs, 6px)",
              cursor: carregando ? "not-allowed" : "pointer",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!carregando) e.currentTarget.style.backgroundColor = "#f3f4f6";
            }}
            onMouseLeave={(e) => {
              if (!carregando) e.currentTarget.style.backgroundColor = "#f9fafb";
            }}
          >
            {rotuloCancelar}
          </button>

          {/* Botão Destrutivo de Perigo (Destacado sem depender exclusivamente de cor) */}
          <button
            type="button"
            onClick={onConfirmar}
            disabled={carregando}
            aria-busy={carregando}
            style={{
              padding: "9px 18px",
              fontSize: "14px",
              fontWeight: 600,
              color: "#ffffff",
              backgroundColor: "#dc2626",
              border: "1px solid #b91c1c",
              borderRadius: "var(--radius-xs, 6px)",
              cursor: carregando ? "not-allowed" : "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              boxShadow: "0 1px 2px rgba(220, 38, 38, 0.2)",
              opacity: carregando ? 0.7 : 1,
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              if (!carregando) e.currentTarget.style.backgroundColor = "#b91c1c";
            }}
            onMouseLeave={(e) => {
              if (!carregando) e.currentTarget.style.backgroundColor = "#dc2626";
            }}
          >
            <IconTrash size={16} aria-hidden="true" />
            <span>{carregando ? "Processando..." : rotuloAcao}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
