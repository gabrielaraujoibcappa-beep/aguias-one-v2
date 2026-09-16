import React from "react";
import { PECAS_DE_PE, type PayloadDiagnostico } from "@/lib/diagnostico/campos";
import { numeroTabular } from "./estilos";

export function PecasDePe({ payload }: { payload: PayloadDiagnostico }) {
  const respondidas = PECAS_DE_PE.some((p) => typeof payload[p.valor] === "boolean");
  const total = PECAS_DE_PE.filter((p) => payload[p.valor] === true).length;

  if (!respondidas) return <p style={{ color: "var(--cor-muted)", fontSize: "13px" }}>Peças ainda não informadas.</p>;

  return (
    <div>
      <div style={{ fontSize: "20px", fontWeight: 700, marginBottom: "var(--espaco-sm)", ...numeroTabular }}>{total}/10 de pé</div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "6px" }}>
        {PECAS_DE_PE.map((p) => {
          const v = payload[p.valor];
          return (
            <li key={p.valor} style={{ display: "flex", gap: "8px", alignItems: "baseline", fontSize: "14px" }}>
              <span className={`adm-chip ${v === true ? "presente" : v === false ? "falta" : "neutro"}`} style={{ minWidth: "44px", justifyContent: "center" }}>
                {v === true ? "Sim" : v === false ? "Não" : "—"}
              </span>
              <span>{p.rotulo}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
