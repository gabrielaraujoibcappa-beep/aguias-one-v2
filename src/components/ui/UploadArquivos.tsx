"use client";

import React, { useState, useRef } from "react";
import { IconFolder, IconAlertCircle, IconCheckCircle } from "./Icons";

export type StatusArquivo = "pronto" | "enviando" | "concluido" | "erro";

export interface ArquivoUploadItem {
  id: string;
  file?: File;
  nome: string;
  tamanhoBytes: number;
  tipoMime?: string;
  progresso?: number; // 0 a 100
  status: StatusArquivo;
  mensagemErro?: string;
}

export interface UploadArquivosProps {
  rotulo: string;
  descricao?: string;
  arquivos: ArquivoUploadItem[];
  onChange: (arquivos: ArquivoUploadItem[]) => void;
  formatosPermitidos?: string[]; // ex: [".png", ".jpg", ".jpeg", ".pdf", ".zip"]
  tamanhoMaximoBytes?: number;  // padrão: 25 * 1024 * 1024 (25 MB)
  maximoArquivos?: number;       // padrão: 5
  obrigatorio?: boolean;
  onTentarNovamente?: (item: ArquivoUploadItem) => void;
}

export function formatarBytes(bytes: number): string {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const tamanhos = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${tamanhos[i]}`;
}

export function UploadArquivos({
  rotulo,
  descricao,
  arquivos,
  onChange,
  formatosPermitidos = [".png", ".jpg", ".jpeg", ".pdf", ".zip"],
  tamanhoMaximoBytes = 25 * 1024 * 1024, // 25 MB
  maximoArquivos = 5,
  obrigatorio = false,
  onTentarNovamente,
}: UploadArquivosProps) {
  const [arrastando, setArrastando] = useState(false);
  const [mensagemStatus, setMensagemStatus] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  const formatosTexto = formatosPermitidos
    .map((f) => f.replace(".", "").toUpperCase())
    .join(", ");
  const tamanhoMaximoTexto = formatarBytes(tamanhoMaximoBytes);

  const processarArquivos = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const novosItens: ArquivoUploadItem[] = [...arquivos];
    let adicionados = 0;
    let rejeitados = 0;

    for (let i = 0; i < files.length; i++) {
      if (novosItens.length >= maximoArquivos) {
        setMensagemStatus(`Limite máximo de ${maximoArquivos} arquivos atingido.`);
        break;
      }

      const file = files[i];
      const extensao = `.${file.name.split(".").pop()?.toLowerCase() || ""}`;
      const formatoValido = formatosPermitidos.some(
        (ext) => ext.toLowerCase() === extensao
      );

      let status: StatusArquivo = "pronto";
      let mensagemErro: string | undefined = undefined;

      if (!formatoValido) {
        status = "erro";
        mensagemErro = `Formato não suportado (${extensao}). Envie ${formatosTexto}.`;
        rejeitados++;
      } else if (file.size > tamanhoMaximoBytes) {
        status = "erro";
        mensagemErro = `Arquivo excede o limite máximo de ${tamanhoMaximoTexto}.`;
        rejeitados++;
      } else {
        adicionados++;
      }

      novosItens.push({
        id: `${file.name}-${file.size}-${Date.now()}-${i}`,
        file,
        nome: file.name,
        tamanhoBytes: file.size,
        tipoMime: file.type,
        progresso: status === "pronto" ? 100 : 0,
        status,
        mensagemErro,
      });
    }

    onChange(novosItens);

    if (adicionados > 0 && rejeitados === 0) {
      setMensagemStatus(`${adicionados} arquivo(s) adicionado(s) com sucesso.`);
    } else if (rejeitados > 0) {
      setMensagemStatus(`${rejeitados} arquivo(s) rejeitado(s) por violar requisitos.`);
    }

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemover = (id: string, nomeArquivo: string) => {
    const filtrados = arquivos.filter((a) => a.id !== id);
    onChange(filtrados);
    setMensagemStatus(`Arquivo ${nomeArquivo} removido.`);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(true);
  };

  const handleDragLeave = () => {
    setArrastando(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setArrastando(false);
    processarArquivos(e.dataTransfer.files);
  };

  return (
    <div style={{ marginBottom: "var(--espaco-lg)" }}>
      {/* Rótulo Acessível com Indicação de Obrigatório */}
      <label
        id="upload-label"
        style={{
          display: "block",
          fontSize: "14px",
          fontWeight: 600,
          color: "var(--cor-ink)",
          marginBottom: "4px",
        }}
      >
        {rotulo} {obrigatorio && <span style={{ color: "var(--cor-error)" }}>*</span>}
      </label>

      {/* Descrição dos Requisitos Visíveis Antes da Seleção */}
      <p
        id="upload-desc"
        style={{
          fontSize: "12px",
          color: "var(--cor-muted)",
          marginBottom: "var(--espaco-sm)",
          lineHeight: 1.4,
        }}
      >
        {descricao ? `${descricao} · ` : ""}
        Formatos: <strong>{formatosTexto}</strong> · Limite:{" "}
        <strong>{tamanhoMaximoTexto}</strong> por arquivo (máx. {maximoArquivos} arquivos).
      </p>

      {/* Área de Seleção Nativa + Drag and Drop Opcional */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: arrastando
            ? "2px dashed var(--cor-deep-green)"
            : "1px dashed var(--cor-hairline)",
          backgroundColor: arrastando ? "rgba(0, 60, 51, 0.04)" : "#fafafb",
          borderRadius: "var(--radius-sm)",
          padding: "var(--espaco-lg)",
          textAlign: "center",
          transition: "all 0.2s ease",
        }}
      >
        <input
          ref={inputRef}
          type="file"
          multiple={maximoArquivos > 1}
          accept={formatosPermitidos.join(",")}
          onChange={(e) => processarArquivos(e.target.files)}
          style={{ display: "none" }}
          aria-labelledby="upload-label"
          aria-describedby="upload-desc"
        />

        <div style={{ display: "flex", justifyContent: "center", marginBottom: "8px", color: "var(--cor-slate)" }}>
          <IconFolder size={28} />
        </div>

        {/* Botão Acessível de Seleção (Caminho Primário) */}
        <div style={{ marginBottom: "6px" }}>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="btn-primary"
            style={{
              fontSize: "13px",
              padding: "7px 16px",
              borderRadius: "var(--radius-xs)",
              cursor: "pointer",
            }}
          >
            Selecionar arquivos
          </button>
        </div>

        <div style={{ fontSize: "12px", color: "var(--cor-muted)" }}>
          ou arraste e solte os arquivos aqui
        </div>
      </div>

      {/* Região de Status Acessível (W3C WCAG 4.1.3 / ARIA22) */}
      <div role="status" aria-live="polite" className="sr-only">
        {mensagemStatus}
      </div>

      {/* Lista de Arquivos Selecionados com Estado Individual */}
      {arquivos.length > 0 && (
        <ul
          role="list"
          aria-label="Arquivos anexados"
          style={{
            listStyle: "none",
            padding: 0,
            marginTop: "var(--espaco-sm)",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          }}
        >
          {arquivos.map((arq) => {
            const rotuloRemocao = `Remover arquivo ${arq.nome}`;
            const isErro = arq.status === "erro";

            return (
              <li
                key={arq.id}
                role="listitem"
                style={{
                  backgroundColor: isErro ? "#fef2f2" : "#ffffff",
                  border: isErro ? "1px solid #fecaca" : "1px solid var(--cor-border-light)",
                  borderRadius: "var(--radius-xs)",
                  padding: "10px 12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  boxShadow: "0 1px 2px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", minWidth: 0 }}>
                    {isErro ? (
                      <IconAlertCircle size={16} style={{ color: "#b91c1c", flexShrink: 0 }} />
                    ) : (
                      <IconCheckCircle size={16} style={{ color: "#047857", flexShrink: 0 }} />
                    )}
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: isErro ? "#991b1b" : "var(--cor-ink)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                      title={arq.nome}
                    >
                      {arq.nome}
                    </span>
                    <span
                      style={{
                        fontSize: "11px",
                        color: "var(--cor-muted)",
                        fontFamily: "var(--font-family-mono)",
                        flexShrink: 0,
                      }}
                    >
                      ({formatarBytes(arq.tamanhoBytes)})
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                    {/* Botão Tentar Novamente para Arquivos com Erro */}
                    {isErro && onTentarNovamente && (
                      <button
                        type="button"
                        onClick={() => onTentarNovamente(arq)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "var(--cor-deep-green)",
                          fontSize: "12px",
                          fontWeight: 600,
                          cursor: "pointer",
                          textDecoration: "underline",
                        }}
                      >
                        Tentar novamente
                      </button>
                    )}

                    {/* Botão Acessível de Remoção Individual */}
                    <button
                      type="button"
                      onClick={() => handleRemover(arq.id, arq.nome)}
                      aria-label={rotuloRemocao}
                      style={{
                        background: "transparent",
                        border: "none",
                        color: "var(--cor-muted)",
                        cursor: "pointer",
                        fontSize: "16px",
                        lineHeight: 1,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        transition: "all 0.15s ease",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "#dc2626";
                        e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.1)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--cor-muted)";
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Mensagem de Erro Específica com Orientação */}
                {isErro && arq.mensagemErro && (
                  <div
                    role="alert"
                    style={{
                      fontSize: "11px",
                      color: "#b91c1c",
                      fontWeight: 500,
                    }}
                  >
                    {arq.mensagemErro}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
