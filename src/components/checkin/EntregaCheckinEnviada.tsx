"use client";

import React, { useState } from "react";
import { EntregaPendente } from "@/lib/api/auditoria";
import { ArquivoVisualizavel, ModalArquivo } from "../ui/ModalArquivo";
import { IconCheckCircle } from "../ui/Icons";

const STATUS: Record<EntregaPendente["status"], { rotulo: string; cor: string; fundo: string; borda: string; texto: string }> = {
  aguardando_avaliacao: {
    rotulo: "Aguardando avaliação",
    cor: "#854d0e",
    fundo: "#fefce8",
    borda: "#fef08a",
    texto: "A equipe ainda vai avaliar. Você pode corrigir ou completar a entrega abaixo e reenviar.",
  },
  ajuste_solicitado: {
    rotulo: "Ajuste solicitado",
    cor: "var(--cor-error)",
    fundo: "#fef2f2",
    borda: "#fecaca",
    texto: "A equipe pediu um ajuste. Corrija a entrega abaixo e reenvie.",
  },
  aprovado: {
    rotulo: "Aprovado",
    cor: "var(--cor-deep-green)",
    fundo: "#f0fdf4",
    borda: "#bbf7d0",
    texto: "Entrega aprovada pela equipe. Ela fica registrada e não pode mais ser alterada.",
  },
};

function dataCurta(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("pt-BR");
}

interface EntregaCheckinEnviadaProps {
  entrega: EntregaPendente;
  /** Mostra links, arquivos e travas (entrega travada). Sem isso, só status e parecer. */
  completa?: boolean;
}

/** O que o mentorado já enviou neste módulo: status, parecer da equipe e as evidências. */
export function EntregaCheckinEnviada({ entrega, completa = false }: EntregaCheckinEnviadaProps) {
  const [arquivoAberto, setArquivoAberto] = useState<ArquivoVisualizavel | null>(null);
  const status = STATUS[entrega.status] ?? STATUS.aguardando_avaliacao;
  const enviadoEm = dataCurta(entrega.enviadoEm);

  return (
    <div className="card" style={{ marginTop: "var(--espaco-lg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "var(--espaco-sm)", flexWrap: "wrap", marginBottom: "var(--espaco-sm)" }}>
        <h2 style={{ fontSize: "18px", margin: 0 }}>Sua entrega</h2>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            fontWeight: 600,
            color: status.cor,
            backgroundColor: status.fundo,
            border: `1px solid ${status.borda}`,
            borderRadius: "999px",
            padding: "2px 10px",
          }}
        >
          {entrega.status === "aprovado" && <IconCheckCircle size={14} />}
          {status.rotulo}
        </span>
        {enviadoEm && <span style={{ fontSize: "12px", color: "var(--cor-muted)" }}>Enviada em {enviadoEm}</span>}
      </div>
      <p style={{ fontSize: "14px", color: "var(--cor-muted)", margin: 0 }}>{status.texto}</p>

      {entrega.parecerTexto && (
        <div
          style={{
            marginTop: "var(--espaco-md)",
            backgroundColor: status.fundo,
            border: `1px solid ${status.borda}`,
            borderRadius: "var(--radius-sm)",
            padding: "var(--espaco-md)",
            fontSize: "14px",
          }}
        >
          <strong style={{ display: "block", fontSize: "13px", color: status.cor, marginBottom: "4px" }}>Parecer da equipe</strong>
          {entrega.parecerTexto}
        </div>
      )}

      {completa && (
        <>
          <h3 style={{ fontSize: "15px", marginTop: "var(--espaco-lg)", marginBottom: "var(--espaco-xs)" }}>Links enviados</h3>
          {entrega.links.length === 0 ? (
            <p style={{ fontSize: "13px", color: "var(--cor-muted)" }}>Nenhum link.</p>
          ) : (
            <ul style={{ paddingLeft: "20px", fontSize: "14px" }}>
              {entrega.links.map((link, idx) => (
                <li key={idx} style={{ marginBottom: "4px", overflowWrap: "anywhere" }}>
                  {link.rotulo}:{" "}
                  <a href={link.url} target="_blank" rel="noopener noreferrer" style={{ color: "var(--cor-action-vibrant)" }}>
                    {link.url}
                  </a>
                </li>
              ))}
            </ul>
          )}

          <h3 style={{ fontSize: "15px", marginTop: "var(--espaco-md)", marginBottom: "var(--espaco-xs)" }}>Arquivos enviados</h3>
          <ListaArquivosEnviados arquivos={entrega.arquivos} onAbrir={setArquivoAberto} />

          {(entrega.travou || entrega.duvidaCall) && (
            <div style={{ marginTop: "var(--espaco-md)", fontSize: "14px" }}>
              {entrega.travou && <p style={{ margin: "0 0 4px" }}><strong>Travou em:</strong> {entrega.travou}</p>}
              {entrega.duvidaCall && <p style={{ margin: 0 }}><strong>Dúvida para a call:</strong> {entrega.duvidaCall}</p>}
            </div>
          )}
        </>
      )}

      <ModalArquivo arquivo={arquivoAberto} bucket="evidencias" onFechar={() => setArquivoAberto(null)} />
    </div>
  );
}

interface ListaArquivosEnviadosProps {
  arquivos: EntregaPendente["arquivos"];
  onAbrir: (arquivo: ArquivoVisualizavel) => void;
  /** Quando presente, cada arquivo ganha um botão para tirá-lo da entrega. */
  onRemover?: (indice: number) => void;
}

export function ListaArquivosEnviados({ arquivos, onAbrir, onRemover }: ListaArquivosEnviadosProps) {
  if (arquivos.length === 0) {
    return <p style={{ fontSize: "13px", color: "var(--cor-muted)" }}>Nenhum arquivo.</p>;
  }
  return (
    <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "6px" }}>
      {arquivos.map((arq, idx) => (
        <li
          key={arq.path}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "var(--espaco-sm)",
            border: "1px solid var(--cor-border-light)",
            borderRadius: "var(--radius-xs)",
            padding: "8px 10px",
            fontSize: "13px",
          }}
        >
          <span style={{ minWidth: 0, overflowWrap: "anywhere" }}>{arq.nome}</span>
          <span style={{ display: "flex", gap: "6px", flexShrink: 0 }}>
            <button
              type="button"
              className="btn-secondary"
              style={{ fontSize: "12px", padding: "4px 10px" }}
              onClick={() => onAbrir({ nome: arq.nome, path: arq.path, rotulo: arq.rotulo })}
            >
              Ver arquivo
            </button>
            {onRemover && (
              <button
                type="button"
                className="btn-secondary"
                style={{ fontSize: "12px", padding: "4px 10px" }}
                onClick={() => onRemover(idx)}
                aria-label={`Remover ${arq.nome} da entrega`}
              >
                Remover
              </button>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
