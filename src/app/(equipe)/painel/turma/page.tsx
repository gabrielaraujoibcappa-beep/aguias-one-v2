"use client";

import React, { useState } from "react";
import { PainelKpisTurma } from "@/components/equipe/PainelKpisTurma";
import { TabelaSemaforoTurma } from "@/components/equipe/TabelaSemaforoTurma";
import { ModalAluno } from "@/components/admin/ModalAluno";
import { FiltroPeriodo } from "@/components/ui/FiltroPeriodo";
import { IconUserPlus } from "@/components/ui/Icons";
import { criarPeriodoPadrao, PeriodoFiltroState } from "@/lib/periodo/calculo-periodo";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { EstadoCarregando } from "@/components/ui/EstadoCarregando";

export default function PainelTurmaPage() {
  const { estado, salvarAluno, carregado } = useSistemaStore();

  const [modalMatriculaAberto, setModalMatriculaAberto] = useState(false);
  const [periodo, setPeriodo] = useState<PeriodoFiltroState>(() =>
    criarPeriodoPadrao("Global da turma")
  );
  const [carregandoPeriodo, setCarregandoPeriodo] = useState(false);

  const turmasDisponiveis = estado.turmas.map((t) => ({ id: t.id, nome: t.nome }));

  const handleAtualizarDados = () => {
    setCarregandoPeriodo(true);
    setTimeout(() => {
      setPeriodo((prev) => ({ ...prev, ultimaAtualizacao: new Date() }));
      setCarregandoPeriodo(false);
    }, 400);
  };

  if (!carregado) return <EstadoCarregando texto="a turma" variante="pagina" />;

  // Turma em andamento vinda do banco (o painel ainda não seleciona entre turmas)
  const turma = (estado.turmas.find((t) => t.status === "em_andamento") ?? estado.turmas[0])?.nome ?? "Nenhuma turma cadastrada";

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--espaco-lg)", flexWrap: "wrap", gap: "var(--espaco-md)" }}>
        <div>
          <h1 style={{ fontSize: "28px", marginBottom: "var(--espaco-xs)" }}>Painel da Turma & Semáforo</h1>
          <p style={{ color: "var(--cor-muted)" }}>
            Acompanhamento semanal para o encontro de quarta com Flávio Lopes: monitoramento de travas e resgate imediato de alunos em risco.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <div style={{
            backgroundColor: "var(--cor-soft-stone)",
            padding: "6px 14px",
            borderRadius: "var(--radius-pill)",
            fontWeight: 600,
            fontSize: "13px",
          }}>
            {turma}
          </div>

          <button
            type="button"
            onClick={() => setModalMatriculaAberto(true)}
            className="btn-primary btn-sm"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <IconUserPlus size={15} />
            <span>+ Matricular Aluno</span>
          </button>
        </div>
      </div>

      {/* Barra Contextual de Filtro de Período (Norma de UX ÁGUIAS ONE) */}
      <FiltroPeriodo
        valor={periodo}
        onChange={setPeriodo}
        onAtualizarDados={handleAtualizarDados}
        carregando={carregandoPeriodo}
        escopoNome={turma}
      />

      {/* Indicadores Estratégicos da Turma (KPIs 360) */}
      <PainelKpisTurma
        alunos={estado.alunosSemaforo}
        entregas={estado.entregas}
        turmaNome={turma}
      />

      <TabelaSemaforoTurma alunos={estado.alunosSemaforo} entregas={estado.entregas} />

      {/* Modal de Matrícula / Criação de Usuário pela Operação */}
      {modalMatriculaAberto && (
        <ModalAluno
          aberto={modalMatriculaAberto}
          turmas={turmasDisponiveis}
          onSalvar={(novoAluno) => {
            salvarAluno(novoAluno);
          }}
          onFechar={() => setModalMatriculaAberto(false)}
        />
      )}
    </div>
  );
}
