"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { GridCanais } from "@/components/canais/GridCanais";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { EstadoCarregando } from "@/components/ui/EstadoCarregando";

export default function CanaisAlunoPage() {
  const router = useRouter();
  const { estado, carregado } = useSistemaStore();

  if (!carregado) return <EstadoCarregando texto="seus canais de captação" variante="tabela" />;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
      <button
        onClick={() => router.push("/dashboard")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "6px",
          color: "var(--cor-muted)",
          fontSize: "14px",
          marginBottom: "var(--espaco-md)",
          fontWeight: 500,
        }}
      >
        ← Voltar ao Dashboard
      </button>

      <div style={{ marginBottom: "var(--espaco-lg)" }}>
        <h1 style={{ fontSize: "28px", marginBottom: "var(--espaco-xs)" }}>Canais de Atração do Escritório</h1>
        <p style={{ color: "var(--cor-muted)" }}>
          Acompanhe a ativação dos seus canais de captação na ordem rigorosa definida no método ÁGUIAS ONE.
        </p>
      </div>

      <GridCanais canaisIniciais={estado.canais} />
    </div>
  );
}
