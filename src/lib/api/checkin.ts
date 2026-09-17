export interface EvidenciaLinkItem {
  rotulo: string;
  url: string;
}

export interface EvidenciaArquivoItem {
  rotulo?: string;
  path: string;
  nome: string;
  tipo?: string;
  tamanhoBytes?: number;
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

export const MAXIMO_EVIDENCIAS = 15;

export interface LinhaEvidencia {
  tipo: "link" | "arquivo";
  rotulo: string;
  valor_url: string | null;
  storage_path: string | null;
  nome_arquivo: string | null;
}

function textoCurto(valor: unknown, limite: number): string | null {
  if (typeof valor !== "string") return null;
  const limpo = valor.trim();
  return limpo ? limpo.slice(0, limite) : null;
}

function urlHttp(valor: unknown): string | null {
  const texto = textoCurto(valor, 2000);
  if (!texto) return null;
  try {
    const url = new URL(texto);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Valida as evidências recebidas pela API e devolve as linhas prontas para gravar.
 * `validarCaminho` decide se o caminho do arquivo pode ser usado por quem envia.
 */
export function normalizarEvidencias(
  evidencias: unknown,
  validarCaminho: (caminho: unknown) => boolean
): { linhas: LinhaEvidencia[]; erro?: undefined } | { linhas?: undefined; erro: string } {
  if (!Array.isArray(evidencias) || evidencias.length === 0) {
    return { erro: "Anexe ao menos um link ou arquivo de comprovação." };
  }
  if (evidencias.length > MAXIMO_EVIDENCIAS) {
    return { erro: `Envie no máximo ${MAXIMO_EVIDENCIAS} evidências por check-in.` };
  }

  const linhas: LinhaEvidencia[] = [];
  for (const ev of evidencias as any[]) {
    if (ev?.tipo === "arquivo") {
      if (!validarCaminho(ev.storagePath)) return { erro: "Arquivo anexado inválido. Envie o arquivo novamente." };
      const nome = textoCurto(ev.nomeArquivo, 200);
      linhas.push({
        tipo: "arquivo",
        rotulo: textoCurto(ev.rotulo, 200) ?? nome ?? "Arquivo",
        valor_url: null,
        storage_path: ev.storagePath,
        nome_arquivo: nome,
      });
    } else {
      const url = urlHttp(ev?.valorUrl);
      if (!url) return { erro: "Todo link de evidência deve começar com http:// ou https://." };
      linhas.push({
        tipo: "link",
        rotulo: textoCurto(ev?.rotulo, 200) ?? "Evidência",
        valor_url: url,
        storage_path: null,
        nome_arquivo: null,
      });
    }
  }
  return { linhas };
}
