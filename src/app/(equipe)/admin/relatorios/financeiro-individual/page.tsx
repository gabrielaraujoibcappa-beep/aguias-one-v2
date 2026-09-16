"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { Button } from "@/components/ui/Button";
import { IconPrinter, IconChevronLeft } from "@/components/ui/Icons";
import {
  ROTULOS_STATUS_AUDITORIA,
  calcularProgressoMetaAnual,
  formatarMesReferencia,
  formatarMoedaReal,
  listarAnosDisponiveis,
} from "@/lib/api/faturamento";
import {
  DeclaracaoTurmaRelatorio,
  resolverMetaPorEmail,
} from "@/lib/api/relatorio-financeiro";

function RelatorioFinanceiroIndividual() {
  const searchParams = useSearchParams();
  const turmaId = searchParams.get("turma");
  const matriculaParam = searchParams.get("matricula");
  const anoParam = searchParams.get("ano");
  const { estado, mentorados, carregado } = useSistemaStore();

  const [turmaInfo, setTurmaInfo] = useState<{ id: string; nome: string; codigo?: string } | null>(null);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [faturamentos, setFaturamentos] = useState<DeclaracaoTurmaRelatorio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [matriculaId, setMatriculaId] = useState<string>(matriculaParam || "");
  const [ano, setAno] = useState<number>(anoParam ? Number(anoParam) : new Date().getFullYear());

  const turma = estado.turmas.find((t) => t.id === turmaId) || turmaInfo;

  useEffect(() => {
    async function carregar() {
      if (!turmaId) {
        setCarregando(false);
        return;
      }
      try {
        const [resChamadas, resFat] = await Promise.all([
          fetch(`/api/chamadas?turmaId=${encodeURIComponent(turmaId)}`),
          fetch(`/api/faturamentos?turmaId=${encodeURIComponent(turmaId)}`),
        ]);
        const [jsonChamadas, jsonFat] = await Promise.all([resChamadas.json(), resFat.json()]);
        if (jsonChamadas.sucesso && jsonFat.sucesso) {
          if (jsonChamadas.alunos) setAlunos(jsonChamadas.alunos);
          if (jsonChamadas.turma) setTurmaInfo(jsonChamadas.turma);
          if (jsonFat.faturamentos) setFaturamentos(jsonFat.faturamentos);
        } else {
          setErro(true);
        }
      } catch (err) {
        console.error("Erro ao carregar dados financeiros:", err);
        setErro(true);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [turmaId]);

  useEffect(() => {
    if (matriculaParam) setMatriculaId(matriculaParam);
  }, [matriculaParam]);

  const anos = useMemo(
    () =>
      listarAnosDisponiveis(
        faturamentos.map((f) => ({ matriculaId: f.matriculaId, mesReferencia: f.mesReferencia, valorBruto: f.valorBruto, comprovantes: [] })),
        new Date().getFullYear()
      ),
    [faturamentos]
  );

  const aluno = useMemo(
    () => alunos.find((a) => a.matricula_id === matriculaId) || null,
    [alunos, matriculaId]
  );
  const matriculaAtual = matriculaId || alunos[0]?.matricula_id || "";
  const alunoAtual = aluno || (alunos.length > 0 ? alunos[0] : null);

  const declaracoesAluno = useMemo(
    () =>
      faturamentos
        .filter((f) => f.matriculaId === matriculaAtual)
        .sort((a, b) => b.mesReferencia.localeCompare(a.mesReferencia)),
    [faturamentos, matriculaAtual]
  );

  const metaAnual = useMemo(
    () => resolverMetaPorEmail(mentorados, estado.metasFaturamentoAlunos, alunoAtual?.email || ""),
    [mentorados, estado.metasFaturamentoAlunos, alunoAtual]
  );

  const progresso = useMemo(
    () =>
      calcularProgressoMetaAnual(
        declaracoesAluno.map((d) => ({
          matriculaId: d.matriculaId,
          mesReferencia: d.mesReferencia,
          valorBruto: d.valorBruto,
          comprovantes: [],
        })),
        metaAnual,
        ano
      ),
    [declaracoesAluno, metaAnual, ano]
  );

  const agora = new Date();

  return (
    <>
      <div className="rel-barra nao-imprimir">
        <Link
          href={`/admin/relatorios/financeiro-geral?turma=${encodeURIComponent(turmaId || "")}`}
          className="btn-secondary btn-sm adm-link-botao"
        >
          <IconChevronLeft size={16} aria-hidden="true" />
          Financeiro geral
        </Link>
        <span className="rel-barra-titulo">Pré-visualização · A4 retrato</span>
        {alunos.length > 0 && (
          <label className="adm-campo" style={{ minWidth: 220 }}>
            <span className="adm-rotulo">Aluno</span>
            <select
              className="adm-input"
              value={matriculaAtual}
              onChange={(e) => setMatriculaId(e.target.value)}
              aria-label="Aluno do relatório"
            >
              {alunos.map((a) => (
                <option key={a.matricula_id} value={a.matricula_id}>
                  {a.nome}
                </option>
              ))}
            </select>
          </label>
        )}
        <label className="adm-campo" style={{ minWidth: 120 }}>
          <span className="adm-rotulo">Ano</span>
          <select className="adm-input" value={ano} onChange={(e) => setAno(Number(e.target.value))} aria-label="Ano do relatório">
            {anos.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </label>
        <Button
          iconeInicio={<IconPrinter size={16} />}
          onClick={() => window.print()}
          disabled={!turma || !alunoAtual || carregando}
        >
          Imprimir / Salvar PDF
        </Button>
      </div>

      <div className="rel-area">
        {!carregado || carregando ? (
          <div className="adm-vazio">Carregando relatório…</div>
        ) : !turma ? (
          <div className="adm-alerta-erro" role="alert">Turma não encontrada.</div>
        ) : !alunoAtual ? (
          <div className="adm-alerta-erro" role="alert">Nenhum aluno matriculado nesta turma.</div>
        ) : (
          <div className="rel-folha">
            {erro && (
              <div className="adm-alerta-erro nao-imprimir" role="alert">
                Não foi possível carregar os dados financeiros desta turma.{" "}
                <button type="button" className="btn-secondary btn-sm" onClick={() => window.location.reload()}>
                  Tentar novamente
                </button>
              </div>
            )}

            <div className="rel-cabecalho">
              <div>
                <h1>Relatório financeiro individual</h1>
                <p>
                  Aluno: <strong>{alunoAtual.nome}</strong>
                </p>
                <p>
                  Turma: <strong>{turma.nome}</strong> ({turma.codigo}) · Ano: <strong>{ano}</strong>
                </p>
              </div>
              <div className="rel-cabecalho-meta">
                <p>
                  Gerado em {agora.toLocaleDateString("pt-BR")} às{" "}
                  {agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p>
                  Meta anual: <strong>{formatarMoedaReal(metaAnual)}</strong> · Meta mensal:{" "}
                  <strong>{formatarMoedaReal(progresso.metaMensal)}</strong>
                </p>
                <p>
                  Realizado: <strong>{formatarMoedaReal(progresso.realizadoAcumulado)}</strong> (
                  {progresso.percentualAnual.toFixed(1).replace(".", ",")}%) · Restante:{" "}
                  <strong>{formatarMoedaReal(progresso.restante)}</strong>
                </p>
              </div>
            </div>

            <h2 style={{ fontSize: 15, margin: "16px 0 8px" }}>Evolução mensal · {ano}</h2>
            <div className="rel-tabela-wrap">
              <table className="rel-tabela">
                <thead>
                  <tr>
                    <th>Mês</th>
                    <th style={{ textAlign: "right" }}>Realizado</th>
                    <th style={{ textAlign: "right" }}>Meta</th>
                    <th style={{ textAlign: "right" }}>% da meta</th>
                    <th style={{ textAlign: "center" }}>Situação</th>
                  </tr>
                </thead>
                <tbody>
                  {progresso.meses.map((m) => (
                    <tr key={m.mes}>
                      <td>{m.rotulo}</td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: m.declarado ? 600 : 400 }}>
                        {m.declarado ? formatarMoedaReal(m.realizado) : "—"}
                      </td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatarMoedaReal(m.meta)}</td>
                      <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                        {m.declarado ? `${m.percentual.toFixed(0)}%` : "—"}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        {!m.declarado ? (
                          <span style={{ color: "#6b7280" }}>Sem declaração</span>
                        ) : m.realizado >= m.meta && m.meta > 0 ? (
                          <span className="rel-status ativo">Acima da meta</span>
                        ) : (
                          <span className="rel-status">Declarado</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 style={{ fontSize: 15, margin: "16px 0 8px" }}>Declarações do ano</h2>
            <div className="rel-tabela-wrap">
              <table className="rel-tabela">
                <thead>
                  <tr>
                    <th>Mês de referência</th>
                    <th style={{ textAlign: "right" }}>Valor bruto</th>
                    <th style={{ textAlign: "center" }}>Auditoria</th>
                  </tr>
                </thead>
                <tbody>
                  {declaracoesAluno.filter((d) => d.mesReferencia.startsWith(String(ano))).length === 0 ? (
                    <tr>
                      <td colSpan={3} className="centro">Nenhuma declaração em {ano}.</td>
                    </tr>
                  ) : (
                    declaracoesAluno
                      .filter((d) => d.mesReferencia.startsWith(String(ano)))
                      .map((d) => (
                        <tr key={d.id}>
                          <td>{formatarMesReferencia(d.mesReferencia)}</td>
                          <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                            {formatarMoedaReal(d.valorBruto)}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <span className={`rel-status ${d.statusAuditoria === "aprovado" ? "ativo" : ""}`}>
                              {ROTULOS_STATUS_AUDITORIA[d.statusAuditoria] || d.statusAuditoria}
                            </span>
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="rel-legenda">
              Média mensal declarada: {formatarMoedaReal(progresso.mediaMensalDeclarada)} · {progresso.mesesDeclarados} de 12 meses
              declarados · {progresso.mesesAcimaDaMeta} acima da meta mensal.
            </div>
            <div className="rel-rodape">
              Documento de uso interno · Mentoria Pericial ÁGUIAS ONE · IBCAPPA
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function RelatorioFinanceiroIndividualPage() {
  return (
    <Suspense fallback={null}>
      <RelatorioFinanceiroIndividual />
    </Suspense>
  );
}
