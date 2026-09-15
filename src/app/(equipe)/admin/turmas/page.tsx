"use client";

import React, { useState } from "react";
import { TurmaCadastro } from "@/lib/api/turmas";
import { useSistemaStore } from "@/lib/store/sistema-store";

export default function AdminTurmasPage() {
  const { estado, salvarTurma, carregado } = useSistemaStore();
  const [codigo, setCodigo] = useState("");
  const [nome, setNome] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [limiteVagas, setLimiteVagas] = useState(40);
  const [modalAberto, setModalAberto] = useState(false);

  if (!carregado) return null;

  const handleCriarTurma = (e: React.FormEvent) => {
    e.preventDefault();
    if (!codigo || !nome || !dataInicio) return;

    const nova: TurmaCadastro = {
      id: `turma-${Date.now()}`,
      codigo,
      nome,
      dataInicio,
      horarioEncontro: "Quartas, 18:15 às 19:45",
      limiteVagas,
      totalMatriculados: 0,
      status: "aberta",
    };

    salvarTurma(nova);
    setModalAberto(false);
    setCodigo("");
    setNome("");
    setDataInicio("");
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--espaco-lg)" }}>
        <div>
          <h1 style={{ fontSize: "28px", marginBottom: "var(--espaco-xs)" }}>Gestão de Turmas</h1>
          <p style={{ color: "var(--cor-muted)" }}>
            Controle de turmas abertas, capacidade de alunos e datas de início dos ciclos.
          </p>
        </div>
        <button className="btn-primary" onClick={() => setModalAberto(true)}>
          + Nova Turma
        </button>
      </div>

      <div className="card">
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--cor-hairline)", color: "var(--cor-muted)" }}>
              <th style={{ padding: "12px 8px" }}>Código</th>
              <th style={{ padding: "12px 8px" }}>Nome da Turma</th>
              <th style={{ padding: "12px 8px" }}>Início</th>
              <th style={{ padding: "12px 8px" }}>Encontro Semanal</th>
              <th style={{ padding: "12px 8px" }}>Vagas Ocupadas</th>
              <th style={{ padding: "12px 8px" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {estado.turmas.map((turma) => (
              <tr key={turma.id} style={{ borderBottom: "1px solid var(--cor-border-light)" }}>
                <td style={{ padding: "14px 8px", fontFamily: "var(--font-family-mono)", fontSize: "13px" }}>{turma.codigo}</td>
                <td style={{ padding: "14px 8px", fontWeight: 500 }}>{turma.nome}</td>
                <td style={{ padding: "14px 8px" }}>{turma.dataInicio}</td>
                <td style={{ padding: "14px 8px" }}>{turma.horarioEncontro}</td>
                <td style={{ padding: "14px 8px" }}>
                  <strong>{turma.totalMatriculados}</strong> / {turma.limiteVagas}
                </td>
                <td style={{ padding: "14px 8px" }}>
                  <span style={{
                    display: "inline-block",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-pill)",
                    fontSize: "12px",
                    fontWeight: 600,
                    backgroundColor: turma.status === "em_andamento" ? "#ecfdf5" : "#f1f5ff",
                    color: turma.status === "em_andamento" ? "#065f46" : "#1863dc",
                  }}>
                    {turma.status === "em_andamento" ? "EM ANDAMENTO" : "ABERTA"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalAberto && (
        <div style={{
          position: "fixed",
          inset: 0,
          backgroundColor: "rgba(0,0,0,0.45)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div className="card" style={{ width: "100%", maxWidth: "480px" }}>
            <h3 style={{ marginBottom: "var(--espaco-md)" }}>Criar Nova Turma</h3>
            <form onSubmit={handleCriarTurma} style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-md)" }}>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>Código da Turma</label>
                <input
                  type="text"
                  value={codigo}
                  onChange={(e) => setCodigo(e.target.value)}
                  placeholder="Ex: POS.ONE.2026.3"
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-xs)", border: "1px solid var(--cor-border-light)" }}
                />
              </div>
              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>Nome da Turma</label>
                <input
                  type="text"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Ex: Águias ONE — Turma 2026.3"
                  required
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-xs)", border: "1px solid var(--cor-border-light)" }}
                />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--espaco-md)" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>Data de Início</label>
                  <input
                    type="date"
                    value={dataInicio}
                    onChange={(e) => setDataInicio(e.target.value)}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-xs)", border: "1px solid var(--cor-border-light)" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "4px" }}>Limite de Vagas</label>
                  <input
                    type="number"
                    value={limiteVagas}
                    onChange={(e) => setLimiteVagas(Number(e.target.value))}
                    min={1}
                    required
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "var(--radius-xs)", border: "1px solid var(--cor-border-light)" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--espaco-sm)", marginTop: "var(--espaco-md)" }}>
                <button type="button" className="btn-secondary" onClick={() => setModalAberto(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Criar Turma</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
