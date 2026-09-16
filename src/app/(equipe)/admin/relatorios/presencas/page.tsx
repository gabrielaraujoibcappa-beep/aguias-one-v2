"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { Button } from "@/components/ui/Button";
import { IconPrinter, IconChevronLeft } from "@/components/ui/Icons";
import {
  obterRelatorioPresencas,
  type RelatorioPresencas as DadosRelatorio,
  type StatusPresenca,
} from "@/lib/api/chamadas";

const MARCAS: Record<StatusPresenca, string> = {
  presente: "✔",
  falta: "✖",
  justificada: "J",
};

function RelatorioPresencas() {
  const turmaId = useSearchParams().get("turma");
  const { estado, carregado } = useSistemaStore();
  const [dados, setDados] = useState<DadosRelatorio | null>(null);
  const [carregando, setCarregando] = useState(true);

  const turma = estado.turmas.find((t) => t.id === turmaId) || dados?.turma;

  useEffect(() => {
    if (!turmaId) {
      setCarregando(false);
      return;
    }
    obterRelatorioPresencas(turmaId)
      .then(setDados)
      .catch(() => setDados(null))
      .finally(() => setCarregando(false));
  }, [turmaId]);

  const agora = new Date();
  const encontros = [...(dados?.encontros ?? [])].sort((a, b) =>
    a.data_encontro.localeCompare(b.data_encontro)
  );

  return (
    <>
      {/* Folha em paisagem apenas enquanto este relatório estiver montado */}
      <style>{"@media print { @page { size: A4 landscape; margin: 12mm; } }"}</style>

      <div className="rel-barra nao-imprimir">
        <Link href="/admin/relatorios" className="btn-secondary btn-sm adm-link-botao">
          <IconChevronLeft size={16} aria-hidden="true" />
          Voltar
        </Link>
        <span className="rel-barra-titulo">Pré-visualização · A4 paisagem</span>
        <Button
          iconeInicio={<IconPrinter size={16} />}
          onClick={() => window.print()}
          disabled={!turma || !dados || carregando}
        >
          Imprimir / Salvar PDF
        </Button>
      </div>

      <div className="rel-area">
        {!carregado || carregando ? (
          <div className="adm-vazio">Carregando relatório…</div>
        ) : !turma || !dados ? (
          <div className="adm-alerta-erro" role="alert">Turma não encontrada ou dados indisponíveis.</div>
        ) : (
          <div className="rel-folha paisagem">
            <div className="rel-cabecalho">
              <div>
                <h1>Histórico de presenças</h1>
                <p>
                  Turma: <strong>{turma.nome}</strong> ({turma.codigo})
                </p>
              </div>
              <div className="rel-cabecalho-meta">
                <p>
                  Gerado em {agora.toLocaleDateString("pt-BR")} às{" "}
                  {agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                </p>
                <p>
                  Alunos: <strong>{(dados.alunos || []).length}</strong> · Encontros: <strong>{encontros.length}</strong>
                </p>
              </div>
            </div>

            <div className="rel-tabela-wrap">
              <table className="rel-tabela grade">
                <thead>
                  <tr>
                    <th style={{ minWidth: 180 }}>Aluno</th>
                    {encontros.map((enc) => (
                      <th key={enc.id} className="centro" title={enc.titulo}>
                        {new Date(enc.data_encontro + "T12:00:00").toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                        })}
                      </th>
                    ))}
                    <th className="centro">Frequência</th>
                  </tr>
                </thead>
                <tbody>
                  {(dados.alunos || []).length === 0 ? (
                    <tr>
                      <td colSpan={encontros.length + 2} className="centro">Nenhum aluno matriculado.</td>
                    </tr>
                  ) : (
                    (dados.alunos || []).map((aluno) => {
                      let registrados = 0;
                      let comparecimentos = 0;

                      const celulas = encontros.map((enc) => {
                        const presenca = (dados.presencas || []).find(
                          (p) => p.matricula_id === aluno.matricula_id && p.encontro_id === enc.id
                        );
                        if (presenca) {
                          registrados++;
                          if (presenca.status !== "falta") comparecimentos++;
                        }
                        return (
                          <td key={enc.id} className="centro">
                            <span className={`rel-marca ${presenca ? presenca.status : "vazio"}`}>
                              {presenca ? MARCAS[presenca.status] : "–"}
                            </span>
                          </td>
                        );
                      });

                      return (
                        <tr key={aluno.matricula_id}>
                          <td style={{ fontWeight: 600 }}>{aluno.nome ?? "—"}</td>
                          {celulas}
                          <td className="centro" style={{ fontWeight: 700 }}>
                            {registrados > 0 ? `${Math.round((comparecimentos / registrados) * 100)}%` : "—"}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div className="rel-legenda">
              <span><span className="rel-marca presente">✔</span> Presente</span>
              <span><span className="rel-marca falta">✖</span> Falta</span>
              <span><span className="rel-marca justificada">J</span> Falta justificada</span>
              <span><span className="rel-marca vazio">–</span> Sem registro</span>
            </div>
            <p style={{ fontSize: 11, color: "#6b7280", marginTop: 8 }}>
              Frequência = (presenças + justificadas) ÷ encontros com chamada registrada.
            </p>

            <div className="rel-rodape">
              Documento de uso interno · Mentoria Pericial ÁGUIAS ONE · IBCAPPA
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function RelatorioPresencasPage() {
  return (
    <Suspense fallback={null}>
      <RelatorioPresencas />
    </Suspense>
  );
}
