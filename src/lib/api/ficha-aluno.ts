import { AlunoCadastro } from "./alunos";
import { TurmaCadastro } from "./turmas";
import { AlunoSemaforoStatus } from "./turma-semaforo";
import { EntregaPendente } from "./auditoria";
import { ModuloItem } from "./modulos-liberacao";
import { CanalItem } from "./canais";
import {
  DeclaracaoFaturamento,
  ProgressoMetaAnual,
  calcularProgressoMetaAnual,
  filtrarFaturamentosPorAluno,
  obterMetaAnualAluno,
} from "./faturamento";
import { BloqueioAcesso, ROTULOS_MOTIVO_BLOQUEIO, formatarDataBloqueio, obterBloqueioVigente } from "./bloqueio-acesso";

/** Tudo que a ficha consulta. Espelha o estado do sistema sem depender do store. */
export interface FonteDadosFicha {
  alunos: AlunoCadastro[];
  turmas: TurmaCadastro[];
  alunosSemaforo: AlunoSemaforoStatus[];
  entregas: EntregaPendente[];
  modulos: ModuloItem[];
  faturamentos: DeclaracaoFaturamento[];
  metasFaturamentoAlunos: Record<string, number>;
  /** Canais só existem para o aluno da sessão; informe o id dele para a ficha saber quando exibi-los. */
  canais?: CanalItem[];
  alunoAtualId?: string;
  bloqueiosAcesso?: Record<string, BloqueioAcesso>;
  historicoBloqueios?: BloqueioAcesso[];
}

export type NivelAlerta = "critico" | "atencao" | "info";

export interface AlertaFicha {
  nivel: NivelAlerta;
  titulo: string;
  detalhe?: string;
  acaoHref?: string;
  acaoRotulo?: string;
}

export interface DocumentoFicha {
  nome: string;
  origem: string; // ex.: "Faturamento · Agosto de 2026" ou "Check-in · Módulo 1"
  path: string;
  tipo: "comprovante" | "evidencia";
}

export interface FichaAluno {
  aluno: AlunoCadastro;
  dadosPessoais: {
    nome: string;
    email: string;
    whatsapp: string;
    cpf?: string;
    areaPericial?: string;
  };
  academico: {
    turmaNome?: string;
    turma?: TurmaCadastro;
    semaforo?: AlunoSemaforoStatus;
    entregas: EntregaPendente[];
    resumoEntregas: { aprovadas: number; aguardando: number; ajustes: number };
    modulosLiberados: ModuloItem[];
  };
  administrativo: {
    statusMatricula: AlunoCadastro["status"];
    criadoEm?: string;
    /** Bloqueio de acesso vigente, se houver. */
    bloqueioAcesso?: BloqueioAcesso;
    historicoBloqueios: BloqueioAcesso[];
    metaAnual: number;
    progresso: ProgressoMetaAnual;
    faturamentos: DeclaracaoFaturamento[];
    pendentesAuditoria: number;
    ajustesSolicitados: number;
    documentos: DocumentoFicha[];
  };
  canais?: CanalItem[];
  alertas: AlertaFicha[];
}

export const ROTULOS_STATUS_MATRICULA: Record<AlunoCadastro["status"], string> = {
  ativo: "Ativa",
  trancado: "Trancada",
  inativo: "Inativa",
  concluido: "Concluída",
};

function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function formatarMesLongo(mesRef: string): string {
  const [ano, mes] = mesRef.split("-");
  const texto = new Date(Number(ano), Number(mes) - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Localiza o registro de semáforo do aluno: por id derivado ("aluno-<id>") ou pelo nome. */
export function localizarSemaforoDoAluno(aluno: AlunoCadastro, semaforos: AlunoSemaforoStatus[]): AlunoSemaforoStatus | undefined {
  const porId = aluno.id ? semaforos.find((s) => s.id === `aluno-${aluno.id}` || s.id === aluno.id) : undefined;
  if (porId) return porId;
  const alvo = normalizarNome(aluno.nome);
  return semaforos.find((s) => normalizarNome(s.nome) === alvo);
}

/** Entregas de check-in do aluno: por nome (as entregas não carregam id do aluno). */
export function localizarEntregasDoAluno(aluno: AlunoCadastro, entregas: EntregaPendente[]): EntregaPendente[] {
  const alvo = normalizarNome(aluno.nome);
  return entregas.filter((e) => normalizarNome(e.alunoNome) === alvo);
}

export function gerarAlertasFicha(ficha: Omit<FichaAluno, "alertas">): AlertaFicha[] {
  const alertas: AlertaFicha[] = [];
  const { aluno, academico, administrativo } = ficha;

  if (administrativo.bloqueioAcesso) {
    const b = administrativo.bloqueioAcesso;
    alertas.push({
      nivel: "critico",
      titulo: "Acesso ao sistema bloqueado",
      detalhe: `${ROTULOS_MOTIVO_BLOQUEIO[b.motivo]} · desde ${formatarDataBloqueio(b.bloqueadoEm)} por ${b.bloqueadoPor}${b.liberarEm ? ` · liberação prevista ${formatarDataBloqueio(b.liberarEm)}` : ""}.`,
      acaoHref: "/admin/alunos",
      acaoRotulo: "Gerenciar acesso",
    });
  }

  if (aluno.status !== "ativo") {
    alertas.push({
      nivel: "critico",
      titulo: `Matrícula ${ROTULOS_STATUS_MATRICULA[aluno.status].toLowerCase()}`,
      detalhe: "O aluno não está com matrícula ativa. Confirme a situação antes de qualquer operação.",
      acaoHref: "/admin/alunos",
      acaoRotulo: "Gestão de Alunos",
    });
  }

  const s = academico.semaforo;
  if (!s) {
    alertas.push({ nivel: "info", titulo: "Sem registro de semáforo", detalhe: "Este aluno ainda não aparece no acompanhamento semanal da turma." });
  } else {
    if (s.precisaResgate) {
      const vermelhas = s.historicoSemaforos.filter((h) => h === "vermelho").length;
      alertas.push({
        nivel: "critico",
        titulo: "Resgate necessário",
        detalhe: `${vermelhas} semana(s) consecutiva(s) em vermelho. Acione o mentorado pelo WhatsApp.`,
        acaoHref: "/painel/turma",
        acaoRotulo: "Turma & Semáforo",
      });
    } else if (s.semaforoAtual === "vermelho") {
      alertas.push({ nivel: "critico", titulo: "Semáforo vermelho", detalhe: s.travouEmLinha || "Aluno em risco nesta semana." });
    } else if (s.semaforoAtual === "amarelo") {
      alertas.push({ nivel: "atencao", titulo: "Semáforo amarelo", detalhe: s.travouEmLinha || "Aluno em atenção nesta semana." });
    }
    if (!s.checkinEntregue) {
      alertas.push({ nivel: "atencao", titulo: "Check-in da semana não entregue", detalhe: `Módulo atual: ${s.moduloAtual}.` });
    }
  }

  if (academico.resumoEntregas.ajustes > 0) {
    alertas.push({
      nivel: "atencao",
      titulo: `${academico.resumoEntregas.ajustes} entrega(s) com ajuste solicitado`,
      detalhe: "O aluno precisa reenviar evidências corrigidas.",
      acaoHref: "/painel/auditoria",
      acaoRotulo: "Fila de Auditoria",
    });
  }
  if (academico.resumoEntregas.aguardando > 0) {
    alertas.push({
      nivel: "info",
      titulo: `${academico.resumoEntregas.aguardando} entrega(s) aguardando avaliação`,
      acaoHref: "/painel/auditoria",
      acaoRotulo: "Fila de Auditoria",
    });
  }

  if (administrativo.ajustesSolicitados > 0) {
    alertas.push({
      nivel: "atencao",
      titulo: `${administrativo.ajustesSolicitados} declaração(ões) de faturamento com ajuste solicitado`,
      acaoHref: "/painel/faturamento",
      acaoRotulo: "Metas & Faturamento",
    });
  }
  if (administrativo.pendentesAuditoria > 0) {
    alertas.push({
      nivel: "info",
      titulo: `${administrativo.pendentesAuditoria} declaração(ões) de faturamento aguardando auditoria`,
      acaoHref: "/painel/faturamento",
      acaoRotulo: "Metas & Faturamento",
    });
  }
  if (administrativo.progresso.mesesDeclarados > 0 && administrativo.progresso.percentualAnual < 50) {
    alertas.push({
      nivel: "atencao",
      titulo: "Abaixo de 50% da meta anual",
      detalhe: `${Math.round(administrativo.progresso.percentualAnual)}% da meta de ${administrativo.progresso.ano} realizado.`,
      acaoHref: "/painel/faturamento",
      acaoRotulo: "Metas & Faturamento",
    });
  }
  if (administrativo.progresso.mesesDeclarados === 0) {
    alertas.push({ nivel: "info", titulo: `Nenhum faturamento declarado em ${administrativo.progresso.ano}` });
  }

  const camposFaltando: string[] = [];
  if (!aluno.cpf) camposFaltando.push("CPF");
  if (!aluno.areaPericial) camposFaltando.push("área pericial");
  if (!aluno.whatsapp) camposFaltando.push("WhatsApp");
  if (camposFaltando.length > 0) {
    alertas.push({
      nivel: "info",
      titulo: "Cadastro incompleto",
      detalhe: `Faltando: ${camposFaltando.join(", ")}.`,
      acaoHref: "/admin/alunos",
      acaoRotulo: "Editar cadastro",
    });
  }

  const ordem: Record<NivelAlerta, number> = { critico: 0, atencao: 1, info: 2 };
  return alertas.sort((a, b) => ordem[a.nivel] - ordem[b.nivel]);
}

/** Monta a ficha completa do aluno a partir do que existe no sistema. Retorna null se o aluno não existir. */
export function montarFichaAluno(fonte: FonteDadosFicha, alunoId: string, ano: number): FichaAluno | null {
  const aluno = fonte.alunos.find((a) => a.id === alunoId);
  if (!aluno) return null;

  const turma = fonte.turmas.find((t) => t.id === aluno.turmaId);
  const semaforo = localizarSemaforoDoAluno(aluno, fonte.alunosSemaforo);
  const entregas = localizarEntregasDoAluno(aluno, fonte.entregas).sort((a, b) => b.enviadoEm.localeCompare(a.enviadoEm));
  const modulosLiberados = fonte.modulos.filter((m) => m.status !== "bloqueado");

  const faturamentos = filtrarFaturamentosPorAluno(fonte.faturamentos, alunoId).sort((a, b) => b.mesReferencia.localeCompare(a.mesReferencia));
  const metaAnual = obterMetaAnualAluno(fonte.metasFaturamentoAlunos, alunoId);
  const progresso = calcularProgressoMetaAnual(faturamentos, metaAnual, ano);

  const documentos: DocumentoFicha[] = [
    ...faturamentos.flatMap((f) =>
      f.comprovantes.map((c) => ({
        nome: c.nome,
        origem: `Faturamento · ${formatarMesLongo(f.mesReferencia)}`,
        path: c.path,
        tipo: "comprovante" as const,
      }))
    ),
    ...entregas.flatMap((e) =>
      e.arquivos.map((a) => ({
        nome: a.nome,
        origem: `Check-in · ${e.moduloTitulo}`,
        path: a.path,
        tipo: "evidencia" as const,
      }))
    ),
  ];

  const semAlertas: Omit<FichaAluno, "alertas"> = {
    aluno,
    dadosPessoais: {
      nome: aluno.nome,
      email: aluno.email,
      whatsapp: aluno.whatsapp,
      cpf: aluno.cpf,
      areaPericial: aluno.areaPericial,
    },
    academico: {
      turmaNome: aluno.turmaNome ?? turma?.nome,
      turma,
      semaforo,
      entregas,
      resumoEntregas: {
        aprovadas: entregas.filter((e) => e.status === "aprovado").length,
        aguardando: entregas.filter((e) => e.status === "aguardando_avaliacao").length,
        ajustes: entregas.filter((e) => e.status === "ajuste_solicitado").length,
      },
      modulosLiberados,
    },
    administrativo: {
      statusMatricula: aluno.status,
      criadoEm: aluno.criadoEm,
      bloqueioAcesso: obterBloqueioVigente(fonte.bloqueiosAcesso ?? {}, alunoId),
      historicoBloqueios: (fonte.historicoBloqueios ?? []).filter((b) => b.alunoId === alunoId),
      metaAnual,
      progresso,
      faturamentos,
      pendentesAuditoria: faturamentos.filter((f) => (f.statusAuditoria ?? "pendente") === "pendente").length,
      ajustesSolicitados: faturamentos.filter((f) => f.statusAuditoria === "ajuste_solicitado").length,
      documentos,
    },
    canais: fonte.canais && fonte.alunoAtualId === alunoId ? fonte.canais : undefined,
  };

  return { ...semAlertas, alertas: gerarAlertasFicha(semAlertas) };
}

/** Contextos operacionais reconhecidos pela ficha (querystring `contexto`). */
export const CONTEXTOS_OPERACIONAIS: Record<string, { rotulo: string; retornoHref: string; retornoRotulo: string }> = {
  "gestao-alunos": { rotulo: "Gestão de Alunos", retornoHref: "/admin/alunos", retornoRotulo: "Voltar para Gestão de Alunos" },
  "turma-semaforo": { rotulo: "Turma & Semáforo", retornoHref: "/painel/turma", retornoRotulo: "Voltar para a Turma" },
  "auditoria-entregas": { rotulo: "Auditoria de Entregas", retornoHref: "/painel/auditoria", retornoRotulo: "Voltar para a Fila de Auditoria" },
  "metas-faturamento": { rotulo: "Metas & Faturamento", retornoHref: "/painel/faturamento", retornoRotulo: "Voltar para Metas & Faturamento" },
};
