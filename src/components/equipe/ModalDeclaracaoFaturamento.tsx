"use client";

import React, { useState } from "react";
import {
  DeclaracaoFaturamento,
  ROTULOS_STATUS_AUDITORIA,
  StatusAuditoriaFaturamento,
  formatarMoedaReal,
} from "@/lib/api/faturamento";

interface ModalDeclaracaoFaturamentoProps {
  aberto: boolean;
  declaracaoInicial?: DeclaracaoFaturamento | null;
  alunos: { id: string; nome: string }[];
  /** Quando informado, o aluno vem travado (edição a partir do detalhe do mentorado). */
  alunoFixoId?: string;
  onSalvar: (declaracao: DeclaracaoFaturamento) => void;
  onFechar: () => void;
}

function digitosParaValor(texto: string): number {
  const digitos = texto.replace(/\D/g, "");
  return digitos ? Number(digitos) / 100 : 0;
}

const CAMPO: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "var(--radius-xs)",
  border: "1px solid var(--cor-border-light)",
  backgroundColor: "var(--cor-canvas)",
};

const ROTULO: React.CSSProperties = { display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" };

export function ModalDeclaracaoFaturamento({ aberto, declaracaoInicial, alunos, alunoFixoId, onSalvar, onFechar }: ModalDeclaracaoFaturamentoProps) {
  const [alunoId, setAlunoId] = useState(declaracaoInicial?.alunoId || alunoFixoId || alunos[0]?.id || "");
  const [mes, setMes] = useState((declaracaoInicial?.mesReferencia || "2026-09-01").slice(0, 7));
  const [valorTexto, setValorTexto] = useState(declaracaoInicial ? formatarMoedaReal(declaracaoInicial.valorBruto) : "");
  const [status, setStatus] = useState<StatusAuditoriaFaturamento>(declaracaoInicial?.statusAuditoria || "pendente");
  const [parecer, setParecer] = useState(declaracaoInicial?.parecerAuditoria || "");
  const [erros, setErros] = useState<string[]>([]);

  if (!aberto) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const valor = digitosParaValor(valorTexto);
    const novosErros: string[] = [];
    if (!alunoId) novosErros.push("aluno");
    if (!/^\d{4}-\d{2}$/.test(mes)) novosErros.push("mes");
    if (valor <= 0) novosErros.push("valor");
    if (status === "ajuste_solicitado" && !parecer.trim()) novosErros.push("parecer");
    if (novosErros.length > 0) {
      setErros(novosErros);
      return;
    }

    onSalvar({
      ...(declaracaoInicial ?? { matriculaId: `mat-${alunoId}`, comprovantes: [] }),
      alunoId,
      mesReferencia: `${mes}-01`,
      valorBruto: valor,
      statusAuditoria: status,
      parecerAuditoria: status === "ajuste_solicitado" ? parecer.trim() : undefined,
    });
    onFechar();
  };

  const bordaErro = (campo: string): React.CSSProperties =>
    erros.includes(campo) ? { border: "1px solid var(--cor-error)" } : {};

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-declaracao-titulo"
      style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0, 0, 0, 0.45)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "16px" }}
    >
      <div className="card" style={{ width: "100%", maxWidth: "520px", backgroundColor: "var(--cor-canvas)", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--espaco-lg)" }}>
          <h3 id="modal-declaracao-titulo">{declaracaoInicial ? "Editar declaração" : "Nova declaração de faturamento"}</h3>
          <button type="button" onClick={onFechar} aria-label="Fechar" style={{ fontSize: "18px", color: "var(--cor-muted)", background: "transparent", border: "none", cursor: "pointer" }}>
            ✕
          </button>
        </div>

        {erros.length > 0 && (
          <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "var(--cor-error)", padding: "var(--espaco-sm) var(--espaco-md)", borderRadius: "var(--radius-sm)", marginBottom: "var(--espaco-md)", fontSize: "13px" }}>
            Confira os campos destacados.
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-md)" }}>
          <div>
            <label htmlFor="decl-aluno" style={ROTULO}>Mentorado *</label>
            <select id="decl-aluno" value={alunoId} onChange={(e) => setAlunoId(e.target.value)} disabled={Boolean(alunoFixoId)} style={{ ...CAMPO, ...bordaErro("aluno") }}>
              {alunos.map((a) => (
                <option key={a.id} value={a.id}>{a.nome}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--espaco-md)" }}>
            <div>
              <label htmlFor="decl-mes" style={ROTULO}>Mês de referência *</label>
              <input id="decl-mes" type="month" value={mes} onChange={(e) => setMes(e.target.value)} style={{ ...CAMPO, ...bordaErro("mes") }} />
            </div>
            <div>
              <label htmlFor="decl-valor" style={ROTULO}>Valor bruto (R$) *</label>
              <input
                id="decl-valor"
                type="text"
                inputMode="numeric"
                value={valorTexto}
                onChange={(e) => setValorTexto(formatarMoedaReal(digitosParaValor(e.target.value)))}
                placeholder="R$ 0,00"
                style={{ ...CAMPO, fontWeight: 600, ...bordaErro("valor") }}
              />
            </div>
          </div>

          <div>
            <label htmlFor="decl-status" style={ROTULO}>Situação da auditoria</label>
            <select id="decl-status" value={status} onChange={(e) => setStatus(e.target.value as StatusAuditoriaFaturamento)} style={CAMPO}>
              {(Object.keys(ROTULOS_STATUS_AUDITORIA) as StatusAuditoriaFaturamento[]).map((s) => (
                <option key={s} value={s}>{ROTULOS_STATUS_AUDITORIA[s]}</option>
              ))}
            </select>
          </div>

          {status === "ajuste_solicitado" && (
            <div>
              <label htmlFor="decl-parecer" style={ROTULO}>Parecer para o mentorado *</label>
              <textarea id="decl-parecer" rows={3} value={parecer} onChange={(e) => setParecer(e.target.value)} style={{ ...CAMPO, ...bordaErro("parecer") }} />
            </div>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--espaco-sm)", marginTop: "var(--espaco-sm)" }}>
            <button type="button" className="btn-secondary" onClick={onFechar}>Cancelar</button>
            <button type="submit" className="btn-primary">Salvar declaração</button>
          </div>
        </form>
      </div>
    </div>
  );
}
