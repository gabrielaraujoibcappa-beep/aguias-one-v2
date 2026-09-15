"use client";

import React, { useRef } from "react";
import { EvidenciaArquivoItem } from "@/lib/api/checkin";
import { IconFolder } from "../ui/Icons";

interface InputMultiploArquivosProps {
  rotulo: string;
  arquivos: EvidenciaArquivoItem[];
  onAdicionar: (novoArquivo: EvidenciaArquivoItem) => void;
  onRemover: (index: number) => void;
  obrigatorio?: boolean;
}

export function InputMultiploArquivos({
  rotulo,
  arquivos,
  onAdicionar,
  onRemover,
  obrigatorio = true,
}: InputMultiploArquivosProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      onAdicionar({
        nome: file.name,
        path: `/mock/uploads/${file.name}`,
        tipo: file.type.includes("pdf") ? "pdf" : "print",
        tamanhoBytes: file.size,
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div style={{ marginBottom: "var(--espaco-lg)" }}>
      <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}>
        {rotulo} {obrigatorio && <span style={{ color: "var(--cor-error)" }}>*</span>}
      </label>

      {/* Dropzone / Botão de Seleção */}
      <div
        onClick={() => fileInputRef.current?.click()}
        style={{
          border: "1px dashed var(--cor-hairline)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--espaco-lg)",
          textAlign: "center",
          backgroundColor: "#fafafb",
          cursor: "pointer",
          transition: "border-color 0.2s ease",
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/png,image/jpeg,application/pdf"
          onChange={handleFileChange}
          style={{ display: "none" }}
        />
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "6px", color: "var(--cor-slate)" }}>
          <IconFolder size={24} />
        </div>
        <div style={{ fontSize: "13px", fontWeight: 500 }}>
          Clique para selecionar arquivos ou prints
        </div>
        <div style={{ fontSize: "11px", color: "var(--cor-muted)", marginTop: "2px", fontFamily: "var(--font-family-mono)" }}>
          Formatos: PNG, JPG ou PDF
        </div>
      </div>

      {/* Lista de Arquivos Anexados */}
      {arquivos.length > 0 && (
        <div style={{ marginTop: "var(--espaco-sm)", display: "flex", flexDirection: "column", gap: "6px" }}>
          {arquivos.map((arq, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "var(--cor-canvas)",
                border: "1px solid var(--cor-border-light)",
                padding: "8px 12px",
                borderRadius: "var(--radius-xs)",
                fontSize: "13px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <IconFolder size={14} style={{ color: "var(--cor-slate)" }} />
                <span style={{ fontWeight: 500 }}>{arq.nome}</span>
              </div>
              <button
                type="button"
                onClick={() => onRemover(idx)}
                style={{ color: "var(--cor-error)", fontSize: "12px", fontWeight: 500 }}
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
