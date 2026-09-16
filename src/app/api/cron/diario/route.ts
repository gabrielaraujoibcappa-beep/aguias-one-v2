import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { deveCongelar, diagnosticoAtrasado } from "@/lib/diagnostico/regras";
import { registrarEvento } from "@/lib/diagnostico/servidor";
import { listarJanelaMes6 } from "@/lib/acompanhamento/mes6-servidor";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/diario — job diário (Vercel Cron, 09h UTC).
 * 1) congela diagnósticos vencidos; 2) registra diagnostico.atrasado; 3) evento anjo.lista_mes6.
 * Só com Authorization: Bearer ${CRON_SECRET}.
 */
export async function GET(req: NextRequest) {
  const segredo = process.env.CRON_SECRET;
  if (!segredo) {
    return NextResponse.json({ sucesso: false, erro: { codigo: "cron_nao_configurado", mensagem: "CRON_SECRET ausente." } }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${segredo}`) {
    return NextResponse.json({ sucesso: false, erro: { codigo: "nao_autorizado", mensagem: "Não autorizado." } }, { status: 401 });
  }

  try {
    const agora = new Date();
    const { data: matriculas, error } = await supabaseAdmin
      .from("matriculas")
      .select("id, matriculado_em, turma_id, turmas (data_inicio), usuarios (papel), diagnostico (id, status, enviado_em)")
      .eq("status", "ativo");
    if (error) throw new Error(error.message);

    let congelados = 0;
    let atrasados = 0;

    for (const m of (matriculas || []) as any[]) {
      if (m.usuarios?.papel !== "mentorado") continue;
      const d = Array.isArray(m.diagnostico) ? m.diagnostico[0] : m.diagnostico;
      const inicio = (Array.isArray(m.turmas) ? m.turmas[0] : m.turmas)?.data_inicio ?? null;

      if (d && deveCongelar(d.status, d.enviado_em, inicio, agora)) {
        const { data: atualizado } = await supabaseAdmin
          .from("diagnostico")
          .update({ status: "congelado", congelado_em: agora.toISOString(), atualizado_em: agora.toISOString() })
          .eq("id", d.id)
          .eq("status", "enviado")
          .select("id")
          .maybeSingle();
        if (atualizado) {
          congelados++;
          await registrarEvento("diagnostico.congelado", { matriculaId: m.id, dados: { origem: "cron" } });
        }
      }

      if (diagnosticoAtrasado(d?.status ?? "rascunho", m.matriculado_em, agora)) {
        atrasados++;
        // Índice único: registra uma vez por matrícula
        await registrarEvento("diagnostico.atrasado", { matriculaId: m.id, dados: { origem: "cron" } });
      }
    }

    const janela = await listarJanelaMes6(null, agora);
    const sessoes = janela.filter((i) => i.resultado.sessaoObrigatoria && !i.temPlano).length;
    await registrarEvento("anjo.lista_mes6", {
      dados: { total: janela.length, sessao_obrigatoria_sem_plano: sessoes, data: agora.toISOString().slice(0, 10) },
    });

    return NextResponse.json({ sucesso: true, congelados, atrasados, janelaMes6: janela.length, sessoesSemPlano: sessoes });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: { codigo: "erro_interno", mensagem: err?.message } }, { status: 500 });
  }
}
