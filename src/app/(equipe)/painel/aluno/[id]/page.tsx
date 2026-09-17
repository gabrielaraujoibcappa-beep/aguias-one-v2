"use client";

import React, { Suspense, useMemo } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { FichaAluno } from "@/components/equipe/FichaAluno";
import { CONTEXTOS_OPERACIONAIS, montarFichaAluno } from "@/lib/api/ficha-aluno";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { EstadoCarregando } from "@/components/ui/EstadoCarregando";

const ANO_ATUAL = new Date().getFullYear();

function ConteudoFicha() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { estado, mentorados, carregado, alunoAtualId } = useSistemaStore();

  const alunoId = decodeURIComponent(Array.isArray(params?.id) ? params.id[0] : params?.id ?? "");
  const contextoChave = searchParams.get("contexto") ?? "";
  const contexto = CONTEXTOS_OPERACIONAIS[contextoChave];

  const ficha = useMemo(
    () =>
      carregado
        ? montarFichaAluno(
            {
              // A ficha é do mentorado: conta da equipe cai em "Aluno não encontrado"
              alunos: mentorados,
              turmas: estado.turmas,
              alunosSemaforo: estado.alunosSemaforo,
              entregas: estado.entregas,
              modulos: estado.modulos,
              faturamentos: estado.faturamentos,
              metasFaturamentoAlunos: estado.metasFaturamentoAlunos,
              canais: estado.canais,
              alunoAtualId,
              bloqueiosAcesso: estado.bloqueiosAcesso,
              historicoBloqueios: estado.historicoBloqueios,
            },
            alunoId,
            ANO_ATUAL
          )
        : null,
    [carregado, estado, alunoId]
  );

  if (!carregado) return <EstadoCarregando texto="a ficha do aluno" variante="pagina" />;

  if (!ficha) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "var(--espaco-xxl)" }}>
        <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>Aluno não encontrado</h1>
        <p style={{ color: "var(--cor-muted)", marginBottom: "var(--espaco-md)" }}>
          Não há registro com o identificador informado no sistema.
        </p>
        <Link href={contexto?.retornoHref ?? "/admin/alunos"} className="btn-secondary">
          {contexto?.retornoRotulo ?? "Ir para Gestão de Alunos"}
        </Link>
      </div>
    );
  }

  return <FichaAluno ficha={ficha} contexto={contexto} />;
}

export default function FichaAlunoPage() {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
      <Suspense fallback={null}>
        <ConteudoFicha />
      </Suspense>
    </div>
  );
}
