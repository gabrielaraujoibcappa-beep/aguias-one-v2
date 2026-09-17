"use client";

import React, { useEffect } from "react";
import { EvidenciaArquivoItem } from "@/lib/api/checkin";
import { REGRAS_BUCKET, extensoesDoBucket } from "@/lib/arquivos/regras";
import { UploadArquivos } from "../ui/UploadArquivos";
import { useEnvioArquivos } from "../ui/useEnvioArquivos";

interface InputMultiploArquivosProps {
  rotulo: string;
  /** Recebe só os arquivos já gravados no Storage e se ainda há envio em andamento. */
  onChange: (arquivos: EvidenciaArquivoItem[], enviando: boolean) => void;
  obrigatorio?: boolean;
}

export function InputMultiploArquivos({ rotulo, onChange, obrigatorio = true }: InputMultiploArquivosProps) {
  const envio = useEnvioArquivos("evidencias");

  const chaveConcluidos = envio.concluidos.map((a) => a.storagePath).join("|");
  useEffect(() => {
    onChange(
      envio.concluidos.map((arq) => ({
        rotulo: arq.nome,
        nome: arq.nome,
        path: arq.storagePath,
        tipo: arq.nome.toLowerCase().endsWith(".pdf") ? "pdf" : "print",
        tamanhoBytes: arq.tamanhoBytes,
      })),
      envio.enviando
    );
    // onChange do pai muda a cada render; só notifica quando a lista ou o envio mudam
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chaveConcluidos, envio.enviando]);

  return (
    <UploadArquivos
      rotulo={rotulo}
      descricao="Evidências de execução da esteira (prints e documentos)"
      arquivos={envio.itens}
      onChange={envio.onChange}
      onTentarNovamente={envio.tentarNovamente}
      formatosPermitidos={extensoesDoBucket("evidencias")}
      tamanhoMaximoBytes={REGRAS_BUCKET.evidencias.tamanhoMaximoBytes}
      maximoArquivos={5}
      obrigatorio={obrigatorio}
    />
  );
}
