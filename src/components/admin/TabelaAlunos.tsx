"use client";

import React, { useState } from "react";
import Link from "next/link";
import { AlunoCadastro, filtrarAlunosPorBusca } from "@/lib/api/alunos";
import { BloqueioAcesso, bloqueioEstaVigente } from "@/lib/api/bloqueio-acesso";

interface TabelaAlunosProps {
  alunos: AlunoCadastro[];
  onEditar: (aluno: AlunoCadastro) => void;
  onExcluir: (aluno: AlunoCadastro) => void;
  onNovo: () => void;
  bloqueios?: Record<string, BloqueioAcesso>;
  onGerenciarAcesso?: (aluno: AlunoCadastro) => void;
}

export function TabelaAlunos({ alunos, onEditar, onExcluir, onNovo, bloqueios = {}, onGerenciarAcesso }: TabelaAlunosProps) {
  const [busca, setBusca] = useState("");
  const alunosFiltrados = filtrarAlunosPorBusca(alunos, busca);

  return (
    <div className="card" style={{ marginTop: "var(--espaco-lg)" }}>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "var(--espaco-lg)",
        flexWrap: "wrap",
        gap: "var(--espaco-md)",
      }}>
        <div style={{ display: "flex", gap: "var(--espaco-sm)", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Buscar por nome, email ou telefone..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{
              padding: "8px 14px",
              minWidth: "300px",
              borderRadius: "var(--radius-pill)",
              border: "1px solid var(--cor-border-light)",
            }}
          />
          <span style={{ fontSize: "13px", color: "var(--cor-muted)" }}>
            {alunosFiltrados.length} aluno(s)
          </span>
        </div>

        <button className="btn-primary" onClick={onNovo}>
          + Novo Aluno
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--cor-hairline)", color: "var(--cor-muted)" }}>
              <th style={{ padding: "12px 8px" }}>Nome</th>
              <th style={{ padding: "12px 8px" }}>Contato</th>
              <th style={{ padding: "12px 8px" }}>Turma</th>
              <th style={{ padding: "12px 8px" }}>Área Pericial</th>
              <th style={{ padding: "12px 8px" }}>Status</th>
              <th style={{ padding: "12px 8px", textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {alunosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "32px 0", textAlign: "center", color: "var(--cor-muted)" }}>
                  Nenhum aluno encontrado.
                </td>
              </tr>
            ) : (
              alunosFiltrados.map((aluno) => {
                const bloqueado = aluno.id ? bloqueioEstaVigente(bloqueios[aluno.id]) : false;
                return (
                <tr key={aluno.id || aluno.email} style={{ borderBottom: "1px solid var(--cor-border-light)" }}>
                  <td style={{ padding: "14px 8px", fontWeight: 500 }}>{aluno.nome}</td>
                  <td style={{ padding: "14px 8px" }}>
                    <div>{aluno.email}</div>
                    <div style={{ fontSize: "12px", color: "var(--cor-muted)" }}>{aluno.whatsapp}</div>
                  </td>
                  <td style={{ padding: "14px 8px" }}>{aluno.turmaNome || "Águias ONE 2026"}</td>
                  <td style={{ padding: "14px 8px" }}>{aluno.areaPericial || "Geral"}</td>
                  <td style={{ padding: "14px 8px" }}>
                    <span style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      borderRadius: "var(--radius-pill)",
                      fontSize: "12px",
                      fontWeight: 600,
                      backgroundColor: aluno.status === "ativo" ? "#ecfdf5" : "#fef2f2",
                      color: aluno.status === "ativo" ? "#065f46" : "#991b1b",
                    }}>
                      {aluno.status.toUpperCase()}
                    </span>
                    {bloqueado && (
                      <span style={{
                        display: "inline-block",
                        marginLeft: "6px",
                        padding: "2px 8px",
                        borderRadius: "var(--radius-pill)",
                        fontSize: "12px",
                        fontWeight: 600,
                        backgroundColor: "#111827",
                        color: "#ffffff",
                      }}>
                        ACESSO BLOQUEADO
                      </span>
                    )}
                  </td>
                  <td style={{ padding: "14px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                    {aluno.id && (
                      <Link
                        href={`/painel/aluno/${encodeURIComponent(aluno.id)}?contexto=gestao-alunos`}
                        style={{ color: "var(--cor-ink)", marginRight: "12px", fontWeight: 500 }}
                      >
                        Ficha
                      </Link>
                    )}
                    {aluno.id && onGerenciarAcesso && (
                      <button
                        onClick={() => onGerenciarAcesso(aluno)}
                        style={{ color: bloqueado ? "#065f46" : "var(--cor-ink)", marginRight: "12px", fontWeight: 500 }}
                      >
                        {bloqueado ? "Desbloquear" : "Bloquear acesso"}
                      </button>
                    )}
                    <button
                      onClick={() => onEditar(aluno)}
                      style={{ color: "var(--cor-action-blue)", marginRight: "12px", fontWeight: 500 }}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => onExcluir(aluno)}
                      aria-label={`Excluir cadastro de ${aluno.nome}`}
                      style={{
                        color: "#dc2626",
                        fontWeight: 500,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                      }}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
