"use client";

import React from "react";
import { DeclaracaoFaturamento, formatarMoedaReal } from "@/lib/api/faturamento";
import { BadgeStatusAuditoria } from "./BadgeStatusAuditoria";

interface TabelaHistoricoFaturamentoProps {
  historico: DeclaracaoFaturamento[];
}

export function TabelaHistoricoFaturamento({ historico }: TabelaHistoricoFaturamentoProps) {
  const formatarMes = (mesRef: string) => {
    const [ano, mes] = mesRef.split("-");
    const data = new Date(Number(ano), Number(mes) - 1, 1);
    return data.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  };

  return (
    <div className="card">
      <h3 style={{ fontSize: "18px", marginBottom: "var(--espaco-md)" }}>Histórico de Declarações</h3>

      <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
        <thead>
          <tr style={{ borderBottom: "1px solid var(--cor-hairline)", color: "var(--cor-muted)" }}>
            <th style={{ padding: "12px 8px" }}>Mês de Referência</th>
            <th style={{ padding: "12px 8px" }}>Valor Bruto Declarado</th>
            <th style={{ padding: "12px 8px" }}>Comprovantes / ZIP</th>
            <th style={{ padding: "12px 8px" }}>Data do Envio</th>
            <th style={{ padding: "12px 8px" }}>Auditoria</th>
          </tr>
        </thead>
        <tbody>
          {historico.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ padding: "24px 0", textAlign: "center", color: "var(--cor-muted)" }}>
                Nenhuma declaração lançada até o momento.
              </td>
            </tr>
          ) : (
            historico.map((item, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--cor-border-light)" }}>
                <td style={{ padding: "14px 8px", textTransform: "capitalize", fontWeight: 500 }}>
                  {formatarMes(item.mesReferencia)}
                </td>
                <td style={{ padding: "14px 8px", fontWeight: 600, color: "var(--cor-deep-green)" }}>
                  {formatarMoedaReal(item.valorBruto)}
                </td>
                <td style={{ padding: "14px 8px" }}>
                  {item.comprovantes.length === 0 ? (
                    <span style={{ fontSize: "12px", color: "var(--cor-muted)" }}>Nenhum comprovante</span>
                  ) : (
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {item.comprovantes.map((c, i) => (
                        <a
                          key={i}
                          href={`#download-${c.path}`}
                          className="btn-secondary"
                          style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "var(--radius-xs)" }}
                        >
                          {c.tipo === "zip" ? "Baixar .ZIP" : "Ver Arquivo"}
                        </a>
                      ))}
                    </div>
                  )}
                </td>
                <td style={{ padding: "14px 8px", fontSize: "13px", color: "var(--cor-muted)" }}>
                  {item.criadoEm ? new Date(item.criadoEm).toLocaleDateString("pt-BR") : "Hoje"}
                </td>
                <td style={{ padding: "14px 8px" }}>
                  <BadgeStatusAuditoria status={item.statusAuditoria} />
                  {item.statusAuditoria === "ajuste_solicitado" && item.parecerAuditoria && (
                    <div style={{ fontSize: "12px", color: "var(--cor-text-muted)", marginTop: "4px", maxWidth: "260px" }}>
                      {item.parecerAuditoria}
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
