"use client";

import React from "react";
import { DeclaracaoFaturamento, formatarMesReferencia, formatarMoedaBRL, mesReferenciaAtual } from "@/lib/api/faturamento";
import { CanalItem } from "@/lib/api/canais";
import { ModuloItem } from "@/lib/api/modulos-liberacao";
import { EntregaPendente } from "@/lib/api/auditoria";
import { StatusDot } from "../ui/StatusDot";
import { IconCurrency, IconCheckCircle, IconGlobe } from "../ui/Icons";

interface PainelKpisAlunoProps {
  faturamentos: DeclaracaoFaturamento[];
  canais: CanalItem[];
  modulos: ModuloItem[];
  entregas: EntregaPendente[];
  semaforo?: "verde" | "amarelo" | "vermelho";
  /** Meta mensal derivada da meta anual (meta anual / 12). */
  metaMensal?: number;
  /** Horário do encontro semanal da turma do aluno, quando conhecido. */
  horarioEncontro?: string;
}

export function PainelKpisAluno({
  faturamentos,
  canais,
  modulos,
  entregas,
  semaforo,
  metaMensal = 20000,
  horarioEncontro,
}: PainelKpisAlunoProps) {
  // Declaração mais recente; sem declaração, zero (nunca um valor de demonstração)
  const faturamentoAtual = faturamentos[0]?.valorBruto ?? 0;
  const cicloAtual = formatarMesReferencia(mesReferenciaAtual()).replace(" de ", " / ");
  const metaCiclo = metaMensal > 0 ? metaMensal : 20000;
  const percMeta = Math.min(Math.round((faturamentoAtual / metaCiclo) * 100), 100);

  const canaisAtivos = canais.filter((c) => c.status === "ativo").length;
  const modulosLiberados = modulos.filter((m) => m.status === "liberado").length;
  const entregasAprovadas = entregas.filter((e) => e.status === "aprovado").length;

  return (
    <div style={{ marginBottom: "var(--espaco-xl)" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        marginBottom: "var(--espaco-sm)",
      }}>
        <h3 style={{
          fontSize: "11px",
          fontWeight: 600,
          letterSpacing: "0.5px",
          textTransform: "uppercase",
          color: "var(--cor-slate)",
          fontFamily: "var(--font-family-mono)",
        }}>
          Indicadores do Perito
        </h3>
        <span style={{ fontSize: "11px", color: "var(--cor-muted)", fontFamily: "var(--font-family-mono)" }}>
          Ciclo: {cicloAtual}
        </span>
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
        gap: "var(--espaco-md)",
      }}>
        {/* KPI 1: Faturamento */}
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid var(--cor-border-light)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--espaco-md)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "var(--cor-slate)",
            marginBottom: "6px",
          }}>
            <span style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Receita Declarada
            </span>
            <IconCurrency size={14} />
          </div>
          <div style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "var(--cor-ink)",
            letterSpacing: "-0.5px",
            fontFamily: "var(--font-family-mono)",
          }}>
            {formatarMoedaBRL(faturamentoAtual)}
          </div>
          <div style={{ marginTop: "10px" }}>
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "11px",
              color: "var(--cor-muted)",
              marginBottom: "4px",
              fontFamily: "var(--font-family-mono)",
            }}>
              <span>Meta mensal {formatarMoedaBRL(metaCiclo)}</span>
              <span>{percMeta}%</span>
            </div>
            <div style={{ width: "100%", height: "4px", backgroundColor: "var(--cor-soft-stone)", borderRadius: "2px", overflow: "hidden" }}>
              <div style={{ width: `${percMeta}%`, height: "100%", backgroundColor: "var(--cor-primary)", borderRadius: "2px" }} />
            </div>
          </div>
        </div>

        {/* KPI 2: Entregas */}
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid var(--cor-border-light)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--espaco-md)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "var(--cor-slate)",
            marginBottom: "6px",
          }}>
            <span style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Check-ins Práticos
            </span>
            <IconCheckCircle size={14} />
          </div>
          <div style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "var(--cor-ink)",
            letterSpacing: "-0.5px",
            fontFamily: "var(--font-family-mono)",
          }}>
            {entregasAprovadas}{" "}
            <span style={{ fontSize: "14px", fontWeight: 400, color: "var(--cor-muted)" }}>
              / {modulosLiberados} liberados
            </span>
          </div>
          <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--cor-body-muted)" }}>
            Aprovados pelo Anjo: <strong style={{ color: "var(--cor-ink)" }}>{entregasAprovadas}</strong>
          </div>
        </div>

        {/* KPI 3: Canais */}
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid var(--cor-border-light)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--espaco-md)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "var(--cor-slate)",
            marginBottom: "6px",
          }}>
            <span style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Canais no Ar
            </span>
            <IconGlobe size={14} />
          </div>
          <div style={{
            fontSize: "24px",
            fontWeight: 600,
            color: "var(--cor-ink)",
            letterSpacing: "-0.5px",
            fontFamily: "var(--font-family-mono)",
          }}>
            {canaisAtivos}{" "}
            <span style={{ fontSize: "14px", fontWeight: 400, color: "var(--cor-muted)" }}>
              / 7 canais
            </span>
          </div>
          <div style={{ marginTop: "12px", fontSize: "12px", color: "var(--cor-body-muted)" }}>
            Ativos:{" "}
            <strong style={{ color: "var(--cor-ink)" }}>
              {canaisAtivos > 0 ? canais.filter((c) => c.status === "ativo").map((c) => c.nome).join(", ") : "nenhum ainda"}
            </strong>
          </div>
        </div>

        {/* KPI 4: Semáforo */}
        <div style={{
          backgroundColor: "#fff",
          border: "1px solid var(--cor-border-light)",
          borderRadius: "var(--radius-sm)",
          padding: "var(--espaco-md)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            color: "var(--cor-slate)",
            marginBottom: "6px",
          }}>
            <span style={{ fontSize: "11px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.4px" }}>
              Status Operacional
            </span>
            <StatusDot status={semaforo ?? "neutro"} />
          </div>
          <div style={{ marginTop: "4px" }}>
            <StatusDot
              status={semaforo ?? "neutro"}
              label={!semaforo ? "Sem avaliação" : semaforo === "verde" ? "Regular (Em dia)" : semaforo === "amarelo" ? "Atenção" : "Em Risco"}
              size={8}
            />
          </div>
          {horarioEncontro && (
            <div style={{ marginTop: "16px", fontSize: "12px", color: "var(--cor-muted)" }}>
              Encontro: <strong>{horarioEncontro}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
