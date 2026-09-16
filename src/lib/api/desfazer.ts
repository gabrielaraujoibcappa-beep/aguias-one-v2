/**
 * Reversão atômica de uma ação sobre um registro de uma lista.
 *
 * - `anterior`: o registro como estava antes da ação (ausente quando a ação criou o registro).
 * - `posterior`: o registro como ficou depois da ação (ausente quando a ação removeu o registro).
 * - `indice`: posição original, usada para devolver um registro removido ao mesmo lugar.
 *
 * A reversão só acontece se o registro ainda estiver exatamente como a ação o deixou.
 * Se alguém o alterou depois, nada é modificado e `ok` volta `false`, para nunca
 * sobrescrever uma mudança mais recente nem criar uma segunda cópia.
 */
export interface AlvoReversao<T> {
  anterior?: T;
  posterior?: T;
  indice: number;
}

export interface ResultadoReversao<T> {
  lista: T[];
  ok: boolean;
}

function mesmoConteudo(a: unknown, b: unknown): boolean {
  return a === b || JSON.stringify(a) === JSON.stringify(b);
}

export function reverterRegistro<T extends { id?: string }>(lista: T[], alvo: AlvoReversao<T>): ResultadoReversao<T> {
  const id = alvo.anterior?.id ?? alvo.posterior?.id;
  if (!id) return { lista, ok: false };

  const indiceAtual = lista.findIndex((item) => item.id === id);

  // A ação alterou ou criou o registro: ele precisa estar intacto desde então
  if (alvo.posterior) {
    if (indiceAtual === -1 || !mesmoConteudo(lista[indiceAtual], alvo.posterior)) {
      return { lista, ok: false };
    }
    if (alvo.anterior) {
      const nova = [...lista];
      nova[indiceAtual] = alvo.anterior;
      return { lista: nova, ok: true };
    }
    return { lista: lista.filter((_, i) => i !== indiceAtual), ok: true };
  }

  // A ação removeu o registro: ele não pode ter reaparecido
  if (!alvo.anterior || indiceAtual !== -1) return { lista, ok: false };
  const nova = [...lista];
  const posicao = Math.min(Math.max(alvo.indice, 0), nova.length);
  nova.splice(posicao, 0, alvo.anterior);
  return { lista: nova, ok: true };
}

/** Reversão de um valor simples por chave (ex.: meta anual de um aluno). */
export function reverterValorPorChave<V>(
  mapa: Record<string, V>,
  chave: string,
  anterior: V | undefined,
  posterior: V
): { mapa: Record<string, V>; ok: boolean } {
  if (!mesmoConteudo(mapa[chave], posterior)) return { mapa, ok: false };
  const novo = { ...mapa };
  if (anterior === undefined) {
    delete novo[chave];
  } else {
    novo[chave] = anterior;
  }
  return { mapa: novo, ok: true };
}
