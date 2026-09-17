"use client";

import React, { useState } from "react";
import { ListaLiberacaoModulos } from "@/components/equipe/ListaLiberacaoModulos";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { EstadoCarregando } from "@/components/ui/EstadoCarregando";

export default function PainelModulosPage() {
  const { estado, alternarModulo, carregado } = useSistemaStore();
  const [turmaSelecionada, setTurmaSelecionada] = useState("");

  if (!carregado) return <EstadoCarregando texto="a liberação de módulos" variante="tabela" />;

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
          aria-label="Turma"
          value={turmaSelecionada || estado.turmas[0]?.id || ""}
          onChange={(e) => setTurmaSelecionada(e.target.value)}
          style={{
            padding: "8px 14px",
            borderRadius: "var(--radius-pill)",
            border: "1px solid var(--cor-border-light)",
            backgroundColor: "var(--cor-canvas)",
            fontWeight: 500,
          }}
        >
          {estado.turmas.length === 0 && <option value="">Nenhuma turma cadastrada</option>}
          {estado.turmas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome}
            </option>
          ))}
        </select>
      </div>

      <ListaLiberacaoModulos
        modulos={estado.modulos}
        onAlternarLiberacao={(moduloId, novoStatus) => alternarModulo(moduloId, novoStatus)}
      />
    </div>
  );
}
