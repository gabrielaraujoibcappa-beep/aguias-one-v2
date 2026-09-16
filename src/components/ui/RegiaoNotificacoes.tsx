"use client";

import React, { useEffect } from "react";
import { ToastDesfazer } from "./ToastDesfazer";
import { desfazerNotificacaoAtual, fecharNotificacao, useNotificacaoAtual } from "@/lib/notificacoes";

function focoEmCampoEditavel(alvo: EventTarget | null): boolean {
  const el = alvo as HTMLElement | null;
  if (!el || typeof el.closest !== "function") return false;
  return Boolean(el.closest('input, textarea, select, [contenteditable=""], [contenteditable="true"]'));
}

/**
 * Região única de notificações do sistema.
 * A região de status fica sempre montada (mesmo vazia) para que leitores de tela
 * anunciem cada mensagem nova sem que o foco saia da tarefa em andamento.
 */
export function RegiaoNotificacoes() {
  const atual = useNotificacaoAtual();

  // Atalho de teclado: Ctrl+Z (⌘Z) desfaz a última ação enquanto a notificação oferece "Desfazer".
  // Não interfere no desfazer nativo de campos de texto.
  useEffect(() => {
    if (!atual?.desfazer) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.shiftKey || e.altKey || e.key.toLowerCase() !== "z") return;
      if (focoEmCampoEditavel(e.target)) return;
      e.preventDefault();
      desfazerNotificacaoAtual();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [atual]);

  const textoAnunciado = atual
    ? atual.desfazer
      ? `${atual.mensagem} Para desfazer, use o botão ${atual.desfazer.rotulo} ou Ctrl+Z.`
      : atual.mensagem
    : "";

  return (
    <>
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        {textoAnunciado}
      </div>
      <ToastDesfazer
        idNotificacao={atual?.id}
        visivel={Boolean(atual)}
        mensagem={atual?.mensagem ?? ""}
        tom={atual?.tom}
        duracaoMs={atual?.duracaoMs}
        anunciar={false}
        mostrarAtalho={Boolean(atual?.desfazer)}
        rotuloDesfazer={atual?.desfazer?.rotulo}
        rotuloAcessivelDesfazer={atual?.desfazer?.rotuloAcessivel}
        onDesfazer={atual?.desfazer ? desfazerNotificacaoAtual : undefined}
        onFechar={() => fecharNotificacao(atual?.id)}
      />
    </>
  );
}
