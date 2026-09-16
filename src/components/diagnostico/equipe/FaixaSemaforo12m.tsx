"use client";

import React, { useEffect, useState } from "react";
import { chamarApi, formatarData } from "@/lib/diagnostico/cliente";
import { ultimas52, type FotoSemana } from "@/lib/acompanhamento/semaforo-semanal";
import { textoMuted } from "./estilos";

const CORES: Record<FotoSemana["cor"], string> = {
  verde: "#10b981",
  amarelo: "#f59e0b",
  vermelho: "#ef4444",
};

const ROTULO: Record<FotoSemana["cor"], string> = { verde: "Verde", amarelo: "Amarelo", vermelho: "Vermelho" };

/** Faixa das últimas 52 semanas do semáforo, com contagem em texto (não depende só da cor). */
export function FaixaSemaforo12m({ matriculaId }: { matriculaId: string }) {
  const [historico, setHistorico] = useState<FotoSemana[] | null>(null);
  const [erro, setErro] = useState(false);

  useEffect(() => {
    let ativo = true;
    chamarApi<{ historico: FotoSemana[] }>(`/api/semaforo/historico?matricula=${encodeURIComponent(matriculaId)}&semanas=52`)
      .then((r) => ativo && setHistorico(ultimas52(r.historico)))
      .catch(() => ativo && setErro(true));
    return () => {
      ativo = false;
    };
  }, [matriculaId]);

  if (erro) return <p style={textoMuted}>Histórico do semáforo indisponível.</p>;
  if (!historico) return <p style={textoMuted}>Carregando histórico…</p>;
  if (historico.length === 0) return <p style={textoMuted}>Sem histórico semanal gravado ainda.</p>;

  const contagem = (cor: FotoSemana["cor"]) => historico.filter((f) => f.cor === cor).length;

  return (
    <div style={{ marginTop: "var(--espaco-md)" }}>
      <h3 style={{ fontSize: "14px", margin: "0 0 6px" }}>Últimos 12 meses ({historico.length} semanas)</h3>
      <div
        role="img"
        aria-label={`Semáforo semanal: ${contagem("verde")} verdes, ${contagem("amarelo")} amarelas, ${contagem("vermelho")} vermelhas`}
        style={{ display: "flex", gap: "2px", flexWrap: "wrap" }}
      >
        {historico.map((f) => (
          <span
            key={f.semana}
            title={`Semana de ${formatarData(`${f.semana}T12:00:00Z`)}: ${ROTULO[f.cor]}${f.motivo ? ` — ${f.motivo}` : ""}`}
            style={{ width: "8px", height: "20px", borderRadius: "2px", backgroundColor: CORES[f.cor] }}
          />
        ))}
      </div>
      <p style={{ ...textoMuted, margin: "6px 0 0", fontVariantNumeric: "tabular-nums lining-nums" }}>
        {contagem("verde")} semanas verdes · {contagem("amarelo")} amarelas · {contagem("vermelho")} vermelhas
      </p>
    </div>
  );
}
