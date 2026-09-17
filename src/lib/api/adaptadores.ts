/**
 * Adaptadores das respostas das rotas /api para os tipos usados pelas telas.
 *
 * As rotas devolvem o formato do banco (ou um formato próprio); as telas foram
 * construídas sobre outros tipos. Toda conversão fica aqui, num só lugar e
 * testada, para que nenhuma tela dependa de dados de demonstração.
 */
import type { DeclaracaoFaturamento, StatusAuditoriaFaturamento } from "./faturamento";
import type { EntregaPendente } from "./auditoria";
import type { AlunoSemaforoStatus } from "./turma-semaforo";
import type { TurmaCadastro } from "./turmas";
import type { BloqueioAcesso, MotivoBloqueio } from "./bloqueio-acesso";
import type { CanalItem } from "./canais";
import type { ModuloItem } from "./modulos-liberacao";

/* eslint-disable @typescript-eslint/no-explicit-any */

const MOTIVOS_BLOQUEIO: MotivoBloqueio[] = ["inadimplencia", "inatividade", "conduta", "administrativo", "outro"];
const STATUS_AUDITORIA: StatusAuditoriaFaturamento[] = ["pendente", "aprovado", "ajuste_solicitado"];

/** Texto vazio vira ausente: a tela mostra "Não informado" em vez de um campo em branco. */
function texto(valor: unknown): string | undefined {
  return typeof valor === "string" && valor.trim() !== "" ? valor : undefined;
}

/** Semanas vermelhas em 28 dias a partir das quais o aluno entra em resgate. */
export const LIMIAR_RESGATE_VERMELHOS_28D = 2;

export function mapearFaturamento(api: any): DeclaracaoFaturamento {
  const caminho = texto(api.storageZipPath);
  const nomeArquivo = caminho ? caminho.split("/").pop() ?? caminho : "";
  const status = STATUS_AUDITORIA.includes(api.statusAuditoria) ? api.statusAuditoria : "pendente";

  return {
    id: api.id,
    matriculaId: api.matriculaId,
    alunoId: api.alunoId,
    mesReferencia: api.mesReferencia,
    valorBruto: Number(api.valorBruto) || 0,
    comprovantes: caminho
      ? [{ nome: nomeArquivo, path: caminho, tipo: nomeArquivo.toLowerCase().endsWith(".zip") ? "zip" : "arquivo" }]
      : [],
    statusAuditoria: status,
    parecerAuditoria: texto(api.parecerAuditoria),
    auditadoEm: texto(api.auditadoEm),
    criadoEm: texto(api.criadoEm),
    ...(texto(api.auditadoPor) ? { auditadoPor: api.auditadoPor } : {}),
  };
}

export function mapearEntrega(api: any): EntregaPendente {
  const evidencias: any[] = Array.isArray(api.evidencias) ? api.evidencias : [];
  const titulo = texto(api.moduloTitulo) ?? "";
  return {
    id: api.id,
    alunoNome: api.alunoNome,
    alunoEmail: texto(api.alunoEmail),
    moduloTitulo: api.moduloNumero ? `Módulo ${api.moduloNumero} — ${titulo}` : titulo,
    links: evidencias
      .filter((ev) => ev.tipo === "link" && texto(ev.valor_url))
      .map((ev) => ({ rotulo: ev.rotulo, url: ev.valor_url })),
    arquivos: evidencias
      .filter((ev) => ev.tipo === "arquivo" && texto(ev.storage_path))
      .map((ev) => ({ rotulo: ev.rotulo, path: ev.storage_path, nome: ev.nome_arquivo ?? ev.rotulo })),
    travou: texto(api.travou),
    duvidaCall: texto(api.duvidaCall),
    status: api.status,
    parecerTexto: texto(api.parecerTexto),
    enviadoEm: api.dataEnvio,
    ...(texto(api.avaliadoEm) ? { avaliadoEm: api.avaliadoEm } : {}),
    ...(texto(api.avaliadoPor) ? { avaliadoPor: api.avaliadoPor } : {}),
  };
}

/** Linha crua de /api/checkins (sem ?pendentes): o aluno lendo os próprios check-ins. */
export function mapearCheckinProprio(linha: any, aluno: { nome: string; email?: string }): EntregaPendente {
  return mapearEntrega({
    id: linha.id,
    status: linha.status,
    alunoNome: aluno.nome,
    alunoEmail: aluno.email,
    moduloNumero: linha.modulos?.numero,
    moduloTitulo: linha.modulos?.titulo,
    travou: linha.travou,
    duvidaCall: linha.duvida_call,
    parecerTexto: linha.parecer_texto,
    dataEnvio: linha.enviado_em,
    evidencias: linha.checkin_evidencias,
  });
}

export function mapearSemaforo(api: any): AlunoSemaforoStatus {
  const cor = api.statusSemaforo;
  const vermelhos = Number(api.vermelhos28d) || 0;
  return {
    id: api.id,
    matriculaId: api.matriculaId,
    nome: api.nome,
    whatsapp: api.whatsapp ?? "",
    semaforoAtual: cor,
    // A API não devolve a série semanal; a semana corrente é o único ponto conhecido
    historicoSemaforos: [cor],
    motivoSemaforo: texto(api.motivoSemaforo),
    moduloAtual: api.ultimoModuloConcluido ?? "",
    checkinEntregue: Number(api.diasSemEntrega) <= 7,
    precisaResgate: vermelhos >= LIMIAR_RESGATE_VERMELHOS_28D,
    vermelhos28d: vermelhos,
  };
}

export function mapearTurma(api: any): TurmaCadastro {
  return {
    id: api.id,
    codigo: api.codigo,
    nome: api.nome,
    dataInicio: api.dataInicio,
    dataFim: texto(api.dataFim),
    horarioEncontro: api.horarioEncontro ?? "",
    limiteVagas: Number(api.limiteVagas) || 0,
    totalMatriculados: Number(api.totalAlunos) || 0,
    status: api.status,
  };
}

export function mapearModulo(api: any): ModuloItem {
  return {
    id: api.id,
    numero: api.numero,
    titulo: api.titulo,
    descricao: texto(api.descricao),
    disciplinaRef: texto(api.disciplinaRef),
    ordem: api.ordem,
    status: api.status,
    liberadoPor: texto(api.liberadoPorNome),
    liberadoEm: texto(api.liberadoEm),
    itensRoteiro: Array.isArray(api.itensRoteiro) ? api.itensRoteiro : [],
  };
}

function mapearLinhaBloqueio(linha: any): BloqueioAcesso {
  return {
    id: linha.id,
    alunoId: linha.usuario_id,
    motivo: MOTIVOS_BLOQUEIO.includes(linha.motivo) ? linha.motivo : "outro",
    observacaoInterna: texto(linha.observacoes),
    bloqueadoPor: linha.bloqueado_por,
    bloqueadoEm: linha.bloqueado_em,
    desbloqueadoPor: texto(linha.desbloqueado_por),
    desbloqueadoEm: texto(linha.desbloqueado_em),
    observacaoDesbloqueio: texto(linha.justificativa_desbloqueio),
  };
}

export function mapearBloqueios(api: any): { vigentes: Record<string, BloqueioAcesso>; historico: BloqueioAcesso[] } {
  const vigentes: Record<string, BloqueioAcesso> = {};
  for (const [usuarioId, linha] of Object.entries(api?.bloqueiosVigentes ?? {})) {
    vigentes[usuarioId] = mapearLinhaBloqueio(linha);
  }
  const historico = (Array.isArray(api?.historico) ? api.historico : []).map(mapearLinhaBloqueio);
  return { vigentes, historico };
}

export function mapearCanais(api: any[]): CanalItem[] {
  return (Array.isArray(api) ? api : []).map((c, indice) => ({
    id: c.id,
    nome: c.nome,
    ordem: indice + 1,
    status: c.status === "ativo" ? "ativo" : "nao_iniciado",
    url: texto(c.url),
    atualizadoEm: texto(c.atualizadoEm),
  }));
}
