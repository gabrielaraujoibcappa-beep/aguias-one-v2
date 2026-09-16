import React from "react";
import { PARCELAS_MES, ROTULOS_FONTE, ROTULOS_PARCELA, chaveMes, type PayloadDiagnostico } from "@/lib/diagnostico/campos";
import { formatarCentavos, formatarMesCurto } from "@/lib/diagnostico/cliente";
import type { ScoresDiagnostico } from "@/lib/diagnostico/regras";
import { grelhaKpis, numeroTabular, rolagemTabela, rotuloKpi, textoMuted, valorKpi } from "./estilos";

interface Props {
  payload: PayloadDiagnostico;
  scores: Partial<ScoresDiagnostico>;
  mesesReferencia: string[];
  /** Resumo sem grade mês a mês nem mix (visão do Concierge). */
  resumido?: boolean;
}

function Kpi({ rotulo, valor }: { rotulo: string; valor: React.ReactNode }) {
  return (
    <div>
      <div style={rotuloKpi}>{rotulo}</div>
      <div style={valorKpi}>{valor}</div>
    </div>
  );
}

export function PlacarEntrada({ payload, scores, mesesReferencia, resumido }: Props) {
  if (scores.media_6m_bruta === undefined && scores.n_meses_preenchidos === undefined) {
    return <p style={textoMuted}>O placar ainda não foi enviado.</p>;
  }

  const temParcelas = !resumido && mesesReferencia.some((_, i) => PARCELAS_MES.some((p) => chaveMes(i + 1, p) in payload));
  const temMix = !resumido && scores.pct_pericia !== undefined;

  return (
    <div>
      {scores.placar_nao_sei && (
        <p className="adm-alerta-erro" style={{ marginBottom: "var(--espaco-md)" }}>
          O aluno marcou que não sabe o placar. “Não sei” = sessão com o Anjo.
        </p>
      )}
      <div style={grelhaKpis}>
        <Kpi rotulo="Média 6 meses (bruta)" valor={formatarCentavos(scores.media_6m_bruta)} />
        <Kpi rotulo="Maior mês" valor={formatarCentavos(scores.maior_mes)} />
        <Kpi rotulo="Menor mês" valor={formatarCentavos(scores.menor_mes)} />
        {!resumido && <Kpi rotulo="Instabilidade" valor={formatarCentavos(scores.instabilidade)} />}
        <Kpi rotulo="Meses preenchidos" valor={`${scores.n_meses_preenchidos ?? 0} de 6`} />
      </div>
      {scores.media_informada_de_memoria && (
        <p style={{ ...textoMuted, marginTop: "var(--espaco-sm)" }}>Três ou mais meses informados de memória, não de extrato.</p>
      )}

      {temMix && (
        <div style={{ marginTop: "var(--espaco-lg)" }}>
          <div style={rotuloKpi}>Mix de receita</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--espaco-sm)", ...numeroTabular }}>
            <span className="adm-chip neutro">Perícia {scores.pct_pericia}%</span>
            <span className="adm-chip neutro">AT {scores.pct_at}%</span>
            <span className="adm-chip neutro">Escritório {scores.pct_escritorio}%</span>
            <span className="adm-chip neutro">Outro {scores.pct_outro}%</span>
          </div>
        </div>
      )}

      {temParcelas && (
        <div style={{ ...rolagemTabela, marginTop: "var(--espaco-lg)" }}>
          <table className="adm-tabela" style={numeroTabular}>
            <thead>
              <tr>
                <th>Mês</th>
                {PARCELAS_MES.map((p) => (
                  <th key={p} title={ROTULOS_PARCELA[p]}>
                    {p === "at" ? "AT" : p === "pericia" ? "Perícia" : p === "escritorio" ? "Escritório" : "Outro"}
                  </th>
                ))}
                <th>Total</th>
                <th>Fonte</th>
              </tr>
            </thead>
            <tbody>
              {mesesReferencia.map((ref, i) => {
                const n = i + 1;
                const valores = PARCELAS_MES.map((p) => payload[chaveMes(n, p)]);
                const numeros = valores.filter((v): v is number => typeof v === "number");
                const fonte = payload[chaveMes(n, "fonte")];
                return (
                  <tr key={ref}>
                    <td>{formatarMesCurto(ref)}</td>
                    {valores.map((v, j) => (
                      <td key={j}>{typeof v === "number" ? formatarCentavos(v) : "—"}</td>
                    ))}
                    <td style={{ fontWeight: 600 }}>{numeros.length ? formatarCentavos(numeros.reduce((a, b) => a + b, 0)) : "—"}</td>
                    <td>{typeof fonte === "string" ? ROTULOS_FONTE[fonte as keyof typeof ROTULOS_FONTE] ?? fonte : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
