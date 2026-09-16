"use client";

import { useEffect, useSyncExternalStore } from "react";
import { AlunoCadastro } from "../api/alunos";
import { TurmaCadastro } from "../api/turmas";
import { ModuloItem, MODULOS_PADRAO_AGUIAS_ONE } from "../api/modulos-liberacao";
import {
  DeclaracaoFaturamento,
  FATURAMENTOS_HISTORICO_MOCK,
  META_FATURAMENTO_ANUAL_PADRAO,
  METAS_FATURAMENTO_ALUNOS_MOCK,
  StatusAuditoriaFaturamento,
  filtrarFaturamentosPorAluno,
  obterMetaAnualAluno,
  processarAuditoriaFaturamento,
} from "../api/faturamento";
import { CanalItem, CANAIS_INICIAIS_MOCK } from "../api/canais";
import { EntregaPendente, ENTREGAS_MOCK } from "../api/auditoria";
import { AlunoSemaforoStatus, ALUNOS_SEMAFORO_MOCK } from "../api/turma-semaforo";
import { PapelUsuario } from "../auth/roles";
import {
  BloqueioAcesso,
  DadosNovoBloqueio,
  criarBloqueio,
  encerrarBloqueio,
  obterBloqueioVigente,
} from "../api/bloqueio-acesso";

const STORAGE_KEY = "aguias_one_v2_store";

/** Id do aluno da sessão de demonstração (Dr. Roberto Silva). */
export const ALUNO_ATUAL_ID = "1";

const NOMES_AVALIADORES: Record<PapelUsuario, string> = {
  admin: "Coordenação UniBCAPPA (Admin)",
  concierge: "Flávio Lopes (Concierge)",
  anjo: "Ana Carolina (Anjo)",
  mentor: "Prof. Edilson Aguiais (Mentor)",
  mentorado: "Mentorado",
};

export interface SistemaState {
  papelAtual: PapelUsuario;
  usuarioAtual: {
    nome: string;
    email: string;
    turmaNome: string;
  };
  modulos: ModuloItem[];
  entregas: EntregaPendente[];
  faturamentos: DeclaracaoFaturamento[];
  /** Meta anual de faturamento por aluno (id do aluno → valor em reais). */
  metasFaturamentoAlunos: Record<string, number>;
  /** Bloqueio de acesso vigente (ou último) por aluno. */
  bloqueiosAcesso: Record<string, BloqueioAcesso>;
  /** Trilha completa de bloqueios e desbloqueios, mais recente primeiro. */
  historicoBloqueios: BloqueioAcesso[];
  canais: CanalItem[];
  alunos: AlunoCadastro[];
  turmas: TurmaCadastro[];
  alunosSemaforo: AlunoSemaforoStatus[];
}

const estadoInicial: SistemaState = {
  papelAtual: "mentorado",
  usuarioAtual: {
    nome: "Dr. Roberto Silva",
    email: "roberto.silva@pericia.com.br",
    turmaNome: "Águias ONE — Turma 2026.1",
  },
  modulos: MODULOS_PADRAO_AGUIAS_ONE,
  entregas: ENTREGAS_MOCK,
  faturamentos: FATURAMENTOS_HISTORICO_MOCK,
  metasFaturamentoAlunos: METAS_FATURAMENTO_ALUNOS_MOCK,
  bloqueiosAcesso: {},
  historicoBloqueios: [],
  canais: CANAIS_INICIAIS_MOCK,
  alunos: [
    {
      id: "1",
      nome: "Dr. Roberto Silva",
      email: "roberto.silva@pericia.com.br",
      whatsapp: "(11) 98765-4321",
      cpf: "123.456.789-00",
      areaPericial: "Contábil e Financeira",
      turmaId: "turma-2026.1",
      turmaNome: "Águias ONE — Turma 2026.1",
      status: "ativo",
    },
    {
      id: "2",
      nome: "Dra. Mariana Costa",
      email: "mariana.costa@advpericia.com.br",
      whatsapp: "(21) 99887-7665",
      cpf: "234.567.890-11",
      areaPericial: "Trabalhista",
      turmaId: "turma-2026.1",
      turmaNome: "Águias ONE — Turma 2026.1",
      status: "ativo",
    },
    {
      id: "3",
      nome: "Dr. André Martins",
      email: "andre.martins@pericia.com.br",
      whatsapp: "(31) 97766-5544",
      cpf: "345.678.901-22",
      areaPericial: "Grafotécnica",
      turmaId: "turma-2026.1",
      turmaNome: "Águias ONE — Turma 2026.1",
      status: "ativo",
    },
  ],
  turmas: [
    {
      id: "turma-2026.1",
      codigo: "POS.ONE.2026.1",
      nome: "Águias ONE — Turma 2026.1",
      dataInicio: "2026-03-01",
      horarioEncontro: "Quartas, 18:15 às 19:45",
      limiteVagas: 40,
      totalMatriculados: 38,
      status: "em_andamento",
    },
    {
      id: "turma-2026.2",
      codigo: "POS.ONE.2026.2",
      nome: "Águias ONE — Turma 2026.2",
      dataInicio: "2026-08-01",
      horarioEncontro: "Quartas, 18:15 às 19:45",
      limiteVagas: 40,
      totalMatriculados: 12,
      status: "aberta",
    },
  ],
  alunosSemaforo: ALUNOS_SEMAFORO_MOCK,
};

/**
 * Reconcilia um estado salvo em versões anteriores com o formato atual:
 * campos novos recebem o valor inicial, declarações sem aluno passam a pertencer
 * ao aluno da sessão e a antiga meta única vira a meta desse aluno.
 */
export function migrarEstadoSalvo(salvo: Partial<SistemaState> & { metaFaturamentoAnual?: number }): SistemaState {
  const base: SistemaState = { ...estadoInicial, ...salvo } as SistemaState;
  const versaoAntiga = !salvo.metasFaturamentoAlunos; // salvo antes da auditoria de faturamento existir
  const mockPorId = new Map(estadoInicial.faturamentos.map((f) => [f.id, f]));

  const faturamentos: DeclaracaoFaturamento[] = (salvo.faturamentos ?? estadoInicial.faturamentos).map((f) => {
    const demo = versaoAntiga && f.id ? mockPorId.get(f.id) : undefined;
    return {
      ...f,
      alunoId: f.alunoId ?? demo?.alunoId ?? ALUNO_ATUAL_ID,
      statusAuditoria: f.statusAuditoria ?? demo?.statusAuditoria ?? "pendente",
      parecerAuditoria: f.parecerAuditoria ?? demo?.parecerAuditoria,
      auditadoPor: f.auditadoPor ?? demo?.auditadoPor,
      auditadoEm: f.auditadoEm ?? demo?.auditadoEm,
    };
  });

  // Uma única vez, na migração da versão antiga: completa com as declarações de demonstração ausentes
  if (versaoAntiga) {
    const idsSalvos = new Set(faturamentos.map((f) => f.id));
    for (const demo of estadoInicial.faturamentos) {
      if (!idsSalvos.has(demo.id)) faturamentos.push(demo);
    }
  }

  const metas: Record<string, number> = { ...estadoInicial.metasFaturamentoAlunos, ...(salvo.metasFaturamentoAlunos ?? {}) };
  if (versaoAntiga && Number.isFinite(salvo.metaFaturamentoAnual) && (salvo.metaFaturamentoAnual as number) > 0) {
    metas[ALUNO_ATUAL_ID] = salvo.metaFaturamentoAnual as number;
  }

  return { ...base, faturamentos, metasFaturamentoAlunos: metas };
}

/** Cookie lido pelo middleware para barrar o mentorado bloqueado já no servidor. */
function sincronizarCookieBloqueio(estado: SistemaState) {
  if (typeof document === "undefined") return;
  const bloqueado = estado.papelAtual === "mentorado" && Boolean(obterBloqueioVigente(estado.bloqueiosAcesso ?? {}, ALUNO_ATUAL_ID));
  document.cookie = `acesso-bloqueado=${bloqueado ? "1" : "0"}; path=/; max-age=31536000; SameSite=Lax`;
}

// ---------------------------------------------------------------------------
// Store compartilhado: um único estado em memória, persistido no localStorage,
// ao qual todos os componentes se inscrevem. Uma ação em qualquer componente
// (sidebar, página, modal) é vista imediatamente pelos demais.
// ---------------------------------------------------------------------------
let estadoGlobal: SistemaState = estadoInicial;
let carregadoGlobal = false;
const ouvintes = new Set<() => void>();

function notificar() {
  ouvintes.forEach((ouvinte) => ouvinte());
}

function inscrever(ouvinte: () => void) {
  ouvintes.add(ouvinte);
  return () => {
    ouvintes.delete(ouvinte);
  };
}

const lerEstado = () => estadoGlobal;
const lerCarregado = () => carregadoGlobal;
const lerEstadoNoServidor = () => estadoInicial;
const lerCarregadoNoServidor = () => false;

function carregarDoArmazenamento() {
  if (carregadoGlobal || typeof window === "undefined") return;
  try {
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) {
      const dados = migrarEstadoSalvo(JSON.parse(salvo));
      estadoGlobal = dados;
      if (typeof document !== "undefined" && dados.papelAtual) {
        document.cookie = `user-role=${dados.papelAtual}; path=/; max-age=31536000; SameSite=Lax`;
      }
      sincronizarCookieBloqueio(dados);
    } else if (typeof document !== "undefined") {
      document.cookie = `user-role=mentorado; path=/; max-age=31536000; SameSite=Lax`;
    }
  } catch {
    // fallback para estado inicial
  }
  carregadoGlobal = true;
  notificar();
}

function salvarEstado(novo: SistemaState) {
  estadoGlobal = novo;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(novo));
    if (typeof document !== "undefined" && novo.papelAtual) {
      document.cookie = `user-role=${novo.papelAtual}; path=/; max-age=31536000; SameSite=Lax`;
    }
    sincronizarCookieBloqueio(novo);
  } catch {
    // ignore
  }
  notificar();
}

/** Somente para testes: volta o estado em memória ao inicial. */
export function resetarStoreParaTestes() {
  estadoGlobal = estadoInicial;
  carregadoGlobal = false;
}

export function useSistemaStore() {
  const estado = useSyncExternalStore(inscrever, lerEstado, lerEstadoNoServidor);
  const carregado = useSyncExternalStore(inscrever, lerCarregado, lerCarregadoNoServidor);

  useEffect(() => {
    carregarDoArmazenamento();
  }, []);

  const mudarPapel = (novoPapel: PapelUsuario) => {
    salvarEstado({ ...estadoGlobal, papelAtual: novoPapel });
  };

  const alternarModulo = (moduloId: string, novoStatus: "liberado" | "bloqueado") => {
    const modulosAtualizados = estadoGlobal.modulos.map((m) =>
      m.id === moduloId ? { ...m, status: novoStatus, liberadoEm: novoStatus === "liberado" ? new Date().toISOString() : undefined } : m
    );
    salvarEstado({ ...estadoGlobal, modulos: modulosAtualizados });
  };

  const submeterCheckin = (entrega: EntregaPendente) => {
    salvarEstado({
      ...estadoGlobal,
      entregas: [entrega, ...estadoGlobal.entregas.filter((e) => e.id !== entrega.id)],
    });
  };

  const auditarEntrega = (id: string, decisao: "aprovado" | "ajuste_solicitado", parecer?: string) => {
    const entregasAtualizadas = estadoGlobal.entregas.map((e) =>
      e.id === id
        ? {
            ...e,
            status: decisao,
            parecerTexto: parecer,
            avaliadoEm: new Date().toISOString(),
            avaliadoPor: estadoGlobal.papelAtual === "anjo" ? "Ana Carolina (Anjo)" : "Flávio Lopes (Concierge)",
          }
        : e
    );
    salvarEstado({ ...estadoGlobal, entregas: entregasAtualizadas });
  };

  const adicionarFaturamento = (faturamento: DeclaracaoFaturamento) => {
    const nova: DeclaracaoFaturamento = {
      ...faturamento,
      id: faturamento.id || `fat-${Date.now()}`,
      alunoId: faturamento.alunoId ?? ALUNO_ATUAL_ID,
      statusAuditoria: faturamento.statusAuditoria ?? "pendente",
      criadoEm: faturamento.criadoEm ?? new Date().toISOString(),
    };
    salvarEstado({
      ...estadoGlobal,
      faturamentos: [nova, ...estadoGlobal.faturamentos],
    });
  };

  /** Equipe: cria ou atualiza uma declaração em nome do aluno (upsert por id). */
  const salvarFaturamento = (faturamento: DeclaracaoFaturamento) => {
    const editor = NOMES_AVALIADORES[estadoGlobal.papelAtual];
    const existe = faturamento.id && estadoGlobal.faturamentos.some((f) => f.id === faturamento.id);
    if (existe) {
      salvarEstado({
        ...estadoGlobal,
        faturamentos: estadoGlobal.faturamentos.map((f) => (f.id === faturamento.id ? { ...f, ...faturamento, editadoPor: editor } : f)),
      });
      return;
    }
    const nova: DeclaracaoFaturamento = {
      ...faturamento,
      id: faturamento.id || `fat-${Date.now()}`,
      alunoId: faturamento.alunoId ?? ALUNO_ATUAL_ID,
      statusAuditoria: faturamento.statusAuditoria ?? "pendente",
      criadoEm: faturamento.criadoEm ?? new Date().toISOString(),
      editadoPor: editor,
    };
    salvarEstado({ ...estadoGlobal, faturamentos: [nova, ...estadoGlobal.faturamentos] });
  };

  const excluirFaturamento = (id: string) => {
    salvarEstado({ ...estadoGlobal, faturamentos: estadoGlobal.faturamentos.filter((f) => f.id !== id) });
  };

  const auditarFaturamento = (id: string, decisao: "aprovado" | "ajuste_solicitado", parecer?: string) => {
    const avaliador = NOMES_AVALIADORES[estadoGlobal.papelAtual];
    salvarEstado({
      ...estadoGlobal,
      faturamentos: estadoGlobal.faturamentos.map((f) => (f.id === id ? processarAuditoriaFaturamento(f, decisao, parecer, avaliador) : f)),
    });
  };

  const definirMetaFaturamentoAnual = (valor: number, alunoId: string = ALUNO_ATUAL_ID) => {
    const metaValida = Number.isFinite(valor) && valor > 0 ? valor : META_FATURAMENTO_ANUAL_PADRAO;
    salvarEstado({
      ...estadoGlobal,
      metasFaturamentoAlunos: { ...estadoGlobal.metasFaturamentoAlunos, [alunoId]: metaValida },
    });
  };

  /** Equipe: bloqueia o acesso de um aluno ao sistema. Substitui um bloqueio vigente, se houver. */
  const bloquearAcesso = (dados: DadosNovoBloqueio) => {
    const autor = NOMES_AVALIADORES[estadoGlobal.papelAtual];
    const novo = criarBloqueio(dados, autor);
    salvarEstado({
      ...estadoGlobal,
      bloqueiosAcesso: { ...estadoGlobal.bloqueiosAcesso, [dados.alunoId]: novo },
      historicoBloqueios: [novo, ...estadoGlobal.historicoBloqueios],
    });
  };

  /** Equipe: encerra o bloqueio vigente do aluno, registrando quem liberou e por quê. */
  const desbloquearAcesso = (alunoId: string, observacao?: string) => {
    const vigente = estadoGlobal.bloqueiosAcesso[alunoId];
    if (!vigente || vigente.desbloqueadoEm) return;
    const encerrado = encerrarBloqueio(vigente, NOMES_AVALIADORES[estadoGlobal.papelAtual], observacao);
    salvarEstado({
      ...estadoGlobal,
      bloqueiosAcesso: { ...estadoGlobal.bloqueiosAcesso, [alunoId]: encerrado },
      historicoBloqueios: estadoGlobal.historicoBloqueios.map((b) => (b.id === encerrado.id ? encerrado : b)),
    });
  };

  // Seletores do aluno da sessão
  const bloqueioAlunoAtual = obterBloqueioVigente(estadoGlobal.bloqueiosAcesso ?? {}, ALUNO_ATUAL_ID);
  const faturamentosAlunoAtual = filtrarFaturamentosPorAluno(estadoGlobal.faturamentos, ALUNO_ATUAL_ID);
  const metaAnualAlunoAtual = obterMetaAnualAluno(estadoGlobal.metasFaturamentoAlunos, ALUNO_ATUAL_ID);
  const faturamentosPendentesAuditoria = estadoGlobal.faturamentos.filter(
    (f) => ((f.statusAuditoria ?? "pendente") as StatusAuditoriaFaturamento) === "pendente"
  ).length;

  const atualizarCanal = (nomeCanal: string, status: "ativo" | "nao_iniciado", url?: string) => {
    const canaisAtualizados = estadoGlobal.canais.map((c) =>
      c.nome === nomeCanal ? { ...c, status, url: url ?? c.url, atualizadoEm: new Date().toISOString() } : c
    );
    salvarEstado({ ...estadoGlobal, canais: canaisAtualizados });
  };

  const salvarAluno = (aluno: AlunoCadastro) => {
    const existe = estadoGlobal.alunos.some((a) => a.id === aluno.id);
    let novosAlunos: AlunoCadastro[];
    if (existe) {
      novosAlunos = estadoGlobal.alunos.map((a) => (a.id === aluno.id ? aluno : a));
    } else {
      novosAlunos = [{ ...aluno, id: aluno.id || String(Date.now()) }, ...estadoGlobal.alunos];
    }
    salvarEstado({ ...estadoGlobal, alunos: novosAlunos });
  };

  const excluirAluno = (id: string) => {
    salvarEstado({ ...estadoGlobal, alunos: estadoGlobal.alunos.filter((a) => a.id !== id) });
  };

  const salvarTurma = (turma: TurmaCadastro) => {
    salvarEstado({ ...estadoGlobal, turmas: [turma, ...estadoGlobal.turmas] });
  };

  return {
    estado,
    carregado,
    mudarPapel,
    alternarModulo,
    submeterCheckin,
    auditarEntrega,
    adicionarFaturamento,
    salvarFaturamento,
    excluirFaturamento,
    auditarFaturamento,
    definirMetaFaturamentoAnual,
    bloquearAcesso,
    desbloquearAcesso,
    bloqueioAlunoAtual,
    faturamentosAlunoAtual,
    metaAnualAlunoAtual,
    faturamentosPendentesAuditoria,
    atualizarCanal,
    salvarAluno,
    excluirAluno,
    salvarTurma,
  };
}
