import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PAPEIS_ICP, erroApi } from "@/lib/diagnostico/servidor";

const LIMITE = 1000;

function dataParam(v: string | null, fimDoDia: boolean): string | null {
  if (!v || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  return new Date(`${v}T${fimDoDia ? "23:59:59.999" : "00:00:00"}-03:00`).toISOString();
}

/**
 * GET /api/mentor/auditoria?de=&ate=&origem=&papel= — mentor e admin.
 * Une evento_sistema e acesso_faturamento_log. Padrão: últimos 30 dias. Máx. 1000 linhas.
 * origem: "eventos" | "acessos" (omitido = ambos). papel: papel de quem agiu.
 */
export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req, PAPEIS_ICP);
  if (auth.erro) return auth.erro;
  try {
    const sp = new URL(req.url).searchParams;
    const ate = dataParam(sp.get("ate"), true) ?? new Date().toISOString();
    const de = dataParam(sp.get("de"), false) ?? new Date(new Date(ate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const origem = sp.get("origem");
    const papel = sp.get("papel");

    const querEventos = origem !== "acessos";
    const querAcessos = origem !== "eventos";

    const [eventos, acessos] = await Promise.all([
      querEventos
        ? (() => {
            let q = supabaseAdmin
              .from("evento_sistema")
              .select("id, codigo, ator_papel, dados, criado_em, matricula_id, ator:ator_id (nome), matriculas (usuarios (nome))")
              .gte("criado_em", de)
              .lte("criado_em", ate)
              .order("criado_em", { ascending: false })
              .limit(LIMITE);
            if (papel) q = q.eq("ator_papel", papel);
            return q;
          })()
        : Promise.resolve({ data: [], error: null }),
      querAcessos
        ? (() => {
            let q = supabaseAdmin
              .from("acesso_faturamento_log")
              .select("id, origem, leitor_papel, criado_em, matricula_id, leitor:leitor_id (nome), matriculas (usuarios (nome))")
              .gte("criado_em", de)
              .lte("criado_em", ate)
              .order("criado_em", { ascending: false })
              .limit(LIMITE);
            if (papel) q = q.eq("leitor_papel", papel);
            return q;
          })()
        : Promise.resolve({ data: [], error: null }),
    ]);

    const erro = (eventos as any).error || (acessos as any).error;
    if (erro) return erroApi(500, { codigo: "erro_consulta", mensagem: erro.message });

    const aluno = (r: any) => {
      const m = Array.isArray(r.matriculas) ? r.matriculas[0] : r.matriculas;
      return m?.usuarios?.nome ?? null;
    };

    const linhas = [
      ...((eventos as any).data || []).map((e: any) => ({
        id: `e:${e.id}`,
        tipo: "evento" as const,
        codigo: e.codigo,
        papel: e.ator_papel ?? "sistema",
        quem: e.ator?.nome ?? "Sistema",
        aluno: aluno(e),
        matriculaId: e.matricula_id,
        detalhe: e.dados ?? {},
        em: e.criado_em,
      })),
      ...((acessos as any).data || []).map((a: any) => ({
        id: `a:${a.id}`,
        tipo: "acesso" as const,
        codigo: a.origem,
        papel: a.leitor_papel,
        quem: a.leitor?.nome ?? "—",
        aluno: aluno(a),
        matriculaId: a.matricula_id,
        detalhe: {},
        em: a.criado_em,
      })),
    ]
      .sort((x, y) => new Date(y.em).getTime() - new Date(x.em).getTime())
      .slice(0, LIMITE);

    return NextResponse.json({ sucesso: true, de, ate, limite: LIMITE, truncado: linhas.length >= LIMITE, linhas });
  } catch (err: any) {
    return erroApi(500, { codigo: "erro_interno", mensagem: err?.message || "Erro ao carregar a auditoria." });
  }
}
