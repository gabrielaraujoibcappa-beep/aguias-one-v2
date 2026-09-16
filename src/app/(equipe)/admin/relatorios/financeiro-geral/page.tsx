"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { Button } from "@/components/ui/Button";
import { IconPrinter, IconChevronLeft, IconArrowRight } from "@/components/ui/Icons";
import {
  formatarMoedaReal,
  formatarMesReferencia,
  listarAnosDisponiveis,
} from "@/lib/api/faturamento";
import {
  DeclaracaoTurmaRelatorio,
  resumirFinanceiroTurma,
  totalizarFinanceiroTurma,
} from "@/lib/api/relatorio-financeiro";

function RelatorioFinanceiroGeral() {
  const searchParams = useSearchParams();
  const turmaId = searchParams.get("turma");
  const { estado, mentorados, carregado } = useSistemaStore();

  const [turmaInfo, setTurmaInfo] = useState<{ id: string; nome: string; codigo?: string } | null>(null);
  const [alunos, setAlunos] = useState<any[]>([]);
  const [faturamentos, setFaturamentos] = useState<DeclaracaoTurmaRelatorio[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);
  const [ano, setAno] = useState<number>(new Date().getFullYear());

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

  const anos = useMemo(
    () =>
      listarAnosDisponiveis(
        faturamentos.map((f) => ({ matriculaId: f.matriculaId, mesReferencia: f.mesReferencia, valorBruto: f.valorBruto, comprovantes: [] })),
        new Date().getFullYear()
      ),
    [faturamentos]
  );

  const linhas = useMemo(
    () => resumirFinanceiroTurma(alunos, faturamentos, mentorados, estado.metasFaturamentoAlunos, ano),
    [alunos, faturamentos, mentorados, estado.metasFaturamentoAlunos, ano]
  );
  const totais = useMemo(() => totalizarFinanceiroTurma(linhas), [linhas]);

  const agora = new Date();

  return (
    <>
      <div className="rel-barra nao-imprimir">
        <Link href="/admin/relatorios" className="btn-secondary btn-sm adm-link-botao">
          <IconChevronLeft size={16} aria-hidden="true" />
          Voltar
        </Link>
        <span className="rel-barra-titulo">Pré-visualização · A4 paisagem</span>
        <label className="adm-campo" style={{ minWidth: 140 }}>
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
          disabled={!turma || carregando}
        >
          Imprimir / Salvar PDF
        </Button>
      </div>

      <div className="rel-area">
        {!carregado || carregando ? (
          <div className="adm-vazio">Carregando relatório…</div>
        ) : !turma ? (
          <div className="adm-alerta-erro" role="alert">Turma não encontrada.</div>
        ) : (
          <div className="rel-folha paisagem">
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
                <h1>Relatório financeiro geral</h1>
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
                  Realizado: <strong>{formatarMoedaReal(totais.totalRealizado)}</strong> de{" "}
                  {formatarMoedaReal(totais.totalMetas)} em metas ({totais.percentualGeral.toFixed(1).replace(".", ",")}%)
                </p>
                <p>
                  {totais.alunosComDeclaracao} de {linhas.length} alunos com declaração · {totais.totalPendentes} pendente(s) de auditoria
                </p>
              </div>
            </div>

            <div className="rel-tabela-wrap">
              <table className="rel-tabela">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>#</th>
                    <th>Aluno</th>
                    <th style={{ textAlign: "right" }}>Meta anual</th>
                    <th style={{ textAlign: "right" }}>Realizado</th>
                    <th style={{ textAlign: "right" }}>% da meta</th>
                    <th style={{ textAlign: "center" }}>Meses</th>
                    <th style={{ textAlign: "center" }}>Pendências</th>
                    <th className="nao-imprimir" style={{ textAlign: "center" }}>Detalhe</th>
                  </tr>
                </thead>
                <tbody>
                  {linhas.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="centro">Nenhum aluno matriculado.</td>
                    </tr>
                  ) : (
                    linhas.map((linha, index) => (
                      <tr key={linha.matriculaId}>
                        <td>{index + 1}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{linha.nome}</div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>{linha.email}</div>
                          {linha.ultimoMesDeclarado && (
                            <div style={{ fontSize: 11, color: "#6b7280" }}>
                              Última: {formatarMesReferencia(linha.ultimoMesDeclarado)}
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{formatarMoedaReal(linha.metaAnual)}</td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums", fontWeight: 600 }}>
                          {formatarMoedaReal(linha.realizadoAno)}
                        </td>
                        <td style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
                          {linha.percentualAnual.toFixed(1).replace(".", ",")}%
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {linha.mesesDeclarados}/12
                          {linha.mesesAcimaDaMeta > 0 && (
                            <span style={{ fontSize: 11, color: "#15803d" }}> ({linha.mesesAcimaDaMeta} acima)</span>
                          )}
                        </td>
                        <td style={{ textAlign: "center" }}>
                          {linha.pendentes === 0 && linha.ajustesSolicitados === 0 ? (
                            "—"
                          ) : (
                            <span className={`rel-status ${linha.pendentes > 0 ? "" : "ativo"}`}>
                              {linha.pendentes > 0 ? `${linha.pendentes} pend.` : ""}
                              {linha.pendentes > 0 && linha.ajustesSolicitados > 0 ? " · " : ""}
                              {linha.ajustesSolicitados > 0 ? `${linha.ajustesSolicitados} ajuste(s)` : ""}
                            </span>
                          )}
                        </td>
                        <td className="nao-imprimir" style={{ textAlign: "center" }}>
                          <Link
                            href={`/admin/relatorios/financeiro-individual?turma=${encodeURIComponent(turmaId || "")}&matricula=${encodeURIComponent(linha.matriculaId)}&ano=${ano}`}
                            className="btn-secondary btn-sm adm-link-botao"
                            aria-label={`Ver relatório individual de ${linha.nome}`}
                          >
                            Individual
                            <IconArrowRight size={14} aria-hidden="true" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="rel-legenda">
              Meses = meses com declaração no ano · % da meta = realizado ÷ meta anual · Pendências = declarações aguardando auditoria ou com ajuste solicitado.
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

export default function RelatorioFinanceiroGeralPage() {
  return (
    <Suspense fallback={null}>
      <RelatorioFinanceiroGeral />
    </Suspense>
  );
}
