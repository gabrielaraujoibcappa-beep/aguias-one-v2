"use client";

import React from "react";
import Link from "next/link";
import { StatusDot } from "@/components/ui/StatusDot";
import { BadgeStatusDiagnostico } from "@/components/diagnostico/equipe/BadgeStatusDiagnostico";
import { PecasDePe } from "@/components/diagnostico/equipe/PecasDePe";
import { PlacarEntrada } from "@/components/diagnostico/equipe/PlacarEntrada";
import { EstadoCarregando, EstadoErro, ROTULOS_COR, corParaDot, useFicha } from "@/components/diagnostico/equipe/dados";
import { secao, textoMuted, tituloSecao } from "@/components/diagnostico/equipe/estilos";
import { ROTULOS_TIPO_ANJO, formatarData } from "@/lib/diagnostico/cliente";

/** O que o Concierge precisa para a quarta. Sem frases e sem mix de receita (a API já filtra). */
export default function ConciergeAlunoPage({ params }: { params: { id: string } }) {
  const { ficha, extra, carregando, erro } = useFicha(params.id);
  const voltar = { href: "/concierge/turma", rotulo: "Voltar à turma" };

  if (carregando) return <div className="adm-pagina"><EstadoCarregando texto="Carregando o aluno…" /></div>;
  if (erro || !ficha) return <div className="adm-pagina"><EstadoErro mensagem={erro ?? "Aluno indisponível."} voltar={voltar} /></div>;

  const { aluno, diagnostico: d } = ficha;

  return (
    <div className="adm-pagina" style={{ maxWidth: "860px" }}>
      <Link href={voltar.href} style={{ color: "var(--cor-muted)", fontSize: "14px", textDecoration: "none" }}>
        ← {voltar.rotulo}
      </Link>
      <header className="adm-cabecalho" style={{ marginTop: "var(--espaco-md)" }}>
        <div>
          <h1 className="adm-titulo" style={{ overflowWrap: "anywhere" }}>{aluno.nome}</h1>
          <p className="adm-subtitulo">{aluno.turma ?? "Turma"} · matrícula em {formatarData(aluno.matriculadoEm)}</p>
          <div className="adm-chips">
            <BadgeStatusDiagnostico status={d.status} atrasado={d.atrasado} />
            {d.scores.anjo_tipo_t0 && <span className="adm-chip neutro">{ROTULOS_TIPO_ANJO[d.scores.anjo_tipo_t0]}</span>}
            {extra.semaforo && <StatusDot status={corParaDot(extra.semaforo)} label={ROTULOS_COR[extra.semaforo]} />}
          </div>
        </div>
      </header>

      {d.atrasado && (
        <p className="adm-alerta-erro" role="status">
          Placar de entrada atrasado (T+48h). O aluno já aparece automaticamente na lista do Resgate (Adelayne).
        </p>
      )}

      <section className="card" style={secao}>
        <h2 style={tituloSecao}>Onde travou</h2>
        {extra.travou ? <p style={{ margin: 0, fontSize: "15px", overflowWrap: "anywhere" }}>{extra.travou}</p> : <p style={{ ...textoMuted, margin: 0 }}>Sem trava registrada no último check-in.</p>}
        {extra.motivo && <p style={{ ...textoMuted, margin: "var(--espaco-sm) 0 0" }}>Semáforo: {extra.motivo}</p>}
      </section>

      <section className="card" style={secao}>
        <h2 style={tituloSecao}>Placar resumido</h2>
        {d.status === "rascunho" ? (
          <p style={textoMuted}>Placar ainda não enviado.</p>
        ) : (
          <PlacarEntrada payload={d.payload} scores={d.scores} mesesReferencia={d.mesesReferencia} resumido />
        )}
      </section>

      <section className="card" style={secao}>
        <h2 style={tituloSecao}>Peças de pé</h2>
        <PecasDePe payload={d.payload} />
      </section>
    </div>
  );
}
