import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PAPEIS_ICP, erroApi } from "@/lib/diagnostico/servidor";

type Contagem = Record<string, number>;

function contar(alvo: Contagem, chave: string | null | undefined) {
  const k = chave ?? "sem_resposta";
  alvo[k] = (alvo[k] ?? 0) + 1;
}

/** GET /api/icp/agregado?turma= — só mentor/admin. Sem matrícula, sem nome, sem frases. */
export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req, PAPEIS_ICP);
  if (auth.erro) return auth.erro;
  try {
    const turmaId = new URL(req.url).searchParams.get("turma");
    let query = supabaseAdmin.from("vw_icp_agregado").select("*");
    if (turmaId) query = query.eq("turma_id", turmaId);
    const { data, error } = await query;
    if (error) return erroApi(500, { codigo: "erro_consulta", mensagem: error.message });

    const linhas = data || [];
    const segmentos: Contagem = {};
    const forcas = { push: {} as Contagem, pull: {} as Contagem, anxiety: {} as Contagem, habit: {} as Contagem };
    const origens: Contagem = {};
    const precoEscrito: Contagem = {};
    const pagouCasa: Contagem = {};
    const pecas: Contagem = {};
    const tiposAnjo: Contagem = {};
    const risco: Contagem = {};
    let flagE = 0;
    let fitNao = 0;
    const soma = { pericia: 0, at: 0, escritorio: 0, outro: 0 };

    for (const l of linhas as any[]) {
      contar(segmentos, l.icp_segmento);
      if (l.flag_e_aluno_casa) flagE++;
      if (l.fit_one === "nao") fitNao++;
      contar(forcas.push, l.forca_push);
      contar(forcas.pull, l.forca_pull);
      contar(forcas.anxiety, l.forca_anxiety);
      contar(forcas.habit, l.forca_habit);
      for (const o of (l.ultimo_origem as string[] | null) ?? []) contar(origens, o);
      if (l.ultimo_preco_escrito) contar(precoEscrito, l.ultimo_preco_escrito);
      for (const p of (l.pagou_casa as string[] | null) ?? []) contar(pagouCasa, p);
      contar(pecas, l.pecas_de_pe_bucket);
      contar(tiposAnjo, l.anjo_tipo_t0);
      contar(risco, l.risco_parcela);
      soma.pericia += l.pct_pericia ?? 0;
      soma.at += l.pct_at ?? 0;
      soma.escritorio += l.pct_escritorio ?? 0;
      soma.outro += l.pct_outro ?? 0;
    }

    const n = linhas.length;
    const media = (v: number) => (n ? Math.round(v / n) : 0);

    return NextResponse.json({
      sucesso: true,
      total: n,
      segmentos,
      flagE,
      fitNao,
      mixReceita: {
        pericia: media(soma.pericia),
        at: media(soma.at),
        escritorio: media(soma.escritorio),
        outro: media(soma.outro),
      },
      forcas,
      porta: { origens, precoEscrito },
      pagouCasa,
      pecas,
      tiposAnjo,
      risco,
    });
  } catch (err: any) {
    return erroApi(500, { codigo: "erro_interno", mensagem: err?.message || "Erro ao agregar o ICP." });
  }
}
