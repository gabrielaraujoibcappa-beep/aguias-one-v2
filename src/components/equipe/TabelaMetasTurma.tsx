"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { ResumoFaturamentoAluno, formatarMesReferencia, formatarMoedaReal } from "@/lib/api/faturamento";
import { IconSearch } from "../ui/Icons";

interface TabelaMetasTurmaProps {
  resumos: ResumoFaturamentoAluno[];
  ano: number;
  onAbrir: (alunoId: string) => void;
}

const CELULA: React.CSSProperties = { padding: "14px 8px", verticalAlign: "top" };
const NUMERO: React.CSSProperties = { ...CELULA, textAlign: "right", fontVariantNumeric: "tabular-nums" };

function chip(ativo: boolean): React.CSSProperties {
  return {
    padding: "5px 12px",
    borderRadius: "var(--radius-pill)",
    fontSize: "12px",
    fontWeight: 500,
    cursor: "pointer",
    border: ativo ? "1px solid var(--cor-ink)" : "1px solid var(--cor-border-light)",
    backgroundColor: ativo ? "var(--cor-soft-stone)" : "#fff",
    color: ativo ? "var(--cor-ink)" : "#374151",
  };
}

export function TabelaMetasTurma({ resumos, ano, onAbrir }: TabelaMetasTurmaProps) {
  const [busca, setBusca] = useState("");
  const [somentePendencias, setSomentePendencias] = useState(false);
  const [somenteAbaixoMetade, setSomenteAbaixoMetade] = useState(false);

  const filtrados = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return resumos.filter((r) => {
      if (q && !r.nome.toLowerCase().includes(q) && !(r.email ?? "").toLowerCase().includes(q)) return false;
      if (somentePendencias && r.pendentes + r.ajustesSolicitados === 0) return false;
      if (somenteAbaixoMetade && r.percentualAnual >= 50) return false;
      return true;
    });
  }, [resumos, busca, somentePendencias, somenteAbaixoMetade]);

  const totalComPendencias = resumos.filter((r) => r.pendentes + r.ajustesSolicitados > 0).length;
  const totalAbaixoMetade = resumos.filter((r) => r.percentualAnual < 50).length;

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--espaco-md)", flexWrap: "wrap", gap: "var(--espaco-sm)" }}>
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: 600 }}>Metas e faturamento por mentorado · {ano}</h3>
          <span style={{ fontSize: "13px", color: "var(--cor-muted)" }}>
            Exibindo {filtrados.length} de {resumos.length} mentorado(s)
          </span>
        </div>
      </div>

      <div style={{ display: "flex", gap: "var(--espaco-md)", flexWrap: "wrap", alignItems: "center", paddingBottom: "var(--espaco-md)", marginBottom: "var(--espaco-md)", borderBottom: "1px solid var(--cor-border-light)" }}>
        <div style={{ position: "relative", flex: "1 1 240px", display: "flex", alignItems: "center" }}>
          <span style={{ position: "absolute", left: "12px", color: "var(--cor-muted)", display: "flex" }}>
            <IconSearch size={15} />
          </span>
          <input
            type="text"
            aria-label="Buscar mentorado"
            placeholder="Buscar por nome ou e-mail"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ width: "100%", padding: "8px 12px 8px 36px", borderRadius: "var(--radius-xs)", border: "1px solid var(--cor-border-light)", fontSize: "13px" }}
          />
        </div>
        <button type="button" aria-pressed={somentePendencias} onClick={() => setSomentePendencias((v) => !v)} style={chip(somentePendencias)}>
          Com pendências de auditoria ({totalComPendencias})
        </button>
        <button type="button" aria-pressed={somenteAbaixoMetade} onClick={() => setSomenteAbaixoMetade((v) => !v)} style={chip(somenteAbaixoMetade)}>
          Abaixo de 50% da meta ({totalAbaixoMetade})
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--cor-hairline)", color: "var(--cor-muted)" }}>
              <th style={{ padding: "12px 8px" }}>Mentorado</th>
              <th style={{ padding: "12px 8px", textAlign: "right" }}>Meta anual</th>
              <th style={{ padding: "12px 8px", textAlign: "right" }}>Meta mensal</th>
              <th style={{ padding: "12px 8px", textAlign: "right" }}>Realizado {ano}</th>
              <th style={{ padding: "12px 8px" }}>Meta atingida</th>
              <th style={{ padding: "12px 8px" }}>Auditoria</th>
              <th style={{ padding: "12px 8px" }}>Último mês</th>
              <th style={{ padding: "12px 8px", textAlign: "right" }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: "32px 0", textAlign: "center", color: "var(--cor-muted)" }}>
                  Nenhum mentorado encontrado para os filtros selecionados.
                </td>
              </tr>
            ) : (
              filtrados.map((r) => (
                <tr key={r.alunoId} style={{ borderBottom: "1px solid var(--cor-border-light)" }}>
                  <td style={CELULA}>
                    <div style={{ fontWeight: 500 }}>{r.nome}</div>
                    {r.email && <div style={{ fontSize: "12px", color: "var(--cor-muted)" }}>{r.email}</div>}
                  </td>
                  <td style={NUMERO}>{formatarMoedaReal(r.metaAnual)}</td>
                  <td style={NUMERO}>{formatarMoedaReal(r.metaMensal)}</td>
                  <td style={{ ...NUMERO, fontWeight: 600 }}>{formatarMoedaReal(r.realizadoAno)}</td>
                  <td style={{ ...CELULA, minWidth: "150px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                      <span style={{ fontWeight: 600 }}>{Math.round(r.percentualAnual)}%</span>
                      <span style={{ color: "var(--cor-muted)" }}>{r.mesesDeclarados} de 12 meses</span>
                    </div>
                    <div style={{ height: "6px", borderRadius: "3px", backgroundColor: "var(--cor-pale-blue)", overflow: "hidden" }}>
                      <div style={{ width: `${Math.min(r.percentualAnual, 100)}%`, height: "100%", backgroundColor: "var(--cor-action-vibrant)" }} />
                    </div>
                  </td>
                  <td style={{ ...CELULA, fontSize: "12px" }}>
                    {r.pendentes === 0 && r.ajustesSolicitados === 0 ? (
                      <span style={{ color: "var(--cor-muted)" }}>Em dia</span>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        {r.pendentes > 0 && <span style={{ color: "#92400e" }}>{r.pendentes} aguardando</span>}
                        {r.ajustesSolicitados > 0 && <span style={{ color: "#991b1b" }}>{r.ajustesSolicitados} em ajuste</span>}
                      </div>
                    )}
                  </td>
                  <td style={{ ...CELULA, fontSize: "13px", color: "var(--cor-text-muted)" }}>
                    {r.ultimoMesDeclarado ? formatarMesReferencia(r.ultimoMesDeclarado) : "—"}
                  </td>
                  <td style={{ ...CELULA, textAlign: "right", whiteSpace: "nowrap" }}>
                    <Link
                      href={`/painel/aluno/${encodeURIComponent(r.alunoId)}?contexto=metas-faturamento`}
                      className="btn-secondary"
                      style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "var(--radius-xs)", marginRight: "6px" }}
                    >
                      Ficha
                    </Link>
                    <button type="button" className="btn-secondary" onClick={() => onAbrir(r.alunoId)} style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "var(--radius-xs)" }}>
                      Abrir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
