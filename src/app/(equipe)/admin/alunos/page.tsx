"use client";

import React, { useState } from "react";
import { TabelaAlunos } from "@/components/admin/TabelaAlunos";
import { ModalAluno } from "@/components/admin/ModalAluno";
import { ModalBloqueioAcesso } from "@/components/admin/ModalBloqueioAcesso";
import { ModalConfirmacaoDestrutiva } from "@/components/ui/ModalConfirmacaoDestrutiva";
import { ToastDesfazer } from "@/components/ui/ToastDesfazer";
import { AlunoCadastro } from "@/lib/api/alunos";
import { useSistemaStore } from "@/lib/store/sistema-store";

export default function AdminAlunosPage() {
  const { estado, salvarAluno, excluirAluno, bloquearAcesso, desbloquearAcesso, carregado } = useSistemaStore();
  const [modalAberto, setModalAberto] = useState(false);
  const [alunoEmEdicao, setAlunoEmEdicao] = useState<AlunoCadastro | null>(null);
  const [alunoAcesso, setAlunoAcesso] = useState<AlunoCadastro | null>(null);
  const [alunoParaExcluir, setAlunoParaExcluir] = useState<AlunoCadastro | null>(null);
  const [toastUndo, setToastUndo] = useState<{ visivel: boolean; mensagem: string; alunoBackup?: AlunoCadastro } | null>(null);

  if (!carregado) return null;

  const turmasDisponiveis = estado.turmas.map((t) => ({ id: t.id, nome: t.nome }));

  const handleSalvar = (alunoSalvo: AlunoCadastro) => {
    salvarAluno(alunoSalvo);
  };

  const handleEditar = (aluno: AlunoCadastro) => {
    setAlunoEmEdicao(aluno);
    setModalAberto(true);
  };

  const handleSolicitarExcluir = (aluno: AlunoCadastro) => {
    setAlunoParaExcluir(aluno);
  };

  const handleConfirmarExcluir = () => {
    if (alunoParaExcluir && alunoParaExcluir.id) {
      const backup = { ...alunoParaExcluir };
      excluirAluno(alunoParaExcluir.id);
      setAlunoParaExcluir(null);
      setToastUndo({
        visivel: true,
        mensagem: `Cadastro de "${backup.nome}" removido.`,
        alunoBackup: backup,
      });
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
        onExcluir={handleSolicitarExcluir}
        onNovo={handleNovo}
        bloqueios={estado.bloqueiosAcesso}
        onGerenciarAcesso={setAlunoAcesso}
      />

      {alunoAcesso && (
        <ModalBloqueioAcesso
          key={alunoAcesso.id}
          aberto
          aluno={alunoAcesso}
          bloqueioAtual={alunoAcesso.id ? estado.bloqueiosAcesso[alunoAcesso.id] : undefined}
          historico={estado.historicoBloqueios}
          onBloquear={bloquearAcesso}
          onDesbloquear={desbloquearAcesso}
          onFechar={() => setAlunoAcesso(null)}
        />
      )}

      <ModalAluno
        aberto={modalAberto}
        alunoInicial={alunoEmEdicao}
        turmas={turmasDisponiveis}
        onSalvar={handleSalvar}
        onFechar={() => setModalAberto(false)}
      />

      {/* Modal de Confirmação Destrutiva conforme Diretrizes Câmara UX */}
      <ModalConfirmacaoDestrutiva
        aberto={Boolean(alunoParaExcluir)}
        titulo="Excluir cadastro do aluno"
        objetoNome={alunoParaExcluir?.nome}
        mensagem="Esta ação é permanente. O perito será desvinculado da turma e seu histórico de check-ins e faturamento não aparecerá mais nos relatórios de auditoria."
        rotuloAcao="Excluir aluno"
        rotuloCancelar="Cancelar"
        tipoIcone="lixeira"
        onConfirmar={handleConfirmarExcluir}
        onCancelar={() => setAlunoParaExcluir(null)}
      />

      {/* Notificação de Desfazer (Undo) para Ações Reversíveis */}
      {toastUndo && (
        <ToastDesfazer
          visivel={toastUndo.visivel}
          mensagem={toastUndo.mensagem}
          rotuloDesfazer="Desfazer"
          onDesfazer={() => {
            if (toastUndo.alunoBackup) {
              salvarAluno(toastUndo.alunoBackup);
            }
          }}
          onFechar={() => setToastUndo(null)}
        />
      )}
    </div>
  );
}
