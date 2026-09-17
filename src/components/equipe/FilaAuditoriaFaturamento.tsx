"use client";

import React, { useState } from "react";
import {
  DeclaracaoFaturamento,
  calcularMetaMensal,
  formatarMesReferencia,
  formatarMoedaReal,
  obterMetaAnualAluno,
} from "@/lib/api/faturamento";
import { AcoesAuditoriaFaturamento } from "./AcoesAuditoriaFaturamento";
import { BadgeStatusAuditoria } from "../faturamento/BadgeStatusAuditoria";
import { ArquivoVisualizavel, ModalArquivo } from "../ui/ModalArquivo";

interface FilaAuditoriaFaturamentoProps {
  declaracoes: DeclaracaoFaturamento[];
  nomesAlunos: Record<string, string>;
  metas: Record<string, number>;
  modo: "pendentes" | "historico";
  onAprovar: (id: string) => void;
  onSolicitarAjuste: (id: string, parecer: string) => void;
  onAbrirAluno: (alunoId: string) => void;
}

const CELULA: React.CSSProperties = { padding: "14px 8px", verticalAlign: "top" };

export function FilaAuditoriaFaturamento({ declaracoes, nomesAlunos, metas, modo, onAprovar, onSolicitarAjuste, onAbrirAluno }: FilaAuditoriaFaturamentoProps) {
  const [comprovanteAberto, setComprovanteAberto] = useState<ArquivoVisualizavel | null>(null);
  const ordenadas = [...declaracoes].sort((a, b) => (b.criadoEm ?? "").localeCompare(a.criadoEm ?? ""));
  const pendentes = modo === "pendentes";

  return (
    <div className="card">
      <div style={{ marginBottom: "var(--espaco-md)" }}>
        <h3 style={{ fontSize: "18px", fontWeight: 600 }}>
          {pendentes ? "Declarações aguardando auditoria" : "Declarações já auditadas"}
        </h3>
        <span style={{ fontSize: "13px", color: "var(--cor-muted)" }}>
          {ordenadas.length} declaração(ões){pendentes ? " para conferir comprovantes e aprovar ou pedir ajuste" : ""}
        </span>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--cor-hairline)", color: "var(--cor-muted)" }}>
              <th style={{ padding: "12px 8px" }}>Mentorado</th>
              <th style={{ padding: "12px 8px" }}>Mês</th>
              <th style={{ padding: "12px 8px", textAlign: "right" }}>Valor bruto</th>
              <th style={{ padding: "12px 8px", textAlign: "right" }}>Da meta mensal</th>
              <th style={{ padding: "12px 8px" }}>Comprovantes</th>
              <th style={{ padding: "12px 8px" }}>{pendentes ? "Enviado em" : "Situação"}</th>
              <th style={{ padding: "12px 8px", textAlign: "right" }}>{pendentes ? "Decisão" : "Ação"}</th>
            </tr>
          </thead>
          <tbody>
            {ordenadas.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: "32px 0", textAlign: "center", color: "var(--cor-muted)" }}>
                  {pendentes ? "Nenhuma declaração pendente de auditoria." : "Nenhuma declaração auditada ainda."}
                </td>
              </tr>
            ) : (
              ordenadas.map((d) => {
                const alunoId = d.alunoId ?? "";
                const metaMensal = calcularMetaMensal(obterMetaAnualAluno(metas, alunoId));
                const percentual = metaMensal > 0 ? Math.round((d.valorBruto / metaMensal) * 100) : 0;
                return (
                  <tr key={d.id} style={{ borderBottom: "1px solid var(--cor-border-light)" }}>
                    <td style={CELULA}>
                      <button
                        type="button"
                        onClick={() => onAbrirAluno(alunoId)}
                        style={{ background: "transparent", border: "none", padding: 0, cursor: "pointer", fontWeight: 500, color: "var(--cor-ink)", textAlign: "left" }}
                      >
                        {nomesAlunos[alunoId] ?? "Mentorado"}
                      </button>
                    </td>
                    <td style={CELULA}>{formatarMesReferencia(d.mesReferencia)}</td>
                    <td style={{ ...CELULA, textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatarMoedaReal(d.valorBruto)}</td>
                    <td style={{ ...CELULA, textAlign: "right", fontVariantNumeric: "tabular-nums", color: percentual >= 100 ? "#065f46" : "var(--cor-text-muted)" }}>
                      {percentual}%
                    </td>
                    <td style={CELULA}>
                      {d.comprovantes.length === 0 ? (
                        <span style={{ fontSize: "12px", color: "var(--cor-muted)" }}>Nenhum comprovante</span>
                      ) : (
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                          {d.comprovantes.map((c, i) => (
                            <button key={i} type="button" onClick={() => setComprovanteAberto({ nome: c.nome, path: c.path })} className="btn-secondary" style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "var(--radius-xs)" }}>
                              {c.tipo === "zip" ? "Abrir .ZIP" : "Ver arquivo"}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    <td style={{ ...CELULA, fontSize: "13px", color: "var(--cor-muted)" }}>
                      {pendentes ? (
                        d.criadoEm ? new Date(d.criadoEm).toLocaleDateString("pt-BR") : "Hoje"
                      ) : (
                        <div>
                          <BadgeStatusAuditoria status={d.statusAuditoria} />
                          <div style={{ fontSize: "12px", marginTop: "4px" }}>
                            {d.auditadoPor}{d.auditadoEm ? ` · ${new Date(d.auditadoEm).toLocaleDateString("pt-BR")}` : ""}
                          </div>
                          {d.parecerAuditoria && <div style={{ fontSize: "12px", color: "var(--cor-text-muted)", marginTop: "2px", maxWidth: "280px" }}>{d.parecerAuditoria}</div>}
                        </div>
                      )}
                    </td>
                    <td style={{ ...CELULA, textAlign: "right" }}>
                      {pendentes ? (
                        <AcoesAuditoriaFaturamento declaracaoId={d.id ?? ""} onAprovar={onAprovar} onSolicitarAjuste={onSolicitarAjuste} compacto />
                      ) : (
                        <button type="button" className="btn-secondary" onClick={() => onAbrirAluno(alunoId)} style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "var(--radius-xs)" }}>
                          Abrir mentorado
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <ModalArquivo arquivo={comprovanteAberto} bucket="comprovantes" onFechar={() => setComprovanteAberto(null)} />
    </div>
  );
}
