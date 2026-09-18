import { AlunoCadastro } from "./alunos";
import { TurmaCadastro as TurmaItem } from "./turmas";
import { ModuloItem, filtrarModulosVisiveis } from "./modulos-liberacao";
import {
  DeclaracaoFaturamento,
  calcularMetaMensal,
  filtrarFaturamentosPorAluno,
  formatarMesReferencia,
  mesReferenciaAtual,
  obterMetaAnualAluno,
} from "./faturamento";
import { CanalItem } from "./canais";
import { EntregaPendente } from "./auditoria";
import { localizarEntregasDoAluno } from "./ficha-aluno";
import type { ContextoDashboard } from "@/components/aluno/AtalhosPrincipais";

export interface AlunoVisao extends AlunoCadastro {
  matriculaId?: string | null;
}

export interface FonteDadosVisao {
  alunos: AlunoVisao[];
  turmas: TurmaItem[];
  modulos: ModuloItem[];
  faturamentos: DeclaracaoFaturamento[];
  metasFaturamentoAlunos: Record<string, number>;
  entregas: EntregaPendente[];
}

export interface ContextoVisaoAluno {
  aluno: AlunoVisao;
  turmaNome: string;
  horarioEncontro?: string;
  moduloAtualTitulo: string;
  contextoAtalhos: ContextoDashboard;
  faturamentosDoAluno: DeclaracaoFaturamento[];
  metaMensal: number;
  entregasDoAluno: EntregaPendente[];
  modulosVisiveis: ModuloItem[];
  matriculaId: string | null;
}

/**
 * Monta o contexto da "visão do aluno": os mesmos dados que o dashboard do
 * mentorado exibe, derivados do estado sincronizado da equipe.
 * Retorna null quando o aluno não existe. Somente leitura: nenhum dado é alterado.
 */
export function montarContextoVisaoAluno(fonte: FonteDadosVisao, alunoId: string): ContextoVisaoAluno | null {
  const aluno = fonte.alunos.find((a) => a.id === alunoId);
  if (!aluno || !aluno.id) return null;

  const turma = fonte.turmas.find((t) => t.id === aluno.turmaId);
  const modulosVisiveis = filtrarModulosVisiveis(fonte.modulos);
  const moduloAtual = modulosVisiveis[modulosVisiveis.length - 1];
  const tituloModulo = moduloAtual ? `Módulo ${moduloAtual.numero} — ${moduloAtual.titulo}` : "Nenhum módulo liberado ainda";

  const faturamentosDoAluno = filtrarFaturamentosPorAluno(fonte.faturamentos, aluno.id);
  const metaMensal = calcularMetaMensal(obterMetaAnualAluno(fonte.metasFaturamentoAlunos, aluno.id));
  const entregasDoAluno = localizarEntregasDoAluno(aluno, fonte.entregas);

  return {
    aluno,
    turmaNome: aluno.turmaNome ?? turma?.nome ?? "Sem Turma Vinculada",
    horarioEncontro: turma?.horarioEncontro || undefined,
    moduloAtualTitulo: tituloModulo,
    contextoAtalhos: {
      moduloLiberadoId: moduloAtual?.id ?? "atual",
      moduloLiberadoTitulo: tituloModulo,
      checkinPendente: moduloAtual?.status === "liberado",
      faturamentoMes: formatarMesReferencia(mesReferenciaAtual()).replace(" de ", "/"),
    },
    faturamentosDoAluno,
    metaMensal,
    entregasDoAluno,
    modulosVisiveis,
    matriculaId: aluno.matriculaId ?? null,
  };
}

/** Canais entram via /api/canais?matriculaId= (o store da equipe não os carrega). */
export type { CanalItem };
