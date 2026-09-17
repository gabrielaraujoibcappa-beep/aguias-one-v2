import React from "react";
import { StatusDot } from "../ui/StatusDot";

interface CardPerfilAlunoProps {
  nome: string;
  turmaNome: string;
  /** Sem avaliação da equipe, o card mostra "Sem avaliação" em vez de inventar uma cor. */
  semaforo?: "verde" | "amarelo" | "vermelho";
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
      backgroundColor: "var(--cor-dark-deep, #0a0a0b)",
      color: "#ffffff",
      borderRadius: "var(--radius-md)",
      padding: "var(--espaco-xl)",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      flexWrap: "wrap",
      gap: "var(--espaco-lg)",
      marginBottom: "var(--espaco-xl)",
      border: "1px solid rgba(255, 255, 255, 0.08)",
      boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
      position: "relative",
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "20px", zIndex: 1 }}>
        <img
          src="/logo-simbolo.png"
          alt="ÁGUIAS ONE"
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "var(--radius-sm)",
            border: "1px solid rgba(0, 194, 255, 0.4)",
            boxShadow: "0 0 16px rgba(0, 82, 255, 0.3)",
            flexShrink: 0,
          }}
        />
        <div>
          <div style={{
            fontSize: "11px",
            fontWeight: 600,
            letterSpacing: "0.5px",
            textTransform: "uppercase",
            color: "var(--cor-action-glow, #00c2ff)",
            marginBottom: "var(--espaco-xs)",
            fontFamily: "var(--font-family-mono)",
          }}>
            {turmaNome} · Perito ÁGUIAS ONE
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
      </div>

      <div style={{
        backgroundColor: "rgba(255, 255, 255, 0.98)",
        padding: "8px 16px",
        borderRadius: "var(--radius-xs)",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
      }}>
        <StatusDot status={semaforo ?? "neutro"} label={semaforo ? semaforoLabels[semaforo] : "Sem avaliação"} size={8} />
      </div>
    </div>
  );
}
