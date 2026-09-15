"use client";

import React, { useState } from "react";
import { ListaLiberacaoModulos } from "@/components/equipe/ListaLiberacaoModulos";
import { useSistemaStore } from "@/lib/store/sistema-store";

export default function PainelModulosPage() {
  const { estado, alternarModulo, carregado } = useSistemaStore();
  const [turmaSelecionada, setTurmaSelecionada] = useState("Águias ONE — Turma 2026.1");

  if (!carregado) return null;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--espaco-lg)", flexWrap: "wrap", gap: "var(--espaco-md)" }}>
        <div>
          <h1 style={{ fontSize: "28px", marginBottom: "var(--espaco-xs)" }}>Liberação de Módulos da Turma</h1>
          <p style={{ color: "var(--cor-muted)" }}>
            Controle ativo do Anjo e Concierge: os alunos só visualizam e preenchem os módulos liberados aqui.
          </p>
        </div>

        <select
          value={turmaSelecionada}
          onChange={(e) => setTurmaSelecionada(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: "var(--radius-pill)",
            border: "1px solid var(--cor-border-light)",
            backgroundColor: "var(--cor-canvas)",
            fontWeight: 500,
          }}
        >
          <option value="Águias ONE — Turma 2026.1">Águias ONE — Turma 2026.1</option>
          <option value="Águias ONE — Turma 2026.2">Águias ONE — Turma 2026.2</option>
        </select>
      </div>

      <ListaLiberacaoModulos
        modulos={estado.modulos}
        onAlternarLiberacao={(moduloId, novoStatus) => alternarModulo(moduloId, novoStatus)}
      />
    </div>
  );
}
