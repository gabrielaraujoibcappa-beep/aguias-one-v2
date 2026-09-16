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
  formatarMesReferencia,
  formatarMoedaReal,
  obterMetaAnualAluno,
} from "@/lib/api/faturamento";
import { lerEstadoSistema, useSistemaStore } from "@/lib/store/sistema-store";
import { notificar } from "@/lib/notificacoes";

const ANO_ATUAL = new Date().getFullYear();

/** "Agosto de 2026" → "agosto de 2026", para uso no meio da frase. */
function mesNaFrase(mesReferencia: string): string {
  const texto = formatarMesReferencia(mesReferencia);
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

export default function PainelFaturamentoPage() {
  const {
    estado,
    carregado,
    salvarFaturamento,
    excluirFaturamento,
    auditarFaturamento,
    definirMetaFaturamentoAnual,
    reverterFaturamento,
    reverterMetaFaturamento,
  } = useSistemaStore();

  const [alunoSelecionadoId, setAlunoSelecionadoId] = useState<string | null>(null);
  const [modal, setModal] = useState<{ aberto: boolean; declaracao: DeclaracaoFaturamento | null; alunoFixoId?: string }>({ aberto: false, declaracao: null });

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

  const nomeDe = (id: string) => nomesAlunos[id] ?? "Mentorado";

  /** "declaração de agosto de 2026 de Dr. Roberto Silva" */
  const descreverDeclaracao = (d: DeclaracaoFaturamento) => `declaração de ${mesNaFrase(d.mesReferencia)} de ${nomeDe(d.alunoId ?? "")}`;

  const localizar = (id: string) => {
    const lista = lerEstadoSistema().faturamentos;
    const indice = lista.findIndex((f) => f.id === id);
    return { registro: indice >= 0 ? lista[indice] : undefined, indice };
  };

  /**
   * Aprovar e pedir ajuste: a decisão aparece na hora, mas só é enviada ao backend
   * quando a janela de "Desfazer" termina. Desfazer devolve a declaração exatamente
   * como estava, sem nenhum envio.
   */
  const auditarComDesfazer = (id: string, decisao: "aprovado" | "ajuste_solicitado", parecer?: string) => {
    const { registro: anterior, indice } = localizar(id);
    if (!anterior) return;
    const efetivar = auditarFaturamento(id, decisao, parecer, { adiarPersistencia: true });
    const posterior = localizar(id).registro;
    const objeto = descreverDeclaracao(anterior);
    const aprovacao = decisao === "aprovado";

    notificar(aprovacao ? `${capitalizar(objeto)} aprovada.` : `Ajuste solicitado na ${objeto}.`, {
      efetivar,
      desfazer: {
        rotulo: aprovacao ? "Desfazer aprovação" : "Desfazer pedido de ajuste",
        rotuloAcessivel: `${aprovacao ? "Desfazer aprovação" : "Desfazer pedido de ajuste"} da ${objeto}`,
        executar: () => reverterFaturamento({ anterior, posterior, indice }),
        mensagemAposDesfazer:
          (anterior.statusAuditoria ?? "pendente") === "pendente"
            ? `${aprovacao ? "Aprovação desfeita" : "Pedido de ajuste desfeito"}. A ${objeto} voltou para a fila de auditoria.`
            : `${aprovacao ? "Aprovação desfeita" : "Pedido de ajuste desfeito"}. A ${objeto} voltou à situação anterior.`,
      },
    });
  };

  const handleAprovar = (id: string) => auditarComDesfazer(id, "aprovado");

  const handleSolicitarAjuste = (id: string, parecer: string) => auditarComDesfazer(id, "ajuste_solicitado", parecer);

  const handleSalvarDeclaracao = (declaracao: DeclaracaoFaturamento) => {
    const edicao = declaracao.id ? localizar(declaracao.id) : { registro: undefined, indice: -1 };
    salvarFaturamento(declaracao);

    // Nova declaração: apenas confirma. Ela pode ser excluída pela própria tabela.
    if (!edicao.registro) {
      notificar(`Declaração de ${mesNaFrase(declaracao.mesReferencia)} lançada para ${nomeDe(declaracao.alunoId ?? "")}.`);
      return;
    }

    const anterior = edicao.registro;
    const posterior = localizar(anterior.id as string).registro;
    const objeto = descreverDeclaracao(anterior);
    notificar(`Alterações salvas na ${objeto}.`, {
      desfazer: {
        rotulo: "Desfazer edição",
        rotuloAcessivel: `Desfazer edição da ${objeto}`,
        executar: () => reverterFaturamento({ anterior, posterior, indice: edicao.indice }),
        mensagemAposDesfazer: `Edição desfeita. A ${objeto} voltou aos valores anteriores.`,
      },
    });
  };

  const handleExcluir = (id: string) => {
    const { registro: anterior, indice } = localizar(id);
    if (!anterior) return;
    excluirFaturamento(id);
    const objeto = descreverDeclaracao(anterior);
    notificar(`${capitalizar(objeto)} excluída.`, {
      desfazer: {
        rotulo: "Desfazer exclusão",
        rotuloAcessivel: `Desfazer exclusão da ${objeto}`,
        executar: () => reverterFaturamento({ anterior, indice }),
        mensagemAposDesfazer: `Exclusão desfeita. A ${objeto} foi restaurada.`,
      },
    });
  };

  const handleDefinirMeta = (alunoId: string, nome: string, valor: number) => {
    const anterior = lerEstadoSistema().metasFaturamentoAlunos[alunoId];
    definirMetaFaturamentoAnual(valor, alunoId);
    const posterior = lerEstadoSistema().metasFaturamentoAlunos[alunoId];
    if (anterior === posterior) return;
    notificar(`Meta anual de ${nome} alterada para ${formatarMoedaReal(posterior)}.`, {
      desfazer: {
        rotulo: "Desfazer alteração",
        rotuloAcessivel: `Desfazer alteração da meta anual de ${nome}`,
        executar: () => reverterMetaFaturamento(alunoId, anterior, posterior),
        mensagemAposDesfazer: `Alteração desfeita. A meta anual de ${nome} voltou para ${formatarMoedaReal(anterior ?? obterMetaAnualAluno({}, alunoId))}.`,
      },
    });
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

      {alunoSelecionado ? (
        <DetalheFaturamentoAluno
          aluno={{ ...alunoSelecionado, turmaNome: estado.alunos.find((a) => a.id === alunoSelecionado.id)?.turmaNome }}
          faturamentos={filtrarFaturamentosPorAluno(estado.faturamentos, alunoSelecionado.id)}
          metaAnual={obterMetaAnualAluno(estado.metasFaturamentoAlunos, alunoSelecionado.id)}
          onDefinirMeta={(valor) => handleDefinirMeta(alunoSelecionado.id, alunoSelecionado.nome, valor)}
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

function capitalizar(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
