"use client";

import React, { useState } from "react";
import { CanalItem, atualizarStatusCanal } from "@/lib/api/canais";

interface GridCanaisProps {
  canaisIniciais: CanalItem[];
}

export function GridCanais({ canaisIniciais }: GridCanaisProps) {
  const [canais, setCanais] = useState<CanalItem[]>(canaisIniciais);
  const [editandoCanal, setEditandoCanal] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");

  const handleIniciarEdicao = (canal: CanalItem) => {
    setEditandoCanal(canal.nome);
    setUrlInput(canal.url || "");
  };

  const handleSalvarEdicao = (canal: CanalItem, novoStatus: "ativo" | "nao_iniciado") => {
    const atualizado = atualizarStatusCanal(canal, novoStatus, urlInput.trim());
    setCanais(canais.map((c) => (c.nome === canal.nome ? atualizado : c)));
    setEditandoCanal(null);
  };

  const canaisAtivos = canais.filter((c) => c.status === "ativo").length;

  return (
    <div>
      <div className="card" style={{ marginBottom: "var(--espaco-lg)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h3 style={{ fontSize: "16px" }}>Progresso de Implantação de Canais</h3>
          <p style={{ fontSize: "13px", color: "var(--cor-muted)" }}>
            Ordem pedagógica obrigatória do PPC (§7 Disciplina 08).
          </p>
        </div>
        <div>
          <span className="badge-semaforo verde" style={{ fontSize: "13px" }}>
            {canaisAtivos} DE 7 CANAIS NO AR
          </span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--espaco-md)" }}>
        {canais.map((canal) => {
          const isAtivo = canal.status === "ativo";
          const isEditando = editandoCanal === canal.nome;

          return (
            <div
              key={canal.nome}
              className="card"
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                borderColor: isAtivo ? "var(--cor-deep-green)" : "var(--cor-border-light)",
                borderTop: isAtivo ? "4px solid var(--cor-deep-green)" : "1px solid var(--cor-border-light)",
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--espaco-xs)" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: "var(--cor-muted)" }}>
                    CANAL {canal.ordem}
                  </span>
                  <span style={{
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "2px 8px",
                    borderRadius: "var(--radius-pill)",
                    backgroundColor: isAtivo ? "#ecfdf5" : "#f3f4f6",
                    color: isAtivo ? "#065f46" : "#6b7280",
                  }}>
                    {isAtivo ? "NO AR" : "NÃO INICIADO"}
                  </span>
                </div>

                <h3 style={{ fontSize: "17px", marginBottom: "4px" }}>{canal.nome}</h3>
                <p style={{ fontSize: "13px", color: "var(--cor-body-muted)", marginBottom: "var(--espaco-md)" }}>
                  {canal.descricao}
                </p>

                {isAtivo && canal.url && !isEditando && (
                  <div style={{ marginBottom: "var(--espaco-md)" }}>
                    <a
                      href={canal.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ fontSize: "12px", color: "var(--cor-primary)", textDecoration: "underline", wordBreak: "break-all" }}
                    >
                      {canal.url}
                    </a>
                  </div>
                )}

                {isEditando && (
                  <div style={{ marginBottom: "var(--espaco-md)" }}>
                    <label style={{ display: "block", fontSize: "12px", fontWeight: 500, marginBottom: "4px" }}>
                      Link de acesso público do canal:
                    </label>
                    <input
                      type="url"
                      value={urlInput}
                      onChange={(e) => setUrlInput(e.target.value)}
                      placeholder="https://..."
                      style={{
                        width: "100%",
                        padding: "8px 10px",
                        borderRadius: "var(--radius-xs)",
                        border: "1px solid var(--cor-border-light)",
                        fontSize: "13px",
                      }}
                    />
                  </div>
                )}
              </div>

              <div style={{ borderTop: "1px solid var(--cor-border-light)", paddingTop: "var(--espaco-sm)", marginTop: "var(--espaco-sm)" }}>
                {isEditando ? (
                  <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                    <button
                      className="btn-secondary"
                      style={{ fontSize: "12px", padding: "4px 10px" }}
                      onClick={() => setEditandoCanal(null)}
                    >
                      Cancelar
                    </button>
                    <button
                      className="btn-primary"
                      style={{ fontSize: "12px", padding: "4px 12px" }}
                      onClick={() => handleSalvarEdicao(canal, "ativo")}
                    >
                      Salvar como No Ar
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <button
                      onClick={() => handleIniciarEdicao(canal)}
                      style={{ fontSize: "12px", color: "var(--cor-muted)", fontWeight: 500 }}
                    >
                      {canal.url ? "Editar Link" : "Configurar Link"}
                    </button>
                    <button
                      className={isAtivo ? "btn-secondary" : "btn-primary"}
                      style={{ fontSize: "12px", padding: "4px 12px" }}
                      onClick={() => handleSalvarEdicao(canal, isAtivo ? "nao_iniciado" : "ativo")}
                    >
                      {isAtivo ? "Marcar Pendente" : "Marcar como Ativo"}
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
