"use client";

import React, { useState } from "react";
import { useSistemaStore } from "@/lib/store/sistema-store";

/**
 * A busca de dados falhou (rede ou servidor). A tela segue utilizável com o que
 * já tinha, mas avisa que pode estar defasada e oferece nova tentativa
 * (Câmara UX — toda espera termina em sucesso, erro ou recuperação).
 */
export function AvisoSincronizacao() {
  const { estado, tentarSincronizarNovamente } = useSistemaStore();
  const [tentando, setTentando] = useState(false);

  if (!estado.sincronizacaoFalhou) return null;

  const tentar = async () => {
    setTentando(true);
    try {
      await tentarSincronizarNovamente();
    } finally {
      setTentando(false);
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        gap: "12px",
        padding: "10px 16px",
        backgroundColor: "#fef3c7",
        borderBottom: "1px solid #fcd34d",
        color: "#78350f",
        fontSize: "13px",
      }}
    >
      <span>
        Não foi possível atualizar os dados agora. O que está na tela pode estar desatualizado.
      </span>
      <button
        type="button"
        className="btn-secondary"
        onClick={tentar}
        disabled={tentando}
        aria-busy={tentando}
        style={{ fontSize: "12px", padding: "4px 10px" }}
      >
        {tentando ? "Atualizando…" : "Tentar novamente"}
      </button>
    </div>
  );
}
