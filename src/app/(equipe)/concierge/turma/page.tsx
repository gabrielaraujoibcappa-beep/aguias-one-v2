"use client";

import React, { useState } from "react";
import Link from "next/link";
import { StatusDot } from "@/components/ui/StatusDot";
import { BadgeStatusDiagnostico } from "@/components/diagnostico/equipe/BadgeStatusDiagnostico";
import { SeletorTurma } from "@/components/diagnostico/equipe/SeletorTurma";
import { EstadoCarregando, EstadoErro, ROTULOS_COR, corParaDot, useTurmaAcompanhamento } from "@/components/diagnostico/equipe/dados";
import { numeroTabular, rolagemTabela } from "@/components/diagnostico/equipe/estilos";
import { ROTULOS_TIPO_ANJO } from "@/lib/diagnostico/cliente";

export default function ConciergeTurmaPage() {
  const { turmaId, turmas, alunos, carregando, erro, trocarTurma } = useTurmaAcompanhamento();
  const [soAtrasados, setSoAtrasados] = useState(false);

  const atrasados = alunos.filter((a) => a.diagnosticoAtrasado);
  const lista = soAtrasados ? atrasados : alunos;

  return (
    <div className="adm-pagina">
      <header className="adm-cabecalho">
        <div>
          <h1 className="adm-titulo">Turma da semana</h1>
          <p className="adm-subtitulo">Preparação da quarta: semáforo, placar de entrada, peças de pé e travas.</p>
        </div>
        <SeletorTurma turmas={turmas} valor={turmaId} onChange={trocarTurma} />
      </header>

      {carregando ? (
        <EstadoCarregando texto="Carregando a turma…" />
      ) : erro ? (
        <EstadoErro mensagem={erro} />
      ) : alunos.length === 0 ? (
        <div className="adm-vazio"><h3>Nenhum mentorado ativo nesta turma</h3></div>
      ) : (
        <>
          {atrasados.length > 0 && (
            <div
              role="status"
              className="card"
              style={{ padding: "var(--espaco-md) var(--espaco-lg)", marginBottom: "var(--espaco-lg)", borderLeft: "4px solid #ef4444", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "var(--espaco-md)" }}
            >
              <div>
                <strong style={numeroTabular}>
                  {atrasados.length} {atrasados.length === 1 ? "placar atrasado" : "placares atrasados"} (T+48h)
                </strong>
                <div style={{ fontSize: "13px", color: "var(--cor-muted)" }}>
                  Já aparecem automaticamente na lista do Resgate (Adelayne): {atrasados.map((a) => a.nome).join(", ")}
                </div>
              </div>
              <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "14px" }}>
                <input type="checkbox" checked={soAtrasados} onChange={(e) => setSoAtrasados(e.target.checked)} />
                Mostrar só atrasados
              </label>
            </div>
          )}

          <div className="card adm-card-sem-padding" style={rolagemTabela}>
            <table className="adm-tabela" style={{ ...numeroTabular, minWidth: "760px" }}>
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>Semáforo</th>
                  <th>Placar</th>
                  <th>Tipo do Anjo</th>
                  <th>Peças</th>
                  <th>Travou</th>
                </tr>
              </thead>
              <tbody>
                {lista.map((a) => (
                  <tr key={a.matriculaId}>
                    <td>
                      <Link href={`/concierge/aluno/${a.matriculaId}`} className="adm-aluno-nome" style={{ textDecoration: "none" }}>
                        {a.nome}
                      </Link>
                    </td>
                    <td>
                      <span title={a.motivoSemaforo ?? undefined}>
                        <StatusDot status={corParaDot(a.semaforo)} label={a.semaforo ? ROTULOS_COR[a.semaforo] : "—"} />
                      </span>
                    </td>
                    <td>
                      <BadgeStatusDiagnostico status={a.diagnosticoStatus} atrasado={a.diagnosticoAtrasado} />
                    </td>
                    <td>{a.scores.anjo_tipo_t0 ? ROTULOS_TIPO_ANJO[a.scores.anjo_tipo_t0] : "—"}</td>
                    <td>{a.scores.pecas_de_pe !== undefined ? `${a.scores.pecas_de_pe}/10` : "—"}</td>
                    <td>
                      <span
                        title={a.travou ?? undefined}
                        style={{ display: "block", maxWidth: "260px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: a.travou ? "var(--cor-ink)" : "var(--cor-muted)" }}
                      >
                        {a.travou ?? "—"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
