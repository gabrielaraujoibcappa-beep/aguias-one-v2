"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Carregando, SeletorTurma, Vazio, mensagemDeErro } from "@/components/diagnostico/mentor/EstadoTela";
import { chamarApi, formatarCentavos, formatarData, formatarMesCurto } from "@/lib/diagnostico/cliente";
import { ROTULOS_STATUS_PLANO, type StatusPlano } from "@/lib/acompanhamento/plano";

interface ResultadoApi {
  meses?: string[];
  media3m?: number | null;
  reguaCentavos?: number | null;
  regua: "media_entrada" | "meta_declarada";
  comparativo: "acima" | "igual" | "abaixo" | null;
  naoSei: boolean;
  sessaoObrigatoria: boolean;
  motivos: string[];
}

interface ItemApi {
  matriculaId: string;
  nome: string;
  dataMes6: string;
  diasAteMes6: number;
  diagnosticoStatus: string;
  mediaEntradaCentavos?: number | null;
  metaCentavos?: number | null;
  placarNaoSei: boolean;
  faturamentos?: { mesReferencia: string; valorBruto: number }[];
  resultado: ResultadoApi;
  temPlano: boolean;
  statusPlano: StatusPlano | null;
}

interface RespostaApi {
  turmaId: string | null;
  turmas: { id: string; nome: string }[];
  regua: "media_entrada" | "meta_declarada";
  base: "matricula" | "primeira_quarta";
  somenteComparativo?: boolean;
  alunos: ItemApi[];
}

const ROTULO_REGUA = { media_entrada: "média de entrada", meta_declarada: "meta declarada" } as const;
const ROTULO_BASE = { matricula: "da matrícula", primeira_quarta: "da primeira quarta" } as const;
const ROTULO_COMPARATIVO = { acima: "Acima", igual: "Igual", abaixo: "Abaixo" } as const;
const tabular: React.CSSProperties = { fontVariantNumeric: "tabular-nums lining-nums" };

export default function ListaMes6Page() {
  const [dados, setDados] = useState<RespostaApi | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async (turma?: string) => {
    setCarregando(true);
    setErro(null);
    try {
      const qs = turma ? `?turma=${encodeURIComponent(turma)}` : "";
      setDados(await chamarApi<RespostaApi>(`/api/anjo/mes6${qs}`));
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const sessoes = dados?.alunos.filter((a) => a.resultado.sessaoObrigatoria).length ?? 0;

  return (
    <div className="adm-pagina">
      <header className="adm-cabecalho">
        <div>
          <h1 className="adm-titulo">Lista do mês 6</h1>
          <p className="adm-subtitulo">
            Quem chega ao mês 6 em até 7 dias ou já passou.
            {dados && ` Régua: ${ROTULO_REGUA[dados.regua]}, contando ${ROTULO_BASE[dados.base]}.`}
          </p>
        </div>
        {dados && dados.turmaId && (
          <SeletorTurma turmas={dados.turmas} valor={dados.turmaId} aoMudar={(id) => carregar(id)} />
        )}
      </header>

      {carregando && <Carregando texto="Montando a lista do mês 6…" />}
      {!carregando && erro && (
        <p className="adm-alerta-erro" role="alert">
          {erro}
        </p>
      )}

      {!carregando && !erro && dados && (
        <>
          <p style={{ color: "var(--cor-muted)", fontSize: "13px", margin: "0 0 var(--espaco-md)" }}>
            {dados.somenteComparativo ? "Você vê só a comparação com a entrada, sem valores." : ""}
            {" "}Abaixo da régua ou “não sei” = sessão obrigatória com o Anjo. O aluno continua na quarta.
          </p>

          {dados.alunos.length === 0 ? (
            <Vazio titulo="Ninguém na janela do mês 6" texto="Quando um mentorado estiver a 7 dias do mês 6, ele aparece aqui." />
          ) : (
            <>
              <div className="adm-chips" style={{ marginBottom: "var(--espaco-md)" }}>
                <span className="adm-chip neutro" style={tabular}>
                  {dados.alunos.length} na janela
                </span>
                <span className={`adm-chip ${sessoes ? "falta" : "presente"}`} style={tabular}>
                  {sessoes} com sessão obrigatória
                </span>
              </div>

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "var(--espaco-md)" }}>
                {dados.alunos.map((a) => {
                  const r = a.resultado;
                  return (
                    <li
                      key={a.matriculaId}
                      className="card"
                      style={{
                        padding: "var(--espaco-lg)",
                        borderLeft: r.sessaoObrigatoria ? "4px solid #ef4444" : "4px solid var(--cor-hairline)",
                      }}
                    >
                      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "var(--espaco-sm)" }}>
                        <div style={{ minWidth: 0 }}>
                          <h2 style={{ fontSize: "17px", margin: 0, overflowWrap: "anywhere" }}>{a.nome}</h2>
                          <p style={{ margin: "2px 0 0", color: "var(--cor-muted)", fontSize: "13px", ...tabular }}>
                            Mês 6 em {formatarData(a.dataMes6)} ·{" "}
                            {a.diasAteMes6 > 0 ? `faltam ${a.diasAteMes6} dias` : a.diasAteMes6 === 0 ? "hoje" : `há ${Math.abs(a.diasAteMes6)} dias`}
                          </p>
                        </div>
                        <div className="adm-chips">
                          {r.sessaoObrigatoria ? (
                            <span className="adm-chip falta">Sessão obrigatória</span>
                          ) : (
                            <span className="adm-chip presente">Na régua</span>
                          )}
                          {r.comparativo && <span className="adm-chip neutro">{ROTULO_COMPARATIVO[r.comparativo]} da régua</span>}
                          <span className={`adm-chip ${a.temPlano ? "presente" : "neutro"}`}>
                            {a.statusPlano ? `Plano: ${ROTULOS_STATUS_PLANO[a.statusPlano]}` : "Sem plano"}
                          </span>
                        </div>
                      </div>

                      {r.motivos.length > 0 && (
                        <ul style={{ margin: "var(--espaco-sm) 0 0", paddingLeft: "18px", fontSize: "13px" }}>
                          {r.motivos.map((m) => (
                            <li key={m}>{m}</li>
                          ))}
                        </ul>
                      )}

                      {!dados.somenteComparativo && (
                        <dl
                          style={{
                            display: "grid",
                            gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))",
                            gap: "var(--espaco-sm)",
                            margin: "var(--espaco-md) 0 0",
                            ...tabular,
                          }}
                        >
                          <div>
                            <dt style={{ fontSize: "12px", color: "var(--cor-muted)" }}>Média de entrada</dt>
                            <dd style={{ margin: 0, fontWeight: 700 }}>{a.placarNaoSei ? "Não sei" : formatarCentavos(a.mediaEntradaCentavos)}</dd>
                          </div>
                          <div>
                            <dt style={{ fontSize: "12px", color: "var(--cor-muted)" }}>Meta declarada</dt>
                            <dd style={{ margin: 0, fontWeight: 700 }}>{formatarCentavos(a.metaCentavos)}</dd>
                          </div>
                          <div>
                            <dt style={{ fontSize: "12px", color: "var(--cor-muted)" }}>Média meses 4–6</dt>
                            <dd style={{ margin: 0, fontWeight: 700 }}>{r.naoSei ? "Não sei" : formatarCentavos(r.media3m)}</dd>
                          </div>
                          <div>
                            <dt style={{ fontSize: "12px", color: "var(--cor-muted)" }}>Régua ({ROTULO_REGUA[r.regua]})</dt>
                            <dd style={{ margin: 0, fontWeight: 700 }}>{formatarCentavos(r.reguaCentavos)}</dd>
                          </div>
                        </dl>
                      )}

                      {!dados.somenteComparativo && a.faturamentos && a.faturamentos.length > 0 && (
                        <div style={{ overflowX: "auto", marginTop: "var(--espaco-md)" }}>
                          <table className="adm-tabela" style={{ minWidth: "360px" }}>
                            <caption className="sr-only">Faturamentos declarados de {a.nome}</caption>
                            <thead>
                              <tr>
                                {a.faturamentos.map((f) => (
                                  <th key={f.mesReferencia} scope="col">
                                    {formatarMesCurto(f.mesReferencia)}
                                  </th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              <tr>
                                {a.faturamentos.map((f) => (
                                  <td key={f.mesReferencia} style={tabular}>
                                    {formatarCentavos(Math.round(f.valorBruto * 100))}
                                  </td>
                                ))}
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}

                      <div className="btn-group" style={{ marginTop: "var(--espaco-md)", flexWrap: "wrap" }}>
                        <Link href={`/anjo/${a.matriculaId}`} className="btn-secondary btn-sm" style={{ textDecoration: "none" }}>
                          Abrir ficha
                        </Link>
                        <Link href={`/anjo/${a.matriculaId}/plano`} className="btn-primary btn-sm" style={{ textDecoration: "none" }}>
                          {a.temPlano ? "Ver plano" : "Escrever plano"}
                        </Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}
