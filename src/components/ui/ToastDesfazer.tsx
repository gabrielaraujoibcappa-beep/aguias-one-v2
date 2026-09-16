"use client";

import React, { useEffect, useState, useRef } from "react";
import { IconCheckCircle, IconX } from "@/components/ui/Icons";

export interface ToastDesfazerProps {
  /** Se a notificação está visível */
  visivel: boolean;
  /** Mensagem descrevendo o que aconteceu (ex: "Aluno 'Dr. Roberto' desativado com sucesso.") */
  mensagem: string;
  /** Rótulo do botão de reversão (padrão: "Desfazer") */
  rotuloDesfazer?: string;
  /** Duração em milissegundos antes do toast desaparecer (padrão: 7000ms / 7 segundos) */
  duracaoMs?: number;
  /** Função de callback chamada quando a pessoa clica em Desfazer */
  onDesfazer: () => void;
  /** Função de callback chamada quando a notificação expira ou é fechada */
  onFechar: () => void;
}

export function ToastDesfazer({
  visivel,
  mensagem,
  rotuloDesfazer = "Desfazer",
  duracaoMs = 7000,
  onDesfazer,
  onFechar,
}: ToastDesfazerProps) {
  const [tempoRestante, setTempoRestante] = useState(duracaoMs);
  const [pausado, setPausado] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!visivel) {
      setTempoRestante(duracaoMs);
      return;
    }

    if (pausado) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const intervalo = 100;
    timerRef.current = setInterval(() => {
      setTempoRestante((prev) => {
        if (prev <= intervalo) {
          clearInterval(timerRef.current!);
          onFechar();
          return 0;
        }
        return prev - intervalo;
      });
    }, intervalo);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [visivel, pausado, duracaoMs, onFechar]);

  if (!visivel) return null;

  const porcentagemRestante = (tempoRestante / duracaoMs) * 100;

  return (
    <div
      role="status"
      aria-live="polite"
      onMouseEnter={() => setPausado(true)}
      onMouseLeave={() => setPausado(false)}
      onFocus={() => setPausado(true)}
      onBlur={() => setPausado(false)}
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        zIndex: 9998,
        maxWidth: "420px",
        backgroundColor: "var(--cor-dark-deep, #0a0a0b)",
        color: "#ffffff",
        borderRadius: "var(--radius-sm, 8px)",
        boxShadow: "0 12px 30px rgba(0, 0, 0, 0.4)",
        border: "1px solid rgba(255, 255, 255, 0.15)",
        overflow: "hidden",
        animation: "slideInUp 0.2s ease-out",
        fontFamily: "var(--font-family-ui)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
        }}
      >
        <span style={{ color: "#10b981", display: "flex", alignItems: "center" }} aria-hidden="true">
          <IconCheckCircle size={20} />
        </span>

        <span style={{ fontSize: "13px", lineHeight: 1.4, flex: 1 }}>{mensagem}</span>

        {/* Botão Desfazer (Ação de reversão rápida) */}
        <button
          type="button"
          onClick={() => {
            onDesfazer();
            onFechar();
          }}
          style={{
            background: "none",
            border: "1px solid var(--cor-action-glow, #00c2ff)",
            color: "var(--cor-action-glow, #00c2ff)",
            borderRadius: "var(--radius-xs, 4px)",
            padding: "5px 12px",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "rgba(0, 194, 255, 0.15)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          {rotuloDesfazer}
        </button>

        {/* Botão Fechar Toast */}
        <button
          type="button"
          onClick={onFechar}
          aria-label="Fechar notificação"
          style={{
            background: "none",
            border: "none",
            color: "rgba(255, 255, 255, 0.5)",
            padding: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
          }}
        >
          <IconX size={14} />
        </button>
      </div>

      {/* Linha de Progresso Visual de Tempo Restante */}
      <div
        style={{
          height: "3px",
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          width: "100%",
        }}
      >
        <div
          style={{
            height: "100%",
            backgroundColor: "var(--cor-action-vibrant, #0052ff)",
            width: `${porcentagemRestante}%`,
            transition: "width 0.1s linear",
          }}
        />
      </div>
    </div>
  );
}
