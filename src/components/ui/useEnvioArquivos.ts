"use client";

import { useCallback, useRef, useState } from "react";
import { enviarArquivo } from "@/lib/arquivos/cliente";
import type { BucketArquivo } from "@/lib/arquivos/regras";
import type { ArquivoUploadItem } from "./UploadArquivos";

export interface ArquivoEnviado extends ArquivoUploadItem {
  storagePath?: string;
}

/**
 * Estado da lista de anexos do UploadArquivos: cada arquivo novo e válido é
 * enviado na hora para o Storage, com status "enviando" → "concluido" ou "erro".
 */
export function useEnvioArquivos(bucket: BucketArquivo) {
  const [itens, setItens] = useState<ArquivoEnviado[]>([]);
  const itensRef = useRef(itens);
  itensRef.current = itens;

  const atualizar = (id: string, mudanca: Partial<ArquivoEnviado>) =>
    setItens((atuais) => atuais.map((it) => (it.id === id ? { ...it, ...mudanca } : it)));

  const enviar = useCallback(
    async (item: ArquivoEnviado) => {
      if (!item.file) return;
      atualizar(item.id, { status: "enviando", progresso: 0, mensagemErro: undefined });
      const resultado = await enviarArquivo(item.file, bucket);
      // O item pode ter sido removido enquanto enviava
      if (!itensRef.current.some((it) => it.id === item.id)) return;
      if (resultado.sucesso) {
        atualizar(item.id, { status: "concluido", progresso: 100, storagePath: resultado.storagePath });
      } else {
        atualizar(item.id, { status: "erro", progresso: 0, mensagemErro: resultado.erro });
      }
    },
    [bucket]
  );

  /** Recebe a lista do UploadArquivos e dispara o envio dos itens novos e válidos. */
  const onChange = (lista: ArquivoUploadItem[]) => {
    const anteriores = new Map(itensRef.current.map((it) => [it.id, it]));
    const proxima: ArquivoEnviado[] = lista.map((it) => anteriores.get(it.id) ?? it);
    itensRef.current = proxima;
    setItens(proxima);
    proxima.filter((it) => !anteriores.has(it.id) && it.status === "pronto").forEach((it) => void enviar(it));
  };

  const tentarNovamente = (item: ArquivoUploadItem) => {
    const atual = itensRef.current.find((it) => it.id === item.id);
    if (atual) void enviar(atual);
  };

  const limpar = () => {
    itensRef.current = [];
    setItens([]);
  };

  return {
    itens,
    onChange,
    tentarNovamente,
    limpar,
    enviando: itens.some((it) => it.status === "enviando"),
    comErro: itens.some((it) => it.status === "erro"),
    concluidos: itens.filter((it): it is ArquivoEnviado & { storagePath: string } => it.status === "concluido" && !!it.storagePath),
  };
}
