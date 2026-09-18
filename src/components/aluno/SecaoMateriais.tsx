"use client";

import React, { useEffect, useState } from "react";
import { IconDownload, IconFolder } from "../ui/Icons";

export interface MaterialItem {
  id: string;
  titulo: string;
  tipo: "PDF" | "HTML" | "ZIP" | "PLANILHA" | "IMAGEM" | "LINK";
  tamanho: string;
  descricao: string;
  downloadUrl: string;
}

/**
 * Materiais publicados pela coordenação (bucket `materiais`, via GET /api/materiais).
 * Sem material publicado, mostra estado vazio — nenhum item mockado.
 * A prop `materiais` permite injetar a lista (testes); quando omitida, busca da API.
 */
export function SecaoMateriais({ materiais: iniciais }: { materiais?: MaterialItem[] }) {
  const [materiais, setMateriais] = useState<MaterialItem[] | null>(iniciais ?? null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    if (iniciais) return;
    let ativo = true;
    fetch("/api/materiais")
      .then(async (resp) => {
        const dados = await resp.json();
        if (!dados.sucesso) throw new Error(dados.erro || "Falha ao carregar.");
        if (!ativo) return;
        setMateriais(
          (dados.materiais || []).map((m: any) => ({
            id: m.path,
            titulo: m.titulo,
            tipo: m.tipo,
            tamanho: m.tamanho,
            descricao: "",
            downloadUrl: m.downloadUrl,
          }))
        );
      })
      .catch((e) => {
        if (!ativo) return;
        setErro(e?.message || "Não foi possível carregar os materiais.");
        setMateriais([]);
      });
    return () => {
      ativo = false;
    };
  }, [iniciais]);

  return (
    <div style={{
      backgroundColor: "#fff",
      border: "1px solid var(--cor-border-light)",
      borderRadius: "var(--radius-sm)",
      padding: "var(--espaco-xl)",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "var(--espaco-xs)" }}>
        <IconFolder size={18} style={{ color: "var(--cor-slate)" }} />
        <h2 style={{ fontSize: "18px", fontWeight: 600 }}>Materiais de Apoio & Templates</h2>
      </div>
      <p style={{ color: "var(--cor-muted)", fontSize: "13px", marginBottom: "var(--espaco-lg)" }}>
        Documentos de referência, roteiros operacionais e minutas disponibilizadas pela coordenação.
      </p>

      {materiais === null ? (
        <p style={{ color: "var(--cor-muted)", fontSize: "13px" }}>
          Carregando materiais...
        </p>
      ) : erro ? (
        <p role="alert" style={{ color: "#991b1b", fontSize: "13px" }}>
          {erro}
        </p>
      ) : materiais.length === 0 ? (
        <p style={{ color: "var(--cor-muted)", fontSize: "13px" }}>
          Nenhum material publicado pela coordenação ainda.
        </p>
      ) : (
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--espaco-md)" }}>
        {materiais.map((mat) => (
          <div key={mat.id} style={{
            border: "1px solid var(--cor-border-light)",
            borderRadius: "var(--radius-xs)",
            padding: "var(--espaco-md)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            backgroundColor: "#fff",
          }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                <span style={{
                  fontSize: "10px",
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: "2px",
                  backgroundColor: "var(--cor-soft-stone)",
                  color: "var(--cor-slate)",
                  fontFamily: "var(--font-family-mono)",
                }}>
                  .{mat.tipo}
                </span>
                <span style={{ fontSize: "11px", color: "var(--cor-muted)", fontFamily: "var(--font-family-mono)" }}>
                  {mat.tamanho}
                </span>
              </div>
              <h4 style={{ fontSize: "14px", fontWeight: 600, margin: "var(--espaco-xs) 0", color: "var(--cor-ink)" }}>
                {mat.titulo}
              </h4>
              {mat.descricao ? (
                <p style={{ fontSize: "12px", color: "var(--cor-body-muted)", marginBottom: "var(--espaco-md)" }}>
                  {mat.descricao}
                </p>
              ) : null}
            </div>

            {mat.downloadUrl ? (
              <a
                href={mat.downloadUrl}
                className="btn-secondary"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  fontSize: "12px",
                  borderRadius: "var(--radius-xs)",
                  gap: "6px",
                }}
                {...(mat.tipo === "LINK" ? { target: "_blank", rel: "noopener noreferrer" } : {})}
              >
                <IconDownload size={13} />
                <span>{mat.tipo === "LINK" ? "Abrir Link" : "Baixar Arquivo"}</span>
              </a>
            ) : (
              <span
                className="btn-secondary"
                aria-disabled="true"
                style={{
                  width: "100%",
                  justifyContent: "center",
                  fontSize: "12px",
                  borderRadius: "var(--radius-xs)",
                  opacity: 0.6,
                  cursor: "default",
                }}
              >
                Disponível em breve
              </span>
            )}
          </div>
        ))}
      </div>
      )}
    </div>
  );
}
