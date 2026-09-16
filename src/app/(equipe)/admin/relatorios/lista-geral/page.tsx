"use client";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { Button } from "@/components/ui/Button";
import { IconPrinter, IconChevronLeft } from "@/components/ui/Icons";

function RelatorioListaGeral() {
  const searchParams = useSearchParams();
  const turmaId = searchParams.get("turma");
  const { estado, carregado } = useSistemaStore();
  const [alunos, setAlunos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState(false);

  const turma = estado.turmas.find((t) => t.id === turmaId);

  useEffect(() => {
    async function carregar() {
      if (!turmaId) {
        setCarregando(false);
        return;
      }
      try {
        const res = await fetch(`/api/chamadas?turmaId=${encodeURIComponent(turmaId)}`);
        const json = await res.json();
        if (json.sucesso && json.alunos) {
          setAlunos(json.alunos);
        }
      } catch (err) {
        console.error("Erro ao carregar alunos:", err);
        setErro(true);
      } finally {
        setCarregando(false);
      }
    }
    carregar();
  }, [turmaId]);

  const agora = new Date();

  return (
    <>
      <div className="rel-barra nao-imprimir">
        <Link href="/admin/relatorios" className="btn-secondary btn-sm adm-link-botao">
          <IconChevronLeft size={16} aria-hidden="true" />
          Voltar
        </Link>
        <span className="rel-barra-titulo">Pré-visualização · A4 retrato</span>
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
          <div className="rel-folha">
            {erro && (
              <div className="adm-alerta-erro nao-imprimir" role="alert">
                Não foi possível carregar os alunos desta turma.
              </div>
            )}

            <div className="rel-cabecalho">
              <div>
                <h1>Relatório geral de alunos</h1>
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
                  Total de alunos: <strong>{alunos.length}</strong>
                </p>
              </div>
            </div>

            <div className="rel-tabela-wrap">
              <table className="rel-tabela">
                <thead>
                  <tr>
                    <th style={{ width: 32 }}>#</th>
                    <th>Aluno</th>
                    <th>Área pericial</th>
                    <th>WhatsApp</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {alunos.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="centro">Nenhum aluno matriculado.</td>
                    </tr>
                  ) : (
                    alunos.map((aluno, index) => (
                      <tr key={aluno.matricula_id}>
                        <td>{index + 1}</td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{aluno.nome ?? "—"}</div>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>{aluno.email}</div>
                        </td>
                        <td>{aluno.area_pericial || "—"}</td>
                        <td className="mono">{aluno.whatsapp || "—"}</td>
                        <td>
                          <span className={`rel-status ${aluno.status === "ativo" ? "ativo" : ""}`}>
                            {aluno.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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

export default function RelatorioListaGeralPage() {
  return (
    <Suspense fallback={null}>
      <RelatorioListaGeral />
    </Suspense>
  );
}
