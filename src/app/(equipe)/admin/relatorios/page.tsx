"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useSistemaStore } from "@/lib/store/sistema-store";
import { IconFolder, IconUsers, IconPrinter, IconCheckCircle, IconCurrency } from "@/components/ui/Icons";

const RELATORIOS = [
  {
    id: "lista-geral",
    titulo: "Lista geral de alunos",
    descricao: "Alunos matriculados na turma, com área pericial, contato e status da matrícula.",
    formato: "A4 · Retrato",
    icone: <IconUsers size={22} />,
    corIcone: "",
  },
  {
    id: "presencas",
    titulo: "Histórico de presenças",
    descricao: "Grade consolidada de presenças, faltas e justificativas em todos os encontros.",
    formato: "A4 · Paisagem",
    icone: <IconCheckCircle size={22} />,
    corIcone: "verde",
  },
  {
    id: "financeiro-geral",
    titulo: "Financeiro geral da turma",
    descricao: "Realizado no ano por aluno, percentual da meta, meses declarados e pendências de auditoria.",
    formato: "A4 · Paisagem",
    icone: <IconCurrency size={22} />,
    corIcone: "verde",
  },
  {
    id: "financeiro-individual",
    titulo: "Financeiro individual",
    descricao: "Evolução mês a mês contra a meta e declarações do ano de um aluno, com status de auditoria.",
    formato: "A4 · Retrato",
    icone: <IconCurrency size={22} />,
    corIcone: "",
  },
];

export default function AdminRelatoriosPage() {
  const { estado, carregado } = useSistemaStore();
  const [turmaSelecionada, setTurmaSelecionada] = useState<string>("");

  if (!carregado) return null;

  const turmas = estado.turmas || [];
  const turmaValida = turmas.some((t) => t.id === turmaSelecionada);
  const turmaAtualId = turmaValida ? turmaSelecionada : turmas[0]?.id || "";

  return (
    <div className="adm-pagina">
      <div className="adm-cabecalho">
        <div>
          <h1 className="adm-titulo">
            <IconFolder size={26} />
            Central de Relatórios
          </h1>
          <p className="adm-subtitulo">Gere relatórios da turma prontos para imprimir ou salvar em PDF.</p>
        </div>
        {turmas.length > 0 && (
          <label className="adm-campo">
            <span className="adm-rotulo">Turma</span>
            <select
              className="adm-input"
              value={turmaAtualId}
              onChange={(e) => setTurmaSelecionada(e.target.value)}
            >
              {turmas.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.nome}
                </option>
              ))}
            </select>
          </label>
        )}
      </div>

      {turmas.length === 0 ? (
        <div className="card">
          <div className="adm-vazio">
            <h3>Nenhuma turma cadastrada</h3>
            <p>Cadastre uma turma em Gestão de Turmas para gerar relatórios.</p>
          </div>
        </div>
      ) : (
        <div className="adm-grid-relatorios">
          {RELATORIOS.map((rel) => (
            <div key={rel.id} className="card adm-relatorio-card">
              <span className={`adm-relatorio-icone ${rel.corIcone}`} aria-hidden="true">
                {rel.icone}
              </span>
              <h3>{rel.titulo}</h3>
              <p>{rel.descricao}</p>
              <div className="adm-relatorio-rodape">
                <span className="adm-chip neutro">{rel.formato}</span>
                <Link
                  href={`/admin/relatorios/${rel.id}?turma=${encodeURIComponent(turmaAtualId)}`}
                  className="btn-secondary btn-md adm-link-botao"
                >
                  <IconPrinter size={16} aria-hidden="true" />
                  Gerar relatório
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
