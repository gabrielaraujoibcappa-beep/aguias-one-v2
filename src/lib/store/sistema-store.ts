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
import { AlvoReversao, reverterRegistro, reverterValorPorChave } from "../api/desfazer";

/** Opções de ações que podem ser desfeitas logo após a execução. */
export interface OpcoesAcaoReversivel {
  /**
   * Não envia ao backend agora. A ação devolve a função que efetiva o envio,
   * a ser chamada quando a janela de "Desfazer" terminar sem reversão.
   */
  adiarPersistencia?: boolean;
}

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

/** Leitura síncrona do estado atual, fora do ciclo de renderização (ex.: logo após uma ação). */
export function lerEstadoSistema(): SistemaState {
  return estadoGlobal;
}

/** Executa agora ou devolve para depois, conforme a ação seja adiável. */
function agendarPersistencia(enviar: () => void, opcoes?: OpcoesAcaoReversivel): () => void {
  if (typeof window === "undefined") return () => {};
  let enviado = false;
  const efetivar = () => {
    if (enviado) return;
    enviado = true;
    enviar();
  };
  if (!opcoes?.adiarPersistencia) efetivar();
  return efetivar;
}

/** Somente para testes: volta o estado em memória ao inicial. */
export function resetarStoreParaTestes() {
  estadoGlobal = estadoInicial;
  carregadoGlobal = false;
}

async function sincronizarComBackend() {
  if (typeof window === "undefined") return;
  try {
    const [resTurmas, resAlunos, resModulos, resSemaforo, resFat, resBloqueios, resEntregas] = await Promise.allSettled([
      fetch("/api/turmas").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/alunos").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/modulos").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/semaforo").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/faturamentos").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/bloqueios").then((r) => (r.ok ? r.json() : null)),
      fetch("/api/checkins?pendentes=true").then((r) => (r.ok ? r.json() : null)),
    ]);

    const novoEstado = { ...estadoGlobal };
    let mudou = false;

    if (resTurmas.status === "fulfilled" && resTurmas.value?.turmas?.length) {
      novoEstado.turmas = resTurmas.value.turmas;
      mudou = true;
    }
    if (resAlunos.status === "fulfilled" && resAlunos.value?.alunos?.length) {
      novoEstado.alunos = resAlunos.value.alunos;
      mudou = true;
    }
    if (resModulos.status === "fulfilled" && resModulos.value?.modulos?.length) {
      novoEstado.modulos = resModulos.value.modulos;
      mudou = true;
    }
    if (resSemaforo.status === "fulfilled" && resSemaforo.value?.alunos?.length) {
      novoEstado.alunosSemaforo = resSemaforo.value.alunos;
      mudou = true;
    }
    if (resFat.status === "fulfilled" && resFat.value?.faturamentos?.length) {
      novoEstado.faturamentos = resFat.value.faturamentos;
      mudou = true;
    }
    if (resBloqueios.status === "fulfilled" && resBloqueios.value?.sucesso) {
      novoEstado.bloqueiosAcesso = resBloqueios.value.bloqueiosVigentes || {};
      novoEstado.historicoBloqueios = resBloqueios.value.historico || [];
      mudou = true;
    }
    if (resEntregas.status === "fulfilled" && resEntregas.value?.entregas?.length) {
      novoEstado.entregas = resEntregas.value.entregas;
      mudou = true;
    }

    if (mudou) {
      salvarEstado(novoEstado);
    }
  } catch {
    // Offline / fallback para localStorage
  }
}

export function useSistemaStore() {
  const estado = useSyncExternalStore(inscrever, lerEstado, lerEstadoNoServidor);
  const carregado = useSyncExternalStore(inscrever, lerCarregado, lerCarregadoNoServidor);

  useEffect(() => {
    carregarDoArmazenamento();
    sincronizarComBackend();
  }, []);

  const mudarPapel = (novoPapel: PapelUsuario) => {
    salvarEstado({ ...estadoGlobal, papelAtual: novoPapel });
  };

  /** Alinha papel e identidade da interface com a sessão validada no servidor. */
  const definirUsuarioLogado = (usuario: { nome: string; email: string; papel: PapelUsuario; turmaNome?: string }) => {
    const atual = estadoGlobal.usuarioAtual;
    if (
      estadoGlobal.papelAtual === usuario.papel &&
      atual?.email === usuario.email &&
      atual?.nome === usuario.nome &&
      (usuario.turmaNome === undefined || atual?.turmaNome === usuario.turmaNome)
    ) {
      return;
    }
    salvarEstado({
      ...estadoGlobal,
      papelAtual: usuario.papel,
      usuarioAtual: {
        nome: usuario.nome,
        email: usuario.email,
        turmaNome: usuario.turmaNome ?? atual?.turmaNome ?? "",
      },
    });
  };

  const alternarModulo = (moduloId: string, novoStatus: "liberado" | "bloqueado") => {
    const modulosAtualizados = estadoGlobal.modulos.map((m) =>
      m.id === moduloId ? { ...m, status: novoStatus, liberadoEm: novoStatus === "liberado" ? new Date().toISOString() : undefined } : m
    );
    salvarEstado({ ...estadoGlobal, modulos: modulosAtualizados });

    // Persistência no backend Supabase
    if (typeof window !== "undefined") {
      const turma = estadoGlobal.turmas[0];
      if (turma?.id) {
        fetch("/api/modulos/liberar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            turmaId: turma.id,
            moduloId,
            status: novoStatus,
            liberadoPorEmail: estadoGlobal.usuarioAtual?.email,
          }),
        }).catch(() => {});
      }
    }
  };

  const submeterCheckin = (entrega: EntregaPendente) => {
    salvarEstado({
      ...estadoGlobal,
      entregas: [entrega, ...estadoGlobal.entregas.filter((e) => e.id !== entrega.id)],
    });

    // Persistência no backend Supabase
    if (typeof window !== "undefined") {
      const aluno = estadoGlobal.alunos.find((a) => a.id === ALUNO_ATUAL_ID || a.email === estadoGlobal.usuarioAtual?.email);
      const matriculaId = (aluno as any)?.matriculaId || aluno?.id;
      if (matriculaId) {
        const matchNumero = (entrega.moduloTitulo || "").match(/(\d+)/);
        const moduloNumero = matchNumero ? Number(matchNumero[1]) : 1;
        const evidencias = [
          ...(entrega.links || []).map((l) => ({ tipo: "link", rotulo: l.rotulo || "Evidência", valorUrl: l.url })),
          ...(entrega.arquivos || []).map((a) => ({ tipo: "arquivo", rotulo: a.nome, storagePath: a.path, nomeArquivo: a.nome })),
        ];

        fetch("/api/checkins", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matriculaId,
            moduloNumero,
            travou: entrega.travou,
            duvidaCall: entrega.duvidaCall,
            evidencias,
          }),
        }).catch(() => {});
      }
    }
  };

  const auditarEntrega = (
    id: string,
    decisao: "aprovado" | "ajuste_solicitado",
    parecer?: string,
    opcoes?: OpcoesAcaoReversivel
  ): (() => void) => {
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
    const avaliadorEmail = estadoGlobal.usuarioAtual?.email;
    salvarEstado({ ...estadoGlobal, entregas: entregasAtualizadas });

    // Persistência no backend Supabase (a API não aceita voltar para "aguardando", por isso o envio é adiável)
    return agendarPersistencia(() => {
      fetch(`/api/checkins/${id}/auditar`, {
        method: "PATCH",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: decisao, parecerTexto: parecer, avaliadorEmail }),
      }).catch(() => {});
    }, opcoes);
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

    // Persistência no backend Supabase
    if (typeof window !== "undefined") {
      const aluno = estadoGlobal.alunos.find((a) => a.id === nova.alunoId);
      const matriculaId = (aluno as any)?.matriculaId || aluno?.id;
      if (matriculaId) {
        fetch("/api/faturamentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matriculaId,
            mesReferencia: nova.mesReferencia,
            valorBruto: nova.valorBruto,
            storageZipPath: nova.comprovantes?.[0]?.path || null,
          }),
        }).catch(() => {});
      }
    }
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

  const auditarFaturamento = (
    id: string,
    decisao: "aprovado" | "ajuste_solicitado",
    parecer?: string,
    opcoes?: OpcoesAcaoReversivel
  ): (() => void) => {
    const avaliador = NOMES_AVALIADORES[estadoGlobal.papelAtual];
    const auditadoPorEmail = estadoGlobal.usuarioAtual?.email;
    salvarEstado({
      ...estadoGlobal,
      faturamentos: estadoGlobal.faturamentos.map((f) => (f.id === id ? processarAuditoriaFaturamento(f, decisao, parecer, avaliador) : f)),
    });

    // Persistência no backend Supabase
    return agendarPersistencia(() => {
      fetch(`/api/faturamentos/${id}/auditar`, {
        method: "PATCH",
        keepalive: true,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statusAuditoria: decisao, parecerAuditoria: parecer, auditadoPorEmail }),
      }).catch(() => {});
    }, opcoes);
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

    // Persistência no backend Supabase
    if (typeof window !== "undefined") {
      fetch("/api/bloqueios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "bloquear",
          usuarioId: dados.alunoId,
          motivo: dados.motivo,
          observacoes: dados.observacaoInterna || dados.mensagemAoAluno || null,
          responsavelNome: autor,
        }),
      }).catch(() => {});
    }
  };

  /** Equipe: encerra o bloqueio vigente do aluno, registrando quem liberou e por quê. */
  const desbloquearAcesso = (alunoId: string, observacao?: string) => {
    const vigente = estadoGlobal.bloqueiosAcesso[alunoId];
    if (!vigente || vigente.desbloqueadoEm) return;
    const autor = NOMES_AVALIADORES[estadoGlobal.papelAtual];
    const encerrado = encerrarBloqueio(vigente, autor, observacao);
    salvarEstado({
      ...estadoGlobal,
      bloqueiosAcesso: { ...estadoGlobal.bloqueiosAcesso, [alunoId]: encerrado },
      historicoBloqueios: estadoGlobal.historicoBloqueios.map((b) => (b.id === encerrado.id ? encerrado : b)),
    });

    // Persistência no backend Supabase
    if (typeof window !== "undefined") {
      fetch("/api/bloqueios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          acao: "desbloquear",
          usuarioId: alunoId,
          responsavelNome: autor,
          justificativaDesbloqueio: observacao,
        }),
      }).catch(() => {});
    }
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

    // Persistência no backend Supabase
    if (typeof window !== "undefined") {
      const aluno = estadoGlobal.alunos.find((a) => a.id === ALUNO_ATUAL_ID);
      const matriculaId = (aluno as any)?.matriculaId || aluno?.id;
      if (matriculaId) {
        fetch("/api/canais", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            matriculaId,
            canalNome: nomeCanal,
            status,
            urlCanal: url,
          }),
        }).catch(() => {});
      }
    }
  };

  const salvarAluno = (aluno: AlunoCadastro) => {
    const existe = estadoGlobal.alunos.some((a) => a.id === aluno.id);
    let novosAlunos: AlunoCadastro[];
    if (existe) {
      novosAlunos = estadoGlobal.alunos.map((a) => (a.id === aluno.id ? aluno : a));
      // Se tiver id existente, atualiza no backend
      if (aluno.id && typeof window !== "undefined") {
        fetch(`/api/alunos/${aluno.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(aluno),
        }).catch(() => {});
      }
    } else {
      novosAlunos = [{ ...aluno, id: aluno.id || String(Date.now()) }, ...estadoGlobal.alunos];
    }
    salvarEstado({ ...estadoGlobal, alunos: novosAlunos });
  };

  const excluirAluno = (id: string, opcoes?: OpcoesAcaoReversivel): (() => void) => {
    salvarEstado({ ...estadoGlobal, alunos: estadoGlobal.alunos.filter((a) => a.id !== id) });
    // Exclui no backend (apaga usuário e acesso de forma definitiva, por isso o envio é adiável)
    return agendarPersistencia(() => {
      if (!id) return;
      fetch(`/api/alunos/${id}`, { method: "DELETE", keepalive: true }).catch(() => {});
    }, opcoes);
  };

  // -------------------------------------------------------------------------
  // Reversões locais usadas pelo "Desfazer". Só revertem se o registro ainda
  // estiver exatamente como a ação o deixou; caso contrário retornam false.
  // -------------------------------------------------------------------------
  const reverterFaturamento = (alvo: AlvoReversao<DeclaracaoFaturamento>): boolean => {
    const { lista, ok } = reverterRegistro(estadoGlobal.faturamentos, alvo);
    if (ok) salvarEstado({ ...estadoGlobal, faturamentos: lista });
    return ok;
  };

  const reverterEntrega = (alvo: AlvoReversao<EntregaPendente>): boolean => {
    const { lista, ok } = reverterRegistro(estadoGlobal.entregas, alvo);
    if (ok) salvarEstado({ ...estadoGlobal, entregas: lista });
    return ok;
  };

  const reverterAluno = (alvo: AlvoReversao<AlunoCadastro>): boolean => {
    const { lista, ok } = reverterRegistro(estadoGlobal.alunos, alvo);
    if (ok) salvarEstado({ ...estadoGlobal, alunos: lista });
    return ok;
  };

  const reverterMetaFaturamento = (alunoId: string, anterior: number | undefined, posterior: number): boolean => {
    const { mapa, ok } = reverterValorPorChave(estadoGlobal.metasFaturamentoAlunos, alunoId, anterior, posterior);
    if (ok) salvarEstado({ ...estadoGlobal, metasFaturamentoAlunos: mapa });
    return ok;
  };

  const salvarTurma = (turma: TurmaCadastro) => {
    salvarEstado({ ...estadoGlobal, turmas: [turma, ...estadoGlobal.turmas] });
    if (typeof window !== "undefined") {
      fetch("/api/turmas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(turma),
      }).catch(() => {});
    }
  };

  return {
    estado,
    carregado,
    mudarPapel,
    definirUsuarioLogado,
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
    reverterFaturamento,
    reverterEntrega,
    reverterAluno,
    reverterMetaFaturamento,
  };
}

