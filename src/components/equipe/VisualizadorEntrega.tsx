"use client";

import React, { useState } from "react";
import { EntregaPendente } from "@/lib/api/auditoria";
import { ArquivoVisualizavel, ModalArquivo } from "@/components/ui/ModalArquivo";

interface VisualizadorEntregaProps {
  entrega: EntregaPendente;
  onAprovar: (id: string) => void;
  onSolicitarAjuste: (id: string, motivo: string) => void;
  onVoltar: () => void;
  /** Admin, concierge e mentor avaliam; os demais papéis só consultam. */
  podeAuditar?: boolean;
}

export function VisualizadorEntrega({
  entrega,
  onAprovar,
  onSolicitarAjuste,
  onVoltar,
  podeAuditar = true,
}: VisualizadorEntregaProps) {
  const [arquivoAberto, setArquivoAberto] = useState<ArquivoVisualizavel | null>(null);
  const [motivoAjuste, setMotivoAjuste] = useState("");
  const [mostrandoCampoAjuste, setMostrandoCampoAjuste] = useState(false);
  const [erro, setErro] = useState("");

  const handleConfirmarAjuste = () => {
    if (!motivoAjuste.trim()) {
      setErro("Por favor, descreva o que o aluno precisa ajustar.");
      return;
    }
    onSolicitarAjuste(entrega.id, motivoAjuste);
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--espaco-lg)" }}>
        <div>
          <button onClick={onVoltar} style={{ fontSize: "13px", color: "var(--cor-muted)", marginBottom: "6px" }}>
            ← Voltar para a Fila
          </button>
          <h2 style={{ fontSize: "22px" }}>{entrega.alunoNome}</h2>
          <p style={{ color: "var(--cor-muted)", fontSize: "14px" }}>
            Entrega do <strong>{entrega.moduloTitulo}</strong> · Enviado em {new Date(entrega.enviadoEm).toLocaleString("pt-BR")}
          </p>
        </div>

        <div>
          <span style={{
            fontSize: "12px",
            fontWeight: 600,
            padding: "4px 10px",
            borderRadius: "var(--radius-pill)",
            backgroundColor: "#fffbeb",
            color: "#92400e",
          }}>
            AGUARDANDO AUDITORIA
          </span>
        </div>
      </div>

      {/* 1. Links Enviados */}
      <div style={{ marginBottom: "var(--espaco-lg)" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "var(--espaco-xs)", color: "var(--cor-primary)" }}>
          Links de Evidência Submetidos
        </h3>
        {entrega.links.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--cor-muted)" }}>Nenhum link exigido ou anexado.</p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {entrega.links.map((link, idx) => (
              <div key={idx} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                backgroundColor: "#f9fafb",
                padding: "8px 12px",
                borderRadius: "var(--radius-xs)",
              }}>
                <span style={{ fontSize: "13px", fontWeight: 500 }}>{link.rotulo}:</span>
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary"
                  style={{ fontSize: "12px", padding: "4px 10px" }}
                >
                  Abrir link externo
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Arquivos e Prints Anexados */}
      <div style={{ marginBottom: "var(--espaco-lg)" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600, marginBottom: "var(--espaco-xs)", color: "var(--cor-primary)" }}>
          Arquivos e Prints Anexados
        </h3>
        {entrega.arquivos.length === 0 ? (
          <p style={{ fontSize: "13px", color: "var(--cor-muted)" }}>Nenhum print anexado.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--espaco-sm)" }}>
            {entrega.arquivos.map((arq, idx) => (
              <div key={idx} style={{
                border: "1px solid var(--cor-border-light)",
                borderRadius: "var(--radius-xs)",
                padding: "10px",
                backgroundColor: "var(--cor-canvas)",
              }}>
                <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>{arq.rotulo}</div>
                <div style={{ fontSize: "12px", color: "var(--cor-muted)", marginBottom: "8px" }}>{arq.nome}</div>
                <button
                  type="button"
                  onClick={() => setArquivoAberto({ nome: arq.nome, path: arq.path, rotulo: arq.rotulo })}
                  className="btn-secondary"
                  style={{ width: "100%", textAlign: "center", fontSize: "11px", padding: "4px 8px" }}
                >
                  Visualizar Arquivo
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. Travas e Dúvidas para Quarta */}
      {(entrega.travou || entrega.duvidaCall) && (
        <div style={{
          backgroundColor: "#fefce8",
          border: "1px solid #fef08a",
          borderRadius: "var(--radius-sm)",
          padding: "var(--espaco-md)",
          marginBottom: "var(--espaco-xl)",
        }}>
          {entrega.travou && (
            <div style={{ marginBottom: entrega.duvidaCall ? "8px" : "0" }}>
              <strong style={{ fontSize: "13px", color: "#854d0e" }}>Trava relatada pelo aluno:</strong>
              <p style={{ fontSize: "13px", color: "#713f12" }}>{entrega.travou}</p>
            </div>
          )}
          {entrega.duvidaCall && (
            <div>
              <strong style={{ fontSize: "13px", color: "#854d0e" }}>Dúvida para o encontro de quarta:</strong>
              <p style={{ fontSize: "13px", color: "#713f12" }}>{entrega.duvidaCall}</p>
            </div>
          )}
        </div>
      )}

      {/* Área de Ação da Auditoria */}
      <div style={{ borderTop: "1px solid var(--cor-border-light)", paddingTop: "var(--espaco-lg)" }}>
        {!podeAuditar || entrega.status === "aprovado" ? (
          <p style={{ fontSize: "13px", color: "var(--cor-muted)", textAlign: "right" }}>
            {entrega.status === "aprovado"
              ? `Entrega aprovada${entrega.avaliadoPor ? ` por ${entrega.avaliadoPor}` : ""}.`
              : "Somente admin, concierge ou mentor avaliam entregas. Seu acesso a esta tela é de consulta."}
          </p>
        ) : !mostrandoCampoAjuste ? (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--espaco-md)" }}>
            <button
              className="btn-secondary"
              style={{ color: "var(--cor-error)", borderColor: "var(--cor-error)" }}
              onClick={() => setMostrandoCampoAjuste(true)}
            >
              Solicitar Ajuste
            </button>
            <button
              className="btn-primary"
              style={{ backgroundColor: "var(--cor-primary)" }}
              onClick={() => onAprovar(entrega.id)}
            >
              Aprovar Entrega
            </button>
          </div>
        ) : (
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "4px" }}>
              Descreva o motivo do ajuste para o mentorado:
            </label>
            <textarea
              rows={3}
              value={motivoAjuste}
              onChange={(e) => setMotivoAjuste(e.target.value)}
              placeholder="Ex: Faltou incluir a assinatura no e-mail profissional ou o link do site está retornando erro 404..."
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--cor-border-light)",
                fontSize: "14px",
                marginBottom: "var(--espaco-sm)",
              }}
            />
            {erro && <div style={{ color: "var(--cor-error)", fontSize: "12px", marginBottom: "8px" }}>{erro}</div>}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--espaco-sm)" }}>
              <button className="btn-secondary" onClick={() => setMostrandoCampoAjuste(false)}>Cancelar</button>
              <button
                className="btn-primary"
                style={{ backgroundColor: "var(--cor-error)" }}
                onClick={handleConfirmarAjuste}
              >
                Enviar Solicitação de Ajuste
              </button>
            </div>
          </div>
        )}
      </div>

      <ModalArquivo arquivo={arquivoAberto} bucket="evidencias" onFechar={() => setArquivoAberto(null)} />
    </div>
  );
}
