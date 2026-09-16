import React from "react";
import { formatarMoedaReal, ROTULOS_STATUS_AUDITORIA, type StatusAuditoriaFaturamento } from "@/lib/api/faturamento";
import { formatarMesCurto } from "@/lib/diagnostico/cliente";
import { numeroTabular, rolagemTabela } from "./estilos";

export interface FaturamentoMes {
  mesReferencia: string;
  valorBruto: number;
  statusAuditoria: string | null;
}

/** Faturamento declarado mês a mês (não é caixa). Valores em reais. */
export function FaturamentoDeclarado({ meses }: { meses: FaturamentoMes[] }) {
  if (!meses.length) return <p style={{ color: "var(--cor-muted)", fontSize: "13px", margin: 0 }}>Nenhum faturamento declarado ainda.</p>;
  return (
    <div style={rolagemTabela}>
      <table className="adm-tabela" style={numeroTabular}>
        <thead>
          <tr>
            <th>Mês</th>
            <th>Declarado (bruto)</th>
            <th>Auditoria</th>
          </tr>
        </thead>
        <tbody>
          {meses.map((m) => (
            <tr key={m.mesReferencia}>
              <td>{formatarMesCurto(m.mesReferencia)}</td>
              <td>{formatarMoedaReal(m.valorBruto)}</td>
              <td>{ROTULOS_STATUS_AUDITORIA[(m.statusAuditoria ?? "pendente") as StatusAuditoriaFaturamento] ?? m.statusAuditoria}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
