import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { diagnosticoAtrasado, filtrarParaPapel, mesesReferencia, prazoCorrecao } from "@/lib/diagnostico/regras";
import {
  PAPEIS_LEITURA_DIAGNOSTICO,
  aplicarCiclo,
  buscarMatricula,
  buscarOuCriarDiagnostico,
  erroApi,
} from "@/lib/diagnostico/servidor";
import { ANJO_LE_FATURAMENTO } from "@/lib/diagnostico/parametros";
import { comparar, mediaCentavos } from "@/lib/acompanhamento/mes6";

const SCORES_DINHEIRO = ["media_6m_bruta", "maior_mes", "menor_mes", "instabilidade"] as const;

interface RouteParams {
  params: Promise<{ matricula: string }>;
}

/**
 * GET /api/diagnostico/:matricula — ficha para concierge, anjo, mentor e admin.
 * Campos filtrados por papel.
 */
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await exigirSessao(req, PAPEIS_LEITURA_DIAGNOSTICO);
  if (auth.erro) return auth.erro;
  const { sessao } = auth;
  try {
    const { matricula: matriculaId } = await params;
    const matricula = await buscarMatricula(matriculaId);
    if (!matricula) return erroApi(404, { codigo: "nao_encontrado", mensagem: "Matrícula não encontrada." });

    const diag = await aplicarCiclo(await buscarOuCriarDiagnostico(matricula.id), matricula);
    const visao = filtrarParaPapel(sessao.papel, diag.payload, diag.status === "rascunho" ? {} : diag.scores);
    // SPEC §16.1: com ANJO_LE_FATURAMENTO=false o Anjo vê só acima/igual/abaixo da entrada
    const soComparativo = sessao.papel === "anjo" && !ANJO_LE_FATURAMENTO;

    const lerFaturamentoMensal = sessao.papel !== "concierge";
    const lerNotas = sessao.papel === "anjo" || sessao.papel === "mentor" || sessao.papel === "admin";
    const lerAuditoria = sessao.papel === "mentor" || sessao.papel === "admin";

    const [faturamentos, notas, plano, eventos, trava] = await Promise.all([
      lerFaturamentoMensal
        ? supabaseAdmin
            .from("faturamentos")
            .select("mes_referencia, valor_bruto, status_auditoria")
            .eq("matricula_id", matricula.id)
            .order("mes_referencia", { ascending: true })
        : Promise.resolve({ data: null }),
      lerNotas
        ? supabaseAdmin
            .from("anjo_nota")
            .select("id, corpo, criado_em, usuarios:autor_id (nome, papel)")
            .eq("matricula_id", matricula.id)
            .order("criado_em", { ascending: false })
        : Promise.resolve({ data: null }),
      supabaseAdmin
        .from("anjo_plano")
        .select("tipo, peca_1, evidencia_1, data_1, peca_2, cadencia_dias, horario_real, status, atualizado_em")
        .eq("matricula_id", matricula.id)
        .maybeSingle(),
      lerAuditoria
        ? supabaseAdmin
            .from("evento_sistema")
            .select("codigo, ator_papel, dados, criado_em, usuarios:ator_id (nome)")
            .eq("matricula_id", matricula.id)
            .order("criado_em", { ascending: false })
            .limit(200)
        : Promise.resolve({ data: null }),
      supabaseAdmin
        .from("checkins_modulo")
        .select("travou")
        .eq("matricula_id", matricula.id)
        .not("travou", "is", null)
        .order("enviado_em", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

    let comparativoEntrada: "acima" | "igual" | "abaixo" | null | undefined;
    let faturamentosVisiveis: any[] = (faturamentos.data as any[] | null) || [];
    if (soComparativo) {
      const ultimos3 = faturamentosVisiveis.slice(-3).map((f: any) => Number(f.valor_bruto));
      const mediaEntrada = typeof diag.scores?.media_6m_bruta === "number" ? diag.scores.media_6m_bruta : null;
      comparativoEntrada = diag.status === "rascunho" ? null : comparar(mediaCentavos(ultimos3), mediaEntrada);
      for (const k of Object.keys(visao.payload)) {
        if (/^mes_\d\.(pericia|at|escritorio|outro)$/.test(k) || k === "meta_6m" || k === "ultimo_valor") delete visao.payload[k];
      }
      for (const k of SCORES_DINHEIRO) delete (visao.scores as any)[k];
      faturamentosVisiveis = [];
    }

    return NextResponse.json({
      sucesso: true,
      ...(soComparativo ? { comparativoEntrada } : {}),
      aluno: {
        matriculaId: matricula.id,
        usuarioId: matricula.usuario_id,
        turmaId: matricula.turma_id,
        travou: (trava.data as any)?.travou ?? null,
        nome: matricula.aluno_nome,
        email: matricula.aluno_email,
        whatsapp: matricula.aluno_whatsapp,
        turma: matricula.turma_nome,
        matriculadoEm: matricula.matriculado_em,
      },
      diagnostico: {
        status: diag.status,
        payload: visao.payload,
        scores: visao.scores,
        enviadoEm: diag.enviado_em,
        congeladoEm: diag.congelado_em,
        corrigirAte:
          diag.status === "enviado" && diag.enviado_em
            ? prazoCorrecao(diag.enviado_em, matricula.turma_inicio).toISOString()
            : null,
        atrasado: diagnosticoAtrasado(diag.status, matricula.matriculado_em),
        versao: diag.versao,
        mesesReferencia: mesesReferencia(matricula.matriculado_em),
      },
      faturamentoMensal: faturamentosVisiveis.map((f: any) => ({
        mesReferencia: f.mes_referencia,
        valorBruto: Number(f.valor_bruto),
        statusAuditoria: f.status_auditoria,
      })),
      notas: lerNotas
        ? (notas.data || []).map((n: any) => ({
            id: n.id,
            corpo: n.corpo,
            criadoEm: n.criado_em,
            autor: n.usuarios?.nome ?? "Equipe",
            autorPapel: n.usuarios?.papel ?? null,
          }))
        : undefined,
      plano: plano.data ?? null,
      auditoria: lerAuditoria
        ? {
            eventos: (eventos.data || []).map((e: any) => ({
              codigo: e.codigo,
              papel: e.ator_papel,
              nome: e.usuarios?.nome ?? "Sistema",
              dados: e.dados,
              em: e.criado_em,
            })),
          }
        : undefined,
    });
  } catch (err: any) {
    return erroApi(500, { codigo: "erro_interno", mensagem: err?.message || "Erro ao carregar a ficha." });
  }
}
