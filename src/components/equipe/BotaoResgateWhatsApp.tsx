"use client";

import React from "react";
import { AlunoSemaforoStatus, gerarLinkWhatsAppResgate } from "@/lib/api/turma-semaforo";
import { IconWhatsApp } from "../ui/Icons";

interface BotaoResgateWhatsAppProps {
  aluno: AlunoSemaforoStatus;
  nomeConcierge?: string;
}

export function BotaoResgateWhatsApp({ aluno, nomeConcierge = "Flávio Lopes" }: BotaoResgateWhatsAppProps) {
  const linkWhatsApp = gerarLinkWhatsAppResgate(aluno, nomeConcierge);

  return (
    <a
      href={linkWhatsApp}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        backgroundColor: "var(--cor-primary)",
        color: "#ffffff",
        padding: "4px 10px",
        borderRadius: "var(--radius-xs)",
        fontSize: "11px",
        fontWeight: 500,
        textDecoration: "none",
        transition: "opacity 0.15s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
    >
      <IconWhatsApp size={13} />
      <span>Resgate via WhatsApp</span>
    </a>
  );
}
