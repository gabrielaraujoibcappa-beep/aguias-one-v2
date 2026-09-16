import React from "react";
import { ROTULOS_STATUS_AUDITORIA, StatusAuditoriaFaturamento } from "@/lib/api/faturamento";
import { StatusDot, StatusVariant } from "../ui/StatusDot";

const VARIANTE: Record<StatusAuditoriaFaturamento, StatusVariant> = {
  pendente: "amarelo",
  aprovado: "verde",
  ajuste_solicitado: "vermelho",
};

export function BadgeStatusAuditoria({ status = "pendente" }: { status?: StatusAuditoriaFaturamento }) {
  return <StatusDot status={VARIANTE[status]} label={ROTULOS_STATUS_AUDITORIA[status]} size={6} />;
}
