"use client";

import React from "react";
import { EvidenciaArquivoItem } from "@/lib/api/checkin";
import { UploadArquivos, ArquivoUploadItem } from "../ui/UploadArquivos";

interface InputMultiploArquivosProps {
  rotulo: string;
  arquivos: EvidenciaArquivoItem[];
  onAdicionar: (novoArquivo: EvidenciaArquivoItem) => void;
  onRemover: (index: number) => void;
  obrigatorio?: boolean;
}

export function InputMultiploArquivos({
  rotulo,
  arquivos,
  onAdicionar,
  onRemover,
  obrigatorio = true,
}: InputMultiploArquivosProps) {
  // Converte EvidenciaArquivoItem em ArquivoUploadItem para o componente de design system
  const arquivosUpload: ArquivoUploadItem[] = arquivos.map((arq, idx) => ({
    id: `evidencia-${idx}-${arq.nome}`,
    nome: arq.nome,
    tamanhoBytes: arq.tamanhoBytes || 1024 * 120, // fallback estimativo se não houver bytes
    status: "concluido",
  }));

  const handleUploadChange = (novos: ArquivoUploadItem[]) => {
    if (novos.length < arquivos.length) {
      // Identifica o índice removido
      const idxRemovido = arquivos.findIndex(
        (arq) => !novos.some((n) => n.nome === arq.nome)
      );
      if (idxRemovido !== -1) {
        onRemover(idxRemovido);
      }
    } else {
      // Identifica itens novos adicionados
      const novosAdicionados = novos.slice(arquivos.length);
      for (const item of novosAdicionados) {
        onAdicionar({
          rotulo: item.nome,
          nome: item.nome,
          path: `/mock/uploads/${item.nome}`,
          tipo: item.nome.toLowerCase().endsWith(".pdf") ? "pdf" : "print",
          tamanhoBytes: item.tamanhoBytes,
        });
      }
    }
  };

  return (
    <UploadArquivos
      rotulo={rotulo}
      descricao="Evidências de execução da esteira (prints e documentos)"
      arquivos={arquivosUpload}
      onChange={handleUploadChange}
      formatosPermitidos={[".png", ".jpg", ".jpeg", ".pdf"]}
      tamanhoMaximoBytes={25 * 1024 * 1024}
      maximoArquivos={5}
      obrigatorio={obrigatorio}
    />
  );
}
