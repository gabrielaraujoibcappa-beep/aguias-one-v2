export type MotivoBloqueio = "inadimplencia" | "inatividade" | "conduta" | "administrativo" | "outro";

export const ROTULOS_MOTIVO_BLOQUEIO: Record<MotivoBloqueio, string> = {
  inadimplencia: "Inadimplência",
  inatividade: "Inatividade prolongada",
  conduta: "Conduta / termos de uso",
  administrativo: "Pendência administrativa",
  outro: "Outro motivo",
};

/** Registro de bloqueio de acesso de um aluno ao sistema. */
export interface BloqueioAcesso {
  id: string;
  alunoId: string;
  motivo: MotivoBloqueio;
  /** Texto exibido ao aluno na tela de bloqueio. */
  mensagemAoAluno?: string;
  /** Anotação visível só para a equipe. */
  observacaoInterna?: string;
  bloqueadoPor: string;
  bloqueadoEm: string; // ISO
  /** Data (YYYY-MM-DD) a partir da qual o acesso volta automaticamente. Opcional. */
  liberarEm?: string;
  desbloqueadoPor?: string;
  desbloqueadoEm?: string; // ISO
  observacaoDesbloqueio?: string;
}

export interface DadosNovoBloqueio {
  alunoId: string;
  motivo: MotivoBloqueio;
  mensagemAoAluno?: string;
  observacaoInterna?: string;
  liberarEm?: string;
}

export function validarNovoBloqueio(dados: DadosNovoBloqueio, hoje: Date = new Date()): { valido: boolean; erros: string[] } {
  const erros: string[] = [];
  if (!dados.alunoId) erros.push("alunoId");
  if (!dados.motivo || !(dados.motivo in ROTULOS_MOTIVO_BLOQUEIO)) erros.push("motivo");
  if (dados.motivo === "outro" && !(dados.observacaoInterna ?? "").trim()) erros.push("observacaoInterna");
  if (dados.liberarEm) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dados.liberarEm)) {
      erros.push("liberarEm");
    } else {
      const limite = new Date(`${dados.liberarEm}T00:00:00`);
      const inicioHoje = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
      if (limite.getTime() <= inicioHoje.getTime()) erros.push("liberarEm");
    }
  }
  return { valido: erros.length === 0, erros };
}

export function criarBloqueio(dados: DadosNovoBloqueio, bloqueadoPor: string, agora: Date = new Date()): BloqueioAcesso {
  const validacao = validarNovoBloqueio(dados, agora);
  if (!validacao.valido) {
    throw new Error(`Bloqueio inválido: ${validacao.erros.join(", ")}`);
  }
  return {
    id: `blq-${agora.getTime()}`,
    alunoId: dados.alunoId,
    motivo: dados.motivo,
    mensagemAoAluno: dados.mensagemAoAluno?.trim() || undefined,
    observacaoInterna: dados.observacaoInterna?.trim() || undefined,
    bloqueadoPor,
    bloqueadoEm: agora.toISOString(),
    liberarEm: dados.liberarEm || undefined,
  };
}

export function encerrarBloqueio(bloqueio: BloqueioAcesso, desbloqueadoPor: string, observacao?: string, agora: Date = new Date()): BloqueioAcesso {
  return {
    ...bloqueio,
    desbloqueadoPor,
    desbloqueadoEm: agora.toISOString(),
    observacaoDesbloqueio: observacao?.trim() || undefined,
  };
}

/** Um bloqueio vale enquanto não foi encerrado e a data de liberação automática (se houver) não chegou. */
export function bloqueioEstaVigente(bloqueio: BloqueioAcesso | undefined, agora: Date = new Date()): boolean {
  if (!bloqueio || bloqueio.desbloqueadoEm) return false;
  if (bloqueio.liberarEm) {
    const limite = new Date(`${bloqueio.liberarEm}T00:00:00`);
    if (agora.getTime() >= limite.getTime()) return false;
  }
  return true;
}

/** Bloqueio vigente do aluno, se existir. */
export function obterBloqueioVigente(bloqueios: Record<string, BloqueioAcesso>, alunoId: string, agora: Date = new Date()): BloqueioAcesso | undefined {
  const atual = bloqueios[alunoId];
  return bloqueioEstaVigente(atual, agora) ? atual : undefined;
}

export function formatarDataBloqueio(iso?: string): string {
  if (!iso) return "";
  const data = iso.length === 10 ? new Date(`${iso}T00:00:00`) : new Date(iso);
  return data.toLocaleDateString("pt-BR");
}
