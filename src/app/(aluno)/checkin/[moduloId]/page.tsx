"use client";

import React, { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { FormularioCheckinModular } from "@/components/checkin/FormularioCheckinModular";
import { SubmissaoCheckin } from "@/lib/api/checkin";
import { MODULOS_PADRAO_AGUIAS_ONE } from "@/lib/api/modulos-liberacao";

export default function CheckinModuloPage() {
  const params = useParams();
  const router = useRouter();
  const moduloId = Array.isArray(params?.moduloId) ? params.moduloId[0] : params?.moduloId || "mod-1";

  const modulo = MODULOS_PADRAO_AGUIAS_ONE.find((m) => m.id === moduloId) || MODULOS_PADRAO_AGUIAS_ONE[0];

  const handleEnviar = (submissao: SubmissaoCheckin) => {
    // Gravação simulada em estado / API
    console.log("Submissão gravada:", submissao);
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
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

      <FormularioCheckinModular
        moduloId={modulo.id}
        moduloTitulo={modulo.titulo}
        itensRoteiro={modulo.itensRoteiro}
        onEnviar={handleEnviar}
      />
    </div>
  );
}
