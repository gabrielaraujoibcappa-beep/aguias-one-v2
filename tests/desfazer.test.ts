import { describe, it, expect, beforeEach, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { reverterRegistro, reverterValorPorChave } from "../src/lib/api/desfazer";
import {
  DURACAO_COM_DESFAZER_MS,
  DURACAO_SIMPLES_MS,
  desfazerNotificacaoAtual,
  efetivarPendente,
  fecharNotificacao,
  lerNotificacaoAtual,
  notificar,
  resetarNotificacoesParaTestes,
} from "../src/lib/notificacoes";
import { ToastDesfazer } from "../src/components/ui/ToastDesfazer";

type Item = { id?: string; status: string };

const A: Item = { id: "a", status: "pendente" };
const B: Item = { id: "b", status: "pendente" };
const C: Item = { id: "c", status: "pendente" };

describe("Reversão atômica de registros", () => {
  it("devolve o registro alterado ao estado anterior completo, na mesma posição", () => {
    const posterior = { ...B, status: "aprovado" };
    const lista = [A, posterior, C];
    const { lista: revertida, ok } = reverterRegistro(lista, { anterior: B, posterior, indice: 1 });
    expect(ok).toBe(true);
    expect(revertida).toEqual([A, B, C]);
  });

  it("restaura um registro excluído na posição original, sem criar segunda cópia", () => {
    const { lista, ok } = reverterRegistro([A, C], { anterior: B, indice: 1 });
    expect(ok).toBe(true);
    expect(lista.map((i) => i.id)).toEqual(["a", "b", "c"]);

    // Segunda tentativa não duplica
    const repetida = reverterRegistro(lista, { anterior: B, indice: 1 });
    expect(repetida.ok).toBe(false);
    expect(repetida.lista).toHaveLength(3);
  });

  it("recusa reverter se o registro foi alterado depois da ação", () => {
    const posterior = { ...B, status: "aprovado" };
    const alteradoDepois = { ...B, status: "ajuste_solicitado" };
    const lista = [A, alteradoDepois, C];
    const { lista: resultado, ok } = reverterRegistro(lista, { anterior: B, posterior, indice: 1 });
    expect(ok).toBe(false);
    expect(resultado).toBe(lista);
  });

  it("desfaz a criação removendo apenas o registro criado", () => {
    const criado = { id: "d", status: "pendente" };
    const { lista, ok } = reverterRegistro([criado, A], { posterior: criado, indice: 0 });
    expect(ok).toBe(true);
    expect(lista).toEqual([A]);
  });

  it("reverte valores por chave e remove a chave quando ela não existia", () => {
    expect(reverterValorPorChave({ "1": 300000 }, "1", 240000, 300000)).toEqual({ mapa: { "1": 240000 }, ok: true });
    expect(reverterValorPorChave({ "1": 300000 }, "1", undefined, 300000)).toEqual({ mapa: {}, ok: true });
    expect(reverterValorPorChave({ "1": 500000 }, "1", 240000, 300000).ok).toBe(false);
  });
});

describe("Notificações temporárias com Desfazer e atraso controlado", () => {
  beforeEach(() => resetarNotificacoesParaTestes());

  it("mantém uma única notificação e usa mais tempo quando há Desfazer", () => {
    notificar("Primeira");
    expect(lerNotificacaoAtual()?.duracaoMs).toBe(DURACAO_SIMPLES_MS);
    notificar("Segunda", { desfazer: { rotulo: "Desfazer", rotuloAcessivel: "Desfazer segunda", executar: () => true, mensagemAposDesfazer: "Desfeito." } });
    expect(lerNotificacaoAtual()?.mensagem).toBe("Segunda");
    expect(lerNotificacaoAtual()?.duracaoMs).toBe(DURACAO_COM_DESFAZER_MS);
  });

  it("desfazer reverte, nunca efetiva o envio e informa o resultado", () => {
    const executar = vi.fn(() => true);
    const efetivar = vi.fn();
    notificar("Declaração aprovada.", {
      efetivar,
      desfazer: { rotulo: "Desfazer aprovação", rotuloAcessivel: "Desfazer aprovação da declaração", executar, mensagemAposDesfazer: "Aprovação desfeita." },
    });

    expect(desfazerNotificacaoAtual()).toBe(true);
    expect(executar).toHaveBeenCalledTimes(1);
    expect(lerNotificacaoAtual()?.mensagem).toBe("Aprovação desfeita.");
    expect(lerNotificacaoAtual()?.desfazer).toBeUndefined();

    // Nada mais dispara o envio: nem fechar, nem nova notificação, nem sair da página
    fecharNotificacao();
    notificar("Outra coisa");
    efetivarPendente();
    expect(efetivar).not.toHaveBeenCalled();

    // Não é possível desfazer duas vezes
    expect(desfazerNotificacaoAtual()).toBe(false);
    expect(executar).toHaveBeenCalledTimes(1);
  });

  it("efetiva o envio uma única vez quando a janela termina sem desfazer", () => {
    const efetivar = vi.fn();
    const id = notificar("Cadastro excluído.", {
      efetivar,
      desfazer: { rotulo: "Desfazer exclusão", rotuloAcessivel: "Desfazer exclusão do cadastro", executar: () => true, mensagemAposDesfazer: "Exclusão desfeita." },
    });
    fecharNotificacao(id);
    fecharNotificacao(id);
    efetivarPendente();
    expect(efetivar).toHaveBeenCalledTimes(1);
    expect(lerNotificacaoAtual()).toBeNull();
  });

  it("efetiva a ação anterior quando outra notificação a substitui", () => {
    const efetivarPrimeira = vi.fn();
    notificar("Primeira aprovada.", {
      efetivar: efetivarPrimeira,
      desfazer: { rotulo: "Desfazer aprovação", rotuloAcessivel: "Desfazer aprovação da primeira", executar: () => true, mensagemAposDesfazer: "Desfeito." },
    });
    notificar("Segunda aprovada.");
    expect(efetivarPrimeira).toHaveBeenCalledTimes(1);
  });

  it("se a tela não puder ser revertida, informa a falha e mantém a ação valendo", () => {
    const efetivar = vi.fn();
    notificar("Declaração aprovada.", {
      efetivar,
      desfazer: { rotulo: "Desfazer aprovação", rotuloAcessivel: "Desfazer aprovação", executar: () => false, mensagemAposDesfazer: "Aprovação desfeita." },
    });
    expect(desfazerNotificacaoAtual()).toBe(false);
    expect(efetivar).toHaveBeenCalledTimes(1);
    expect(lerNotificacaoAtual()?.tom).toBe("erro");
    expect(lerNotificacaoAtual()?.mensagem).toContain("Não foi possível desfazer");
  });

  it("não fecha uma notificação mais nova com o id de uma antiga", () => {
    const antiga = notificar("Antiga");
    notificar("Nova");
    fecharNotificacao(antiga);
    expect(lerNotificacaoAtual()?.mensagem).toBe("Nova");
  });
});

describe("ToastDesfazer: nome acessível específico", () => {
  it("usa o nome acessível com ação e objeto, e permite não se anunciar quando há região persistente", () => {
    const html = renderToStaticMarkup(
      React.createElement(ToastDesfazer, {
        visivel: true,
        mensagem: "Declaração de agosto de 2026 de Dr. Roberto Silva aprovada.",
        rotuloDesfazer: "Desfazer aprovação",
        rotuloAcessivelDesfazer: "Desfazer aprovação da declaração de agosto de 2026 de Dr. Roberto Silva",
        anunciar: false,
        mostrarAtalho: true,
        onDesfazer: () => {},
        onFechar: () => {},
      })
    );
    expect(html).toContain('aria-label="Desfazer aprovação da declaração de agosto de 2026 de Dr. Roberto Silva"');
    expect(html).toContain('aria-keyshortcuts="Control+Z"');
    expect(html).toContain('aria-label="Dispensar notificação"');
    expect(html).not.toContain('role="status"');
  });

  it("sem ação de desfazer, mostra só a mensagem e o botão de dispensar", () => {
    const html = renderToStaticMarkup(
      React.createElement(ToastDesfazer, { visivel: true, mensagem: "Declaração lançada.", onFechar: () => {} })
    );
    expect(html).toContain("Declaração lançada.");
    expect(html).not.toContain("toast-desfazer-acao");
  });
});
