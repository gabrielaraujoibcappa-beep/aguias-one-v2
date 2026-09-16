"use client";

import React, { useState } from "react";

interface AcoesAuditoriaFaturamentoProps {
  declaracaoId: string;
  onAprovar: (id: string) => void;
  onSolicitarAjuste: (id: string, parecer: string) => void;
  compacto?: boolean;
}

/** Botões Aprovar / Solicitar ajuste com o campo de parecer aberto sob demanda. */
export function AcoesAuditoriaFaturamento({ declaracaoId, onAprovar, onSolicitarAjuste, compacto = false }: AcoesAuditoriaFaturamentoProps) {
  const [pedindoAjuste, setPedindoAjuste] = useState(false);
  const [parecer, setParecer] = useState("");
  const [erro, setErro] = useState("");

  const confirmarAjuste = () => {
    if (!parecer.trim()) {
      setErro("Descreva o que o mentorado precisa corrigir.");
      return;
    }
    onSolicitarAjuste(declaracaoId, parecer.trim());
    setParecer("");
    setErro("");
    setPedindoAjuste(false);
  };

  const estiloBotao: React.CSSProperties = compacto
    ? { fontSize: "12px", padding: "5px 12px", borderRadius: "var(--radius-xs)" }
    : { fontSize: "13px", padding: "8px 14px", borderRadius: "var(--radius-xs)" };

  if (!pedindoAjuste) {
    return (
      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end", flexWrap: "wrap" }}>
        <button
          type="button"
          className="btn-secondary"
          style={{ ...estiloBotao, color: "var(--cor-error)", borderColor: "var(--cor-error)" }}
          onClick={() => setPedindoAjuste(true)}
        >
          Solicitar ajuste
        </button>
        <button type="button" className="btn-primary" style={estiloBotao} onClick={() => onAprovar(declaracaoId)}>
          Aprovar
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "260px" }}>
      <label htmlFor={`parecer-${declaracaoId}`} style={{ fontSize: "12px", fontWeight: 500 }}>
        Parecer para o mentorado
      </label>
      <textarea
        id={`parecer-${declaracaoId}`}
        rows={2}
        value={parecer}
        onChange={(e) => setParecer(e.target.value)}
        placeholder="Ex: comprovante ilegível, valor divergente do extrato..."
        style={{ width: "100%", padding: "8px", borderRadius: "var(--radius-xs)", border: "1px solid var(--cor-border-light)", fontSize: "13px" }}
      />
      {erro && <div style={{ color: "var(--cor-error)", fontSize: "12px" }}>{erro}</div>}
      <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
        <button type="button" className="btn-secondary" style={estiloBotao} onClick={() => { setPedindoAjuste(false); setErro(""); }}>
          Cancelar
        </button>
        <button type="button" className="btn-primary" style={{ ...estiloBotao, background: "var(--cor-error)" }} onClick={confirmarAjuste}>
          Enviar ajuste
        </button>
      </div>
    </div>
  );
}
