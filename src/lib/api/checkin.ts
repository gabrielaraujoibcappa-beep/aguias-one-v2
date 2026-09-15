export interface EvidenciaLinkItem {
  rotulo: string;
  url: string;
}

export interface EvidenciaArquivoItem {
  rotulo: string;
  path: string;
  nome: string;
}

export interface SubmissaoCheckin {
  id?: string;
  matriculaId: string;
  moduloId: string;
  links: EvidenciaLinkItem[];
  arquivos: EvidenciaArquivoItem[];
  travou?: string;
  duvidaCall?: string;
  status?: "rascunho" | "aguardando_avaliacao" | "ajuste_solicitado" | "aprovado";
  parecerTexto?: string;
  enviadoEm?: string;
}

export function validarSubmissaoCheckin(submissao: SubmissaoCheckin): { valido: boolean; erros: string[] } {
  const erros: string[] = [];

  // Validação dos links
  for (const link of submissao.links) {
    if (!link.url || link.url.trim().length === 0) {
      erros.push(`${link.rotulo}: URL obrigatória`);
    } else if (!/^https?:\/\/.+/i.test(link.url.trim())) {
      erros.push(`${link.rotulo}: link deve iniciar com http:// ou https://`);
    }
  }

  // Validação dos arquivos
  if (submissao.arquivos.length === 0 && submissao.links.length === 0) {
    erros.push("É necessário anexar ao menos um link ou arquivo de comprovação.");
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}
