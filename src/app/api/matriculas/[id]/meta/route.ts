import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, podeAcessarMatricula, respostaProibida } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";

// PUT /api/matriculas/:id/meta → define a meta anual de faturamento.
// Equipe define para qualquer matrícula; o mentorado só para a própria.
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;
  if (!podeAcessarMatricula(auth.sessao, params.id)) return respostaProibida();

  try {
    const { valor } = await req.json();
    const meta = Number(valor);
    if (!Number.isFinite(meta) || meta <= 0 || meta > 1_000_000_000) {
      return NextResponse.json({ sucesso: false, erro: "Informe uma meta anual maior que zero." }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("matriculas")
      .update({ meta_faturamento_anual: meta })
      .eq("id", params.id)
      .select("id")
      .maybeSingle();

    if (error) return NextResponse.json({ sucesso: false, erro: "Não foi possível salvar a meta." }, { status: 500 });
    if (!data) return NextResponse.json({ sucesso: false, erro: "Matrícula não encontrada." }, { status: 404 });
    return NextResponse.json({ sucesso: true, metaFaturamentoAnual: meta });
  } catch {
    return NextResponse.json({ sucesso: false, erro: "Não foi possível salvar a meta." }, { status: 500 });
  }
}
