"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { StatusDot } from "@/components/ui/StatusDot";
import { BadgeStatusDiagnostico } from "@/components/diagnostico/equipe/BadgeStatusDiagnostico";
import { SeletorTurma } from "@/components/diagnostico/equipe/SeletorTurma";
import {
  Cor,
  EstadoCarregando,
  EstadoErro,
  ROTULOS_COR,
  corParaDot,
  diasAteMes6,
  useTurmaAcompanhamento,
} from "@/components/diagnostico/equipe/dados";
import { numeroTabular } from "@/components/diagnostico/equipe/estilos";
import { ROTULOS_RISCO, ROTULOS_SEGMENTO, ROTULOS_TIPO_ANJO } from "@/lib/diagnostico/cliente";
import type { AnjoTipoT0, RiscoParcela } from "@/lib/diagnostico/regras";

const CLASSE_RISCO: Record<RiscoParcela, string> = { alto: "falta", medio: "justificada", baixo: "neutro" };

export default function MesaAnjoPage() {
  const { turmaId, turmas, alunos, carregando, erro, trocarTurma } = useTurmaAcompanhamento();
  const [busca, setBusca] = useState("");
  const [tipo, setTipo] = useState<AnjoTipoT0 | "">("");
  const [risco, setRisco] = useState<RiscoParcela | "">("");
  const [cor, setCor] = useState<Cor | "">("");
  const [soIncompletos, setSoIncompletos] = useState(false);
  const [comVermelho28d, setComVermelho28d] = useState(false);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return alunos.filter((a) => {
      if (termo.length >= 2 && !a.nome.toLowerCase().includes(termo)) return false;
      if (tipo && a.scores.anjo_tipo_t0 !== tipo) return false;
      if (risco && a.scores.risco_parcela !== risco) return false;
      if (cor && a.semaforo !== cor) return false;
      if (soIncompletos && a.diagnosticoStatus !== "rascunho") return false;
      if (comVermelho28d && !(a.vermelhos28d && a.vermelhos28d > 0)) return false;
      return true;
    });
  }, [alunos, busca, tipo, risco, cor, soIncompletos, comVermelho28d]);

  return (
    <div className="adm-pagina">
      <header className="adm-cabecalho">
        <div>
          <h1 className="adm-titulo">Mesa do Anjo</h1>
          <p className="adm-subtitulo">Leitura semanal da turma: placar de entrada, tipo do Anjo, risco e contagem até o mês 6.</p>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--espaco-sm)", alignItems: "flex-end" }}>
          <Link href="/anjo/mes6" className="btn-secondary btn-sm" style={{ textDecoration: "none" }}>
            Lista do mês 6
          </Link>
          <SeletorTurma turmas={turmas} valor={turmaId} onChange={trocarTurma} />
        </div>
      </header>

      <div className="card" style={{ padding: "var(--espaco-lg)", marginBottom: "var(--espaco-lg)", display: "flex", flexWrap: "wrap", gap: "var(--espaco-md)", alignItems: "flex-end" }}>
        <div className="adm-campo" style={{ flex: "1 1 220px" }}>
          <label htmlFor="busca-mesa" className="adm-rotulo">Buscar</label>
          <input id="busca-mesa" className="adm-input" style={{ minWidth: 0 }} placeholder="Nome (mínimo 2 letras)" value={busca} onChange={(e) => setBusca(e.target.value)} />
        </div>
        <div className="adm-campo" style={{ flex: "1 1 160px" }}>
          <label htmlFor="filtro-tipo" className="adm-rotulo">Tipo do Anjo</label>
          <select id="filtro-tipo" className="adm-input" style={{ minWidth: 0 }} value={tipo} onChange={(e) => setTipo(e.target.value as AnjoTipoT0 | "")}>
            <option value="">Todos</option>
            {(["A_nada", "B_estrutura_sem_venda", "C_vendeu_sem_sobrar", "indefinido"] as AnjoTipoT0[]).map((t) => (
              <option key={t} value={t}>{ROTULOS_TIPO_ANJO[t]}</option>
            ))}
          </select>
        </div>
        <div className="adm-campo" style={{ flex: "1 1 140px" }}>
          <label htmlFor="filtro-risco" className="adm-rotulo">Risco da parcela</label>
          <select id="filtro-risco" className="adm-input" style={{ minWidth: 0 }} value={risco} onChange={(e) => setRisco(e.target.value as RiscoParcela | "")}>
            <option value="">Todos</option>
            {(["alto", "medio", "baixo"] as RiscoParcela[]).map((r) => (
              <option key={r} value={r}>{ROTULOS_RISCO[r]}</option>
            ))}
          </select>
        </div>
        <div className="adm-campo" style={{ flex: "1 1 130px" }}>
          <label htmlFor="filtro-semaforo" className="adm-rotulo">Semáforo</label>
          <select id="filtro-semaforo" className="adm-input" style={{ minWidth: 0 }} value={cor} onChange={(e) => setCor(e.target.value as Cor | "")}>
            <option value="">Todos</option>
            {(["verde", "amarelo", "vermelho"] as Cor[]).map((c) => (
              <option key={c} value={c}>{ROTULOS_COR[c]}</option>
            ))}
          </select>
        </div>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", paddingBottom: "8px" }}>
          <input type="checkbox" checked={soIncompletos} onChange={(e) => setSoIncompletos(e.target.checked)} />
          Placar incompleto
        </label>
        <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px", paddingBottom: "8px" }}>
          <input type="checkbox" checked={comVermelho28d} onChange={(e) => setComVermelho28d(e.target.checked)} />
          Com vermelho nos últimos 28 dias
        </label>
      </div>

      {carregando ? (
        <EstadoCarregando texto="Carregando a mesa…" />
      ) : erro ? (
        <EstadoErro mensagem={erro} />
      ) : alunos.length === 0 ? (
        <div className="adm-vazio"><h3>Nenhum mentorado ativo nesta turma</h3></div>
      ) : filtrados.length === 0 ? (
        <div className="adm-vazio"><h3>Nenhum aluno com esses filtros</h3></div>
      ) : (
        <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(min(100%, 300px), 1fr))", gap: "var(--espaco-md)" }}>
          {filtrados.map((a) => {
            const dias = diasAteMes6(a.matriculadoEm);
            return (
              <li key={a.matriculaId}>
                <Link href={`/anjo/${a.matriculaId}`} className="card adm-encontro" style={{ display: "block", textDecoration: "none", color: "inherit", height: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", alignItems: "flex-start" }}>
                    <h3 style={{ overflowWrap: "anywhere" }}>{a.nome}</h3>
                    <StatusDot status={corParaDot(a.semaforo)} label={a.semaforo ? ROTULOS_COR[a.semaforo] : "Sem semáforo"} />
                  </div>
                  <div className="adm-chips">
                    <BadgeStatusDiagnostico status={a.diagnosticoStatus} atrasado={a.diagnosticoAtrasado} />
                    {a.scores.icp_segmento && <span className="adm-chip neutro">{ROTULOS_SEGMENTO[a.scores.icp_segmento]}</span>}
                    {a.scores.anjo_tipo_t0 && <span className="adm-chip neutro">{ROTULOS_TIPO_ANJO[a.scores.anjo_tipo_t0]}</span>}
                    {a.scores.risco_parcela && <span className={`adm-chip ${CLASSE_RISCO[a.scores.risco_parcela]}`}>{ROTULOS_RISCO[a.scores.risco_parcela]}</span>}
                  </div>
                  <p className="adm-encontro-meta" style={{ marginTop: "var(--espaco-sm)", ...numeroTabular }}>
                    {dias > 0 ? `Mês 6: faltam ${dias} dias` : `Mês 6: chegou há ${Math.abs(dias)} dias`}
                    {" · "}
                    {(a.vermelhos28d ?? 0) === 0
                      ? "nenhum vermelho em 28 dias"
                      : `${a.vermelhos28d} ${a.vermelhos28d === 1 ? "semana vermelha" : "semanas vermelhas"} em 28 dias`}
                  </p>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
