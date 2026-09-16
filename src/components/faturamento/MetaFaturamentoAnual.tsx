"use client";

import React, { useMemo, useState } from "react";
import {
  DeclaracaoFaturamento,
  ProgressoMes,
  calcularProgressoMetaAnual,
  formatarMoedaReal,
  listarAnosDisponiveis,
} from "@/lib/api/faturamento";

interface MetaFaturamentoAnualProps {
  faturamentos: DeclaracaoFaturamento[];
  metaAnual: number;
  onDefinirMeta: (valor: number) => void;
  anoInicial?: number;
}

// Geometria do gráfico (viewBox fixo; escala com a largura do container)
const LARGURA = 720;
const ALTURA = 280;
const MARGEM = { topo: 24, direita: 16, base: 32, esquerda: 60 };
const LARGURA_PLOT = LARGURA - MARGEM.esquerda - MARGEM.direita;
const ALTURA_PLOT = ALTURA - MARGEM.topo - MARGEM.base;
const LARGURA_SLOT = LARGURA_PLOT / 12;
const LARGURA_BARRA = 24;
const RAIO_BARRA = 4;
const LINHA_BASE = MARGEM.topo + ALTURA_PLOT;

const COR_BARRA = "var(--cor-action-vibrant, #0052ff)";
const COR_BARRA_HOVER = "#1a60ff";
const COR_META = "var(--cor-text-muted, #4b5563)";
const COR_GRADE = "var(--cor-hairline, #e5e7eb)";
const COR_TEXTO_MUTED = "var(--cor-muted, #6b7280)";

/** Arredonda o teto do eixo para um número "limpo" (múltiplo de 1, 2, 5 × 10^n). */
function tetoLimpo(valor: number): number {
  if (valor <= 0) return 1000;
  const magnitude = Math.pow(10, Math.floor(Math.log10(valor)));
  const normalizado = valor / magnitude;
  const fator = normalizado <= 1 ? 1 : normalizado <= 2 ? 2 : normalizado <= 2.5 ? 2.5 : normalizado <= 5 ? 5 : 10;
  return fator * magnitude;
}

function formatarCompacto(valor: number): string {
  if (valor >= 1_000_000) return `${(valor / 1_000_000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mi`;
  if (valor >= 1000) return `${(valor / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })} mil`;
  return valor.toLocaleString("pt-BR", { maximumFractionDigits: 0 });
}

function formatarPercentual(valor: number): string {
  return `${Math.round(valor)}%`;
}

/** Caminho de uma coluna com topo arredondado (4px) e base reta. */
function caminhoColuna(x: number, yTopo: number, largura: number, yBase: number): string {
  const altura = yBase - yTopo;
  if (altura <= 0) return "";
  const r = Math.min(RAIO_BARRA, altura, largura / 2);
  return [
    `M ${x} ${yBase}`,
    `V ${yTopo + r}`,
    `Q ${x} ${yTopo} ${x + r} ${yTopo}`,
    `H ${x + largura - r}`,
    `Q ${x + largura} ${yTopo} ${x + largura} ${yTopo + r}`,
    `V ${yBase}`,
    "Z",
  ].join(" ");
}

function digitosParaValor(texto: string): number {
  const digitos = texto.replace(/\D/g, "");
  return digitos ? Number(digitos) / 100 : 0;
}

export function MetaFaturamentoAnual({ faturamentos, metaAnual, onDefinirMeta, anoInicial }: MetaFaturamentoAnualProps) {
  const [ano, setAno] = useState<number>(() => anoInicial ?? new Date().getFullYear());
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [metaTexto, setMetaTexto] = useState("");
  const [mostrarTabela, setMostrarTabela] = useState(false);
  const [mesFocado, setMesFocado] = useState<number | null>(null);

  const anos = useMemo(() => listarAnosDisponiveis(faturamentos, ano), [faturamentos, ano]);
  const progresso = useMemo(() => calcularProgressoMetaAnual(faturamentos, metaAnual, ano), [faturamentos, metaAnual, ano]);

  // Escala vertical: passo redondo (1, 2, 2,5, 5 × 10^n) e teto múltiplo do passo,
  // acomodando a maior coluna e a linha da meta com folga de 10%
  const maiorValor = Math.max(progresso.metaMensal, ...progresso.meses.map((m) => m.realizado)) * 1.1;
  const passoEixo = tetoLimpo(maiorValor / 5);
  const tetoEixo = Math.max(Math.ceil(maiorValor / passoEixo) * passoEixo, passoEixo);
  const escalaY = (valor: number) => LINHA_BASE - (Math.min(valor, tetoEixo) / tetoEixo) * ALTURA_PLOT;
  const ticks = Array.from({ length: Math.round(tetoEixo / passoEixo) + 1 }, (_, i) => i * passoEixo);
  const yMeta = escalaY(progresso.metaMensal);

  const iniciarEdicao = () => {
    setMetaTexto(formatarMoedaReal(metaAnual));
    setEditandoMeta(true);
  };

  const salvarMeta = (e: React.FormEvent) => {
    e.preventDefault();
    const valor = digitosParaValor(metaTexto);
    if (valor > 0) onDefinirMeta(valor);
    setEditandoMeta(false);
  };

  const metaEmEdicao = digitosParaValor(metaTexto);
  const mesEmDestaque: ProgressoMes | null = mesFocado !== null ? progresso.meses[mesFocado] : null;

  const resumoAcessivel =
    `Gráfico de colunas do faturamento mensal de ${ano} contra a meta mensal de ${formatarMoedaReal(progresso.metaMensal)}. ` +
    `Realizado no ano: ${formatarMoedaReal(progresso.realizadoAcumulado)}, ${formatarPercentual(progresso.percentualAnual)} da meta anual.`;

  return (
    <section className="card" aria-labelledby="meta-anual-titulo" style={{ marginBottom: "var(--espaco-lg)" }}>
      {/* Cabeçalho: título, ano e meta editável */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--espaco-md)", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--espaco-lg)" }}>
        <div>
          <h2 id="meta-anual-titulo" style={{ fontSize: "18px", marginBottom: "4px" }}>Meta de faturamento anual</h2>
          <p style={{ color: "var(--cor-muted)", fontSize: "14px" }}>
            A meta do ano é dividida em 12 metas mensais iguais. Cada declaração conta para o mês de referência.
          </p>
        </div>

        <div style={{ display: "flex", gap: "var(--espaco-sm)", alignItems: "center", flexWrap: "wrap" }}>
          <label style={{ fontSize: "13px", color: "var(--cor-text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            Ano
            <select
              value={ano}
              onChange={(e) => setAno(Number(e.target.value))}
              style={{ padding: "8px 10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--cor-border-light)", background: "#fff" }}
            >
              {anos.map((a) => (
                <option key={a} value={a}>{a}</option>
              ))}
            </select>
          </label>

          {editandoMeta ? (
            <form onSubmit={salvarMeta} style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
              <label htmlFor="meta-anual-input" className="sr-only">Meta anual em reais</label>
              <input
                id="meta-anual-input"
                type="text"
                inputMode="numeric"
                autoFocus
                value={metaTexto}
                onChange={(e) => setMetaTexto(formatarMoedaReal(digitosParaValor(e.target.value)))}
                style={{ width: "170px", padding: "8px 10px", borderRadius: "var(--radius-xs)", border: "1px solid var(--cor-border-light)", fontWeight: 600 }}
              />
              <span style={{ fontSize: "12px", color: "var(--cor-muted)", whiteSpace: "nowrap" }}>
                = {formatarMoedaReal(metaEmEdicao / 12)} por mês
              </span>
              <button type="submit" className="btn-primary" style={{ padding: "8px 14px", fontSize: "13px", borderRadius: "var(--radius-xs)" }}>
                Salvar meta
              </button>
              <button type="button" className="btn-secondary" onClick={() => setEditandoMeta(false)} style={{ padding: "8px 12px", fontSize: "13px", borderRadius: "var(--radius-xs)" }}>
                Cancelar
              </button>
            </form>
          ) : (
            <button type="button" className="btn-secondary" onClick={iniciarEdicao} style={{ padding: "8px 14px", fontSize: "13px", borderRadius: "var(--radius-xs)" }}>
              Meta {ano}: {formatarMoedaReal(metaAnual)} · editar
            </button>
          )}
        </div>
      </div>

      {/* Indicadores do ano */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "var(--espaco-md)", marginBottom: "var(--espaco-lg)" }}>
        <Indicador rotulo="Meta mensal" valor={formatarMoedaReal(progresso.metaMensal)} />
        <Indicador rotulo={`Realizado em ${ano}`} valor={formatarMoedaReal(progresso.realizadoAcumulado)} detalhe={`${progresso.mesesDeclarados} de 12 meses declarados`} />
        <Indicador
          rotulo="Meta anual atingida"
          valor={formatarPercentual(progresso.percentualAnual)}
          detalhe={progresso.restante > 0 ? `Faltam ${formatarMoedaReal(progresso.restante)}` : "Meta anual superada"}
          progresso={Math.min(progresso.percentualAnual, 100)}
        />
        <Indicador
          rotulo="Meses na meta"
          valor={`${progresso.mesesAcimaDaMeta} de ${progresso.mesesDeclarados || 0}`}
          detalhe={progresso.mesesDeclarados > 0 ? `Média ${formatarMoedaReal(progresso.mediaMensalDeclarada)}` : "Nenhuma declaração no ano"}
        />
      </div>

      {/* Gráfico */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--espaco-sm)", flexWrap: "wrap", gap: "8px" }}>
        <h3 style={{ fontSize: "14px", fontWeight: 600 }}>Faturamento mensal × meta</h3>
        <button
          type="button"
          onClick={() => setMostrarTabela((v) => !v)}
          aria-expanded={mostrarTabela}
          aria-controls="meta-anual-tabela"
          style={{ background: "transparent", border: "none", color: "var(--cor-action-vibrant)", fontSize: "13px", fontWeight: 500, cursor: "pointer", padding: "4px 0" }}
        >
          {mostrarTabela ? "Ocultar tabela" : "Ver em tabela"}
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <div style={{ position: "relative", minWidth: "560px" }}>
          <svg viewBox={`0 0 ${LARGURA} ${ALTURA}`} role="img" aria-label={resumoAcessivel} style={{ width: "100%", height: "auto", display: "block" }}>
            {/* Grade horizontal e ticks do eixo Y */}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={MARGEM.esquerda} x2={LARGURA - MARGEM.direita} y1={escalaY(t)} y2={escalaY(t)} stroke={COR_GRADE} strokeWidth={1} />
                <text x={MARGEM.esquerda - 8} y={escalaY(t)} textAnchor="end" dominantBaseline="middle" fontSize={11} fill={COR_TEXTO_MUTED} style={{ fontVariantNumeric: "tabular-nums" }}>
                  {formatarCompacto(t)}
                </text>
              </g>
            ))}

            {/* Colunas */}
            {progresso.meses.map((m, idx) => {
              const xSlot = MARGEM.esquerda + idx * LARGURA_SLOT;
              const xBarra = xSlot + (LARGURA_SLOT - LARGURA_BARRA) / 2;
              const yTopo = escalaY(m.realizado);
              const destacado = mesFocado === idx;
              return (
                <g key={m.mes}>
                  {m.realizado > 0 && (
                    <path d={caminhoColuna(xBarra, yTopo, LARGURA_BARRA, LINHA_BASE)} fill={destacado ? COR_BARRA_HOVER : COR_BARRA} />
                  )}
                  <text x={xSlot + LARGURA_SLOT / 2} y={LINHA_BASE + 18} textAnchor="middle" fontSize={11} fill={destacado ? "var(--cor-ink)" : COR_TEXTO_MUTED} fontWeight={destacado ? 600 : 400}>
                    {m.rotulo}
                  </text>
                  {/* Área de interação: o slot inteiro, maior que a coluna */}
                  <rect
                    x={xSlot}
                    y={MARGEM.topo}
                    width={LARGURA_SLOT}
                    height={ALTURA_PLOT + MARGEM.base}
                    fill="transparent"
                    tabIndex={0}
                    aria-label={`${m.rotulo} ${ano}: ${m.declarado ? formatarMoedaReal(m.realizado) : "sem declaração"}, ${formatarPercentual(m.percentual)} da meta mensal`}
                    onPointerEnter={() => setMesFocado(idx)}
                    onPointerLeave={() => setMesFocado(null)}
                    onFocus={() => setMesFocado(idx)}
                    onBlur={() => setMesFocado(null)}
                    style={{ outline: "none", cursor: "default" }}
                  />
                </g>
              );
            })}

            {/* Linha da meta mensal */}
            <line x1={MARGEM.esquerda} x2={LARGURA - MARGEM.direita} y1={yMeta} y2={yMeta} stroke={COR_META} strokeWidth={2} strokeLinecap="round" />
            <text x={LARGURA - MARGEM.direita} y={yMeta - 6} textAnchor="end" fontSize={11} fill="var(--cor-text-muted)" fontWeight={500}>
              Meta mensal {formatarMoedaReal(progresso.metaMensal)}
            </text>

            {/* Linha de base */}
            <line x1={MARGEM.esquerda} x2={LARGURA - MARGEM.direita} y1={LINHA_BASE} y2={LINHA_BASE} stroke={COR_GRADE} strokeWidth={1} />
          </svg>

          {/* Tooltip do mês em foco */}
          {mesEmDestaque && (
            <div
              role="status"
              style={{
                position: "absolute",
                left: `${((MARGEM.esquerda + (mesFocado! + 0.5) * LARGURA_SLOT) / LARGURA) * 100}%`,
                top: `${(Math.min(escalaY(mesEmDestaque.realizado), yMeta) / ALTURA) * 100}%`,
                transform: `translate(${mesFocado! <= 1 ? "0" : mesFocado! >= 10 ? "-100%" : "-50%"}, calc(-100% - 8px))`,
                background: "var(--cor-ink)",
                color: "#fff",
                padding: "8px 10px",
                borderRadius: "var(--radius-xs)",
                fontSize: "12px",
                lineHeight: 1.4,
                whiteSpace: "nowrap",
                pointerEvents: "none",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              }}
            >
              <div style={{ fontWeight: 600 }}>{mesEmDestaque.rotulo} {ano}</div>
              <div>Realizado: {mesEmDestaque.declarado ? formatarMoedaReal(mesEmDestaque.realizado) : "sem declaração"}</div>
              <div>Meta: {formatarMoedaReal(mesEmDestaque.meta)} · {formatarPercentual(mesEmDestaque.percentual)}</div>
            </div>
          )}
        </div>
      </div>

      {/* Tabela: leitura alternativa dos mesmos dados */}
      <div id="meta-anual-tabela" hidden={!mostrarTabela} style={{ marginTop: "var(--espaco-md)" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--cor-hairline)", color: "var(--cor-muted)" }}>
              <th style={{ padding: "8px" }}>Mês</th>
              <th style={{ padding: "8px", textAlign: "right" }}>Realizado</th>
              <th style={{ padding: "8px", textAlign: "right" }}>Meta</th>
              <th style={{ padding: "8px", textAlign: "right" }}>Atingido</th>
            </tr>
          </thead>
          <tbody>
            {progresso.meses.map((m) => (
              <tr key={m.mes} style={{ borderBottom: "1px solid var(--cor-border-light)" }}>
                <td style={{ padding: "8px", fontWeight: 500 }}>{m.rotulo}</td>
                <td style={{ padding: "8px", textAlign: "right", fontVariantNumeric: "tabular-nums", color: m.declarado ? "var(--cor-ink)" : "var(--cor-muted)" }}>
                  {m.declarado ? formatarMoedaReal(m.realizado) : "—"}
                </td>
                <td style={{ padding: "8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatarMoedaReal(m.meta)}</td>
                <td style={{ padding: "8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{m.declarado ? formatarPercentual(m.percentual) : "—"}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ fontWeight: 600 }}>
              <td style={{ padding: "8px" }}>Total {ano}</td>
              <td style={{ padding: "8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatarMoedaReal(progresso.realizadoAcumulado)}</td>
              <td style={{ padding: "8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatarMoedaReal(progresso.metaAnual)}</td>
              <td style={{ padding: "8px", textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatarPercentual(progresso.percentualAnual)}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>
  );
}

interface IndicadorProps {
  rotulo: string;
  valor: string;
  detalhe?: string;
  progresso?: number; // 0..100, exibe barra de progresso
}

function Indicador({ rotulo, valor, detalhe, progresso }: IndicadorProps) {
  return (
    <div style={{ border: "1px solid var(--cor-border-light)", borderRadius: "var(--radius-sm)", padding: "var(--espaco-md)" }}>
      <div style={{ fontSize: "12px", color: "var(--cor-text-muted)", marginBottom: "6px" }}>{rotulo}</div>
      <div style={{ fontSize: "22px", fontWeight: 600, color: "var(--cor-ink)", letterSpacing: "-0.3px" }}>{valor}</div>
      {progresso !== undefined && (
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(progresso)}
          style={{ marginTop: "8px", height: "6px", borderRadius: "3px", backgroundColor: "var(--cor-pale-blue)", overflow: "hidden" }}
        >
          <div style={{ width: `${progresso}%`, height: "100%", backgroundColor: "var(--cor-action-vibrant)", borderRadius: "3px" }} />
        </div>
      )}
      {detalhe && <div style={{ fontSize: "12px", color: "var(--cor-muted)", marginTop: "6px" }}>{detalhe}</div>}
    </div>
  );
}
