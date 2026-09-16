"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  PeriodoFiltroState,
  AtalhoPeriodo,
  Granularidade,
  calcularIntervaloAtalho,
  validarIntervaloCustomizado,
  formatarDataBR,
  criarPeriodoPadrao,
} from "@/lib/periodo/calculo-periodo";
import { IconCalendar } from "./Icons";

export interface FiltroPeriodoProps {
  valor: PeriodoFiltroState;
  onChange: (novoPeriodo: PeriodoFiltroState) => void;
  onAtualizarDados?: () => void;
  carregando?: boolean;
  escopoNome?: string;
}

export function FiltroPeriodo({
  valor,
  onChange,
  onAtualizarDados,
  carregando = false,
  escopoNome,
}: FiltroPeriodoProps) {
  const [aberto, setAberto] = useState(false);
  const [dataInicioTemp, setDataInicioTemp] = useState(valor.dataInicio);
  const [dataFimTemp, setDataFimTemp] = useState(valor.dataFim);
  const [erroValidacao, setErroValidacao] = useState<string | null>(null);

  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const escopoAtual = escopoNome || valor.escopo;

  // Sincroniza temporários ao abrir
  useEffect(() => {
    if (aberto) {
      setDataInicioTemp(valor.dataInicio);
      setDataFimTemp(valor.dataFim);
      setErroValidacao(null);
    }
  }, [aberto, valor.dataInicio, valor.dataFim]);

  // Tecla Escape para fechar com foco retornado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && aberto) {
        setAberto(false);
        triggerRef.current?.focus();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [aberto]);

  // Fechar ao clicar fora
  useEffect(() => {
    const handleClickFora = (e: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setAberto(false);
      }
    };
    if (aberto) {
      document.addEventListener("mousedown", handleClickFora);
    }
    return () => document.removeEventListener("mousedown", handleClickFora);
  }, [aberto]);

  const aplicarAtalho = (atalho: AtalhoPeriodo) => {
    const { dataInicio, dataFim } = calcularIntervaloAtalho(atalho, valor.ultimaAtualizacao);
    onChange({
      ...valor,
      tipo: "relativo",
      atalho,
      dataInicio,
      dataFim,
    });
    setAberto(false);
    triggerRef.current?.focus();
  };

  const aplicarCustomizado = () => {
    const validacao = validarIntervaloCustomizado(dataInicioTemp, dataFimTemp, true);
    if (!validacao.valido) {
      setErroValidacao(validacao.erro || "Intervalo inválido.");
      return;
    }

    setErroValidacao(null);
    onChange({
      ...valor,
      tipo: "customizado",
      atalho: undefined,
      dataInicio: dataInicioTemp,
      dataFim: dataFimTemp,
    });
    setAberto(false);
    triggerRef.current?.focus();
  };

  const restaurarPadrao = () => {
    const padrao = criarPeriodoPadrao(escopoAtual);
    onChange(padrao);
    setAberto(false);
    triggerRef.current?.focus();
  };

  const alternarGranularidade = (g: Granularidade) => {
    onChange({
      ...valor,
      granularidade: g,
    });
  };

  // Rótulo por extenso do período ativo
  const rotuloAtalho = valor.tipo === "relativo" && valor.atalho
    ? calcularIntervaloAtalho(valor.atalho, valor.ultimaAtualizacao).rotulo
    : "Personalizado";

  const textoPeriodoCompleto = `${rotuloAtalho} (${formatarDataBR(valor.dataInicio)} – ${formatarDataBR(valor.dataFim)})`;

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        border: "1px solid var(--cor-border-light)",
        borderRadius: "var(--radius-sm)",
        padding: "12px 16px",
        marginBottom: "var(--espaco-lg)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
      }}
    >
      {/* Barra de Contexto: Escopo, Período Ativo, Granularidade e Fuso */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px",
        }}
      >
        {/* Esquerda: Escopo e Trigger do Período */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Badge de Escopo Explícito */}
          <span
            style={{
              fontSize: "11px",
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              backgroundColor: "var(--cor-soft-stone)",
              color: "var(--cor-slate)",
              padding: "4px 8px",
              borderRadius: "var(--radius-xs)",
              fontFamily: "var(--font-family-mono)",
            }}
          >
            Escopo: {escopoAtual}
          </span>

          {/* Trigger Rico do Filtro de Período (Nunca apenas um ícone silencioso) */}
          <div style={{ position: "relative" }}>
            <button
              ref={triggerRef}
              type="button"
              onClick={() => setAberto(!aberto)}
              aria-haspopup="dialog"
              aria-expanded={aberto}
              aria-label={`Filtro de período: ${textoPeriodoCompleto}, Escopo: ${escopoAtual}`}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 12px",
                backgroundColor: aberto ? "var(--cor-canvas)" : "#ffffff",
                border: "1px solid var(--cor-hairline)",
                borderRadius: "var(--radius-xs)",
                fontSize: "13px",
                fontWeight: 600,
                color: "var(--cor-ink)",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              <IconCalendar size={15} style={{ color: "var(--cor-slate)" }} />
              <span>{textoPeriodoCompleto}</span>
              <span
                style={{
                  fontSize: "10px",
                  padding: "1px 5px",
                  borderRadius: "var(--radius-pill)",
                  backgroundColor: valor.tipo === "relativo" ? "rgba(16, 185, 129, 0.1)" : "rgba(59, 130, 246, 0.1)",
                  color: valor.tipo === "relativo" ? "#047857" : "#1d4ed8",
                  fontWeight: 600,
                }}
              >
                {valor.tipo === "relativo" ? "Relativo" : "Fixo"}
              </span>
            </button>

            {/* Popover com Semântica W3C WAI-ARIA role="dialog" */}
            {aberto && (
              <div
                ref={popoverRef}
                role="dialog"
                aria-modal="true"
                aria-label="Selecionar período temporal"
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  marginTop: "6px",
                  zIndex: 50,
                  backgroundColor: "#ffffff",
                  border: "1px solid var(--cor-border-light)",
                  borderRadius: "var(--radius-sm)",
                  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
                  width: "360px",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--cor-slate)" }}>
                    Janela Temporal
                  </span>
                  <button
                    type="button"
                    onClick={restaurarPadrao}
                    style={{
                      background: "transparent",
                      border: "none",
                      color: "var(--cor-deep-green)",
                      fontSize: "11px",
                      fontWeight: 600,
                      cursor: "pointer",
                      textDecoration: "underline",
                    }}
                  >
                    Restaurar Padrão
                  </button>
                </div>

                {/* Atalhos Rápidos Relativos */}
                <div style={{ marginBottom: "14px" }}>
                  <div style={{ fontSize: "11px", color: "var(--cor-muted)", marginBottom: "6px" }}>
                    Atalhos Estratégicos:
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {(
                      [
                        { id: "hoje", rotulo: "Hoje" },
                        { id: "ultimos_7d", rotulo: "Últimos 7 dias" },
                        { id: "ultimos_30d", rotulo: "Últimos 30 dias (Padrão)" },
                        { id: "mes_atual", rotulo: "Mês atual" },
                        { id: "ciclo_atual", rotulo: "Ciclo ÁGUIAS ONE 2026.1" },
                      ] as const
                    ).map((item) => {
                      const rangeReal = calcularIntervaloAtalho(item.id, valor.ultimaAtualizacao);
                      const ativo = valor.tipo === "relativo" && valor.atalho === item.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => aplicarAtalho(item.id)}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            padding: "6px 10px",
                            borderRadius: "var(--radius-xs)",
                            border: ativo ? "1px solid var(--cor-deep-green)" : "1px solid transparent",
                            backgroundColor: ativo ? "rgba(0, 60, 51, 0.05)" : "transparent",
                            color: ativo ? "var(--cor-deep-green)" : "var(--cor-ink)",
                            fontWeight: ativo ? 600 : 400,
                            fontSize: "12px",
                            cursor: "pointer",
                            textAlign: "left",
                          }}
                        >
                          <span>{item.rotulo}</span>
                          <span style={{ fontSize: "11px", color: "var(--cor-muted)", fontFamily: "var(--font-family-mono)" }}>
                            {formatarDataBR(rangeReal.dataInicio)} – {formatarDataBR(rangeReal.dataFim)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Intervalo Personalizado (Custom Range com Validação e Aplicação Manual) */}
                <div style={{ borderTop: "1px solid var(--cor-border-light)", paddingTop: "12px" }}>
                  <div style={{ fontSize: "11px", fontWeight: 600, color: "var(--cor-slate)", marginBottom: "8px" }}>
                    Intervalo Personalizado (Fixo):
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", textTransform: "uppercase", color: "var(--cor-muted)", marginBottom: "2px" }}>
                        De:
                      </label>
                      <input
                        type="date"
                        value={dataInicioTemp}
                        onChange={(e) => setDataInicioTemp(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "5px 8px",
                          fontSize: "12px",
                          borderRadius: "var(--radius-xs)",
                          border: "1px solid var(--cor-border-light)",
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "10px", textTransform: "uppercase", color: "var(--cor-muted)", marginBottom: "2px" }}>
                        Até:
                      </label>
                      <input
                        type="date"
                        value={dataFimTemp}
                        onChange={(e) => setDataFimTemp(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "5px 8px",
                          fontSize: "12px",
                          borderRadius: "var(--radius-xs)",
                          border: "1px solid var(--cor-border-light)",
                        }}
                      />
                    </div>
                  </div>

                  {erroValidacao && (
                    <div
                      role="alert"
                      style={{
                        color: "#b91c1c",
                        fontSize: "11px",
                        backgroundColor: "#fef2f2",
                        border: "1px solid #fecaca",
                        padding: "6px 8px",
                        borderRadius: "var(--radius-xs)",
                        marginBottom: "10px",
                      }}
                    >
                      {erroValidacao}
                    </div>
                  )}

                  <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
                    <button
                      type="button"
                      onClick={() => setAberto(false)}
                      className="btn-secondary"
                      style={{ fontSize: "12px", padding: "5px 10px" }}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={aplicarCustomizado}
                      className="btn-primary"
                      style={{ fontSize: "12px", padding: "5px 12px" }}
                    >
                      Aplicar Filtro
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Direita: Granularidade Ortogonal, Fuso Horário e Reload */}
        <div style={{ display: "flex", alignItems: "center", gap: "14px", flexWrap: "wrap" }}>
          {/* Granularidade Desacoplada do Período */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "11px", color: "var(--cor-muted)", fontWeight: 500 }}>Granularidade:</span>
            <div style={{ display: "inline-flex", backgroundColor: "var(--cor-soft-stone)", padding: "2px", borderRadius: "var(--radius-xs)" }}>
              {(["dia", "semana", "mes"] as const).map((g) => {
                const ativo = valor.granularidade === g;
                const rotulo = g === "dia" ? "Dia" : g === "semana" ? "Semana" : "Mês";
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => alternarGranularidade(g)}
                    style={{
                      border: "none",
                      backgroundColor: ativo ? "#ffffff" : "transparent",
                      color: ativo ? "var(--cor-ink)" : "var(--cor-muted)",
                      fontWeight: ativo ? 600 : 400,
                      fontSize: "11px",
                      padding: "3px 8px",
                      borderRadius: "var(--radius-xs)",
                      cursor: "pointer",
                      boxShadow: ativo ? "0 1px 2px rgba(0,0,0,0.05)" : "none",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {rotulo}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fuso Horário Explícito e Sincronização */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span
              style={{
                fontSize: "11px",
                color: "var(--cor-muted)",
                fontFamily: "var(--font-family-mono)",
              }}
              title="Fuso de referência das métricas"
            >
              Fuso: {valor.fusoHorario}
            </span>

            {onAtualizarDados && (
              <button
                type="button"
                onClick={onAtualizarDados}
                disabled={carregando}
                aria-label="Atualizar dados do período"
                style={{
                  background: "transparent",
                  border: "1px solid var(--cor-hairline)",
                  borderRadius: "var(--radius-xs)",
                  padding: "3px 8px",
                  fontSize: "11px",
                  cursor: carregando ? "not-allowed" : "pointer",
                  color: "var(--cor-slate)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <span>{carregando ? "Atualizando..." : "Atualizar"}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
