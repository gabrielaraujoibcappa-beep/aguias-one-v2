import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CAMPOS_FRASE } from "@/lib/diagnostico/campos";
import { PAPEIS_ICP, erroApi, registrarEvento } from "@/lib/diagnostico/servidor";

/**
 * GET /api/icp/frases?turma=&segmento=&comNome=1 — mural de frases (mentor/admin).
 * Frases são identificáveis: toda leitura gera evento leitura_icp_frases.
 * Sem comNome=1 a lista sai sem nome; com o parâmetro, o drill-down também é logado.
 */
export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req, PAPEIS_ICP);
  if (auth.erro) return auth.erro;
  try {
    const { searchParams } = new URL(req.url);
    const turmaId = searchParams.get("turma");
    const segmento = searchParams.get("segmento");
    const comNome = searchParams.get("comNome") === "1";

    let query = supabaseAdmin
      .from("diagnostico")
      .select("matricula_id, payload, scores, enviado_em, matriculas!inner (turma_id, usuarios (nome))")
      .in("status", ["enviado", "congelado"]);
    if (turmaId) query = query.eq("matriculas.turma_id", turmaId);
    if (segmento) query = query.eq("scores->>icp_segmento", segmento);

    const { data, error } = await query;
    if (error) return erroApi(500, { codigo: "erro_consulta", mensagem: error.message });

    await registrarEvento("leitura_icp_frases", {
      sessao: auth.sessao,
      dados: { turma: turmaId, segmento, comNome, quantidade: data?.length ?? 0 },
    });

    const frases = (data || []).flatMap((d: any, i: number) =>
      CAMPOS_FRASE.filter((campo) => typeof d.payload?.[campo] === "string" && d.payload[campo].trim()).map((campo) => ({
        campo,
        texto: d.payload[campo] as string,
        segmento: d.scores?.icp_segmento ?? null,
        flagE: !!d.scores?.flag_e_aluno_casa,
        respondente: comNome ? d.matriculas?.usuarios?.nome ?? "Mentorado" : `Respondente ${i + 1}`,
        enviadoEm: d.enviado_em,
      }))
    );

    return NextResponse.json({ sucesso: true, frases });
  } catch (err: any) {
    return erroApi(500, { codigo: "erro_interno", mensagem: err?.message || "Erro ao listar as frases." });
  }
}
