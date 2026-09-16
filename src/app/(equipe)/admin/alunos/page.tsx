"use client";

import React, { useState } from "react";
import { TabelaAlunos } from "@/components/admin/TabelaAlunos";
import { ModalAluno } from "@/components/admin/ModalAluno";
import { ModalBloqueioAcesso } from "@/components/admin/ModalBloqueioAcesso";
import { ModalConfirmacaoDestrutiva } from "@/components/ui/ModalConfirmacaoDestrutiva";
import { AlunoCadastro } from "@/lib/api/alunos";
import { lerEstadoSistema, useSistemaStore } from "@/lib/store/sistema-store";
import { DURACAO_COM_DESFAZER_MS, notificar } from "@/lib/notificacoes";

const SEGUNDOS_PARA_DESFAZER = Math.round(DURACAO_COM_DESFAZER_MS / 1000);

export default function AdminAlunosPage() {
  const { estado, salvarAluno, excluirAluno, reverterAluno, bloquearAcesso, desbloquearAcesso, carregado } = useSistemaStore();
  const [modalAberto, setModalAberto] = useState(false);
  const [alunoEmEdicao, setAlunoEmEdicao] = useState<AlunoCadastro | null>(null);
  const [alunoAcesso, setAlunoAcesso] = useState<AlunoCadastro | null>(null);
  const [alunoParaExcluir, setAlunoParaExcluir] = useState<AlunoCadastro | null>(null);

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

  /**
   * Exclusão com confirmação + atraso controlado.
   * No backend a exclusão é definitiva (usuário, acesso e histórico em cascata), por isso
   * o DELETE só é enviado quando a janela de "Desfazer" termina. Desfazer devolve o
   * cadastro à mesma posição da lista sem que nada tenha sido apagado.
   */
  const handleConfirmarExcluir = () => {
    const alvoId = alunoParaExcluir?.id;
    if (!alvoId) return;

    const lista = lerEstadoSistema().alunos;
    const indice = lista.findIndex((a) => a.id === alvoId);
    const anterior = lista[indice];
    setAlunoParaExcluir(null);
    if (!anterior) return;

    const efetivar = excluirAluno(alvoId, { adiarPersistencia: true });

    notificar(`Cadastro de ${anterior.nome} excluído.`, {
      efetivar,
      desfazer: {
        rotulo: "Desfazer exclusão",
        rotuloAcessivel: `Desfazer exclusão do cadastro de ${anterior.nome}`,
        executar: () => reverterAluno({ anterior, indice }),
        mensagemAposDesfazer: `Exclusão desfeita. O cadastro de ${anterior.nome} foi mantido, com acesso e histórico intactos.`,
      },
    });
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

      {/* Montado só quando aberto e com key por registro: o formulário inicializa o estado
          (papel incluído) a partir de alunoInicial; sem isso, editar alguém da equipe
          reaproveitava o papel "mentorado" do primeiro render e o salvava como aluno. */}
      {modalAberto && (
        <ModalAluno
          key={alunoEmEdicao?.id ?? "novo"}
          aberto={modalAberto}
          alunoInicial={alunoEmEdicao}
          turmas={turmasDisponiveis}
          onSalvar={handleSalvar}
          onFechar={() => setModalAberto(false)}
        />
      )}

      {/* Modal de Confirmação Destrutiva conforme Diretrizes Câmara UX */}
      <ModalConfirmacaoDestrutiva
        aberto={Boolean(alunoParaExcluir)}
        titulo="Excluir cadastro do aluno"
        objetoNome={alunoParaExcluir?.nome}
        mensagem={`O login, a matrícula, os check-ins, as declarações de faturamento, os canais e os bloqueios deste aluno serão apagados definitivamente. Depois de confirmar, você terá ${SEGUNDOS_PARA_DESFAZER} segundos para desfazer. Passado esse tempo, não é possível recuperar.`}
        rotuloAcao="Excluir aluno"
        rotuloCancelar="Cancelar"
        tipoIcone="lixeira"
        onConfirmar={handleConfirmarExcluir}
        onCancelar={() => setAlunoParaExcluir(null)}
      />
    </div>
  );
}
