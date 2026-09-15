"use client";

import React, { useState } from "react";
import { PainelKpisTurma } from "@/components/equipe/PainelKpisTurma";
import { TabelaSemaforoTurma } from "@/components/equipe/TabelaSemaforoTurma";
import { useSistemaStore } from "@/lib/store/sistema-store";

export default function PainelTurmaPage() {
  const { estado, carregado } = useSistemaStore();
  const [turma] = useState("Águias ONE — Turma 2026.1");

  if (!carregado) return null;

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--espaco-lg)", flexWrap: "wrap", gap: "var(--espaco-md)" }}>
        <div>
          <h1 style={{ fontSize: "28px", marginBottom: "var(--espaco-xs)" }}>Painel da Turma & Semáforo</h1>
          <p style={{ color: "var(--cor-muted)" }}>
            Acompanhamento semanal para o encontro de quarta com Flávio Lopes: monitoramento de travas e resgate imediato de alunos em risco.
          </p>
        </div>

        <div style={{
          backgroundColor: "var(--cor-soft-stone)",
          padding: "6px 14px",
          borderRadius: "var(--radius-pill)",
          fontWeight: 600,
          fontSize: "13px",
        }}>
          {turma}
        </div>
      </div>

      {/* Indicadores Estratégicos da Turma (KPIs 360) */}
      <PainelKpisTurma
        alunos={estado.alunosSemaforo}
        entregas={estado.entregas}
        turmaNome={turma}
      />

      <TabelaSemaforoTurma alunos={estado.alunosSemaforo} />
    </div>
  );
}
