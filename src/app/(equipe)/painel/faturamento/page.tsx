"use client";

import React, { useMemo, useState } from "react";
import { Tabs, TabItem } from "@/components/ui/Tabs";
import { TabelaMetasTurma } from "@/components/equipe/TabelaMetasTurma";
import { FilaAuditoriaFaturamento } from "@/components/equipe/FilaAuditoriaFaturamento";
import { DetalheFaturamentoAluno } from "@/components/equipe/DetalheFaturamentoAluno";
import { ModalDeclaracaoFaturamento } from "@/components/equipe/ModalDeclaracaoFaturamento";
import {
  DeclaracaoFaturamento,
  consolidarFaturamentoTurma,
  filtrarFaturamentosPorAluno,
  formatarMoedaReal,
  obterMetaAnualAluno,
} from "@/lib/api/faturamento";
import { useSistemaStore } from "@/lib/store/sistema-store";

const ANO_ATUAL = new Date().getFullYear();

export default function PainelFaturamentoPage() {
  const { estado, carregado, salvarFaturamento, excluirFaturamento, auditarFaturamento, definirMetaFaturamentoAnual } = useSistemaStore();

  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ aberto: boolean; declaracao: DeclaracaoFaturamento | null; alunoFixoId?: string }>({ aberto: false, declaracao: null });
  const [toast, setToast] = useState<string | null>(null);

  const alunosBase = useMemo(
    () => estado.alunos.map((a) => ({ id: a.id ?? "", nome: a.nome, email: a.email })).filter((a) => a.id),
    [estado.alunos]
  );
  const nomesAlunos = useMemo(() => Object.fromEntries(alunosBase.map((a) => [a.id, a.nome])), [alunosBase]);

  const resumos = useMemo(
    () => consolidarFaturamentoTurma(alunosBase, estado.faturamentos, estado.metasFaturamentoAlunos, ANO_ATUAL),
    [alunosBase, estado.faturamentos, estado.metasFaturamentoAlunos]
  );

  if (!carregado) return null;

  const mostrarToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const nomeDe = (id: string) => nomesAlunos[id] ?? "Mentorado";

  const handleAprovar = (id: string) => {
    const alvo = estado.faturamentos.find((f) => f.id === id);
    auditarFaturamento(id, "aprovado");
    mostrarToast(`Declaração de ${nomeDe(alvo?.alunoId ?? "")} aprovada.`);
  };

  const handleSolicitarAjuste = (id: string, parecer: string) => {
    const alvo = estado.faturamentos.find((f) => f.id === id);
    auditarFaturamento(id, "ajuste_solicitado", parecer);
    mostrarToast(`Ajuste solicitado para ${nomeDe(alvo?.alunoId ?? "")}.`);
  };

  const handleSalvarDeclaracao = (declaracao: DeclaracaoFaturamento) => {
    salvarFaturamento(declaracao);
    mostrarToast(`Declaração de ${nomeDe(declaracao.alunoId ?? "")} salva.`);
  };

  const handleExcluir = (id: string) => {
    excluirFaturamento(id);
    mostrarToast("Declaração excluída.");
  };

  const pendentes = estado.faturamentos.filter((f) => (f.statusAuditoria ?? "pendente") === "pendente");
  const auditadas = estado.faturamentos.filter((f) => (f.statusAuditoria ?? "pendente") !== "pendente");

  const totalMetas = resumos.reduce((s, r) => s + r.metaAnual, 0);
  const totalRealizado = resumos.reduce((s, r) => s + r.realizadoAno, 0);
  const abaixoMetade = resumos.filter((r) => r.percentualAnual < 50).length;

  const alunoSelecionado = alunoSelecionadoId ? alunosBase.find((a) => a.id === alunoSelecionadoId) : null;

  const abas: TabItem[] = [
    {
      id: "turma",
      label: "Metas da turma",
      content: <TabelaMetasTurma resumos={resumos} ano={ANO_ATUAL} onAbrir={setAlunoSelecionadoId} />,
    },
    {
      id: "pendentes",
      label: "Fila de auditoria",
      badge: pendentes.length,
      content: (
        <FilaAuditoriaFaturamento
          declaracoes={pendentes}
          nomesAlunos={nomesAlunos}
          metas={estado.metasFaturamentoAlunos}
          modo="pendentes"
          onAprovar={handleAprovar}
          onSolicitarAjuste={handleSolicitarAjuste}
          onAbrirAluno={setAlunoSelecionadoId}
        />
      ),
    },
    {
      id: "historico",
      label: "Histórico auditado",
      badge: auditadas.length,
      content: (
        <FilaAuditoriaFaturamento
          declaracoes={auditadas}
          nomesAlunos={nomesAlunos}
          metas={estado.metasFaturamentoAlunos}
          modo="historico"
          onAprovar={handleAprovar}
          onSolicitarAjuste={handleSolicitarAjuste}
          onAbrirAluno={setAlunoSelecionadoId}
        />
      ),
    },
  ];

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
      <div style={{ marginBottom: "var(--espaco-lg)" }}>
        <h1 style={{ fontSize: "28px", marginBottom: "var(--espaco-xs)" }}>Metas e Faturamento da Turma</h1>
        <p style={{ color: "var(--cor-muted)" }}>
          Auditoria das declarações mensais, acompanhamento da meta anual de cada mentorado e edição de metas e lançamentos pela equipe.
        </p>
      </div>

      {toast && (
        <div role="status" style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", padding: "12px 16px", borderRadius: "var(--radius-sm)", marginBottom: "var(--espaco-md)", fontWeight: 500 }}>
          {toast}
        </div>
      )}

      {alunoSelecionado ? (
        <DetalheFaturamentoAluno
          aluno={{ ...alunoSelecionado, turmaNome: estado.alunos.find((a) => a.id === alunoSelecionado.id)?.turmaNome }}
          faturamentos={filtrarFaturamentosPorAluno(estado.faturamentos, alunoSelecionado.id)}
          metaAnual={obterMetaAnualAluno(estado.metasFaturamentoAlunos, alunoSelecionado.id)}
          onDefinirMeta={(valor) => {
            definirMetaFaturamentoAnual(valor, alunoSelecionado.id);
            mostrarToast(`Meta anual de ${alunoSelecionado.nome} definida em ${formatarMoedaReal(valor)}.`);
          }}
          onNovaDeclaracao={() => setModal({ aberto: true, declaracao: null, alunoFixoId: alunoSelecionado.id })}
          onEditar={(d) => setModal({ aberto: true, declaracao: d, alunoFixoId: alunoSelecionado.id })}
          onExcluir={handleExcluir}
          onAprovar={handleAprovar}
          onSolicitarAjuste={handleSolicitarAjuste}
          onVoltar={() => setAlunoSelecionadoId(null)}
        />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--espaco-md)", marginBottom: "var(--espaco-lg)" }}>
            <Indicador rotulo={`Realizado pela turma em ${ANO_ATUAL}`} valor={formatarMoedaReal(totalRealizado)} detalhe={`de ${formatarMoedaReal(totalMetas)} em metas somadas`} />
            <Indicador rotulo="Meta da turma atingida" valor={`${totalMetas > 0 ? Math.round((totalRealizado / totalMetas) * 100) : 0}%`} detalhe={`${resumos.length} mentorado(s) com meta`} />
            <Indicador rotulo="Aguardando auditoria" valor={String(pendentes.length)} detalhe="declarações na fila" />
            <Indicador rotulo="Abaixo de 50% da meta" valor={String(abaixoMetade)} detalhe="mentorado(s) para acompanhar" />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "var(--espaco-md)" }}>
            <button type="button" className="btn-primary" onClick={() => setModal({ aberto: true, declaracao: null })} style={{ fontSize: "13px", padding: "8px 16px", borderRadius: "var(--radius-xs)" }}>
              Nova declaração
            </button>
          </div>

          <Tabs tabs={abas} defaultTabId="turma" ariaLabel="Visões de metas e faturamento da turma" />
        </>
      )}

      {modal.aberto && (
        <ModalDeclaracaoFaturamento
          aberto={modal.aberto}
          declaracaoInicial={modal.declaracao}
          alunos={alunosBase}
          alunoFixoId={modal.alunoFixoId}
          onSalvar={handleSalvarDeclaracao}
          onFechar={() => setModal({ aberto: false, declaracao: null })}
        />
      )}
    </div>
  );
}

function Indicador({ rotulo, valor, detalhe }: { rotulo: string; valor: string; detalhe?: string }) {
  return (
    <div style={{ backgroundColor: "#fff", border: "1px solid var(--cor-border-light)", borderRadius: "var(--radius-sm)", padding: "var(--espaco-md)" }}>
      <div style={{ fontSize: "12px", color: "var(--cor-text-muted)", marginBottom: "6px" }}>{rotulo}</div>
      <div style={{ fontSize: "22px", fontWeight: 600, color: "var(--cor-ink)", letterSpacing: "-0.3px" }}>{valor}</div>
      {detalhe && <div style={{ fontSize: "12px", color: "var(--cor-muted)", marginTop: "6px" }}>{detalhe}</div>}
    </div>
  );
}
