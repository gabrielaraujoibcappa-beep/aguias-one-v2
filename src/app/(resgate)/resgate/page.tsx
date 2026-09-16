"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FalhaApi, chamarApi, formatarDataHora } from "@/lib/diagnostico/cliente";
import {
  CANAIS_RESGATE,
  MAX_OBSERVACAO,
  MOTIVOS_RESGATE,
  RESULTADOS_RESGATE,
  ROTULOS_CANAL,
  ROTULOS_MOTIVO,
  ROTULOS_RESULTADO,
  linkWhatsAppResgate,
  type CanalResgate,
  type MotivoResgate,
  type ResultadoResgate,
} from "@/lib/acompanhamento/resgate";
import { notificar } from "@/lib/notificacoes";

interface AlunoResgate {
  matriculaId: string;
  nome: string;
  whatsapp: string | null;
  turma: string | null;
  motivos: MotivoResgate[];
  semanasVermelhasSeguidas: number;
  diagnosticoStatus: "rascunho" | "enviado" | "congelado";
  ultimoContato: { canal: CanalResgate; resultado: ResultadoResgate; em: string; autor: string } | null;
}

interface Contato {
  id: string;
  canal: CanalResgate;
  resultado: ResultadoResgate;
  motivoContato: MotivoResgate;
  observacao: string | null;
  em: string;
  autor: string;
}

type FiltroMotivo = "todos" | "vermelho_duplo" | "diagnostico_atrasado";

function mensagemErro(err: unknown): string {
  if (err instanceof FalhaApi && err.status === 403) return "Seu papel não acessa esta tela.";
  if (err instanceof Error) return err.message;
  return "Não foi possível carregar.";
}

export default function ResgatePage() {
  const [alunos, setAlunos] = useState<AlunoResgate[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<FiltroMotivo>("todos");
  const [busca, setBusca] = useState("");
  const [abertoId, setAbertoId] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const r = await chamarApi<{ alunos: AlunoResgate[] }>("/api/resgate");
      setAlunos(r.alunos);
    } catch (e) {
      setErro(mensagemErro(e));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const visiveis = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return alunos.filter(
      (a) =>
        (filtro === "todos" || a.motivos.includes(filtro)) &&
        (termo.length < 2 || a.nome.toLowerCase().includes(termo))
    );
  }, [alunos, filtro, busca]);

  const contagem = (m: MotivoResgate) => alunos.filter((a) => a.motivos.includes(m)).length;

  return (
    <div className="adm-pagina">
      <header className="adm-cabecalho">
        <div>
          <h1 className="adm-titulo">Alunos para resgatar</h1>
          <p className="adm-subtitulo">
            Vermelho duas semanas seguidas ou placar de entrada atrasado. Registre cada contato.
          </p>
        </div>
      </header>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--espaco-sm, 8px)", marginBottom: "var(--espaco-md, 16px)" }}>
        <div role="group" aria-label="Filtrar por motivo" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
          {(
            [
              ["todos", `Todos (${alunos.length})`],
              ["vermelho_duplo", `Vermelho duplo (${contagem("vermelho_duplo")})`],
              ["diagnostico_atrasado", `Placar atrasado (${contagem("diagnostico_atrasado")})`],
            ] as [FiltroMotivo, string][]
          ).map(([valor, rotulo]) => (
            <button
              key={valor}
              type="button"
              className={filtro === valor ? "btn-primary btn-sm" : "btn-secondary btn-sm"}
              aria-pressed={filtro === valor}
              onClick={() => setFiltro(valor)}
            >
              {rotulo}
            </button>
          ))}
        </div>
        <label className="adm-campo" style={{ flex: "1 1 200px", minWidth: 0 }}>
          <span className="sr-only">Buscar aluno</span>
          <input
            className="adm-input"
            style={{ minWidth: 0, width: "100%" }}
            type="search"
            placeholder="Buscar pelo nome (2 letras)"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
        </label>
      </div>

      {carregando && <p className="adm-vazio">Carregando…</p>}
      {erro && (
        <div className="adm-alerta-erro" role="alert">
          {erro}
        </div>
      )}
      {!carregando && !erro && visiveis.length === 0 && (
        <p className="adm-vazio">Ninguém para resgatar {filtro === "todos" ? "agora" : "neste filtro"}.</p>
      )}

      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "var(--espaco-sm, 12px)" }}>
        {visiveis.map((a) => (
          <li key={a.matriculaId} className="card" style={{ padding: "var(--espaco-md, 16px)" }}>
            <CardAluno
              aluno={a}
              aberto={abertoId === a.matriculaId}
              alternar={() => setAbertoId(abertoId === a.matriculaId ? null : a.matriculaId)}
              aoRegistrar={carregar}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

function CardAluno({
  aluno,
  aberto,
  alternar,
  aoRegistrar,
}: {
  aluno: AlunoResgate;
  aberto: boolean;
  alternar: () => void;
  aoRegistrar: () => void;
}) {
  const link = linkWhatsAppResgate(aluno.nome, aluno.whatsapp);
  return (
    <div>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: "8px" }}>
        <div style={{ minWidth: 0 }}>
          <h2 style={{ fontSize: "16px", margin: 0 }}>{aluno.nome}</h2>
          <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--cor-muted)" }}>{aluno.turma ?? "Sem turma"}</p>
          <div className="adm-chips" style={{ marginTop: "8px" }}>
            {aluno.motivos.map((m) => (
              <span key={m} className="adm-chip">
                {m === "vermelho_duplo"
                  ? `Vermelho ${aluno.semanasVermelhasSeguidas > 1 ? `${aluno.semanasVermelhasSeguidas} semanas seguidas` : "na semana"}`
                  : "Placar de entrada atrasado"}
              </span>
            ))}
          </div>
          <p style={{ margin: "8px 0 0", fontSize: "13px" }}>
            {aluno.ultimoContato
              ? `Último contato: ${ROTULOS_CANAL[aluno.ultimoContato.canal]} · ${ROTULOS_RESULTADO[aluno.ultimoContato.resultado]} · ${formatarDataHora(aluno.ultimoContato.em)} · ${aluno.ultimoContato.autor}`
              : "Nenhum contato registrado."}
          </p>
        </div>
        <div className="adm-acoes" style={{ display: "flex", flexWrap: "wrap", gap: "6px", alignItems: "flex-start" }}>
          {link ? (
            <a className="btn-secondary btn-sm" href={link} target="_blank" rel="noopener noreferrer">
              Abrir WhatsApp
            </a>
          ) : (
            <span style={{ fontSize: "12px", color: "var(--cor-muted)" }}>Sem WhatsApp</span>
          )}
          <button type="button" className="btn-primary btn-sm" onClick={alternar} aria-expanded={aberto}>
            {aberto ? "Fechar" : "Registrar contato"}
          </button>
        </div>
      </div>
      {aberto && <PainelContato aluno={aluno} aoRegistrar={aoRegistrar} />}
    </div>
  );
}

function PainelContato({ aluno, aoRegistrar }: { aluno: AlunoResgate; aoRegistrar: () => void }) {
  const [contatos, setContatos] = useState<Contato[] | null>(null);
  const [erroHist, setErroHist] = useState<string | null>(null);
  const [canal, setCanal] = useState<CanalResgate>("whatsapp");
  const [resultado, setResultado] = useState<ResultadoResgate>("contato_feito");
  const [motivo, setMotivo] = useState<MotivoResgate>(aluno.motivos[0] ?? "outro");
  const [observacao, setObservacao] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const carregar = useCallback(async () => {
    try {
      const r = await chamarApi<{ contatos: Contato[] }>(`/api/resgate/contatos?matricula=${encodeURIComponent(aluno.matriculaId)}`);
      setContatos(r.contatos);
    } catch (e) {
      setErroHist(mensagemErro(e));
    }
  }, [aluno.matriculaId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const registrar = async (e: React.FormEvent) => {
    e.preventDefault();
    setEnviando(true);
    setErro(null);
    try {
      await chamarApi("/api/resgate/contatos", {
        method: "POST",
        body: JSON.stringify({ matriculaId: aluno.matriculaId, canal, resultado, motivoContato: motivo, observacao }),
      });
      setObservacao("");
      notificar(`Contato com ${aluno.nome} registrado.`);
      await carregar();
      aoRegistrar();
    } catch (err) {
      setErro(mensagemErro(err));
    } finally {
      setEnviando(false);
    }
  };

  const selectEstilo = { minWidth: 0, width: "100%" } as const;
  const idBase = `contato-${aluno.matriculaId}`;

  return (
    <div style={{ marginTop: "12px", borderTop: "1px solid var(--cor-border-light)", paddingTop: "12px" }}>
      <form onSubmit={registrar} style={{ display: "grid", gap: "10px", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))" }}>
        <label className="adm-campo" htmlFor={`${idBase}-canal`}>
          <span className="adm-rotulo">Canal</span>
          <select id={`${idBase}-canal`} className="adm-input" style={selectEstilo} value={canal} onChange={(e) => setCanal(e.target.value as CanalResgate)}>
            {CANAIS_RESGATE.map((c) => (
              <option key={c} value={c}>
                {ROTULOS_CANAL[c]}
              </option>
            ))}
          </select>
        </label>
        <label className="adm-campo" htmlFor={`${idBase}-resultado`}>
          <span className="adm-rotulo">Resultado</span>
          <select id={`${idBase}-resultado`} className="adm-input" style={selectEstilo} value={resultado} onChange={(e) => setResultado(e.target.value as ResultadoResgate)}>
            {RESULTADOS_RESGATE.map((r) => (
              <option key={r} value={r}>
                {ROTULOS_RESULTADO[r]}
              </option>
            ))}
          </select>
        </label>
        <label className="adm-campo" htmlFor={`${idBase}-motivo`}>
          <span className="adm-rotulo">Motivo</span>
          <select id={`${idBase}-motivo`} className="adm-input" style={selectEstilo} value={motivo} onChange={(e) => setMotivo(e.target.value as MotivoResgate)}>
            {MOTIVOS_RESGATE.map((m) => (
              <option key={m} value={m}>
                {ROTULOS_MOTIVO[m]}
              </option>
            ))}
          </select>
        </label>
        <label className="adm-campo" htmlFor={`${idBase}-obs`} style={{ gridColumn: "1 / -1" }}>
          <span className="adm-rotulo">Observação (opcional)</span>
          <textarea
            id={`${idBase}-obs`}
            className="adm-input"
            style={{ ...selectEstilo, minHeight: "64px" }}
            maxLength={MAX_OBSERVACAO}
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
          />
        </label>
        <div style={{ gridColumn: "1 / -1", display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
          <button type="submit" className="btn-primary btn-sm" disabled={enviando}>
            {enviando ? "Registrando…" : "Salvar contato"}
          </button>
          <span aria-live="polite" style={{ fontSize: "12px", color: "var(--cor-muted)" }}>
            O registro não pode ser editado depois.
          </span>
        </div>
        {erro && (
          <div className="adm-alerta-erro" role="alert" style={{ gridColumn: "1 / -1" }}>
            {erro}
          </div>
        )}
      </form>

      <h3 style={{ fontSize: "14px", margin: "16px 0 8px" }}>Histórico de contatos</h3>
      {erroHist && <p className="adm-alerta-erro">{erroHist}</p>}
      {!contatos && !erroHist && <p className="adm-vazio">Carregando…</p>}
      {contatos && contatos.length === 0 && <p className="adm-vazio">Nenhum contato registrado.</p>}
      {contatos && contatos.length > 0 && (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: "6px" }}>
          {contatos.map((c) => (
            <li key={c.id} style={{ fontSize: "13px" }}>
              <strong>{formatarDataHora(c.em)}</strong> · {ROTULOS_CANAL[c.canal]} · {ROTULOS_RESULTADO[c.resultado]} ·{" "}
              {ROTULOS_MOTIVO[c.motivoContato]} · {c.autor}
              {c.observacao && <div style={{ color: "var(--cor-muted)", whiteSpace: "pre-wrap" }}>{c.observacao}</div>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
