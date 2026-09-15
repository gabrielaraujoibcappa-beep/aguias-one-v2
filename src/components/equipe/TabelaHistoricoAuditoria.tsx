"use client";

import React, { useState, useMemo } from "react";
import { EntregaPendente, filtrarEntregasAuditoria } from "@/lib/api/auditoria";
import { StatusDot } from "../ui/StatusDot";
import { IconSearch } from "../ui/Icons";

interface TabelaHistoricoAuditoriaProps {
  entregas: EntregaPendente[];
  onSelecionar: (entrega: EntregaPendente) => void;
}

export function TabelaHistoricoAuditoria({ entregas, onSelecionar }: TabelaHistoricoAuditoriaProps) {
  const [busca, setBusca] = useState("");
  const [decisaoFiltro, setDecisaoFiltro] = useState<"todos" | "aprovado" | "ajuste_solicitado">("todos");
  const [avaliadorFiltro, setAvaliadorFiltro] = useState<string>("todos");

  // Avaliadores únicos presentes no histórico
  const avaliadoresDisponiveis = useMemo(() => {
    const setAvaliadores = new Set<string>();
    entregas.forEach((e) => {
      if (e.avaliadoPor) setAvaliadores.add(e.avaliadoPor);
    });
    return Array.from(setAvaliadores);
  }, [entregas]);

  const totalAprovadas = useMemo(() => entregas.filter((e) => e.status === "aprovado").length, [entregas]);
  const totalAjustes = useMemo(() => entregas.filter((e) => e.status === "ajuste_solicitado").length, [entregas]);

  const temFiltroAtivo = busca.trim().length > 0 || decisaoFiltro !== "todos" || avaliadorFiltro !== "todos";

  const entregasFiltradas = useMemo(() => {
    return filtrarEntregasAuditoria(entregas, {
      busca,
      decisao: decisaoFiltro === "todos" ? undefined : decisaoFiltro,
      avaliador: avaliadorFiltro,
    });
  }, [entregas, busca, decisaoFiltro, avaliadorFiltro]);

  const limparFiltros = () => {
    setBusca("");
    setDecisaoFiltro("todos");
    setAvaliadorFiltro("todos");
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--espaco-lg)", flexWrap: "wrap", gap: "var(--espaco-sm)" }}>
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: 600 }}>Histórico de Entregas Avaliadas</h3>
          <span style={{ fontSize: "13px", color: "var(--cor-muted)" }}>
            Exibindo {entregasFiltradas.length} de {entregas.length} parecer(es) emitido(s)
          </span>
        </div>
        {temFiltroAtivo && (
          <button
            onClick={limparFiltros}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--cor-deep-green)",
              fontSize: "12px",
              cursor: "pointer",
              fontWeight: 500,
              textDecoration: "underline",
            }}
          >
            Limpar Filtros
          </button>
        )}
      </div>

      {/* Barra de Filtros do Histórico */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--espaco-md)",
        paddingBottom: "var(--espaco-lg)",
        marginBottom: "var(--espaco-lg)",
        borderBottom: "1px solid var(--cor-border-light)",
      }}>
        <div style={{ display: "flex", gap: "var(--espaco-md)", flexWrap: "wrap", alignItems: "center" }}>
          {/* Campo de Busca por Aluno ou Parecer */}
          <div style={{
            position: "relative",
            flex: "1 1 260px",
            display: "flex",
            alignItems: "center",
          }}>
            <span style={{ position: "absolute", left: "12px", color: "var(--cor-muted)", display: "flex" }}>
              <IconSearch size={15} />
            </span>
            <input
              type="text"
              placeholder="Buscar por aluno, parecer ou módulo..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px 8px 36px",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--cor-border-light)",
                fontSize: "13px",
                outline: "none",
              }}
            />
          </div>

          {/* Seletor de Avaliador */}
          <div style={{ flex: "0 1 240px" }}>
            <select
              value={avaliadorFiltro}
              onChange={(e) => setAvaliadorFiltro(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 12px",
                borderRadius: "var(--radius-xs)",
                border: "1px solid var(--cor-border-light)",
                fontSize: "13px",
                backgroundColor: "#fff",
                outline: "none",
              }}
            >
              <option value="todos">Todos os Avaliadores ({entregas.length})</option>
              {avaliadoresDisponiveis.map((av) => (
                <option key={av} value={av}>
                  {av}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chips de Decisão */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--cor-muted)", marginRight: "4px" }}>
            Decisão:
          </span>

          <button
            type="button"
            onClick={() => setDecisaoFiltro("todos")}
            style={{
              padding: "5px 12px",
              borderRadius: "var(--radius-pill)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              border: decisaoFiltro === "todos" ? "1px solid var(--cor-deep-green)" : "1px solid var(--cor-border-light)",
              backgroundColor: decisaoFiltro === "todos" ? "var(--cor-soft-stone)" : "#fff",
              color: decisaoFiltro === "todos" ? "var(--cor-deep-green)" : "#374151",
            }}
          >
            Todas ({entregas.length})
          </button>

          <button
            type="button"
            onClick={() => setDecisaoFiltro("aprovado")}
            style={{
              padding: "5px 12px",
              borderRadius: "var(--radius-pill)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              border: decisaoFiltro === "aprovado" ? "1px solid var(--cor-deep-green)" : "1px solid var(--cor-border-light)",
              backgroundColor: decisaoFiltro === "aprovado" ? "var(--cor-soft-stone)" : "#fff",
              color: decisaoFiltro === "aprovado" ? "var(--cor-deep-green)" : "#374151",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <StatusDot status="verde" size={6} />
            <span>Aprovadas ({totalAprovadas})</span>
          </button>

          <button
            type="button"
            onClick={() => setDecisaoFiltro("ajuste_solicitado")}
            style={{
              padding: "5px 12px",
              borderRadius: "var(--radius-pill)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              border: decisaoFiltro === "ajuste_solicitado" ? "1px solid var(--cor-deep-green)" : "1px solid var(--cor-border-light)",
              backgroundColor: decisaoFiltro === "ajuste_solicitado" ? "var(--cor-soft-stone)" : "#fff",
              color: decisaoFiltro === "ajuste_solicitado" ? "var(--cor-deep-green)" : "#374151",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <StatusDot status="amarelo" size={6} />
            <span>Ajuste Solicitado ({totalAjustes})</span>
          </button>
        </div>
      </div>

      {/* Tabela do Histórico */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--cor-hairline)", color: "var(--cor-muted)" }}>
              <th style={{ padding: "12px 8px" }}>Aluno</th>
              <th style={{ padding: "12px 8px" }}>Módulo</th>
              <th style={{ padding: "12px 8px" }}>Decisão</th>
              <th style={{ padding: "12px 8px" }}>Parecer Técnico</th>
              <th style={{ padding: "12px 8px" }}>Avaliador</th>
              <th style={{ padding: "12px 8px", textAlign: "right" }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {entregasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "32px 0", textAlign: "center", color: "var(--cor-muted)" }}>
                  {temFiltroAtivo ? (
                    <div>
                      <p style={{ marginBottom: "8px" }}>Nenhum parecer encontrado para os filtros selecionados.</p>
                      <button onClick={limparFiltros} className="btn-secondary" style={{ fontSize: "12px", padding: "4px 12px" }}>
                        Limpar Filtros
                      </button>
                    </div>
                  ) : (
                    "Nenhuma entrega avaliada registrada até o momento."
                  )}
                </td>
              </tr>
            ) : (
              entregasFiltradas.map((entrega) => {
                const isAprovado = entrega.status === "aprovado";

                return (
                  <tr
                    key={entrega.id}
                    onClick={() => onSelecionar(entrega)}
                    style={{
                      borderBottom: "1px solid var(--cor-border-light)",
                      cursor: "pointer",
                      transition: "background-color 0.15s ease",
                    }}
                  >
                    <td style={{ padding: "14px 8px" }}>
                      <div style={{ fontWeight: 500 }}>{entrega.alunoNome}</div>
                      {entrega.alunoEmail && (
                        <div style={{ fontSize: "12px", color: "var(--cor-muted)" }}>{entrega.alunoEmail}</div>
                      )}
                    </td>
                    <td style={{ padding: "14px 8px" }}>{entrega.moduloTitulo}</td>
                    <td style={{ padding: "14px 8px" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 500 }}>
                        <StatusDot status={isAprovado ? "verde" : "amarelo"} size={6} />
                        {isAprovado ? "Aprovado" : "Ajuste Solicitado"}
                      </span>
                    </td>
                    <td style={{ padding: "14px 8px", fontSize: "13px", color: "var(--cor-muted)", maxWidth: "280px" }}>
                      {entrega.parecerTexto || "Sem observações adicionais."}
                    </td>
                    <td style={{ padding: "14px 8px", fontSize: "13px", color: "var(--cor-muted)" }}>
                      <div>{entrega.avaliadoPor || "Equipe"}</div>
                      {entrega.avaliadoEm && (
                        <div style={{ fontSize: "11px", fontFamily: "var(--font-family-mono)", color: "var(--cor-muted)" }}>
                          {new Date(entrega.avaliadoEm).toLocaleDateString("pt-BR")}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "14px 8px", textAlign: "right" }}>
                      <button className="btn-secondary" style={{ fontSize: "12px", padding: "4px 12px" }}>
                        Visualizar
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
