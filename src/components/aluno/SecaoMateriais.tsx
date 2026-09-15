import React from "react";
import { IconDownload, IconFolder } from "../ui/Icons";

export interface MaterialItem {
  id: string;
  titulo: string;
  tipo: "PDF" | "HTML" | "ZIP" | "PLANILHA";
  tamanho: string;
  descricao: string;
  downloadUrl: string;
}

const MATERIAIS_PADRAO: MaterialItem[] = [
  {
    id: "mat-1",
    titulo: "Estrutura de 8 Pastas do Google Drive",
    tipo: "ZIP",
    tamanho: "1.2 MB",
    descricao: "Template da árvore de diretórios padronizada para escritórios periciais individuais.",
    downloadUrl: "#",
  },
  {
    id: "mat-2",
    titulo: "Kits de Produtos em HTML (Bancário, Trabalhista, Tributário)",
    tipo: "HTML",
    tamanho: "450 KB",
    descricao: "Modelos das 7 peças de abordagem e apresentação de proposta técnica.",
    downloadUrl: "#",
  },
  {
    id: "mat-3",
    titulo: "Contrato Modelo de Parceria por Indicação",
    tipo: "PDF",
    tamanho: "320 KB",
    descricao: "Minuta jurídica para parceria com advogados e peritos parceiros (PPC §10).",
    downloadUrl: "#",
  },
];

export function SecaoMateriais() {
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--espaco-md)" }}>
        {MATERIAIS_PADRAO.map((mat) => (
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
              <p style={{ fontSize: "12px", color: "var(--cor-body-muted)", marginBottom: "var(--espaco-md)" }}>
                {mat.descricao}
              </p>
            </div>

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
            >
              <IconDownload size={13} />
              <span>Baixar Arquivo</span>
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
