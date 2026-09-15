"use client";

import React from "react";

interface InputLinkEvidenciaProps {
  rotulo: string;
  url: string;
  onChange: (novaUrl: string) => void;
  obrigatorio?: boolean;
}

export function InputLinkEvidencia({
  rotulo,
  url,
  onChange,
  obrigatorio = true,
}: InputLinkEvidenciaProps) {
  return (
    <div style={{ marginBottom: "var(--espaco-md)" }}>
      <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}>
        {rotulo} {obrigatorio && <span style={{ color: "var(--cor-error)" }}>*</span>}
      </label>
      <input
        type="url"
        value={url}
        onChange={(e) => onChange(e.target.value)}
        placeholder="https://seu-site-ou-link.com.br"
        style={{
          width: "100%",
          padding: "10px 14px",
          borderRadius: "var(--radius-xs)",
          border: "1px solid var(--cor-border-light)",
          fontSize: "14px",
        }}
      />
      <span style={{ fontSize: "12px", color: "var(--cor-muted)", display: "block", marginTop: "4px" }}>
        Cole a URL completa (iniciando com https://)
      </span>
    </div>
  );
}
