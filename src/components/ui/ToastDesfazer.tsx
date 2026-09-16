"use client";

import React, { useEffect, useRef, useState } from "react";
import { IconAlertCircle, IconCheckCircle, IconX } from "@/components/ui/Icons";

export interface ToastDesfazerProps {
  /** Se a notificação está visível */
  visivel: boolean;
  /** O que aconteceu, com o objeto afetado (ex: "Declaração de agosto de Dr. Roberto Silva aprovada.") */
  mensagem: string;
  /** Texto visível do botão de reversão. Omitido quando não há ação a desfazer. */
  rotuloDesfazer?: string;
  /** Nome acessível do botão, com ação e objeto (ex: "Desfazer aprovação da declaração de agosto"). */
  rotuloAcessivelDesfazer?: string;
  /** Tempo até a notificação sumir. Pausa enquanto o ponteiro ou o foco estão sobre ela. */
  duracaoMs?: number;
  /** Tom visual do ícone */
  tom?: "sucesso" | "info" | "erro";
  /**
   * Se o próprio toast deve se anunciar como região de status.
   * Use `false` quando uma região de status persistente já anuncia a mensagem.
   */
  anunciar?: boolean;
  /** Mostra a dica do atalho de teclado Ctrl+Z ao lado do botão */
  mostrarAtalho?: boolean;
  /** Identificador da notificação; reinicia a contagem quando muda, mesmo com a mesma mensagem */
  idNotificacao?: number | string;
  /** Chamado quando a pessoa aciona "Desfazer" */
  onDesfazer?: () => void;
  /** Chamado quando a notificação expira ou é dispensada */
  onFechar: () => void;
}

const COR_ICONE = { sucesso: "#10b981", info: "#60a5fa", erro: "#f87171" };

export function ToastDesfazer({
  visivel,
  mensagem,
  rotuloDesfazer = "Desfazer",
  rotuloAcessivelDesfazer,
  duracaoMs = 7000,
  tom = "sucesso",
  anunciar = true,
  mostrarAtalho = false,
  idNotificacao,
  onDesfazer,
  onFechar,
}: ToastDesfazerProps) {
  const [pausado, setPausado] = useState(false);
  const restanteRef = useRef(duracaoMs);
  const inicioRef = useRef(0);
  const onFecharRef = useRef(onFechar);
  onFecharRef.current = onFechar;
  const botaoFecharRef = useRef<HTMLButtonElement>(null);
  const devolverFocoRef = useRef(false);

  // Reinicia a contagem a cada nova notificação
  useEffect(() => {
    restanteRef.current = duracaoMs;
    setPausado(false);
  }, [visivel, mensagem, duracaoMs, idNotificacao]);

  // Quem acionou "Desfazer" pelo teclado continua com o foco dentro da notificação,
  // no botão de dispensar, em vez de cair no início da página
  useEffect(() => {
    if (devolverFocoRef.current && visivel) {
      devolverFocoRef.current = false;
      botaoFecharRef.current?.focus();
    }
  }, [visivel, mensagem, idNotificacao]);

  // Contagem pausável: ao pausar, guarda o tempo que ainda falta
  useEffect(() => {
    if (!visivel || pausado) return;
    inicioRef.current = Date.now();
    const temporizador = setTimeout(() => onFecharRef.current(), restanteRef.current);
    return () => {
      clearTimeout(temporizador);
      restanteRef.current = Math.max(0, restanteRef.current - (Date.now() - inicioRef.current));
    };
  }, [visivel, pausado, mensagem, duracaoMs, idNotificacao]);

  if (!visivel) return null;

  const temAcao = Boolean(onDesfazer);
  const Icone = tom === "erro" ? IconAlertCircle : IconCheckCircle;

  return (
    <div
      className="toast-desfazer"
      {...(anunciar ? { role: "status", "aria-live": "polite" as const } : {})}
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPausado(false);
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "12px 12px 12px 16px" }}>
        <span style={{ color: COR_ICONE[tom], display: "flex", alignItems: "center", flexShrink: 0 }} aria-hidden="true">
          <Icone size={20} />
        </span>

        <span style={{ fontSize: "14px", lineHeight: 1.4, flex: 1, minWidth: 0 }}>{mensagem}</span>

        {temAcao && (
          <button
            type="button"
            className="toast-desfazer-acao"
            aria-label={rotuloAcessivelDesfazer}
            aria-keyshortcuts={mostrarAtalho ? "Control+Z" : undefined}
            onClick={(e) => {
              devolverFocoRef.current = document.activeElement === e.currentTarget;
              onDesfazer?.();
            }}
          >
            {rotuloDesfazer}
            {mostrarAtalho && (
              <kbd aria-hidden="true" style={{ marginLeft: "8px", fontSize: "11px", fontFamily: "inherit", opacity: 0.7 }}>
                Ctrl Z
              </kbd>
            )}
          </button>
        )}

        <button ref={botaoFecharRef} type="button" className="toast-desfazer-fechar" onClick={() => onFecharRef.current()} aria-label="Dispensar notificação">
          <IconX size={16} />
        </button>
      </div>

      <div className="toast-desfazer-trilho" aria-hidden="true">
        <div
          key={`${idNotificacao ?? ""}-${mensagem}-${duracaoMs}`}
          className="toast-desfazer-progresso"
          style={{ animationDuration: `${duracaoMs}ms`, animationPlayState: pausado ? "paused" : "running" }}
        />
      </div>
    </div>
  );
}
