"use client";

import { useEffect, useSyncExternalStore } from "react";
import { AlunoCadastro } from "../api/alunos";
import { TurmaCadastro } from "../api/turmas";
import { ModuloItem } from "../api/modulos-liberacao";
import {
  DeclaracaoFaturamento,
  META_FATURAMENTO_ANUAL_PADRAO,
  StatusAuditoriaFaturamento,
  filtrarFaturamentosPorAluno,
  obterMetaAnualAluno,
  processarAuditoriaFaturamento,
} from "../api/faturamento";
import { CanalItem } from "../api/canais";
import { EntregaPendente } from "../api/auditoria";
import { AlunoSemaforoStatus } from "../api/turma-semaforo";
import { PapelUsuario, ROTULOS_PAPEL, apenasMentorados } from "../auth/roles";
import {
  BloqueioAcesso,
  DadosNovoBloqueio,
  criarBloqueio,
  encerrarBloqueio,
  obterBloqueioVigente,
} from "../api/bloqueio-acesso";
import { AlvoReversao, reverterRegistro, reverterValorPorChave } from "../api/desfazer";
import { notificar as avisarUsuario } from "../notificacoes";
import {
  mapearBloqueios,
  mapearCanais,
  mapearCheckinProprio,
  mapearEntrega,
  mapearFaturamento,
  mapearModulo,
  mapearSemaforo,
  mapearTurma,
} from "../api/adaptadores";

/** Opções de ações que podem ser desfeitas logo após a execução. */
export interface OpcoesAcaoReversivel {
  /**
   * Não envia ao backend agora. A ação devolve a função que efetiva o envio,
   * a ser chamada quando a janela de "Desfazer" terminar sem reversão.
   */
  adiarPersistencia?: boolean;
}

/**
 * Só preferências de interface ficam no navegador. Dados do servidor são sempre
 * buscados de novo: guardá-los aqui mantinha registros apagados e dados de demonstração.
 */
const STORAGE_KEY = "aguias_one_v2_ui";
/** Chave antiga que guardava o estado inteiro (com dados de demonstração). */
const STORAGE_KEY_LEGADA = "aguias_one_v2_store";

export interface SessaoAtual {
  /** id em public.usuarios do usuário logado */
  usuarioId: string | null;
  /** matrícula ativa do mentorado logado (equipe não tem) */
  matriculaId: string | null;
}

export interface SistemaState {
  papelAtual: PapelUsuario;
  usuarioAtual: {
    nome: string;
    email: string;
    turmaNome: string;
  };
  sessao: SessaoAtual;
  modulos: ModuloItem[];
  entregas: EntregaPendente[];
  faturamentos: DeclaracaoFaturamento[];
  /** Meta anual de faturamento por aluno (id do usuário → valor em reais). */
  metasFaturamentoAlunos: Record<string, number>;
  /** Bloqueio de acesso vigente por aluno. */
  bloqueiosAcesso: Record<string, BloqueioAcesso>;
  /** Trilha completa de bloqueios e desbloqueios, mais recente primeiro. */
  historicoBloqueios: BloqueioAcesso[];
  canais: CanalItem[];
  alunos: AlunoCadastro[];
  turmas: TurmaCadastro[];
  alunosSemaforo: AlunoSemaforoStatus[];
  /** Última sincronização com o servidor falhou: a tela mostra dados possivelmente defasados. */
  sincronizacaoFalhou: boolean;
}

/** Estado vazio: nada é exibido até o servidor responder. */
const estadoInicial: SistemaState = {
  papelAtual: "mentorado",
  usuarioAtual: { nome: "", email: "", turmaNome: "" },
  sessao: { usuarioId: null, matriculaId: null },
  modulos: [],
  entregas: [],
  faturamentos: [],
  metasFaturamentoAlunos: {},
  bloqueiosAcesso: {},
  historicoBloqueios: [],
  canais: [],
  alunos: [],
  turmas: [],
  alunosSemaforo: [],
  sincronizacaoFalhou: false,
};

/**
 * Lê o que estava salvo no navegador e aproveita só a identidade exibida
 * (papel e nome), para a barra lateral não piscar antes da sessão ser validada.
 * Qualquer coleção salva em versões anteriores é descartada.
 */
export function migrarEstadoSalvo(salvo: any): SistemaState {
  const papel = typeof salvo?.papelAtual === "string" && salvo.papelAtual in ROTULOS_PAPEL ? (salvo.papelAtual as PapelUsuario) : estadoInicial.papelAtual;
  const usuario = salvo?.usuarioAtual ?? {};
  return {
    ...estadoInicial,
    papelAtual: papel,
    usuarioAtual: {
      nome: typeof usuario.nome === "string" ? usuario.nome : "",
      email: typeof usuario.email === "string" ? usuario.email : "",
      turmaNome: typeof usuario.turmaNome === "string" ? usuario.turmaNome : "",
    },
  };
}

// ---------------------------------------------------------------------------
// Store compartilhado: um único estado em memória ao qual todos os componentes
// se inscrevem. Uma ação em qualquer componente é vista imediatamente pelos demais.
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
    localStorage.removeItem(STORAGE_KEY_LEGADA);
    const salvo = localStorage.getItem(STORAGE_KEY);
    if (salvo) estadoGlobal = migrarEstadoSalvo(JSON.parse(salvo));
  } catch {
    // armazenamento indisponível: segue com o estado vazio
  }
  carregadoGlobal = true;
  notificar();
}

function salvarEstado(novo: SistemaState) {
  estadoGlobal = novo;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ papelAtual: novo.papelAtual, usuarioAtual: novo.usuarioAtual }));
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

/** Envia ao backend e, ao terminar (com sucesso ou não), busca de novo o estado real. */
function enviarEDepoisSincronizar(url: string, init: RequestInit) {
  fetch(url, { keepalive: true, ...init, headers: { "Content-Type": "application/json", ...(init.headers ?? {}) } })
    .catch(() => {})
    .finally(() => sincronizarAgora());
}

export interface ResultadoEnvio {
  sucesso: boolean;
  erro?: string;
}

/** Como enviarEDepoisSincronizar, mas devolve se o servidor aceitou (para a tela mostrar o erro). */
async function enviarComResultado(url: string, init: RequestInit): Promise<ResultadoEnvio> {
  try {
    const res = await fetch(url, { ...init, headers: { "Content-Type": "application/json", ...(init.headers ?? {}) } });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || json.sucesso === false) {
      return { sucesso: false, erro: typeof json.erro === "string" ? json.erro : "O servidor recusou o envio." };
    }
    return { sucesso: true };
  } catch {
    return { sucesso: false, erro: "Sem conexão com o servidor. Tente novamente." };
  } finally {
    sincronizarAgora();
  }
}

/** Somente para testes: volta o estado em memória ao inicial. */
export function resetarStoreParaTestes() {
  estadoGlobal = estadoInicial;
  carregadoGlobal = false;
}

// Vários componentes usam o store ao mesmo tempo: uma única sincronização por vez,
// repetida no máximo a cada INTERVALO_SYNC_MS após sucesso.
const INTERVALO_SYNC_MS = 10_000;
const ROTAS_SEM_SYNC = ["/", "/login", "/acesso-bloqueado"];
let syncEmAndamento: Promise<void> | null = null;
let ultimaSyncOk = 0;

function sincronizarComBackend(): Promise<void> {
  if (typeof window === "undefined") return Promise.resolve();
  if (ROTAS_SEM_SYNC.includes(window.location.pathname)) return Promise.resolve();
  if (syncEmAndamento) return syncEmAndamento;
  if (Date.now() - ultimaSyncOk < INTERVALO_SYNC_MS) return Promise.resolve();

  syncEmAndamento = executarSincronizacao().finally(() => {
    syncEmAndamento = null;
  });
  return syncEmAndamento;
}

/** Ignora o intervalo mínimo: usado logo depois de gravar algo no servidor. */
function sincronizarAgora(): Promise<void> {
  ultimaSyncOk = 0;
  return syncEmAndamento ? syncEmAndamento.then(() => sincronizarComBackend()) : sincronizarComBackend();
}

/** Resposta utilizável: requisição concluída e sem `sucesso: false`. */
function ok(resultado: PromiseSettledResult<any>): any | null {
  if (resultado.status !== "fulfilled" || !resultado.value) return null;
  return resultado.value.sucesso === false ? null : resultado.value;
}

async function executarSincronizacao() {
  try {
    // Sem sessão válida não há o que buscar (evita rajadas de 401)
    const resMe = await fetch("/api/auth/me", { cache: "no-store" });
    const me = resMe.ok ? await resMe.json() : null;
    if (!me?.autenticado || !me.usuario) return;

    const usuario = me.usuario;
    const equipe = usuario.papel !== "mentorado";
    const matriculaId: string | null = usuario.matriculaId ?? null;

    const buscar = (url: string, condicao = true) =>
      condicao ? fetch(url, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)) : Promise.resolve(null);

    const [turmas, alunos, modulos, semaforo, faturamentos, bloqueios, entregas, canais] = await Promise.allSettled([
      buscar("/api/turmas"),
      buscar("/api/alunos", equipe),
      buscar("/api/modulos"),
      buscar("/api/semaforo", equipe),
      buscar("/api/faturamentos"),
      buscar("/api/bloqueios"),
      buscar(equipe ? "/api/checkins?todas=true" : "/api/checkins", equipe || !!matriculaId),
      buscar(`/api/canais?matriculaId=${encodeURIComponent(matriculaId ?? "")}`, !equipe && !!matriculaId),
    ]);
    ultimaSyncOk = Date.now();

    // Sempre substitui pelo que o servidor devolveu, inclusive listas vazias
    const novo: SistemaState = {
      ...estadoGlobal,
      papelAtual: usuario.papel,
      usuarioAtual: { nome: usuario.nome ?? "", email: usuario.email ?? "", turmaNome: usuario.turma?.nome ?? "" },
      sessao: { usuarioId: usuario.id ?? null, matriculaId },
    };

    const rTurmas = ok(turmas);
    if (rTurmas) novo.turmas = (rTurmas.turmas ?? []).map(mapearTurma);

    const rModulos = ok(modulos);
    if (rModulos) novo.modulos = (rModulos.modulos ?? []).map(mapearModulo);

    const rFat = ok(faturamentos);
    if (rFat) novo.faturamentos = (rFat.faturamentos ?? []).map(mapearFaturamento);

    const rBloqueios = ok(bloqueios);
    if (rBloqueios) {
      const { vigentes, historico } = mapearBloqueios(rBloqueios);
      novo.bloqueiosAcesso = vigentes;
      novo.historicoBloqueios = historico;
    }

    if (equipe) {
      const rAlunos = ok(alunos);
      if (rAlunos) {
        novo.alunos = rAlunos.alunos ?? [];
        novo.metasFaturamentoAlunos = Object.fromEntries(
          novo.alunos.filter((a: any) => a.id && a.metaFaturamentoAnual).map((a: any) => [a.id, Number(a.metaFaturamentoAnual)])
        );
      }
      const rSemaforo = ok(semaforo);
      if (rSemaforo) novo.alunosSemaforo = (rSemaforo.alunos ?? []).map(mapearSemaforo);
      const rEntregas = ok(entregas);
      if (rEntregas) novo.entregas = (rEntregas.entregas ?? []).map(mapearEntrega);
      novo.canais = [];
    } else {
      novo.alunos = [];
      novo.alunosSemaforo = [];
      novo.metasFaturamentoAlunos = usuario.id && usuario.metaFaturamentoAnual ? { [usuario.id]: Number(usuario.metaFaturamentoAnual) } : {};
      const rEntregas = ok(entregas);
      novo.entregas = rEntregas ? (rEntregas.checkins ?? []).map((c: any) => mapearCheckinProprio(c, usuario)) : [];
      const rCanais = ok(canais);
      novo.canais = rCanais ? mapearCanais(rCanais.canais ?? []) : [];
    }

    novo.sincronizacaoFalhou = false;
    salvarEstado(novo);
  } catch {
    // Offline ou servidor fora: mantém o que está na tela e avisa que pode estar defasado
    salvarEstado({ ...estadoGlobal, sincronizacaoFalhou: true });
  }
}

/** Nome de quem executa a ação, para registros exibidos antes do servidor responder. */
function nomeResponsavel(): string {
  const { usuarioAtual, papelAtual } = estadoGlobal;
  return usuarioAtual.nome ? `${usuarioAtual.nome} (${ROTULOS_PAPEL[papelAtual]})` : ROTULOS_PAPEL[papelAtual];
}

/** Matrícula de um aluno: a do próprio mentorado logado ou a do cadastro carregado pela equipe. */
function matriculaDoAluno(alunoId: string | undefined): string | null {
  if (!alunoId) return null;
  if (alunoId === estadoGlobal.sessao.usuarioId) return estadoGlobal.sessao.matriculaId;
  return (estadoGlobal.alunos.find((a) => a.id === alunoId) as any)?.matriculaId ?? null;
}

export function useSistemaStore() {
  const estado = useSyncExternalStore(inscrever, lerEstado, lerEstadoNoServidor);
  const carregado = useSyncExternalStore(inscrever, lerCarregado, lerCarregadoNoServidor);
  /** Nova tentativa manual após falha de rede ou de servidor. */
  const tentarSincronizarNovamente = () => sincronizarAgora();

  useEffect(() => {
    carregarDoArmazenamento();
    sincronizarComBackend();
  }, []);

  const mudarPapel = (novoPapel: PapelUsuario) => {
    salvarEstado({ ...estadoGlobal, papelAtual: novoPapel });
  };

  /** Alinha papel, identidade e matrícula da interface com a sessão validada no servidor. */
  const definirUsuarioLogado = (usuario: {
    id?: string;
    nome: string;
    email: string;
    papel: PapelUsuario;
    turmaNome?: string;
    matriculaId?: string | null;
  }) => {
    const atual = estadoGlobal.usuarioAtual;
    const sessao: SessaoAtual = {
      usuarioId: usuario.id ?? estadoGlobal.sessao.usuarioId,
      matriculaId: usuario.matriculaId !== undefined ? usuario.matriculaId : estadoGlobal.sessao.matriculaId,
    };
    if (
      estadoGlobal.papelAtual === usuario.papel &&
      atual.email === usuario.email &&
      atual.nome === usuario.nome &&
      (usuario.turmaNome === undefined || atual.turmaNome === usuario.turmaNome) &&
      estadoGlobal.sessao.usuarioId === sessao.usuarioId &&
      estadoGlobal.sessao.matriculaId === sessao.matriculaId
    ) {
      return;
    }
    salvarEstado({
      ...estadoGlobal,
      papelAtual: usuario.papel,
      usuarioAtual: { nome: usuario.nome, email: usuario.email, turmaNome: usuario.turmaNome ?? atual.turmaNome ?? "" },
      sessao,
    });
  };

  const alternarModulo = (moduloId: string, novoStatus: "liberado" | "bloqueado") => {
    const modulosAtualizados = estadoGlobal.modulos.map((m) =>
      m.id === moduloId ? { ...m, status: novoStatus, liberadoEm: novoStatus === "liberado" ? new Date().toISOString() : undefined } : m
    );
    salvarEstado({ ...estadoGlobal, modulos: modulosAtualizados });

    const turma = estadoGlobal.turmas[0];
    if (turma?.id) {
      enviarEDepoisSincronizar("/api/modulos/liberar", {
        method: "POST",
        body: JSON.stringify({ turmaId: turma.id, moduloId, status: novoStatus }),
      });
    }
  };

  const submeterCheckin = async (entrega: EntregaPendente, moduloId: string): Promise<ResultadoEnvio> => {
    const matriculaId = estadoGlobal.sessao.matriculaId;
    if (!matriculaId) return { sucesso: false, erro: "Matrícula não encontrada. Faça login novamente." };

    const evidencias = [
      ...(entrega.links || []).map((l) => ({ tipo: "link", rotulo: l.rotulo || "Evidência", valorUrl: l.url })),
      ...(entrega.arquivos || []).map((a) => ({ tipo: "arquivo", rotulo: a.nome, storagePath: a.path, nomeArquivo: a.nome })),
    ];
    const resultado = await enviarComResultado("/api/checkins", {
      method: "POST",
      body: JSON.stringify({ matriculaId, moduloId, travou: entrega.travou, duvidaCall: entrega.duvidaCall, evidencias }),
    });
    if (resultado.sucesso) {
      salvarEstado({
        ...estadoGlobal,
        entregas: [entrega, ...estadoGlobal.entregas.filter((e) => e.id !== entrega.id)],
      });
    }
    return resultado;
  };

  const auditarEntrega = (
    id: string,
    decisao: "aprovado" | "ajuste_solicitado",
    parecer?: string,
    opcoes?: OpcoesAcaoReversivel
  ): (() => void) => {
    const entregasAtualizadas = estadoGlobal.entregas.map((e) =>
      e.id === id
        ? { ...e, status: decisao, parecerTexto: parecer, avaliadoEm: new Date().toISOString(), avaliadoPor: nomeResponsavel() }
        : e
    );
    salvarEstado({ ...estadoGlobal, entregas: entregasAtualizadas });

    // A API não aceita voltar para "aguardando", por isso o envio é adiável.
    // Se o servidor recusar, a sincronização desfaz a mudança na tela e o erro é avisado.
    return agendarPersistencia(() => {
      void enviarComResultado(`/api/checkins/${id}/auditar`, {
        keepalive: true,
        method: "PATCH",
        body: JSON.stringify({ status: decisao, parecerTexto: parecer }),
      }).then((resultado) => {
        if (!resultado.sucesso) {
          avisarUsuario(`A avaliação não foi salva: ${resultado.erro}`, { tom: "erro" });
        }
      });
    }, opcoes);
  };

  /** Mentorado declara o faturamento do mês. */
  const adicionarFaturamento = async (faturamento: DeclaracaoFaturamento): Promise<ResultadoEnvio> => {
    const nova: DeclaracaoFaturamento = {
      ...faturamento,
      id: faturamento.id || `local-${Date.now()}`,
      alunoId: faturamento.alunoId ?? estadoGlobal.sessao.usuarioId ?? undefined,
      statusAuditoria: "pendente",
      criadoEm: faturamento.criadoEm ?? new Date().toISOString(),
    };

    const matriculaId = faturamento.matriculaId && !faturamento.matriculaId.startsWith("mat-") ? faturamento.matriculaId : matriculaDoAluno(nova.alunoId);
    if (!matriculaId) return { sucesso: false, erro: "Matrícula não encontrada. Faça login novamente." };
    const resultado = await enviarComResultado("/api/faturamentos", {
      method: "POST",
      body: JSON.stringify({
        matriculaId,
        mesReferencia: nova.mesReferencia,
        valorBruto: nova.valorBruto,
        storageZipPath: nova.comprovantes?.[0]?.path || null,
      }),
    });
    if (resultado.sucesso) {
      salvarEstado({ ...estadoGlobal, faturamentos: [nova, ...estadoGlobal.faturamentos] });
    }
    return resultado;
  };

  /**
   * Equipe: cria ou atualiza uma declaração em nome do aluno.
   * A edição é adiável (janela de "Desfazer"); a criação vai direto ao servidor.
   */
  const salvarFaturamento = (faturamento: DeclaracaoFaturamento, opcoes?: OpcoesAcaoReversivel): (() => void) => {
    const editor = nomeResponsavel();
    const existente = faturamento.id ? estadoGlobal.faturamentos.find((f) => f.id === faturamento.id) : undefined;

    if (existente) {
      const atualizada = { ...existente, ...faturamento, editadoPor: editor };
      salvarEstado({
        ...estadoGlobal,
        faturamentos: estadoGlobal.faturamentos.map((f) => (f.id === faturamento.id ? atualizada : f)),
      });
      return agendarPersistencia(() => {
        void enviarComResultado(`/api/faturamentos/${faturamento.id}`, {
          keepalive: true,
          method: "PATCH",
          body: JSON.stringify({
            mesReferencia: atualizada.mesReferencia,
            valorBruto: atualizada.valorBruto,
            statusAuditoria: atualizada.statusAuditoria,
            parecerAuditoria: atualizada.parecerAuditoria,
          }),
        }).then((r) => {
          if (!r.sucesso) avisarUsuario(`A declaração não foi salva: ${r.erro}`, { tom: "erro" });
        });
      }, opcoes);
    }

    const nova: DeclaracaoFaturamento = {
      ...faturamento,
      id: `local-${Date.now()}`,
      statusAuditoria: faturamento.statusAuditoria ?? "pendente",
      criadoEm: new Date().toISOString(),
      editadoPor: editor,
    };
    salvarEstado({ ...estadoGlobal, faturamentos: [nova, ...estadoGlobal.faturamentos] });
    const matriculaId = matriculaDoAluno(nova.alunoId);
    if (matriculaId) {
      void enviarComResultado("/api/faturamentos", {
        method: "POST",
        body: JSON.stringify({ matriculaId, mesReferencia: nova.mesReferencia, valorBruto: nova.valorBruto }),
      }).then((r) => {
        if (!r.sucesso) avisarUsuario(`A declaração não foi lançada: ${r.erro}`, { tom: "erro" });
      });
    }
    return () => {};
  };

  /** Gestão: exclui uma declaração. O envio é adiável (janela de "Desfazer"). */
  const excluirFaturamento = (id: string, opcoes?: OpcoesAcaoReversivel): (() => void) => {
    salvarEstado({ ...estadoGlobal, faturamentos: estadoGlobal.faturamentos.filter((f) => f.id !== id) });
    return agendarPersistencia(() => {
      if (id.startsWith("local-")) return;
      enviarEDepoisSincronizar(`/api/faturamentos/${id}`, { method: "DELETE" });
    }, opcoes);
  };

  const auditarFaturamento = (
    id: string,
    decisao: "aprovado" | "ajuste_solicitado",
    parecer?: string,
    opcoes?: OpcoesAcaoReversivel
  ): (() => void) => {
    salvarEstado({
      ...estadoGlobal,
      faturamentos: estadoGlobal.faturamentos.map((f) => (f.id === id ? processarAuditoriaFaturamento(f, decisao, parecer, nomeResponsavel()) : f)),
    });

    return agendarPersistencia(() => {
      enviarEDepoisSincronizar(`/api/faturamentos/${id}/auditar`, {
        method: "PATCH",
        body: JSON.stringify({ statusAuditoria: decisao, parecerAuditoria: parecer }),
      });
    }, opcoes);
  };

  /**
   * Define a meta anual de um aluno (padrão: o mentorado logado).
   * O envio é adiável (janela de "Desfazer").
   */
  const definirMetaFaturamentoAnual = (valor: number, alunoId?: string, opcoes?: OpcoesAcaoReversivel): (() => void) => {
    const alvo = alunoId ?? estadoGlobal.sessao.usuarioId ?? "";
    const metaValida = Number.isFinite(valor) && valor > 0 ? valor : META_FATURAMENTO_ANUAL_PADRAO;
    salvarEstado({
      ...estadoGlobal,
      metasFaturamentoAlunos: { ...estadoGlobal.metasFaturamentoAlunos, [alvo]: metaValida },
    });

    const matriculaId = matriculaDoAluno(alvo);
    return agendarPersistencia(() => {
      if (!matriculaId) return;
      enviarEDepoisSincronizar(`/api/matriculas/${matriculaId}/meta`, {
        method: "PUT",
        body: JSON.stringify({ valor: metaValida }),
      });
    }, opcoes);
  };

  /** Equipe: bloqueia o acesso de um aluno ao sistema. Substitui um bloqueio vigente, se houver. */
  const bloquearAcesso = (dados: DadosNovoBloqueio) => {
    const novo = criarBloqueio(dados, nomeResponsavel());
    salvarEstado({
      ...estadoGlobal,
      bloqueiosAcesso: { ...estadoGlobal.bloqueiosAcesso, [dados.alunoId]: novo },
      historicoBloqueios: [novo, ...estadoGlobal.historicoBloqueios],
    });

    enviarEDepoisSincronizar("/api/bloqueios", {
      method: "POST",
      body: JSON.stringify({
        acao: "bloquear",
        usuarioId: dados.alunoId,
        motivo: dados.motivo,
        observacoes: dados.observacaoInterna || dados.mensagemAoAluno || null,
      }),
    });
  };

  /** Equipe: encerra o bloqueio vigente do aluno, registrando quem liberou e por quê. */
  const desbloquearAcesso = (alunoId: string, observacao?: string) => {
    const vigente = estadoGlobal.bloqueiosAcesso[alunoId];
    if (!vigente || vigente.desbloqueadoEm) return;
    const encerrado = encerrarBloqueio(vigente, nomeResponsavel(), observacao);
    salvarEstado({
      ...estadoGlobal,
      bloqueiosAcesso: { ...estadoGlobal.bloqueiosAcesso, [alunoId]: encerrado },
      historicoBloqueios: estadoGlobal.historicoBloqueios.map((b) => (b.id === encerrado.id ? encerrado : b)),
    });

    enviarEDepoisSincronizar("/api/bloqueios", {
      method: "POST",
      body: JSON.stringify({ acao: "desbloquear", usuarioId: alunoId, justificativaDesbloqueio: observacao }),
    });
  };

  // Seletores do aluno da sessão
  const alunoAtualId = estadoGlobal.sessao.usuarioId ?? "";
  const bloqueioAlunoAtual = alunoAtualId ? obterBloqueioVigente(estadoGlobal.bloqueiosAcesso, alunoAtualId) : undefined;
  const faturamentosAlunoAtual = alunoAtualId ? filtrarFaturamentosPorAluno(estadoGlobal.faturamentos, alunoAtualId) : [];
  const metaAnualAlunoAtual = obterMetaAnualAluno(estadoGlobal.metasFaturamentoAlunos, alunoAtualId);
  const faturamentosPendentesAuditoria = estadoGlobal.faturamentos.filter(
    (f) => ((f.statusAuditoria ?? "pendente") as StatusAuditoriaFaturamento) === "pendente"
  ).length;
  /** Só mentorados: o cadastro também traz contas da equipe. */
  const mentorados = apenasMentorados(estadoGlobal.alunos);

  const atualizarCanal = (nomeCanal: string, status: "ativo" | "nao_iniciado", url?: string) => {
    const canaisAtualizados = estadoGlobal.canais.map((c) =>
      c.nome === nomeCanal ? { ...c, status, url: url ?? c.url, atualizadoEm: new Date().toISOString() } : c
    );
    salvarEstado({ ...estadoGlobal, canais: canaisAtualizados });

    const matriculaId = estadoGlobal.sessao.matriculaId;
    if (!matriculaId) return;
    enviarEDepoisSincronizar("/api/canais", {
      method: "POST",
      body: JSON.stringify({ matriculaId, canalNome: nomeCanal, status, urlCanal: url }),
    });
  };

  const salvarAluno = (aluno: AlunoCadastro) => {
    const existe = estadoGlobal.alunos.some((a) => a.id === aluno.id);
    const novosAlunos = existe
      ? estadoGlobal.alunos.map((a) => (a.id === aluno.id ? aluno : a))
      : [{ ...aluno, id: aluno.id || `local-${Date.now()}` }, ...estadoGlobal.alunos];
    salvarEstado({ ...estadoGlobal, alunos: novosAlunos });

    if (existe && aluno.id) {
      enviarEDepoisSincronizar(`/api/alunos/${aluno.id}`, { method: "PATCH", body: JSON.stringify(aluno) });
    } else {
      // Cadastro novo é gravado pelo próprio modal (/api/admin/usuarios); aqui só recarrega
      sincronizarAgora();
    }
  };

  const excluirAluno = (id: string, opcoes?: OpcoesAcaoReversivel): (() => void) => {
    salvarEstado({ ...estadoGlobal, alunos: estadoGlobal.alunos.filter((a) => a.id !== id) });
    // Apaga usuário e acesso de forma definitiva no backend, por isso o envio é adiável
    return agendarPersistencia(() => {
      if (!id) return;
      enviarEDepoisSincronizar(`/api/alunos/${id}`, { method: "DELETE" });
    }, opcoes);
  };

  // -------------------------------------------------------------------------
  // Reversões locais usadas pelo "Desfazer". Só revertem se o registro ainda
  // estiver exatamente como a ação o deixou; caso contrário retornam false.
  // -------------------------------------------------------------------------
  const reverterFaturamento = (alvo: AlvoReversao<DeclaracaoFaturamento>): boolean => {
    const { lista, ok: revertido } = reverterRegistro(estadoGlobal.faturamentos, alvo);
    if (revertido) salvarEstado({ ...estadoGlobal, faturamentos: lista });
    return revertido;
  };

  const reverterEntrega = (alvo: AlvoReversao<EntregaPendente>): boolean => {
    const { lista, ok: revertido } = reverterRegistro(estadoGlobal.entregas, alvo);
    if (revertido) salvarEstado({ ...estadoGlobal, entregas: lista });
    return revertido;
  };

  const reverterAluno = (alvo: AlvoReversao<AlunoCadastro>): boolean => {
    const { lista, ok: revertido } = reverterRegistro(estadoGlobal.alunos, alvo);
    if (revertido) salvarEstado({ ...estadoGlobal, alunos: lista });
    return revertido;
  };

  const reverterMetaFaturamento = (alunoId: string, anterior: number | undefined, posterior: number): boolean => {
    const { mapa, ok: revertido } = reverterValorPorChave(estadoGlobal.metasFaturamentoAlunos, alunoId, anterior, posterior);
    if (revertido) salvarEstado({ ...estadoGlobal, metasFaturamentoAlunos: mapa });
    return revertido;
  };

  const salvarTurma = (turma: TurmaCadastro) => {
    salvarEstado({ ...estadoGlobal, turmas: [turma, ...estadoGlobal.turmas] });
    enviarEDepoisSincronizar("/api/turmas", { method: "POST", body: JSON.stringify(turma) });
  };

  return {
    tentarSincronizarNovamente,
    estado,
    mentorados,
    carregado,
    alunoAtualId,
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
