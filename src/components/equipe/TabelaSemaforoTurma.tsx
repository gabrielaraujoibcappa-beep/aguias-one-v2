"use client";

import React, { useState } from "react";
import { AlunoSemaforoStatus } from "@/lib/api/turma-semaforo";
import { BotaoResgateWhatsApp } from "./BotaoResgateWhatsApp";
import { StatusDot } from "../ui/StatusDot";
import { ResumoFiltrosAtivos, FiltroAtivoItem } from "../ui/ResumoFiltrosAtivos";

interface TabelaSemaforoTurmaProps {
  alunos: AlunoSemaforoStatus[];
}

export function TabelaSemaforoTurma({ alunos }: TabelaSemaforoTurmaProps) {
  const [filtroSemaforo, setFiltroSemaforo] = useState<string>("todos");

  const alunosFiltrados = alunos.filter((a) => {
    if (filtroSemaforo === "todos") return true;
    if (filtroSemaforo === "resgate") return a.precisaResgate;
    return a.semaforoAtual === filtroSemaforo;
  });

  const totalVerdes = alunos.filter((a) => a.semaforoAtual === "verde").length;
  const totalAmarelos = alunos.filter((a) => a.semaforoAtual === "amarelo").length;
  const totalVermelhos = alunos.filter((a) => a.semaforoAtual === "vermelho").length;
  const totalResgate = alunos.filter((a) => a.precisaResgate).length;

  const filtrosAtivos: FiltroAtivoItem[] = [];
  if (filtroSemaforo !== "todos") {
    const rotulos: Record<string, string> = {
      verde: "Regulares (Verde)",
      amarelo: "Atenção (Amarelo)",
      vermelho: "Em Risco (Vermelho)",
      resgate: "Resgate Necessário",
    };
    filtrosAtivos.push({
      id: "semaforo",
      categoria: "Semáforo",
      valorRotulo: rotulos[filtroSemaforo] || filtroSemaforo,
      onRemover: () => setFiltroSemaforo("todos"),
      removivel: true,
    });
  }

  return (
    <div style={{
      backgroundColor: "#fff",
      border: "1px solid var(--cor-border-light)",
      borderRadius: "var(--radius-sm)",
      padding: "var(--espaco-xl)",
    }}>
      {/* Filtros Limpos sem Emojis */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "var(--espaco-lg)", flexWrap: "wrap", alignItems: "center" }}>
        <button
          className={filtroSemaforo === "todos" ? "btn-primary" : "btn-secondary"}
          onClick={() => setFiltroSemaforo("todos")}
          style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "var(--radius-xs)" }}
        >
          Todos ({alunos.length})
        </button>
        <button
          className={filtroSemaforo === "verde" ? "btn-primary" : "btn-secondary"}
          onClick={() => setFiltroSemaforo("verde")}
          style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "var(--radius-xs)", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <StatusDot status="verde" size={6} />
          <span>Regulares ({totalVerdes})</span>
        </button>
        <button
          className={filtroSemaforo === "amarelo" ? "btn-primary" : "btn-secondary"}
          onClick={() => setFiltroSemaforo("amarelo")}
          style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "var(--radius-xs)", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <StatusDot status="amarelo" size={6} />
          <span>Atenção ({totalAmarelos})</span>
        </button>
        <button
          className={filtroSemaforo === "vermelho" ? "btn-primary" : "btn-secondary"}
          onClick={() => setFiltroSemaforo("vermelho")}
          style={{ fontSize: "12px", padding: "5px 12px", borderRadius: "var(--radius-xs)", display: "inline-flex", alignItems: "center", gap: "6px" }}
        >
          <StatusDot status="vermelho" size={6} />
          <span>Em Risco ({totalVermelhos})</span>
        </button>
        {totalResgate > 0 && (
          <button
            onClick={() => setFiltroSemaforo("resgate")}
            style={{
              fontSize: "12px",
              padding: "5px 12px",
              borderRadius: "var(--radius-xs)",
              border: "1px solid #fecaca",
              backgroundColor: filtroSemaforo === "resgate" ? "#b91c1c" : "rgba(239, 68, 68, 0.08)",
              color: filtroSemaforo === "resgate" ? "#fff" : "#991b1b",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Resgate Necessário ({totalResgate})
          </button>
        )}
      </div>

      {/* Resumo de Filtros Ativos (Câmara UX / Baymard / Carbon) */}
      <ResumoFiltrosAtivos
        filtros={filtrosAtivos}
        totalResultados={alunosFiltrados.length}
        totalGeral={alunos.length}
        entidadeNome="peritos"
        onLimparTudo={() => setFiltroSemaforo("todos")}
      />

      {/* Tabela de Alunos com Semáforos e Travas */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
          <thead>
            <tr style={{
              borderBottom: "1px solid var(--cor-border-light)",
              color: "var(--cor-slate)",
              fontSize: "11px",
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              fontFamily: "var(--font-family-mono)",
            }}>
              <th style={{ padding: "10px 8px" }}>Aluno</th>
              <th style={{ padding: "10px 8px" }}>Status Operacional</th>
              <th style={{ padding: "10px 8px" }}>Módulo Atual</th>
              <th style={{ padding: "10px 8px" }}>Trava Relatada</th>
              <th style={{ padding: "10px 8px", textAlign: "right" }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {alunosFiltrados.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: "24px 0", textAlign: "center", color: "var(--cor-muted)" }}>
                  Nenhum aluno com o filtro selecionado.
                </td>
              </tr>
            ) : (
              alunosFiltrados.map((aluno) => (
                <tr key={aluno.id} style={{ borderBottom: "1px solid var(--cor-border-light)" }}>
                  <td style={{ padding: "12px 8px" }}>
                    <div style={{ fontWeight: 600, color: "var(--cor-ink)" }}>{aluno.nome}</div>
                    <div style={{ fontSize: "11px", color: "var(--cor-muted)", fontFamily: "var(--font-family-mono)" }}>
                      {aluno.whatsapp}
                    </div>
                  </td>
                  <td style={{ padding: "12px 8px" }}>
                    <StatusDot
                      status={aluno.semaforoAtual}
                      label={aluno.semaforoAtual === "verde" ? "Regular" : aluno.semaforoAtual === "amarelo" ? "Atenção" : "Em Risco"}
                      size={7}
                    />
                  </td>
                  <td style={{ padding: "12px 8px", color: "var(--cor-ink)" }}>{aluno.moduloAtual}</td>
                  <td style={{ padding: "12px 8px", fontSize: "12px", color: aluno.travouEmLinha ? "var(--cor-ink)" : "var(--cor-muted)" }}>
                    {aluno.travouEmLinha || "Sem travas relatadas."}
                  </td>
                  <td style={{ padding: "12px 8px", textAlign: "right" }}>
                    {aluno.precisaResgate ? (
                      <BotaoResgateWhatsApp aluno={aluno} />
                    ) : (
                      <span style={{ fontSize: "11px", color: "var(--cor-muted)", fontFamily: "var(--font-family-mono)" }}>Regular</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
