"use client";

import React from "react";
import Link from "next/link";
import { formatarMoedaBRL } from "@/lib/api/faturamento";
import { AlunoSemaforoStatus } from "@/lib/api/turma-semaforo";
import { EntregaPendente } from "@/lib/api/auditoria";
import { StatusDot } from "../ui/StatusDot";
import { IconUsers, IconAlertCircle, IconAudit, IconCurrency } from "../ui/Icons";

interface PainelKpisTurmaProps {
  alunos: AlunoSemaforoStatus[];
  entregas: EntregaPendente[];
  turmaNome?: string;
}

export function PainelKpisTurma({ alunos, entregas, turmaNome = "Turma 2026.1" }: PainelKpisTurmaProps) {
  const totalAlunos = alunos.length;
  const alunosVermelho = alunos.filter((a) => a.semaforoAtual === "vermelho");
  const alunosAmarelo = alunos.filter((a) => a.semaforoAtual === "amarelo");
  const alunosVerde = alunos.filter((a) => a.semaforoAtual === "verde");

  const entregasPendentes = entregas.filter((e) => e.status === "aguardando_avaliacao").length;

  const faturamentoTotalTurma = alunos.reduce((acc, a) => acc + (a.faturamentoAtual || 0), 0);
  const mediaFaturamento = totalAlunos > 0 ? Math.round(faturamentoTotalTurma / totalAlunos) : 0;

  return (
    <div style={{ marginBottom: "var(--espaco-xl)" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "var(--espaco-sm)",
      }}>
        <h3 style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          color: "var(--cor-slate)",
          fontFamily: "var(--font-family-mono)",
        }}>
          Indicadores da Turma
        </h3>
        <span style={{ fontSize: "11px", color: "var(--cor-muted)", fontFamily: "var(--font-family-mono)" }}>
          {turmaNome}
        </span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
        gap: "var(--espaco-md)",
      }}>
        {/* KPI 1: Alunos em Risco */}
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid var(--cor-border-light)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--espaco-md)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: alunosVermelho.length > 0 ? "#b91c1c" : "var(--cor-slate)",
            marginBottom: "6px",
          }}>
            <span style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Alunos em Risco
            </span>
            <IconAlertCircle size={14} />
          </div>
          <div style={{
            fontSize: "24px",
            fontWeight: 600,
            color: alunosVermelho.length > 0 ? "#b91c1c" : "var(--cor-ink)",
            letterSpacing: "-0.5px",
            fontFamily: "var(--font-family-mono)",
          }}>
            {alunosVermelho.length}{" "}
            <span style={{ fontSize: "13px", fontWeight: 400, color: "var(--cor-muted)" }}>
              perito(s)
            </span>
          </div>
          <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--cor-muted)" }}>
            Critério: 2+ semanas sem check-in
          </div>
        </div>

        {/* KPI 2: Distribuição do Semáforo */}
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid var(--cor-border-light)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--espaco-md)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "var(--cor-slate)",
            marginBottom: "6px",
          }}>
            <span style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Distribuição Semanal
            </span>
            <IconUsers size={14} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "16px", marginTop: "4px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <StatusDot status="verde" size={8} />
              <span style={{ fontFamily: "var(--font-family-mono)", fontSize: "18px", fontWeight: 600 }}>{alunosVerde.length}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <StatusDot status="amarelo" size={8} />
              <span style={{ fontFamily: "var(--font-family-mono)", fontSize: "18px", fontWeight: 600 }}>{alunosAmarelo.length}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <StatusDot status="vermelho" size={8} />
              <span style={{ fontFamily: "var(--font-family-mono)", fontSize: "18px", fontWeight: 600, color: "#b91c1c" }}>{alunosVermelho.length}</span>
            </div>
          </div>
          <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--cor-muted)" }}>
            Total de {totalAlunos} peritos matriculados
          </div>
        </div>

        {/* KPI 3: Auditoria Pendente */}
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid var(--cor-border-light)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--espaco-md)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "var(--cor-slate)",
            marginBottom: "6px",
          }}>
            <span style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Fila de Auditoria
            </span>
            <IconAudit size={14} />
          </div>
          <div style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "var(--cor-ink)",
            letterSpacing: "-0.5px",
            fontFamily: "var(--font-family-mono)",
          }}>
            {entregasPendentes}{" "}
            <span style={{ fontSize: "13px", fontWeight: 400, color: "var(--cor-muted)" }}>
              pendente(s)
            </span>
          </div>
          <div style={{ marginTop: "12px" }}>
            <Link
              href="/painel/auditoria"
              style={{
                fontSize: "12px",
                color: "var(--cor-primary)",
                fontWeight: 500,
                textDecoration: "underline",
              }}
            >
              Abrir esteira de validação →
            </Link>
          </div>
        </div>

        {/* KPI 4: Faturamento Total */}
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid var(--cor-border-light)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--espaco-md)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "var(--cor-slate)",
            marginBottom: "6px",
          }}>
            <span style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Receita da Turma
            </span>
            <IconCurrency size={14} />
          </div>
          <div style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "var(--cor-ink)",
            letterSpacing: "-0.5px",
            fontFamily: "var(--font-family-mono)",
          }}>
            {formatarMoedaBRL(faturamentoTotalTurma)}
          </div>
          <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--cor-muted)" }}>
            Média: <strong style={{ color: "var(--cor-ink)", fontFamily: "var(--font-family-mono)" }}>{formatarMoedaBRL(mediaFaturamento)}</strong> / perito
          </div>
        </div>
      </div>
    </div>
  );
}
