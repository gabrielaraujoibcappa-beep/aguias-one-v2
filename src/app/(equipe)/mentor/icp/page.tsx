"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { IconCopy, IconDownload, IconFolder } from "@/components/ui/Icons";
import { BarrasHorizontais, paraItens } from "@/components/diagnostico/mentor/BarrasHorizontais";
import { Carregando, SeletorTurma, Vazio, mensagemDeErro } from "@/components/diagnostico/mentor/EstadoTela";
import {
  ROTULOS_SEGMENTO,
  baixarArquivo,
  chamarApi,
  formatarData,
  gerarCsv,
  rotuloOpcao,
} from "@/lib/diagnostico/cliente";
import { CAMPOS_FRASE } from "@/lib/diagnostico/campos";
import type { IcpSegmento } from "@/lib/diagnostico/regras";
import { notificar } from "@/lib/notificacoes";

type Contagem = Record<string, number>;

interface Agregado {
  total: number;
  segmentos: Contagem;
  flagE: number;
  fitNao: number;
  mixReceita: { pericia: number; at: number; escritorio: number; outro: number };
  forcas: { push: Contagem; pull: Contagem; anxiety: Contagem; habit: Contagem };
  porta: { origens: Contagem; precoEscrito: Contagem };
  pagouCasa: Contagem;
  pecas: Contagem;
  tiposAnjo: Contagem;
  risco: Contagem;
}

interface Frase {
  campo: (typeof CAMPOS_FRASE)[number];
  texto: string;
  segmento: IcpSegmento | null;
  flagE: boolean;
  respondente: string;
  enviadoEm: string | null;
}

interface Turma {
  id: string;
  nome: string;
  status: string;
}

const ROTULO_CURTO_FRASE: Record<(typeof CAMPOS_FRASE)[number], string> = {
  job_frase: "Job",
  frase_sabado: "Sábado",
  frase_preco: "Preço",
  frase_sozinho: "Sozinho",
  ultima_vez_organizou: "Última vez que organizou",
};

const rotuloSegmento = (s: string) => ROTULOS_SEGMENTO[s as IcpSegmento] ?? s;

export default function MentorIcpPage() {
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [turmaId, setTurmaId] = useState("");
  const [agregado, setAgregado] = useState<Agregado | null>(null);
  const [frases, setFrases] = useState<Frase[]>([]);
  const [segmento, setSegmento] = useState("");
  const [comNome, setComNome] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [carregandoFrases, setCarregandoFrases] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregarFrases = useCallback(async (turma: string, seg: string, nomes: boolean) => {
    setCarregandoFrases(true);
    try {
      const qs = new URLSearchParams();
      if (turma) qs.set("turma", turma);
      if (seg) qs.set("segmento", seg);
      if (nomes) qs.set("comNome", "1");
      const r = await chamarApi<{ frases: Frase[] }>(`/api/icp/frases?${qs.toString()}`);
      setFrases(r.frases);
    } catch (err) {
      setErro(mensagemDeErro(err));
    } finally {
      setCarregandoFrases(false);
    }
  }, []);

  const carregarTurma = useCallback(
    async (turma: string) => {
      setCarregando(true);
      setErro(null);
      try {
        const r = await chamarApi<Agregado>(`/api/icp/agregado${turma ? `?turma=${encodeURIComponent(turma)}` : ""}`);
        setAgregado(r);
        await carregarFrases(turma, segmento, comNome);
      } catch (err) {
        setErro(mensagemDeErro(err));
        setAgregado(null);
      } finally {
        setCarregando(false);
      }
    },
    [carregarFrases, segmento, comNome]
  );

  useEffect(() => {
    (async () => {
      try {
        const r = await chamarApi<{ turmas: Turma[] }>("/api/turmas");
        setTurmas(r.turmas);
        const inicial = r.turmas.find((t) => t.status === "em_andamento")?.id ?? r.turmas[0]?.id ?? "";
        setTurmaId(inicial);
        await carregarTurma(inicial);
      } catch (err) {
        setErro(mensagemDeErro(err));
        setCarregando(false);
      }
    })();
    // carga inicial única
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trocarTurma = (id: string) => {
    setTurmaId(id);
    carregarTurma(id);
  };

  const trocarSegmento = (seg: string) => {
    setSegmento(seg);
    carregarFrases(turmaId, seg, comNome);
  };

  const alternarNomes = () => {
    const novo = !comNome;
    setComNome(novo);
    carregarFrases(turmaId, segmento, novo);
  };

  const frasesPorCampo = useMemo(
    () => CAMPOS_FRASE.map((campo) => ({ campo, lista: frases.filter((f) => f.campo === campo) })),
    [frases]
  );

  const copiar = async (texto: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      notificar("Frase copiada.");
    } catch {
      notificar("Não foi possível copiar. Selecione o texto e copie manualmente.");
    }
  };

  const nomeTurma = turmas.find((t) => t.id === turmaId)?.nome ?? "turma";
  const sufixoArquivo = nomeTurma.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-");

  const exportarFrases = () => {
    const csv = gerarCsv(
      frases.map((f) => ({
        campo: ROTULO_CURTO_FRASE[f.campo],
        frase: f.texto,
        segmento: f.segmento ? rotuloSegmento(f.segmento) : "",
        aluno_da_casa: f.flagE ? "sim" : "não",
        respondente: f.respondente,
        enviado_em: formatarData(f.enviadoEm),
      }))
    );
    baixarArquivo(`frases-icp-${sufixoArquivo}.csv`, csv);
  };

  const exportarAgregado = () => {
    if (!agregado) return;
    const linhas: { grupo: string; opcao: string; quantidade: number }[] = [];
    const add = (grupo: string, contagem: Contagem, rotular: (k: string) => string) =>
      Object.entries(contagem).forEach(([k, v]) => linhas.push({ grupo, opcao: k === "sem_resposta" ? "Sem resposta" : rotular(k), quantidade: v }));
    linhas.push({ grupo: "Total", opcao: "Placares enviados", quantidade: agregado.total });
    add("Segmento", agregado.segmentos, rotuloSegmento);
    linhas.push({ grupo: "Flag E", opcao: "Aluno da casa", quantidade: agregado.flagE });
    linhas.push({ grupo: "Fit ONE", opcao: "Não", quantidade: agregado.fitNao });
    Object.entries(agregado.mixReceita).forEach(([k, v]) => linhas.push({ grupo: "Mix de receita (% médio)", opcao: k, quantidade: v }));
    add("Força · insuportável", agregado.forcas.push, (k) => rotuloOpcao("forca_push", k));
    add("Força · puxou", agregado.forcas.pull, (k) => rotuloOpcao("forca_pull", k));
    add("Força · quase segurou", agregado.forcas.anxiety, (k) => rotuloOpcao("forca_anxiety", k));
    add("Força · sem a compra", agregado.forcas.habit, (k) => rotuloOpcao("forca_habit", k));
    add("Porta · origem do último", agregado.porta.origens, (k) => rotuloOpcao("ultimo_origem", k));
    add("Porta · preço escrito", agregado.porta.precoEscrito, (k) => rotuloOpcao("ultimo_preco_escrito", k));
    add("Já pagou na casa", agregado.pagouCasa, (k) => rotuloOpcao("pagou_casa", k));
    baixarArquivo(`agregado-icp-${sufixoArquivo}.csv`, gerarCsv(linhas));
  };

  const total = agregado?.total ?? 0;

  return (
    <div className="adm-pagina">
      <div className="adm-cabecalho">
        <div>
          <h1 className="adm-titulo">
            <IconFolder size={26} />
            ICP & Frases
          </h1>
          <p className="adm-subtitulo">Agregado dos placares de entrada. Matéria-prima da copy, sem nomes na lista padrão.</p>
        </div>
        <SeletorTurma turmas={turmas} valor={turmaId} aoMudar={trocarTurma} />
      </div>

      {erro && (
        <div className="adm-alerta-erro" role="alert">
          {erro}
        </div>
      )}

      {carregando ? (
        <Carregando texto="Carregando o agregado…" />
      ) : erro && !agregado ? null : !agregado || total === 0 ? (
        <Vazio titulo="Nenhum placar enviado nesta turma ainda." />
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "var(--espaco-lg)" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "var(--cor-text-muted)", fontVariantNumeric: "tabular-nums" }}>
              {total} {total === 1 ? "placar enviado" : "placares enviados"} · {agregado.flagE} aluno(s) da casa (flag E) · {agregado.fitNao} fora do fit ONE
            </p>
            <button type="button" className="btn-secondary btn-sm" onClick={exportarAgregado}>
              <IconDownload size={14} /> Exportar agregado (CSV)
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 300px), 1fr))", gap: "var(--espaco-lg)", marginBottom: "var(--espaco-xl)" }}>
            <section className="card" aria-labelledby="w-segmento">
              <h2 id="w-segmento" className="adm-rotulo" style={{ marginTop: 0 }}>1 · Segmento</h2>
              <BarrasHorizontais titulo="Distribuição por segmento" itens={paraItens(agregado.segmentos, rotuloSegmento)} total={total} />
            </section>

            <section className="card" aria-labelledby="w-mix">
              <h2 id="w-mix" className="adm-rotulo" style={{ marginTop: 0 }}>2 · Mix de receita</h2>
              <BarrasHorizontais
                titulo="Participação média na receita"
                sufixo="%"
                maximo={100}
                itens={[
                  { chave: "pericia", rotulo: "Perícia judicial", valor: agregado.mixReceita.pericia },
                  { chave: "at", rotulo: "Assistente técnico", valor: agregado.mixReceita.at },
                  { chave: "escritorio", rotulo: "Escritório contábil", valor: agregado.mixReceita.escritorio },
                  { chave: "outro", rotulo: "Outro", valor: agregado.mixReceita.outro },
                ]}
              />
            </section>

            <section className="card" aria-labelledby="w-porta">
              <h2 id="w-porta" className="adm-rotulo" style={{ marginTop: 0 }}>4 · Porta</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-lg)" }}>
                <BarrasHorizontais titulo="De onde veio o último trabalho" itens={paraItens(agregado.porta.origens, (k) => rotuloOpcao("ultimo_origem", k))} total={total} />
                <BarrasHorizontais titulo="Preço já estava escrito?" itens={paraItens(agregado.porta.precoEscrito, (k) => rotuloOpcao("ultimo_preco_escrito", k))} total={total} />
              </div>
            </section>

            <section className="card" aria-labelledby="w-casa">
              <h2 id="w-casa" className="adm-rotulo" style={{ marginTop: 0 }}>5 · Já pagou na casa</h2>
              <BarrasHorizontais titulo="Produtos IBCAPPA/UniBCAPPA (baseline da turma)" itens={paraItens(agregado.pagouCasa, (k) => rotuloOpcao("pagou_casa", k))} total={total} />
            </section>
          </div>

          <section className="card" aria-labelledby="w-forcas" style={{ marginBottom: "var(--espaco-xl)" }}>
            <h2 id="w-forcas" className="adm-rotulo" style={{ marginTop: 0 }}>3 · Four Forces</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))", gap: "var(--espaco-lg)" }}>
              <BarrasHorizontais titulo="O que ficou insuportável" itens={paraItens(agregado.forcas.push, (k) => rotuloOpcao("forca_push", k))} total={total} />
              <BarrasHorizontais titulo="O que puxou" itens={paraItens(agregado.forcas.pull, (k) => rotuloOpcao("forca_pull", k))} total={total} />
              <BarrasHorizontais titulo="O que quase segurou" itens={paraItens(agregado.forcas.anxiety, (k) => rotuloOpcao("forca_anxiety", k))} total={total} />
              <BarrasHorizontais titulo="O que faria sem a compra" itens={paraItens(agregado.forcas.habit, (k) => rotuloOpcao("forca_habit", k))} total={total} />
            </div>
          </section>

          <section className="card" aria-labelledby="w-mural">
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "flex-end", gap: "12px", marginBottom: "var(--espaco-md)" }}>
              <div>
                <h2 id="w-mural" style={{ fontSize: "18px", margin: "0 0 4px" }}>6 · Mural de frases</h2>
                <p style={{ margin: 0, fontSize: "13px", color: "var(--cor-muted)" }}>Texto cru, como o mentorado escreveu.</p>
              </div>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "flex-end", gap: "10px" }}>
                <label className="adm-campo" style={{ minWidth: 0 }}>
                  <span className="adm-rotulo">Segmento</span>
                  <select className="adm-input" style={{ minWidth: "180px" }} value={segmento} onChange={(e) => trocarSegmento(e.target.value)}>
                    <option value="">Todos</option>
                    {(Object.keys(ROTULOS_SEGMENTO) as IcpSegmento[]).map((s) => (
                      <option key={s} value={s}>
                        {ROTULOS_SEGMENTO[s]}
                      </option>
                    ))}
                  </select>
                </label>
                <button type="button" className="btn-secondary btn-sm" aria-pressed={comNome} onClick={alternarNomes}>
                  {comNome ? "Ocultar nomes" : "Mostrar nomes"}
                </button>
                <button type="button" className="btn-secondary btn-sm" onClick={exportarFrases} disabled={!frases.length}>
                  <IconDownload size={14} /> Exportar frases (CSV)
                </button>
              </div>
            </div>

            <p role="note" style={{ fontSize: "13px", padding: "8px 12px", margin: "0 0 var(--espaco-md)", backgroundColor: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", borderRadius: "var(--radius-sm)" }}>
              Frase identificável não vai para anúncio sem autorização do Edilson.
              {comNome && " Esta leitura fica registrada."}
            </p>

            {carregandoFrases ? (
              <Carregando texto="Carregando frases…" />
            ) : frases.length === 0 ? (
              <Vazio titulo="Nenhuma frase para este filtro." />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--espaco-lg)" }}>
                {frasesPorCampo
                  .filter((g) => g.lista.length)
                  .map((g) => (
                    <div key={g.campo}>
                      <h3 style={{ fontSize: "14px", margin: "0 0 8px" }}>
                        {ROTULO_CURTO_FRASE[g.campo]}{" "}
                        <span style={{ color: "var(--cor-muted)", fontWeight: 400, fontVariantNumeric: "tabular-nums" }}>({g.lista.length})</span>
                      </h3>
                      <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                        {g.lista.map((f, i) => (
                          <li
                            key={`${g.campo}-${i}`}
                            style={{ display: "flex", gap: "10px", alignItems: "flex-start", padding: "10px 12px", border: "1px solid var(--cor-border-light)", borderRadius: "var(--radius-sm)" }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <blockquote style={{ margin: 0, fontSize: "14px", color: "var(--cor-ink)", whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                                “{f.texto}”
                              </blockquote>
                              <div style={{ fontSize: "12px", color: "var(--cor-muted)", marginTop: "4px" }}>
                                {f.respondente}
                                {f.segmento && ` · ${rotuloSegmento(f.segmento)}`}
                                {f.flagE && " · aluno da casa"}
                              </div>
                            </div>
                            <button
                              type="button"
                              className="btn-tertiary btn-sm"
                              onClick={() => copiar(f.texto)}
                              aria-label={`Copiar frase de ${f.respondente}`}
                              style={{ flexShrink: 0 }}
                            >
                              <IconCopy size={14} /> Copiar
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
