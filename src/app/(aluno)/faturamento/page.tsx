"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { FormularioFaturamento } from "@/components/faturamento/FormularioFaturamento";
import { TabelaHistoricoFaturamento } from "@/components/faturamento/TabelaHistoricoFaturamento";
import { MetaFaturamentoAnual } from "@/components/faturamento/MetaFaturamentoAnual";
import { useSistemaStore } from "@/lib/store/sistema-store";

export default function FaturamentoAlunoPage() {
  const router = useRouter();
  const { estado, adicionarFaturamento, definirMetaFaturamentoAnual, carregado } = useSistemaStore();

  if (!carregado) return null;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
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
        <h1 style={{ fontSize: "28px", marginBottom: "var(--espaco-xs)" }}>Faturamento & Comprovantes</h1>
        <p style={{ color: "var(--cor-muted)" }}>
          Registro direto de faturamento bruto do escritório com upload de comprovantes ou pacotes compactados .zip.
        </p>
      </div>

      <MetaFaturamentoAnual
        faturamentos={estado.faturamentos}
        metaAnual={estado.metaFaturamentoAnual}
        onDefinirMeta={definirMetaFaturamentoAnual}
      />

      <FormularioFaturamento onSalvar={adicionarFaturamento} />
      <TabelaHistoricoFaturamento historico={estado.faturamentos} />
    </div>
  );
}
