"use client";

import React, { useState, useMemo } from "react";
import { EntregaPendente, filtrarEntregasAuditoria } from "@/lib/api/auditoria";
import { IconSearch } from "../ui/Icons";

interface FilaAuditoriaProps {
  entregas: EntregaPendente[];
  onSelecionar: (entrega: EntregaPendente) => void;
}

export function FilaAuditoria({ entregas, onSelecionar }: FilaAuditoriaProps) {
  const [busca, setBusca] = useState("");
  const [moduloSelecionado, setModuloSelecionado] = useState("todos");
  const [apenasComDuvida, setApenasComDuvida] = useState(false);
  const [apenasComTrava, setApenasComTrava] = useState(false);

  // Módulos disponíveis para o select
  const modulosDisponiveis = useMemo(() => {
    const setModulos = new Set<string>();
    entregas.forEach((e) => setModulos.add(e.moduloTitulo));
    return Array.from(setModulos);
  }, [entregas]);

  // Contagens para badges de filtro
  const totalComDuvida = useMemo(() => entregas.filter((e) => Boolean(e.duvidaCall?.trim())).length, [entregas]);
  const totalComTrava = useMemo(() => entregas.filter((e) => Boolean(e.travou?.trim())).length, [entregas]);

  // Filtro ativo
  const temFiltroAtivo = busca.trim().length > 0 || moduloSelecionado !== "todos" || apenasComDuvida || apenasComTrava;

  const entregasFiltradas = useMemo(() => {
    return filtrarEntregasAuditoria(entregas, {
      busca,
      modulo: moduloSelecionado,
      apenasComDuvida,
      apenasComTrava,
    });
  }, [entregas, busca, moduloSelecionado, apenasComDuvida, apenasComTrava]);

  const limparFiltros = () => {
    setBusca("");
    setModuloSelecionado("todos");
    setApenasComDuvida(false);
    setApenasComTrava(false);
  };

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--espaco-lg)", flexWrap: "wrap", gap: "var(--espaco-sm)" }}>
        <div>
          <h3 style={{ fontSize: "18px", fontWeight: 600 }}>Entregas Aguardando Auditoria</h3>
          <span style={{ fontSize: "13px", color: "var(--cor-muted)" }}>
            Exibindo {entregasFiltradas.length} de {entregas.length} entrega(s) pendente(s)
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

      {/* Barra de Filtros Operacionais */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: "var(--espaco-md)",
        paddingBottom: "var(--espaco-lg)",
        marginBottom: "var(--espaco-lg)",
        borderBottom: "1px solid var(--cor-border-light)",
      }}>
        <div style={{ display: "flex", gap: "var(--espaco-md)", flexWrap: "wrap", alignItems: "center" }}>
          {/* Campo de Busca Textual */}
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
              placeholder="Buscar por aluno ou módulo..."
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

          {/* Seletor de Módulo */}
          <div style={{ flex: "0 1 240px" }}>
            <select
              value={moduloSelecionado}
              onChange={(e) => setModuloSelecionado(e.target.value)}
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
              <option value="todos">Todos os Módulos ({entregas.length})</option>
              {modulosDisponiveis.map((mod) => (
                <option key={mod} value={mod}>
                  {mod}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chips de Filtro Rápido */}
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "12px", color: "var(--cor-muted)", marginRight: "4px" }}>
            Priorizar:
          </span>

          <button
            type="button"
            onClick={() => setApenasComDuvida(!apenasComDuvida)}
            style={{
              padding: "5px 12px",
              borderRadius: "var(--radius-pill)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              border: apenasComDuvida ? "1px solid var(--cor-deep-green)" : "1px solid var(--cor-border-light)",
              backgroundColor: apenasComDuvida ? "var(--cor-soft-stone)" : "#fff",
              color: apenasComDuvida ? "var(--cor-deep-green)" : "#374151",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>Dúvida de Call de 4ª</span>
            <span style={{
              fontSize: "11px",
              fontFamily: "var(--font-family-mono)",
              fontWeight: 600,
              padding: "1px 6px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: apenasComDuvida ? "var(--cor-deep-green)" : "#f3f4f6",
              color: apenasComDuvida ? "#fff" : "var(--cor-muted)",
            }}>
              {totalComDuvida}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setApenasComTrava(!apenasComTrava)}
            style={{
              padding: "5px 12px",
              borderRadius: "var(--radius-pill)",
              fontSize: "12px",
              fontWeight: 500,
              cursor: "pointer",
              border: apenasComTrava ? "1px solid var(--cor-deep-green)" : "1px solid var(--cor-border-light)",
              backgroundColor: apenasComTrava ? "var(--cor-soft-stone)" : "#fff",
              color: apenasComTrava ? "var(--cor-deep-green)" : "#374151",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>Relato de Trava</span>
            <span style={{
              fontSize: "11px",
              fontFamily: "var(--font-family-mono)",
              fontWeight: 600,
              padding: "1px 6px",
              borderRadius: "var(--radius-pill)",
              backgroundColor: apenasComTrava ? "var(--cor-deep-green)" : "#f3f4f6",
              color: apenasComTrava ? "#fff" : "var(--cor-muted)",
            }}>
              {totalComTrava}
            </span>
          </button>
        </div>
      </div>

      {/* Tabela de Entregas */}
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--cor-hairline)", color: "var(--cor-muted)" }}>
              <th style={{ padding: "12px 8px" }}>Aluno</th>
              <th style={{ padding: "12px 8px" }}>Módulo</th>
              <th style={{ padding: "12px 8px" }}>Destaques</th>
              <th style={{ padding: "12px 8px" }}>Evidências</th>
              <th style={{ padding: "12px 8px" }}>Data de Envio</th>
              <th style={{ padding: "12px 8px", textAlign: "right" }}>Ação</th>
            </tr>
          </thead>
          <tbody>
            {entregasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: "32px 0", textAlign: "center", color: "var(--cor-muted)" }}>
                  {temFiltroAtivo ? (
                    <div>
                      <p style={{ marginBottom: "8px" }}>Nenhuma entrega encontrada para os filtros selecionados.</p>
                      <button onClick={limparFiltros} className="btn-secondary" style={{ fontSize: "12px", padding: "4px 12px" }}>
                        Limpar Filtros
                      </button>
                    </div>
                  ) : (
                    "Nenhuma entrega pendente de auditoria no momento."
                  )}
                </td>
              </tr>
            ) : (
              entregasFiltradas.map((entrega) => (
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
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {entrega.duvidaCall && (
                        <span style={{
                          fontSize: "11px",
                          padding: "2px 7px",
                          borderRadius: "var(--radius-xs)",
                          backgroundColor: "#eff6ff",
                          color: "#1e40af",
                          fontWeight: 500,
                        }}>
                          Dúvida p/ 4ª
                        </span>
                      )}
                      {entrega.travou && (
                        <span style={{
                          fontSize: "11px",
                          padding: "2px 7px",
                          borderRadius: "var(--radius-xs)",
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                          fontWeight: 500,
                        }}>
                          Trava relatada
                        </span>
                      )}
                      {!entrega.duvidaCall && !entrega.travou && (
                        <span style={{ fontSize: "12px", color: "var(--cor-muted)" }}>—</span>
                      )}
                    </div>
                  </td>
                  <td style={{ padding: "14px 8px" }}>
                    <span style={{ fontSize: "12px", color: "var(--cor-muted)" }}>
                      {entrega.links.length} link(s) · {entrega.arquivos.length} print(s)
                    </span>
                  </td>
                  <td style={{ padding: "14px 8px", fontSize: "13px", color: "var(--cor-muted)", fontFamily: "var(--font-family-mono)" }}>
                    {new Date(entrega.enviadoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                  </td>
                  <td style={{ padding: "14px 8px", textAlign: "right" }}>
                    <button className="btn-secondary" style={{ fontSize: "12px", padding: "4px 12px" }}>
                      Auditar →
                    </button>
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
