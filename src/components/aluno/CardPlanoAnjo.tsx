"use client";

import React, { useEffect, useState } from "react";
import { ROTULOS_TIPO_ANJO, formatarData } from "@/lib/diagnostico/cliente";
import { ROTULOS_STATUS_PLANO, type StatusPlano, type TipoPlano } from "@/lib/acompanhamento/plano";

interface Plano {
  tipo: TipoPlano;
  peca1: string;
  evidencia1: string;
  data1: string;
  peca2: string | null;
  cadenciaDias: number;
  horarioReal: string | null;
  status: StatusPlano;
}

/** Plano dos 6 meses escrito pelo Anjo. Só leitura; aparece quando ativo ou em reavaliação. */
export function CardPlanoAnjo() {
  const [plano, setPlano] = useState<Plano | null>(null);

  useEffect(() => {
    let ativo = true;
    (async () => {
      try {
        const me = await fetch("/api/auth/me", { cache: "no-store" }).then((r) => (r.ok ? r.json() : null));
        const matriculaId = me?.usuario?.matriculaId;
        if (!matriculaId) return;
        const res = await fetch(`/api/anjo/plano/${encodeURIComponent(matriculaId)}`, { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (ativo && json?.plano && ["ativo", "reavaliar"].includes(json.plano.status)) setPlano(json.plano);
      } catch {
        // sem plano visível: o card simplesmente não aparece
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  if (!plano) return null;

  return (
    <section className="card" aria-labelledby="card-plano-anjo" style={{ padding: "var(--espaco-lg)", marginBottom: "var(--espaco-lg)" }}>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "var(--espaco-sm)", alignItems: "baseline" }}>
        <h2 id="card-plano-anjo" style={{ fontSize: "18px", margin: 0 }}>
          Seu plano dos 6 meses
        </h2>
        <span className="adm-chip neutro">{ROTULOS_STATUS_PLANO[plano.status]}</span>
      </div>
      <p style={{ color: "var(--cor-muted)", fontSize: "13px", margin: "4px 0 var(--espaco-md)" }}>
        Escrito com o Anjo · {ROTULOS_TIPO_ANJO[plano.tipo]}. Você continua na quarta normalmente.
      </p>
      <dl style={{ display: "grid", gap: "var(--espaco-sm)", margin: 0 }}>
        <div>
          <dt style={{ fontSize: "12px", color: "var(--cor-muted)" }}>Peça 1 · até {formatarData(`${plano.data1}T12:00:00`)}</dt>
          <dd style={{ margin: 0, fontWeight: 600, overflowWrap: "anywhere" }}>{plano.peca1}</dd>
        </div>
        <div>
          <dt style={{ fontSize: "12px", color: "var(--cor-muted)" }}>Evidência que o Anjo vai ver</dt>
          <dd style={{ margin: 0, overflowWrap: "anywhere" }}>{plano.evidencia1}</dd>
        </div>
        {plano.peca2 && (
          <div>
            <dt style={{ fontSize: "12px", color: "var(--cor-muted)" }}>Peça 2</dt>
            <dd style={{ margin: 0, overflowWrap: "anywhere" }}>{plano.peca2}</dd>
          </div>
        )}
        <div>
          <dt style={{ fontSize: "12px", color: "var(--cor-muted)" }}>Ritmo</dt>
          <dd style={{ margin: 0, fontVariantNumeric: "tabular-nums lining-nums" }}>
            Mensagem do Anjo a cada {plano.cadenciaDias} dias{plano.horarioReal ? ` · seu horário: ${plano.horarioReal}` : ""}
          </dd>
        </div>
      </dl>
    </section>
  );
}
