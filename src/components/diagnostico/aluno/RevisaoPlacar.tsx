"use client";

import React from "react";
import { BLOCOS, PayloadDiagnostico } from "@/lib/diagnostico/campos";
import { campoVisivel } from "@/lib/diagnostico/regras";
import { formatarValorCampo } from "@/lib/diagnostico/cliente";

interface RevisaoPlacarProps {
  payload: PayloadDiagnostico;
  /** Leva de volta ao bloco informado para corrigir uma resposta. */
  onEditarBloco: (passo: number) => void;
}

/**
 * Última etapa antes do envio: mostra o que foi respondido, bloco a bloco, com
 * atalho para corrigir cada um. O placar congela depois do envio, por isso a
 * revisão (Câmara UX — etapas em formulários longos).
 */
export function RevisaoPlacar({ payload, onEditarBloco }: RevisaoPlacarProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-md)" }}>
      {BLOCOS.map((bloco, indice) => {
        const campos = bloco.campos.filter((campo) => campoVisivel(campo, payload));
        if (campos.length === 0) return null;

        return (
          <section key={bloco.numero} className="card" aria-labelledby={`revisao-bloco-${bloco.numero}`}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: "12px", marginBottom: "var(--espaco-sm)" }}>
              <h2 id={`revisao-bloco-${bloco.numero}`} style={{ fontSize: "16px", margin: 0 }}>
                {bloco.titulo}
              </h2>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => onEditarBloco(indice + 1)}
                style={{ fontSize: "12px", padding: "4px 10px", flexShrink: 0 }}
              >
                Editar <span className="sr-only">as respostas de {bloco.titulo}</span>
              </button>
            </div>

            <dl style={{ display: "grid", gridTemplateColumns: "minmax(140px, 40%) 1fr", gap: "6px 12px", margin: 0, fontSize: "13px" }}>
              {campos.map((campo) => (
                <React.Fragment key={campo.id}>
                  <dt style={{ color: "var(--cor-muted)" }}>{campo.rotulo}</dt>
                  <dd style={{ margin: 0, overflowWrap: "anywhere" }}>
                    {formatarValorCampo(campo.id, campo.tipo, payload[campo.id])}
                  </dd>
                </React.Fragment>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}
