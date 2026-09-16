import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ANJO_LE_FATURAMENTO, BASE_MES6, REGUA_MES6 } from "@/lib/diagnostico/parametros";
import { erroApi, registrarAcessoFaturamento } from "@/lib/diagnostico/servidor";
import { listarJanelaMes6 } from "@/lib/acompanhamento/mes6-servidor";

/**
 * GET /api/anjo/mes6?turma= — quem entrou na janela do mês 6 (≤ 7 dias ou já passou).
 * Números com log; com ANJO_LE_FATURAMENTO=false o Anjo recebe só acima/igual/abaixo.
 */
export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req, ["anjo", "mentor", "admin"]);
  if (auth.erro) return auth.erro;
  const { sessao } = auth;
  try {
    const { data: turmas } = await supabaseAdmin
      .from("turmas")
      .select("id, nome, status, data_inicio")
      .order("data_inicio", { ascending: false });
    let turmaId = new URL(req.url).searchParams.get("turma");
    if (!turmaId) turmaId = (turmas || []).find((t) => t.status === "em_andamento")?.id ?? turmas?.[0]?.id ?? null;
    if (!turmaId) return NextResponse.json({ sucesso: true, turmaId: null, turmas: [], regua: REGUA_MES6, base: BASE_MES6, alunos: [] });

    const itens = await listarJanelaMes6(turmaId);
    const soComparativo = sessao.papel === "anjo" && !ANJO_LE_FATURAMENTO;

    if (itens.length && !soComparativo) await registrarAcessoFaturamento(sessao, null, `anjo_mes6:${turmaId}`);

    const alunos = itens.map((i) =>
      soComparativo
        ? {
            matriculaId: i.matriculaId,
            nome: i.nome,
            dataMes6: i.dataMes6,
            diasAteMes6: i.diasAteMes6,
            diagnosticoStatus: i.diagnosticoStatus,
            placarNaoSei: i.placarNaoSei,
            temPlano: i.temPlano,
            statusPlano: i.statusPlano,
            resultado: {
              comparativo: i.resultado.comparativo,
              naoSei: i.resultado.naoSei,
              sessaoObrigatoria: i.resultado.sessaoObrigatoria,
              motivos: i.resultado.motivos,
              regua: i.resultado.regua,
            },
          }
        : i
    );

    return NextResponse.json({
      sucesso: true,
      turmaId,
      turmas: turmas || [],
      regua: REGUA_MES6,
      base: BASE_MES6,
      somenteComparativo: soComparativo,
      alunos,
    });
  } catch (err: any) {
    return erroApi(500, { codigo: "erro_interno", mensagem: err?.message || "Erro ao montar a lista do mês 6." });
  }
}
