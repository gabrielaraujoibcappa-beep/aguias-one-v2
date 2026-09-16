"use client";

import { useSyncExternalStore } from "react";

/**
 * Notificações temporárias do sistema, com no máximo uma visível por vez.
 * Uma nova notificação substitui a anterior, para que duas ações "Desfazer"
 * nunca disputem a atenção nem fiquem ambíguas.
 */

export interface AcaoDesfazer {
  /** Texto visível do botão. Curto e específico: "Desfazer aprovação". */
  rotulo: string;
  /** Nome acessível com o objeto afetado: "Desfazer aprovação da declaração de Dr. Roberto Silva". */
  rotuloAcessivel: string;
  /** Executa a reversão. Retorne `false` se não foi possível reverter com segurança. */
  executar: () => boolean | void;
  /** Feedback exibido depois que a reversão é concluída. */
  mensagemAposDesfazer: string;
  /** Feedback quando a reversão não pôde ser aplicada. */
  mensagemFalha?: string;
}

export type TomNotificacao = "sucesso" | "info" | "erro";

export interface Notificacao {
  id: number;
  mensagem: string;
  tom: TomNotificacao;
  duracaoMs: number;
  desfazer?: AcaoDesfazer;
  /**
   * Efetiva a ação fora da tela (ex.: envio ao backend) quando a janela de desfazer termina:
   * ao expirar, ao ser dispensada, ao ser substituída por outra notificação ou ao sair da página.
   * Nunca é chamada se a pessoa desfizer.
   */
  efetivar?: () => void;
}

export const DURACAO_COM_DESFAZER_MS = 10000;
export const DURACAO_SIMPLES_MS = 5000;

const MENSAGEM_FALHA_PADRAO = "Não foi possível desfazer: o registro foi alterado depois da ação.";

let atual: Notificacao | null = null;
let proximoId = 1;
const ouvintes = new Set<() => void>();

function emitir() {
  ouvintes.forEach((ouvinte) => ouvinte());
}

/** Efetiva a ação pendente da notificação atual, no máximo uma vez. */
export function efetivarPendente() {
  const efetivar = atual?.efetivar;
  if (!efetivar || !atual) return;
  atual = { ...atual, efetivar: undefined, desfazer: undefined };
  efetivar();
}

// Ao sair da página durante a janela de desfazer, a ação é efetivada (envio com keepalive)
if (typeof window !== "undefined") {
  window.addEventListener("pagehide", efetivarPendente);
}

export function notificar(
  mensagem: string,
  opcoes: { desfazer?: AcaoDesfazer; efetivar?: () => void; tom?: TomNotificacao; duracaoMs?: number } = {}
): number {
  // A notificação anterior perde a chance de ser desfeita: efetiva o que estava pendente
  efetivarPendente();
  const id = proximoId++;
  atual = {
    id,
    mensagem,
    tom: opcoes.tom ?? "sucesso",
    desfazer: opcoes.desfazer,
    efetivar: opcoes.efetivar,
    duracaoMs: opcoes.duracaoMs ?? (opcoes.desfazer ? DURACAO_COM_DESFAZER_MS : DURACAO_SIMPLES_MS),
  };
  emitir();
  return id;
}

/** Fecha a notificação atual e efetiva a ação pendente. Com `id`, só fecha se ainda for a mesma. */
export function fecharNotificacao(id?: number) {
  if (!atual || (id !== undefined && atual.id !== id)) return;
  efetivarPendente();
  atual = null;
  emitir();
}

/** Executa o "Desfazer" da notificação atual, uma única vez, e informa o resultado. */
export function desfazerNotificacaoAtual(): boolean {
  const acao = atual?.desfazer;
  if (!acao || !atual) return false;
  // Retira ação e efetivação antes de executar: impede execução dupla e o envio ao backend
  const efetivarSeFalhar = atual.efetivar;
  atual = { ...atual, desfazer: undefined, efetivar: undefined };
  const ok = acao.executar() !== false;
  if (!ok) {
    // A tela não pôde ser revertida: a ação continua valendo e precisa ser efetivada
    efetivarSeFalhar?.();
  }
  notificar(ok ? acao.mensagemAposDesfazer : acao.mensagemFalha ?? MENSAGEM_FALHA_PADRAO, { tom: ok ? "info" : "erro" });
  return ok;
}

export function lerNotificacaoAtual(): Notificacao | null {
  return atual;
}

/** Somente para testes. */
export function resetarNotificacoesParaTestes() {
  atual = null;
  proximoId = 1;
}

function inscrever(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

export function useNotificacaoAtual(): Notificacao | null {
  return useSyncExternalStore(inscrever, lerNotificacaoAtual, () => null);
}
