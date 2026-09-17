"use client";

import React, { useEffect, useId, useRef, useState } from "react";
import { IconDownload, IconX } from "@/components/ui/Icons";
import { BucketArquivo, urlArquivo } from "@/lib/arquivos/regras";

export interface ArquivoVisualizavel {
  /** Nome exibido no título (ex.: "print-pasta.png") */
  nome: string;
  /** Caminho do arquivo no Storage */
  path: string;
  /** Rótulo dado pelo mentorado, quando houver */
  rotulo?: string;
}

export interface ModalArquivoProps {
  arquivo: ArquivoVisualizavel | null;
  bucket: BucketArquivo;
  onFechar: () => void;
}

type Formato = "imagem" | "pdf" | "outro";

/** Formato pela extensão do nome ou do caminho: define como o arquivo é exibido. */
export function formatoDoArquivo(nome: string): Formato {
  const limpo = nome.toLowerCase().split("?")[0];
  if (/\.(png|jpe?g|webp|gif)$/.test(limpo)) return "imagem";
  if (limpo.endsWith(".pdf")) return "pdf";
  return "outro";
}

/**
 * Abre a evidência sem sair da fila de auditoria. Imagem e PDF aparecem no próprio
 * modal; outros formatos (ex.: .zip) oferecem download.
 */
export function ModalArquivo({ arquivo, bucket, onFechar }: ModalArquivoProps) {
  const idTitulo = `modal-arquivo-${useId()}`;
  const dialogRef = useRef<HTMLDivElement>(null);
  const botaoFecharRef = useRef<HTMLButtonElement>(null);
  const ultimoFocoRef = useRef<HTMLElement | null>(null);
  const [erroCarregamento, setErroCarregamento] = useState(false);

  useEffect(() => {
    setErroCarregamento(false);
  }, [arquivo?.path]);

  useEffect(() => {
    if (!arquivo) {
      ultimoFocoRef.current?.focus?.();
      return;
    }
    ultimoFocoRef.current = typeof document !== "undefined" ? (document.activeElement as HTMLElement) : null;
    const timer = setTimeout(() => botaoFecharRef.current?.focus(), 30);

    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onFechar();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const focaveis = dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], iframe, [tabindex]:not([tabindex="-1"])'
      );
      if (focaveis.length === 0) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (e.shiftKey && document.activeElement === primeiro) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primeiro.focus();
      }
    };

    window.addEventListener("keydown", aoTeclar);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [arquivo, onFechar]);

  if (!arquivo) return null;

  const url = urlArquivo(bucket, arquivo.path);
  const formato = formatoDoArquivo(arquivo.nome || arquivo.path);

  return (
    <div
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onFechar();
      }}
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "rgba(0, 0, 0, 0.6)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "16px",
      }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        className="card"
        style={{
          width: "100%",
          maxWidth: "900px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          gap: "var(--espaco-sm)",
          backgroundColor: "var(--cor-canvas)",
          padding: "var(--espaco-md)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "var(--espaco-sm)" }}>
          <div style={{ minWidth: 0 }}>
            <h2 id={idTitulo} style={{ fontSize: "16px", margin: 0, overflowWrap: "anywhere" }}>
              {arquivo.rotulo || arquivo.nome}
            </h2>
            {arquivo.rotulo && arquivo.rotulo !== arquivo.nome && (
              <p style={{ fontSize: "12px", color: "var(--cor-muted)", margin: "2px 0 0" }}>{arquivo.nome}</p>
            )}
          </div>
          <button
            ref={botaoFecharRef}
            type="button"
            onClick={onFechar}
            aria-label="Fechar visualização do arquivo"
            className="btn-secondary"
            style={{ padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: "4px", flexShrink: 0 }}
          >
            <IconX size={16} /> Fechar
          </button>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: "320px",
            backgroundColor: "var(--cor-soft-stone)",
            borderRadius: "var(--radius-xs)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "auto",
          }}
        >
          {erroCarregamento || formato === "outro" ? (
            <p style={{ fontSize: "13px", color: "var(--cor-muted)", padding: "var(--espaco-lg)", textAlign: "center" }}>
              {erroCarregamento
                ? "Não foi possível exibir este arquivo aqui. Use o download para abri-lo."
                : "Este formato não abre na tela. Baixe o arquivo para conferir."}
            </p>
          ) : formato === "imagem" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={url}
              alt={`Evidência: ${arquivo.rotulo || arquivo.nome}`}
              onError={() => setErroCarregamento(true)}
              style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
            />
          ) : (
            <iframe
              src={url}
              title={`Documento: ${arquivo.rotulo || arquivo.nome}`}
              onError={() => setErroCarregamento(true)}
              style={{ width: "100%", height: "70vh", border: "none", backgroundColor: "#fff" }}
            />
          )}
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--espaco-sm)" }}>
          <a
            href={url}
            download={arquivo.nome}
            className="btn-secondary"
            style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <IconDownload size={14} /> Baixar arquivo
          </a>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
            style={{ fontSize: "12px" }}
          >
            Abrir em nova aba
          </a>
        </div>
      </div>
    </div>
  );
}
