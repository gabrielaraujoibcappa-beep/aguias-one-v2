"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StatusDot } from "@/components/ui/StatusDot";
import { CAMPOS_FRASE, TODOS_CAMPOS, type PayloadDiagnostico } from "@/lib/diagnostico/campos";
import {
  ROTULOS_RISCO,
  ROTULOS_SEGMENTO,
  ROTULOS_TIPO_ANJO,
  formatarCentavos,
  formatarData,
  formatarDataHora,
  rotuloCampo,
  rotuloOpcao,
} from "@/lib/diagnostico/cliente";
import { BadgeStatusDiagnostico } from "./BadgeStatusDiagnostico";
import { FaturamentoDeclarado } from "./FaturamentoDeclarado";
import { NotasAnjo } from "./NotasAnjo";
import { PecasDePe } from "./PecasDePe";
import { PlacarEntrada } from "./PlacarEntrada";
import { FaixaSemaforo12m } from "./FaixaSemaforo12m";
import { EstadoCarregando, EstadoErro, ROTULOS_COR, corParaDot, diasAteMes6, useFicha } from "./dados";
import { numeroTabular, rolagemTabela, secao, textoMuted, tituloSecao } from "./estilos";

const ROTULOS_EVENTO: Record<string, string> = {
  "diagnostico.enviado": "Placar enviado",
  "diagnostico.corrigido": "Placar corrigido",
  "diagnostico.congelado": "Placar congelado",
  "diagnostico.atrasado": "Placar atrasado (T+48h)",
  leitura_anjo_ficha: "Anjo abriu a ficha",
  leitura_icp_frases: "Leitura de frases ICP",
  "anjo.plano_ativo": "Plano do Anjo ativado",
};

const CAMPOS_ICP_NAO_FRASE = TODOS_CAMPOS.filter(
  (c) => c.consumo === "icp" && !(CAMPOS_FRASE as readonly string[]).includes(c.id) && c.tipo !== "texto"
);

function valorLegivel(campoId: string, v: PayloadDiagnostico[string]): string {
  if (v === undefined || v === null || v === "") return "—";
  if (Array.isArray(v)) return v.length ? v.map((x) => rotuloOpcao(campoId, x)).join(", ") : "—";
  if (typeof v === "boolean") return v ? "Sim" : "Não";
  if (typeof v === "string") return rotuloOpcao(campoId, v);
  return String(v);
}

function Secao({ numero, titulo, children }: { numero?: number; titulo: string; children: React.ReactNode }) {
  return (
    <section className="card" style={secao} aria-labelledby={`secao-${titulo}`}>
      <h2 id={`secao-${titulo}`} style={tituloSecao}>
        {numero !== undefined && <span style={{ color: "var(--cor-muted)", marginRight: "6px", ...numeroTabular }}>{numero}.</span>}
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function FraseCopiavel({ campo, texto }: { campo: string; texto: string }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      setCopiado(false);
    }
  };
  return (
    <li style={{ borderLeft: "3px solid var(--cor-hairline)", paddingLeft: "var(--espaco-md)" }}>
      <div style={{ fontSize: "12px", color: "var(--cor-muted)", marginBottom: "4px" }}>{rotuloCampo(campo)}</div>
      <blockquote style={{ margin: "0 0 6px", fontSize: "15px", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>{texto}</blockquote>
      <button type="button" className="btn-tertiary btn-sm" onClick={copiar} aria-live="polite">
        {copiado ? "Copiado" : "Copiar frase"}
      </button>
    </li>
  );
}

export function FichaAcompanhamento({ matriculaId, modo }: { matriculaId: string; modo: "anjo" | "mentor" }) {
  const { ficha, extra, carregando, erro } = useFicha(matriculaId);
  const voltar = modo === "anjo" ? { href: "/anjo", rotulo: "Voltar à mesa" } : { href: "/mentor/turma", rotulo: "Voltar à turma" };

  if (carregando) return <div className="adm-pagina"><EstadoCarregando texto="Carregando a ficha…" /></div>;
  if (erro || !ficha) return <div className="adm-pagina"><EstadoErro mensagem={erro ?? "Ficha indisponível."} voltar={voltar} /></div>;

  const { aluno, diagnostico: d } = ficha;
  const s = d.scores;
  const enviado = d.status !== "rascunho";
  const dias = diasAteMes6(aluno.matriculadoEm);
  const meta = d.payload.meta_6m;
  const frases = CAMPOS_FRASE.filter((c) => typeof d.payload[c] === "string" && (d.payload[c] as string).trim());

  return (
    <div className="adm-pagina">
      <Link href={voltar.href} style={{ color: "var(--cor-muted)", fontSize: "14px", textDecoration: "none" }}>
        ← {voltar.rotulo}
      </Link>
      <header className="adm-cabecalho" style={{ marginTop: "var(--espaco-md)" }}>
        <div>
          <h1 className="adm-titulo" style={{ overflowWrap: "anywhere" }}>{aluno.nome}</h1>
          <p className="adm-subtitulo">
            {aluno.turma ?? "Turma"} · matrícula em {formatarData(aluno.matriculadoEm)} ·{" "}
            <span style={numeroTabular}>{dias > 0 ? `mês 6 em ${dias} dias` : `mês 6 atingido há ${Math.abs(dias)} dias`}</span>
          </p>
          <div className="adm-chips">
            <BadgeStatusDiagnostico status={d.status} atrasado={d.atrasado} />
            {s.icp_segmento && <span className="adm-chip neutro">{ROTULOS_SEGMENTO[s.icp_segmento]}</span>}
            {modo === "mentor" && s.flag_e_aluno_casa && <span className="adm-chip neutro">E · Aluno da casa</span>}
            {s.anjo_tipo_t0 && <span className="adm-chip neutro">{ROTULOS_TIPO_ANJO[s.anjo_tipo_t0]}</span>}
            {s.risco_parcela && <span className={`adm-chip ${s.risco_parcela === "alto" ? "falta" : s.risco_parcela === "medio" ? "justificada" : "neutro"}`}>{ROTULOS_RISCO[s.risco_parcela]}</span>}
            {modo === "mentor" && s.fit_one && (
              <span className={`adm-chip ${s.fit_one === "nao" ? "falta" : "presente"}`}>{s.fit_one === "nao" ? "Fora do fit ONE" : "Fit ONE"}</span>
            )}
          </div>
        </div>
      </header>

      <p style={{ ...textoMuted, marginTop: "calc(-1 * var(--espaco-md))", marginBottom: "var(--espaco-lg)" }}>
        Leitura registrada na auditoria.
      </p>

      <Secao numero={1} titulo="Placar de entrada">
        {enviado ? (
          <PlacarEntrada payload={d.payload} scores={s} mesesReferencia={d.mesesReferencia} />
        ) : (
          <p style={textoMuted}>Placar ainda em rascunho{d.atrasado ? " e atrasado (T+48h) — aparece automaticamente no Resgate" : ""}.</p>
        )}
      </Secao>

      <Secao numero={2} titulo="Meta dos 6 meses">
        <div style={{ fontSize: "22px", fontWeight: 700, ...numeroTabular }}>{typeof meta === "number" ? formatarCentavos(meta) : "—"}</div>
        <p style={{ ...textoMuted, margin: "4px 0 0" }}>Média mensal bruta que o aluno escreveu como “feita”.</p>
      </Secao>

      <Secao numero={3} titulo="Peças de pé">
        <PecasDePe payload={d.payload} />
      </Secao>

      <Secao numero={4} titulo="Evidências">
        {extra.usuarioId ? (
          <Link href={`/painel/aluno/${extra.usuarioId}`} className="btn-secondary btn-sm" style={{ textDecoration: "none" }}>
            Abrir timeline de evidências
          </Link>
        ) : (
          <p style={textoMuted}>A timeline de evidências fica na ficha do aluno em Turma & Semáforo.</p>
        )}
      </Secao>

      <Secao numero={5} titulo="Semáforo">
        {extra.semaforo ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <StatusDot status={corParaDot(extra.semaforo)} label={ROTULOS_COR[extra.semaforo]} size={9} />
            {extra.motivo && <span style={textoMuted}>{extra.motivo}</span>}
          </div>
        ) : (
          <p style={textoMuted}>Semáforo indisponível para esta matrícula.</p>
        )}
        {extra.travou && <p style={{ margin: "var(--espaco-sm) 0 0", fontSize: "14px" }}>Travou: {extra.travou}</p>}
        <FaixaSemaforo12m matriculaId={matriculaId} />
      </Secao>

      <Secao numero={6} titulo="Faturamento declarado mês a mês">
        <FaturamentoDeclarado meses={ficha.faturamentoMensal} />
      </Secao>

      <Secao numero={7} titulo="Notas do Anjo">
        <NotasAnjo matriculaId={matriculaId} notas={ficha.notas ?? []} podeEscrever />
      </Secao>

      <Secao numero={8} titulo="Plano dos 6 meses">
        {ficha.plano ? (
          <dl style={{ display: "grid", gridTemplateColumns: "max-content 1fr", gap: "6px 16px", margin: 0, fontSize: "14px" }}>
            <dt style={textoMuted}>Tipo</dt>
            <dd style={{ margin: 0 }}>{ROTULOS_TIPO_ANJO[ficha.plano.tipo as keyof typeof ROTULOS_TIPO_ANJO] ?? ficha.plano.tipo}</dd>
            <dt style={textoMuted}>Peça 1</dt>
            <dd style={{ margin: 0 }}>{ficha.plano.peca_1} · evidência: {ficha.plano.evidencia_1} · até {formatarData(ficha.plano.data_1)}</dd>
            {ficha.plano.peca_2 && (<><dt style={textoMuted}>Peça 2</dt><dd style={{ margin: 0 }}>{ficha.plano.peca_2}</dd></>)}
            <dt style={textoMuted}>Cadência</dt>
            <dd style={{ margin: 0 }}>a cada {ficha.plano.cadencia_dias} dias</dd>
            {ficha.plano.horario_real && (<><dt style={textoMuted}>Horário real</dt><dd style={{ margin: 0 }}>{ficha.plano.horario_real}</dd></>)}
            <dt style={textoMuted}>Status</dt>
            <dd style={{ margin: 0 }}>{ficha.plano.status}</dd>
          </dl>
        ) : (
          <p style={textoMuted}>Plano dos 6 meses: vazio até o gatilho do mês 6.</p>
        )}
        <Link href={`/anjo/${matriculaId}/plano`} className="btn-secondary btn-sm" style={{ textDecoration: "none", display: "inline-block", marginTop: "var(--espaco-md)" }}>
          Abrir plano dos 6 meses
        </Link>
      </Secao>

      {modo === "mentor" && (
        <>
          <Secao titulo="Frases ICP">
            {frases.length === 0 ? (
              <p style={textoMuted}>Sem frases (placar não enviado).</p>
            ) : (
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "var(--espaco-lg)" }}>
                {frases.map((c) => (
                  <FraseCopiavel key={c} campo={c} texto={d.payload[c] as string} />
                ))}
              </ul>
            )}
          </Secao>

          <Secao titulo="Four Forces e histórico na casa">
            <dl style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1fr)", gap: "8px 16px", margin: 0, fontSize: "14px" }}>
              {CAMPOS_ICP_NAO_FRASE.map((c) => (
                <React.Fragment key={c.id}>
                  <dt style={textoMuted}>{c.rotulo}</dt>
                  <dd style={{ margin: 0 }}>
                    {valorLegivel(c.id, d.payload[c.id])}
                    {typeof d.payload[`${c.id}_outro`] === "string" && ` — ${d.payload[`${c.id}_outro`]}`}
                  </dd>
                </React.Fragment>
              ))}
            </dl>
          </Secao>

          <Secao titulo="Auditoria">
            <h3 style={{ fontSize: "14px", margin: "0 0 var(--espaco-sm)" }}>Quem abriu esta ficha (90 dias)</h3>
            {ficha.auditoria?.acessos.length ? (
              <div style={rolagemTabela}>
                <table className="adm-tabela" style={numeroTabular}>
                  <thead><tr><th>Quando</th><th>Quem</th><th>Papel</th><th>Origem</th></tr></thead>
                  <tbody>
                    {ficha.auditoria.acessos.map((a, i) => (
                      <tr key={i}><td>{formatarDataHora(a.em)}</td><td>{a.nome}</td><td>{a.papel}</td><td>{a.origem}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={textoMuted}>Nenhum acesso registrado.</p>
            )}

            <h3 style={{ fontSize: "14px", margin: "var(--espaco-lg) 0 var(--espaco-sm)" }}>Eventos</h3>
            {ficha.auditoria?.eventos.length ? (
              <div style={rolagemTabela}>
                <table className="adm-tabela" style={numeroTabular}>
                  <thead><tr><th>Quando</th><th>Evento</th><th>Quem</th><th>Detalhe</th></tr></thead>
                  <tbody>
                    {ficha.auditoria.eventos.map((e, i) => (
                      <tr key={i}>
                        <td>{formatarDataHora(e.em)}</td>
                        <td>{ROTULOS_EVENTO[e.codigo] ?? e.codigo}</td>
                        <td>{e.nome}{e.papel ? ` (${e.papel})` : ""}</td>
                        <td style={{ overflowWrap: "anywhere" }}>
                          {e.dados?.motivo ? `Motivo: ${e.dados.motivo}` : ""}
                          {e.dados?.segmento_mudou ? ` · segmento ${e.dados.segmento_anterior ?? "—"} → ${e.dados.segmento_novo ?? "—"}` : ""}
                          {e.dados?.versao ? ` · versão ${e.dados.versao}` : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p style={textoMuted}>Nenhum evento registrado.</p>
            )}
          </Secao>
        </>
      )}
    </div>
  );
}
