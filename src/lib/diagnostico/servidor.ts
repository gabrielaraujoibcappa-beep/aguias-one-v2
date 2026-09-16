/**
 * Acesso a dados do placar de entrada para as rotas /api (service_role).
 * Toda leitura de dinheiro de terceiros registra acesso_faturamento_log.
 */
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import type { Sessao } from "@/lib/auth/sessao-api";
import type { PapelUsuario } from "@/lib/auth/roles";
import type { PayloadDiagnostico } from "./campos";
import {
  ErroDiagnostico,
  ScoresDiagnostico,
  StatusDiagnostico,
  calcularScores,
  deveCongelar,
  validarEnvio,
  diagnosticoAtrasado,
  filtrarParaPapel,
  mesesReferencia,
  prazoCorrecao,
} from "./regras";

export const PAPEIS_LEITURA_DIAGNOSTICO: PapelUsuario[] = ["concierge", "anjo", "mentor", "admin"];
export const PAPEIS_ICP: PapelUsuario[] = ["mentor", "admin"];

export interface LinhaDiagnostico {
  id: string;
  matricula_id: string;
  status: StatusDiagnostico;
  payload: PayloadDiagnostico;
  scores: Partial<ScoresDiagnostico>;
  enviado_em: string | null;
  congelado_em: string | null;
  versao: number;
}

export interface MatriculaContexto {
  id: string;
  status: string;
  matriculado_em: string;
  turma_id: string;
  turma_inicio: string | null;
  turma_nome: string | null;
  aluno_nome: string;
  aluno_email: string;
  aluno_whatsapp: string | null;
  usuario_id: string | null;
}

/** Envelope de erro do spec: { erro: { codigo, mensagem, campo } }. Mantém `sucesso` do padrão v2. */
export function erroApi(status: number, erro: ErroDiagnostico) {
  return NextResponse.json({ sucesso: false, erro }, { status });
}

const SELECT_MATRICULA = `id, status, matriculado_em, turma_id,
  turmas (nome, data_inicio),
  usuarios (id, nome, email, whatsapp, papel)`;

function mapearMatricula(m: any): MatriculaContexto {
  return {
    id: m.id,
    status: m.status,
    matriculado_em: m.matriculado_em,
    turma_id: m.turma_id,
    turma_inicio: m.turmas?.data_inicio ?? null,
    turma_nome: m.turmas?.nome ?? null,
    aluno_nome: m.usuarios?.nome ?? "Mentorado",
    aluno_email: m.usuarios?.email ?? "",
    aluno_whatsapp: m.usuarios?.whatsapp ?? null,
    usuario_id: m.usuarios?.id ?? null,
  };
}

export async function buscarMatricula(matriculaId: string): Promise<MatriculaContexto | null> {
  const { data } = await supabaseAdmin.from("matriculas").select(SELECT_MATRICULA).eq("id", matriculaId).maybeSingle();
  return data ? mapearMatricula(data) : null;
}

/** Matrícula do aluno vem da sessão (nunca do body): a ativa mais recente. */
export async function matriculaDoAluno(sessao: Sessao): Promise<MatriculaContexto | null> {
  if (!sessao.matriculaIds.length) return null;
  const { data } = await supabaseAdmin
    .from("matriculas")
    .select(SELECT_MATRICULA)
    .in("id", sessao.matriculaIds)
    .order("matriculado_em", { ascending: false });
  const lista = (data || []).map(mapearMatricula);
  return lista.find((m) => m.status === "ativo") ?? lista[0] ?? null;
}

export async function buscarOuCriarDiagnostico(matriculaId: string): Promise<LinhaDiagnostico> {
  const { data: existente, error } = await supabaseAdmin
    .from("diagnostico")
    .select("*")
    .eq("matricula_id", matriculaId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (existente) return existente as LinhaDiagnostico;

  const { data: criado, error: erroCriar } = await supabaseAdmin
    .from("diagnostico")
    .upsert({ matricula_id: matriculaId }, { onConflict: "matricula_id" })
    .select("*")
    .single();
  if (erroCriar) throw new Error(erroCriar.message);
  return criado as LinhaDiagnostico;
}

export async function registrarEvento(
  codigo: string,
  opts: { matriculaId?: string | null; sessao?: Sessao; dados?: Record<string, unknown> } = {}
) {
  const { error } = await supabaseAdmin.from("evento_sistema").insert({
    codigo,
    matricula_id: opts.matriculaId ?? null,
    ator_id: opts.sessao?.usuarioId ?? null,
    ator_papel: opts.sessao?.papel ?? "sistema",
    dados: opts.dados ?? {},
  });
  // 23505: evento único de ciclo de vida já registrado
  if (error && error.code !== "23505") console.error("[evento_sistema]", codigo, error.message);
}

export async function registrarAcessoFaturamento(sessao: Sessao, matriculaId: string | null, origem: string) {
  const { error } = await supabaseAdmin.from("acesso_faturamento_log").insert({
    leitor_id: sessao.usuarioId,
    leitor_papel: sessao.papel,
    matricula_id: matriculaId,
    origem,
  });
  if (error) throw new Error(`Não foi possível registrar o acesso: ${error.message}`);
}

/**
 * Aplica o ciclo de vida sem cron: congela quem passou do prazo de correção.
 * Idempotente; roda em toda leitura.
 */
export async function aplicarCiclo(diag: LinhaDiagnostico, matricula: MatriculaContexto): Promise<LinhaDiagnostico> {
  if (!deveCongelar(diag.status, diag.enviado_em, matricula.turma_inicio)) return diag;
  const agora = new Date().toISOString();
  const { data } = await supabaseAdmin
    .from("diagnostico")
    .update({ status: "congelado", congelado_em: agora, atualizado_em: agora })
    .eq("id", diag.id)
    .eq("status", "enviado")
    .select("*")
    .maybeSingle();
  if (data) {
    await registrarEvento("diagnostico.congelado", { matriculaId: matricula.id });
    return data as LinhaDiagnostico;
  }
  return { ...diag, status: "congelado", congelado_em: agora };
}

/**
 * Grava uma versão fechada (envio, correção ou import): valida, calcula scores,
 * atualiza o diagnóstico e anexa ao histórico. Não decide permissão — a rota decide.
 */
export async function gravarVersao(opts: {
  diag: LinhaDiagnostico;
  payload: PayloadDiagnostico;
  sessao: Sessao;
  statusFinal: "enviado" | "congelado";
  motivo: string;
  statusEsperado: StatusDiagnostico[];
}): Promise<{ diag: LinhaDiagnostico; erro?: undefined } | { erro: ErroDiagnostico; diag?: undefined }> {
  const erro = validarEnvio(opts.payload);
  if (erro) return { erro };

  const scores = calcularScores(opts.payload);
  const agora = new Date().toISOString();
  const primeiroEnvio = !opts.diag.enviado_em;
  const versao = primeiroEnvio && opts.diag.status === "rascunho" ? opts.diag.versao : opts.diag.versao + 1;

  const { data, error } = await supabaseAdmin
    .from("diagnostico")
    .update({
      status: opts.statusFinal,
      payload: opts.payload,
      scores,
      enviado_em: opts.diag.enviado_em ?? agora,
      congelado_em: opts.statusFinal === "congelado" ? opts.diag.congelado_em ?? agora : null,
      versao,
      atualizado_em: agora,
    })
    .eq("id", opts.diag.id)
    .in("status", opts.statusEsperado)
    .eq("versao", opts.diag.versao)
    .select("*")
    .maybeSingle();

  if (error) return { erro: { codigo: "erro_gravacao", mensagem: error.message } };
  if (!data) return { erro: { codigo: "conflito", mensagem: "O placar mudou enquanto você editava. Recarregue a página." } };

  const { error: erroHist } = await supabaseAdmin.from("diagnostico_historico").insert({
    diagnostico_id: opts.diag.id,
    versao,
    payload: opts.payload,
    scores,
    motivo: opts.motivo,
    autor_papel: opts.sessao.papel,
    autor_id: opts.sessao.usuarioId,
  });
  if (erroHist) console.error("[diagnostico_historico]", erroHist.message);

  return { diag: data as LinhaDiagnostico };
}

/** Corpo de resposta para o próprio aluno (sem scores internos). */
export function respostaAluno(diag: LinhaDiagnostico, matricula: MatriculaContexto) {
  const visao = filtrarParaPapel("mentorado", diag.payload, diag.scores);
  return {
    sucesso: true,
    diagnostico: {
      status: diag.status,
      payload: visao.payload,
      resumo: visao.scores,
      enviadoEm: diag.enviado_em,
      congeladoEm: diag.congelado_em,
      corrigirAte:
        diag.status === "enviado" && diag.enviado_em
          ? prazoCorrecao(diag.enviado_em, matricula.turma_inicio).toISOString()
          : null,
      versao: diag.versao,
      mesesReferencia: mesesReferencia(matricula.matriculado_em),
    },
  };
}

/** Registra diagnostico.atrasado (uma vez por matrícula) quando T+48h sem envio. */
export async function sinalizarAtraso(diag: Pick<LinhaDiagnostico, "status"> | null, matricula: MatriculaContexto) {
  if (matricula.status !== "ativo") return false;
  const atrasado = diagnosticoAtrasado(diag?.status ?? "rascunho", matricula.matriculado_em);
  if (atrasado) await registrarEvento("diagnostico.atrasado", { matriculaId: matricula.id });
  return atrasado;
}
