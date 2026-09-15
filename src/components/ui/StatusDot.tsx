import React from "react";

export type StatusVariant = "verde" | "amarelo" | "vermelho" | "azul" | "neutro";

interface StatusDotProps {
  status: StatusVariant;
  label?: string;
  size?: number;
}

const CORES: Record<StatusVariant, { dot: string; bg: string; text: string }> = {
  verde: {
    dot: "#10b981",
    bg: "rgba(16, 185, 129, 0.12)",
    text: "#065f46",
  },
  amarelo: {
    dot: "#f59e0b",
    bg: "rgba(245, 158, 11, 0.12)",
    text: "#92400e",
  },
  vermelho: {
    dot: "#ef4444",
    bg: "rgba(239, 68, 68, 0.12)",
    text: "#991b1b",
  },
  azul: {
    dot: "#1863dc",
    bg: "rgba(24, 99, 220, 0.12)",
    text: "#1e40af",
  },
  neutro: {
    dot: "#9ca3af",
    bg: "rgba(156, 163, 175, 0.12)",
    text: "#374151",
  },
};

export function StatusDot({ status, label, size = 7 }: StatusDotProps) {
  const c = CORES[status] || CORES.neutro;

  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
      <span
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          backgroundColor: c.dot,
          boxShadow: `0 0 0 2.5px ${c.bg}`,
          flexShrink: 0,
        }}
      />
      {label && (
        <span style={{ fontSize: "12px", fontWeight: 500, color: "var(--cor-ink)", letterSpacing: "-0.1px" }}>
          {label}
        </span>
      )}
    </span>
  );
}
