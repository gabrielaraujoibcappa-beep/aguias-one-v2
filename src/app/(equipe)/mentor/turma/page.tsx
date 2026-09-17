"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusDot, type StatusVariant } from "@/components/ui/StatusDot";
import { IconUsers } from "@/components/ui/Icons";
import { Carregando, SeletorTurma, Vazio, mensagemDeErro } from "@/components/diagnostico/mentor/EstadoTela";
import {
  ROTULOS_RISCO,
  ROTULOS_SEGMENTO,
  ROTULOS_STATUS_DIAGNOSTICO,
  ROTULOS_TIPO_ANJO,
  chamarApi,
  formatarCentavos,
} from "@/lib/diagnostico/cliente";
import type { ScoresDiagnostico, StatusDiagnostico } from "@/lib/diagnostico/regras";

interface AlunoCard {
  matriculaId: string;
  nome: string;
  email: string;
  diagnosticoStatus: StatusDiagnostico;
  diagnosticoAtrasado: boolean;
  travou: string | null;
  scores: Partial<ScoresDiagnostico>;
  media3mCentavos?: number | null;
}

interface RespostaLista {
  turma: { id: string; nome: string } | null;
  turmas: { id: string; nome: string }[];
  alunos: AlunoCard[];
}

interface AlunoSemaforo {
  matriculaId: string;
  statusSemaforo: "verde" | "amarelo" | "vermelho";
  motivoSemaforo: string;
}

type Filtro = "travas" | "fit_nao" | "risco_alto";

const ROTULOS_FILTRO: Record<Filtro, string> = {
  travas: "Com trava",
  fit_nao: "Fit ONE: não",
  risco_alto: "Risco alto",
};

const ROTULOS_SEMAFORO: Record<AlunoSemaforo["statusSemaforo"], string> = {
  verde: "Verde",
  amarelo: "Amarelo",
  vermelho: "Vermelho",
};

export default function MentorTurmaPage() {
  const router = useRouter();
  const [turmaId, setTurmaId] = useState("");
  const [dados, setDados] = useState<RespostaLista | null>(null);
  const [semaforo, setSemaforo] = useState<Map<string, AlunoSemaforo>>(new Map());
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [filtros, setFiltros] = useState<Set<Filtro>>(new Set());

  const carregar = useCallback(async (turma: string) => {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await chamarApi<RespostaLista>(`/api/diagnosticos${turma ? `?turma=${encodeURIComponent(turma)}` : ""}`);
      setDados(lista);
      if (!turma && lista.turma) setTurmaId(lista.turma.id);
      if (lista.turma) {
        // Semáforo é complementar: falha nele não derruba a tabela
        const sem = await chamarApi<{ alunos: AlunoSemaforo[] }>(
          `/api/semaforo?turmaId=${encodeURIComponent(lista.turma.id)}`
        ).catch(() => ({ alunos: [] as AlunoSemaforo[] }));
        setSemaforo(new Map(sem.alunos.map((a) => [a.matriculaId, a])));
      } else {
        setSemaforo(new Map());
      }
    } catch (err) {
      setErro(mensagemDeErro(err));
      setDados(null);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar(turmaId);
    // turmaId inicial vem da própria resposta; recarrega só em troca explícita
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const trocarTurma = (id: string) => {
    setTurmaId(id);
    carregar(id);
  };

  const alternarFiltro = (f: Filtro) =>
    setFiltros((atual) => {
      const novo = new Set(atual);
      if (novo.has(f)) novo.delete(f);
      else novo.add(f);
      return novo;
    });

  const alunos = useMemo(() => {
    return (dados?.alunos ?? []).filter((a) => {
      if (filtros.has("travas") && !a.travou) return false;
      if (filtros.has("fit_nao") && a.scores.fit_one !== "nao") return false;
      if (filtros.has("risco_alto") && a.scores.risco_parcela !== "alto") return false;
      return true;
    });
  }, [dados, filtros]);

  return (
    <div className="adm-pagina">
      <div className="adm-cabecalho">
        <div>
          <h1 className="adm-titulo">
            <IconUsers size={26} />
            Mentor · Turma
          </h1>
          <p className="adm-subtitulo">Operação da turma com placar de entrada, fit e risco da parcela.</p>
        </div>
        <SeletorTurma turmas={dados?.turmas ?? []} valor={turmaId || dados?.turma?.id || ""} aoMudar={trocarTurma} />
      </div>

      {erro && (
        <div className="adm-alerta-erro" role="alert">
          {erro}
        </div>
      )}

      {!erro && (
        <div
          role="group"
          aria-label="Filtros"
          style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px", marginBottom: "var(--espaco-lg)" }}
        >
          <span className="adm-rotulo">Filtros</span>
          {(Object.keys(ROTULOS_FILTRO) as Filtro[]).map((f) => (
            <button
              key={f}
              type="button"
              className="btn-secondary btn-sm"
              aria-pressed={filtros.has(f)}
              onClick={() => alternarFiltro(f)}
              style={
                filtros.has(f)
                  ? { backgroundColor: "var(--cor-pale-blue)", borderColor: "var(--cor-action-vibrant)", color: "var(--cor-action-vibrant)" }
                  : undefined
              }
            >
              {ROTULOS_FILTRO[f]}
            </button>
          ))}
          {filtros.size > 0 && (
            <button type="button" className="btn-tertiary btn-sm" onClick={() => setFiltros(new Set())}>
              Limpar filtros
            </button>
          )}
        </div>
      )}

      {carregando ? (
        <Carregando texto="Carregando a turma…" />
      ) : erro ? null : !dados?.turma ? (
        <Vazio titulo="Nenhuma turma encontrada." />
      ) : alunos.length === 0 ? (
        <Vazio
          titulo={dados.alunos.length ? "Nenhum mentorado com esses filtros." : "Nenhum mentorado ativo nesta turma."}
        />
      ) : (
        <div className="card adm-card-sem-padding">
          <div style={{ overflowX: "auto" }}>
            <table className="adm-tabela" style={{ minWidth: "1080px" }}>
              <caption className="sr-only">Mentorados da turma {dados.turma.nome}</caption>
              <thead>
                <tr>
                  <th scope="col">Mentorado</th>
                  <th scope="col">Semáforo</th>
                  <th scope="col">Placar</th>
                  <th scope="col">Tipo Anjo</th>
                  <th scope="col" style={{ textAlign: "right" }}>Peças</th>
                  <th scope="col">Travou</th>
                  <th scope="col" style={{ textAlign: "right" }}>Média 3m</th>
                  <th scope="col">Fit ONE</th>
                  <th scope="col">Risco</th>
                  <th scope="col">Segmento</th>
                </tr>
              </thead>
              <tbody>
                {alunos.map((a) => {
                  const sem = semaforo.get(a.matriculaId);
                  const href = `/mentor/aluno/${a.matriculaId}`;
                  const s = a.scores;
                  return (
                    <tr key={a.matriculaId} onClick={() => router.push(href)} style={{ cursor: "pointer" }}>
                      <td>
                        <Link href={href} className="adm-aluno-nome" onClick={(e) => e.stopPropagation()}>
                          {a.nome}
                        </Link>
                        <div className="adm-aluno-email">{a.email}</div>
                      </td>
                      <td title={sem?.motivoSemaforo}>
                        {sem ? (
                          <StatusDot status={sem.statusSemaforo as StatusVariant} label={ROTULOS_SEMAFORO[sem.statusSemaforo]} />
                        ) : (
                          <StatusDot status="neutro" label="—" />
                        )}
                      </td>
                      <td>
                        <span className={`adm-chip ${a.diagnosticoStatus === "rascunho" ? (a.diagnosticoAtrasado ? "falta" : "neutro") : "presente"}`}>
                          {a.diagnosticoAtrasado ? "Atrasado" : ROTULOS_STATUS_DIAGNOSTICO[a.diagnosticoStatus]}
                        </span>
                      </td>
                      <td>{s.anjo_tipo_t0 ? ROTULOS_TIPO_ANJO[s.anjo_tipo_t0] : "—"}</td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {s.pecas_de_pe !== undefined ? `${s.pecas_de_pe}/10` : "—"}
                      </td>
                      <td style={{ maxWidth: "220px" }}>
                        {a.travou ? (
                          <span
                            title={a.travou}
                            style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontSize: "13px" }}
                          >
                            {a.travou}
                          </span>
                        ) : (
                          <span style={{ color: "var(--cor-muted)" }}>—</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", whiteSpace: "nowrap" }}>
                        {formatarCentavos(a.media3mCentavos ?? null)}
                      </td>
                      <td>
                        {s.fit_one === "nao" ? (
                          <span className="adm-chip falta">Não</span>
                        ) : s.fit_one === "sim" ? (
                          <span className="adm-chip neutro">Sim</span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>
                        {s.risco_parcela ? (
                          <span className={`adm-chip ${s.risco_parcela === "alto" ? "falta" : s.risco_parcela === "medio" ? "justificada" : "neutro"}`}>
                            {ROTULOS_RISCO[s.risco_parcela]}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>
                        {s.icp_segmento ? ROTULOS_SEGMENTO[s.icp_segmento] : "—"}
                        {s.flag_e_aluno_casa && (
                          <span className="adm-chip neutro" style={{ marginLeft: "6px" }} title="Aluno da casa há 2 anos ou mais">
                            E
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!carregando && !erro && dados?.turma && (
        <p style={{ fontSize: "12px", color: "var(--cor-muted)", marginTop: "var(--espaco-md)" }}>
          Média 3m = últimos 3 meses declarados.
        </p>
      )}
    </div>
  );
}
