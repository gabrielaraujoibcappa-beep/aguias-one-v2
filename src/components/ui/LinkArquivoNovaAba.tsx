"use client";

import React from "react";
import { BucketArquivo, urlArquivo } from "@/lib/arquivos/regras";

interface LinkArquivoNovaAbaProps {
  bucket: BucketArquivo;
  path: string;
  nome: string;
  style?: React.CSSProperties;
}

/** Abre o arquivo privado direto em outra aba (a rota confere a permissão). */
export function LinkArquivoNovaAba({ bucket, path, nome, style }: LinkArquivoNovaAbaProps) {
  return (
    <a
      href={urlArquivo(bucket, path)}
      target="_blank"
      rel="noopener noreferrer"
      className="btn-secondary"
      aria-label={`Abrir ${nome} em nova aba`}
      title="Abrir em nova aba"
      style={{ fontSize: "12px", padding: "4px 10px", textDecoration: "none", whiteSpace: "nowrap", ...style }}
    >
      Nova aba ↗
    </a>
  );
}
