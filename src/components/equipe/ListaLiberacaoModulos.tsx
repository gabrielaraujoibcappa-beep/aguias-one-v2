"use client";

import React from "react";
import { ModuloItem } from "@/lib/api/modulos-liberacao";
import { StatusDot } from "../ui/StatusDot";

interface ListaLiberacaoModulosProps {
  modulos: ModuloItem[];
  onAlternarLiberacao: (moduloId: string, novoStatus: "liberado" | "bloqueado") => void;
}

export function ListaLiberacaoModulos({ modulos, onAlternarLiberacao }: ListaLiberacaoModulosProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-md)" }}>
      {modulos.map((modulo) => {
        const isLiberado = modulo.status === "liberado";

        return (
          <div
            key={modulo.id}
            className="card"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              borderColor: isLiberado ? "var(--cor-deep-green)" : "var(--cor-border-light)",
              borderWidth: isLiberado ? "2px" : "1px",
              backgroundColor: isLiberado ? "#fbfdfb" : "var(--cor-canvas)",
            }}
          >
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "var(--espaco-sm)", marginBottom: "4px" }}>
                <span style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  backgroundColor: isLiberado ? "#ecfdf5" : "#f3f4f6",
                  color: isLiberado ? "#065f46" : "#6b7280",
                  padding: "2px 8px",
                  borderRadius: "var(--radius-pill)",
                }}>
                  MÓDULO {modulo.numero}
                </span>
                <span style={{ fontSize: "12px", color: "var(--cor-muted)" }}>
                  {modulo.disciplinaRef}
                </span>
              </div>
              <h3 style={{ fontSize: "16px", marginBottom: "4px" }}>{modulo.titulo}</h3>
              <p style={{ fontSize: "13px", color: "var(--cor-body-muted)" }}>{modulo.descricao}</p>
              {modulo.liberadoEm && (
                <div style={{ fontSize: "11px", color: "var(--cor-muted)", marginTop: "6px" }}>
                  Liberado em: {new Date(modulo.liberadoEm).toLocaleDateString("pt-BR")}
                </div>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "var(--espaco-md)" }}>
              <StatusDot
                status={isLiberado ? "verde" : "neutro"}
                label={isLiberado ? "Liberado" : "Bloqueado"}
                size={7}
              />

              <button
                className={isLiberado ? "btn-secondary" : "btn-primary"}
                onClick={() => onAlternarLiberacao(modulo.id, isLiberado ? "bloqueado" : "liberado")}
                style={{ fontSize: "12px", padding: "6px 14px", borderRadius: "var(--radius-xs)" }}
              >
                {isLiberado ? "Bloquear Módulo" : "Liberar para a Turma"}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
