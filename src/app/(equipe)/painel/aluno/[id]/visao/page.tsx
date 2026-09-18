"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CardPerfilAluno } from "@/components/aluno/CardPerfilAluno";
import { PainelKpisAluno } from "@/components/aluno/PainelKpisAluno";
import { AtalhosPrincipais } from "@/components/aluno/AtalhosPrincipais";
import { SecaoMateriais } from "@/components/aluno/SecaoMateriais";
import { CardPlanoAnjo } from "@/components/aluno/CardPlanoAnjo";
import { EditorCanaisAluno } from "@/components/equipe/EditorCanaisAluno";
import { montarContextoVisaoAluno } from "@/lib/api/visao-aluno";
import { CanalItem } from "@/lib/api/canais";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { EstadoCarregando } from "@/components/ui/EstadoCarregando";

/**
 * Visão do aluno (equipe): replica as seções do dashboard do mentorado,
 * somente leitura, para apoiar quem precisa de ajuda ("não aparece pra mim").
 * Nenhuma ação é executada em nome do aluno.
 */
function ConteudoVisao() {
  const params = useParams<{ id: string }>();
  const { estado, mentorados, carregado } = useSistemaStore();
  const [canais, setCanais] = useState<CanalItem[]>([]);
  const [canaisProntos, setCanaisProntos] = useState(false);

  const alunoId = decodeURIComponent(Array.isArray(params?.id) ? params.id[0] : params?.id ?? "");

  const contexto = useMemo(
    () =>
      carregado
        ? montarContextoVisaoAluno(
            {
              alunos: mentorados,
              turmas: estado.turmas,
              modulos: estado.modulos,
              faturamentos: estado.faturamentos,
              metasFaturamentoAlunos: estado.metasFaturamentoAlunos,
              entregas: estado.entregas,
            },
            alunoId
          )
        : null,
    [carregado, estado, mentorados, alunoId]
  );

  // Canais não vêm no sync da equipe: busca pontual da matrícula alvo
  useEffect(() => {
    let ativo = true;
    setCanais([]);
    setCanaisProntos(false);
    if (!contexto?.matriculaId) return;
    fetch(`/api/canais?matriculaId=${encodeURIComponent(contexto.matriculaId)}`, { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((dados) => {
        if (!ativo) return;
        if (dados?.sucesso) setCanais(dados.canais || []);
        setCanaisProntos(true);
      })
      .catch(() => {
        if (ativo) setCanaisProntos(true);
      });
    return () => {
      ativo = false;
    };
  }, [contexto?.matriculaId]);

  if (!carregado) return <EstadoCarregando texto="a visão do aluno" variante="pagina" />;

  if (!contexto) {
    return (
      <div className="card" style={{ textAlign: "center", padding: "var(--espaco-xxl)" }}>
        <h1 style={{ fontSize: "20px", marginBottom: "8px" }}>Aluno não encontrado</h1>
        <p style={{ color: "var(--cor-muted)", marginBottom: "var(--espaco-md)" }}>
          Não há registro com o identificador informado no sistema.
        </p>
        <Link href="/admin/alunos" className="btn-secondary">
          Ir para Gestão de Alunos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div
        role="note"
        style={{
          backgroundColor: "#eff6ff",
          border: "1px solid #bfdbfe",
          color: "#1e40af",
          borderRadius: "var(--radius-sm)",
          padding: "12px 16px",
          fontSize: "13px",
          marginBottom: "var(--espaco-lg)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "8px",
        }}
      >
        <span>
          Você está operando como <strong>{contexto.aluno.nome}</strong> — edições feitas pela equipe.
        </span>
        <Link href={`/painel/aluno/${encodeURIComponent(alunoId)}`} className="btn-secondary btn-sm" style={{ textDecoration: "none" }}>
          Voltar à ficha
        </Link>
      </div>

      <nav aria-label="Ações rápidas" style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginBottom: "var(--espaco-lg)" }}>
        <Link href="/admin/alunos" className="btn-secondary btn-sm" style={{ textDecoration: "none" }}>
          Editar cadastro
        </Link>
        <Link href="/painel/auditoria" className="btn-secondary btn-sm" style={{ textDecoration: "none" }}>
          Auditar entregas
        </Link>
        <Link href="/painel/faturamento" className="btn-secondary btn-sm" style={{ textDecoration: "none" }}>
          Metas & faturamento
        </Link>
        <Link href="/admin/materiais" className="btn-secondary btn-sm" style={{ textDecoration: "none" }}>
          Materiais
        </Link>
      </nav>

      <CardPerfilAluno
        nome={contexto.aluno.nome}
        turmaNome={contexto.turmaNome}
        moduloAtualTitulo={contexto.moduloAtualTitulo}
      />

      <CardPlanoAnjo matriculaId={contexto.matriculaId} />

      <PainelKpisAluno
        faturamentos={contexto.faturamentosDoAluno}
        canais={canais}
        modulos={contexto.modulosVisiveis}
        entregas={contexto.entregasDoAluno}
        metaMensal={contexto.metaMensal}
        horarioEncontro={contexto.horarioEncontro}
      />

      <AtalhosPrincipais contexto={contexto.contextoAtalhos} somenteLeitura />

      {contexto.matriculaId && canaisProntos && (
        <EditorCanaisAluno
          matriculaId={contexto.matriculaId}
          nomeAluno={contexto.aluno.nome}
          iniciais={canais}
        />
      )}

      <SecaoMateriais />
    </div>
  );
}

export default function VisaoAlunoPage() {
  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
      <Suspense fallback={null}>
        <ConteudoVisao />
      </Suspense>
    </div>
  );
}
