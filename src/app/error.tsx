"use client";

import React, { useEffect } from "react";

/**
 * Falha inesperada: em vez de tela branca, explica o que houve, preserva a
 * navegação e oferece recuperação (Câmara UX — estados de carregamento).
 */
export default function ErroGlobal({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error("[Erro na tela]:", error.message, error.digest ?? "");
  }, [error]);

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto", padding: "var(--espaco-xxl) var(--espaco-lg)" }}>
      <div className="card" role="alert" style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-sm)" }}>
        <h1 style={{ fontSize: "22px", margin: 0 }}>Não foi possível carregar esta tela</h1>
        <p style={{ color: "var(--cor-muted)", fontSize: "14px", margin: 0 }}>
          Seus dados continuam salvos. Tente de novo; se o problema seguir, avise a coordenação
          informando o que você estava fazendo.
        </p>
        {error.digest && (
          <p style={{ color: "var(--cor-text-muted)", fontSize: "12px", fontFamily: "var(--font-family-mono)", margin: 0 }}>
            Código do erro: {error.digest}
          </p>
        )}
        <div style={{ display: "flex", gap: "var(--espaco-sm)", marginTop: "var(--espaco-sm)" }}>
          <button type="button" className="btn-primary" onClick={reset}>
            Tentar carregar de novo
          </button>
          <a href="/" className="btn-secondary">
            Voltar ao início
          </a>
        </div>
      </div>
    </div>
  );
}
