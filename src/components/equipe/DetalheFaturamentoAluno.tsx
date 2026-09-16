"use client";

import React, { useState } from "react";
import Link from "next/link";
import { DeclaracaoFaturamento, formatarMesReferencia, formatarMoedaReal } from "@/lib/api/faturamento";
import { MetaFaturamentoAnual } from "../faturamento/MetaFaturamentoAnual";
import { BadgeStatusAuditoria } from "../faturamento/BadgeStatusAuditoria";
import { AcoesAuditoriaFaturamento } from "./AcoesAuditoriaFaturamento";

interface DetalheFaturamentoAlunoProps {
  aluno: { id: string; nome: string; email?: string; turmaNome?: string };
  faturamentos: DeclaracaoFaturamento[];
  metaAnual: number;
  onDefinirMeta: (valor: number) => void;
  onNovaDeclaracao: () => void;
  onEditar: (declaracao: DeclaracaoFaturamento) => void;
  onExcluir: (id: string) => void;
  onAprovar: (id: string) => void;
  onSolicitarAjuste: (id: string, parecer: string) => void;
  onVoltar: () => void;
}

const CELULA: React.CSSProperties = { padding: "14px 8px", verticalAlign: "top" };
const BOTAO_PEQUENO: React.CSSProperties = { fontSize: "12px", padding: "5px 12px", borderRadius: "var(--radius-xs)" };

export function DetalheFaturamentoAluno({
  aluno,
  faturamentos,
  metaAnual,
  onDefinirMeta,
  onNovaDeclaracao,
  onEditar,
  onExcluir,
  onAprovar,
  onSolicitarAjuste,
  onVoltar,
}: DetalheFaturamentoAlunoProps) {
  const [confirmandoExclusao, setConfirmandoExclusao] = useState<string | null>(null);

  const ordenados = [...faturamentos].sort((a, b) => b.mesReferencia.localeCompare(a.mesReferencia));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--espaco-lg)", flexWrap: "wrap", gap: "var(--espaco-md)" }}>
        <div>
          <button type="button" onClick={onVoltar} style={{ fontSize: "13px", color: "var(--cor-muted)", marginBottom: "6px", background: "transparent", border: "none", cursor: "pointer", padding: 0 }}>
            ← Voltar para a turma
          </button>
          <h2 style={{ fontSize: "22px" }}>{aluno.nome}</h2>
          <p style={{ color: "var(--cor-muted)", fontSize: "14px" }}>
            {[aluno.email, aluno.turmaNome].filter(Boolean).join(" · ")}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <Link
            href={`/painel/aluno/${encodeURIComponent(aluno.id)}?contexto=metas-faturamento`}
            className="btn-secondary"
            style={{ fontSize: "13px", padding: "8px 16px", borderRadius: "var(--radius-xs)" }}
          >
            Ver ficha completa
          </Link>
          <button type="button" className="btn-primary" onClick={onNovaDeclaracao} style={{ fontSize: "13px", padding: "8px 16px", borderRadius: "var(--radius-xs)" }}>
            Nova declaração
          </button>
        </div>
      </div>

      {/* Meta anual editável + gráfico (mesmo componente que o mentorado vê) */}
      <MetaFaturamentoAnual faturamentos={faturamentos} metaAnual={metaAnual} onDefinirMeta={onDefinirMeta} />

      <div className="card">
        <h3 style={{ fontSize: "18px", marginBottom: "var(--espaco-md)" }}>Declarações do mentorado</h3>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--cor-hairline)", color: "var(--cor-muted)" }}>
                <th style={{ padding: "12px 8px" }}>Mês</th>
                <th style={{ padding: "12px 8px", textAlign: "right" }}>Valor bruto</th>
                <th style={{ padding: "12px 8px" }}>Comprovantes</th>
                <th style={{ padding: "12px 8px" }}>Auditoria</th>
                <th style={{ padding: "12px 8px", textAlign: "right" }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ordenados.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "32px 0", textAlign: "center", color: "var(--cor-muted)" }}>
                    Nenhuma declaração lançada para este mentorado.
                  </td>
                </tr>
              ) : (
                ordenados.map((d) => {
                  const id = d.id ?? "";
                  const pendente = (d.statusAuditoria ?? "pendente") === "pendente";
                  return (
                    <tr key={id} style={{ borderBottom: "1px solid var(--cor-border-light)" }}>
                      <td style={{ ...CELULA, fontWeight: 500 }}>{formatarMesReferencia(d.mesReferencia)}</td>
                      <td style={{ ...CELULA, textAlign: "right", fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{formatarMoedaReal(d.valorBruto)}</td>
                      <td style={{ ...CELULA, fontSize: "12px", color: "var(--cor-muted)" }}>
                        {d.comprovantes.length === 0 ? "Nenhum" : d.comprovantes.map((c) => c.nome).join(", ")}
                      </td>
                      <td style={CELULA}>
                        <BadgeStatusAuditoria status={d.statusAuditoria} />
                        {d.auditadoPor && (
                          <div style={{ fontSize: "12px", color: "var(--cor-muted)", marginTop: "4px" }}>
                            {d.auditadoPor}{d.auditadoEm ? ` · ${new Date(d.auditadoEm).toLocaleDateString("pt-BR")}` : ""}
                          </div>
                        )}
                        {d.parecerAuditoria && <div style={{ fontSize: "12px", color: "var(--cor-text-muted)", marginTop: "2px", maxWidth: "260px" }}>{d.parecerAuditoria}</div>}
                        {d.editadoPor && <div style={{ fontSize: "11px", color: "var(--cor-muted)", marginTop: "2px" }}>Lançado/editado por {d.editadoPor}</div>}
                      </td>
                      <td style={{ ...CELULA, textAlign: "right" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end" }}>
                          {pendente && <AcoesAuditoriaFaturamento declaracaoId={id} onAprovar={onAprovar} onSolicitarAjuste={onSolicitarAjuste} compacto />}
                          <div style={{ display: "flex", gap: "6px" }}>
                            <button type="button" className="btn-secondary" style={BOTAO_PEQUENO} onClick={() => onEditar(d)}>
                              Editar
                            </button>
                            {confirmandoExclusao === id ? (
                              <>
                                <button type="button" className="btn-secondary" style={BOTAO_PEQUENO} onClick={() => setConfirmandoExclusao(null)}>
                                  Cancelar
                                </button>
                                <button type="button" className="btn-primary" style={{ ...BOTAO_PEQUENO, background: "var(--cor-error)" }} onClick={() => { onExcluir(id); setConfirmandoExclusao(null); }}>
                                  Confirmar exclusão
                                </button>
                              </>
                            ) : (
                              <button type="button" className="btn-secondary" style={{ ...BOTAO_PEQUENO, color: "var(--cor-error)", borderColor: "var(--cor-error)" }} onClick={() => setConfirmandoExclusao(id)}>
                                Excluir
                              </button>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
