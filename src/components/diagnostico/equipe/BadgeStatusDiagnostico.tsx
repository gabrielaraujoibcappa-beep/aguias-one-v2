import React from "react";
import { ROTULOS_STATUS_DIAGNOSTICO } from "@/lib/diagnostico/cliente";
import type { StatusDiagnostico } from "@/lib/diagnostico/regras";

const CLASSE: Record<StatusDiagnostico, string> = {
  rascunho: "neutro",
  enviado: "presente",
  congelado: "presente",
};

export function BadgeStatusDiagnostico({ status, atrasado }: { status: StatusDiagnostico; atrasado?: boolean }) {
  return (
    <span style={{ display: "inline-flex", gap: "4px", flexWrap: "wrap" }}>
      <span className={`adm-chip ${CLASSE[status] ?? "neutro"}`}>Placar: {ROTULOS_STATUS_DIAGNOSTICO[status] ?? status}</span>
      {atrasado && <span className="adm-chip falta">Atrasado</span>}
    </span>
  );
}
