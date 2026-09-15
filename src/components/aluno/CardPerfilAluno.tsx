import React from "react";
import { StatusDot } from "../ui/StatusDot";

interface CardPerfilAlunoProps {
  nome: string;
  turmaNome: string;
  semaforo: "verde" | "amarelo" | "vermelho";
  moduloAtualTitulo: string;
}

export function CardPerfilAluno({
  nome,
  turmaNome,
  semaforo,
  moduloAtualTitulo,
}: CardPerfilAlunoProps) {
  const semaforoLabels: Record<"verde" | "amarelo" | "vermelho", string> = {
    verde: "Tração Nominal",
    amarelo: "Atrito / Dúvida",
    vermelho: "Check-in Pendente",
  };

  return (
    <div style={{
      backgroundColor: "var(--cor-deep-green)",
      color: "#ffffff",
      borderRadius: "var(--radius-sm)",
      padding: "var(--espaco-xl)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "var(--espaco-lg)",
      marginBottom: "var(--espaco-xl)",
    }}>
      <div>
        <div style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          color: "rgba(255, 255, 255, 0.7)",
          marginBottom: "var(--espaco-xs)",
          fontFamily: "var(--font-family-mono)",
        }}>
          {turmaNome}
        </div>
        <h1 style={{
          fontSize: "26px",
          color: "#ffffff",
          marginBottom: "var(--espaco-xs)",
          letterSpacing: "-0.5px",
          fontFamily: "var(--font-family-display)",
        }}>
          {nome}
        </h1>
        <p style={{ color: "rgba(255, 255, 255, 0.8)", fontSize: "13px" }}>
          Foco atual: <strong style={{ color: "#ffffff" }}>{moduloAtualTitulo}</strong>
        </p>
      </div>

      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        padding: "8px 16px",
        borderRadius: "var(--radius-xs)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}>
        <StatusDot status={semaforo} label={semaforoLabels[semaforo]} size={8} />
      </div>
    </div>
  );
}
