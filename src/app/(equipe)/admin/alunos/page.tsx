"use client";

import React, { useState } from "react";
import { TabelaAlunos } from "@/components/admin/TabelaAlunos";
import { ModalAluno } from "@/components/admin/ModalAluno";
import { AlunoCadastro } from "@/lib/api/alunos";
import { useSistemaStore } from "@/lib/store/sistema-store";

export default function AdminAlunosPage() {
  const { estado, salvarAluno, excluirAluno, carregado } = useSistemaStore();
  const [modalAberto, setModalAberto] = useState(false);
  const [alunoEmEdicao, setAlunoEmEdicao] = useState<AlunoCadastro | null>(null);

  if (!carregado) return null;

  const turmasDisponiveis = estado.turmas.map((t) => ({ id: t.id, nome: t.nome }));

  const handleSalvar = (alunoSalvo: AlunoCadastro) => {
    salvarAluno(alunoSalvo);
  };

  const handleEditar = (aluno: AlunoCadastro) => {
    setAlunoEmEdicao(aluno);
    setModalAberto(true);
  };

  const handleExcluir = (id: string) => {
    if (confirm("Tem certeza que deseja desativar este aluno?")) {
      excluirAluno(id);
    }
  };

  const handleNovo = () => {
    setAlunoEmEdicao(null);
    setModalAberto(true);
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "var(--espaco-xl)" }}>
      <div style={{ marginBottom: "var(--espaco-lg)" }}>
        <h1 style={{ fontSize: "28px", marginBottom: "var(--espaco-xs)" }}>Gestão de Alunos / Mentorados</h1>
        <p style={{ color: "var(--cor-muted)" }}>
          Cadastre peritos, gerencie matrículas, atualize telefones de contato e acompanhe o status da base.
        </p>
      </div>

      <TabelaAlunos
        alunos={estado.alunos}
        onEditar={handleEditar}
        onExcluir={handleExcluir}
        onNovo={handleNovo}
      />

      <ModalAluno
        aberto={modalAberto}
        alunoInicial={alunoEmEdicao}
        turmas={turmasDisponiveis}
        onSalvar={handleSalvar}
        onFechar={() => setModalAberto(false)}
      />
    </div>
  );
}
