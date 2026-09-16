import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, podeAcessarMatricula, respostaProibida } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { CANAIS_TEMPLATE } from "@/lib/api/canais";

export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;
  try {
    const { searchParams } = new URL(req.url);
    const matriculaId = searchParams.get("matriculaId");
    if (matriculaId && !podeAcessarMatricula(auth.sessao, matriculaId)) return respostaProibida();

    let canaisDb: any[] = [];
    if (matriculaId) {
      const { data } = await supabaseAdmin
        .from("canais_mentorados")
        .select("*")
        .eq("matricula_id", matriculaId);
      canaisDb = data || [];
    }

    const mapaDb = new Map(canaisDb.map((c) => [c.canal_nome, c]));

    const canaisResultado = CANAIS_TEMPLATE.map((nome, index) => {
      const registro = mapaDb.get(nome);
      return {
        id: registro?.id || `canal-${index + 1}`,
        nome,
        status: registro?.status || "nao_iniciado",
        url: registro?.url_canal || "",
        atualizadoEm: registro?.atualizado_em || null,
      };
    });

    const canaisAtivos = canaisResultado.filter((c) => c.status === "ativo").length;

    return NextResponse.json({
      sucesso: true,
      matriculaId,
      totalCanais: CANAIS_TEMPLATE.length,
      canaisAtivos,
      canais: canaisResultado,
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;
  try {
    const body = await req.json();
    const { matriculaId, canalNome, status, urlCanal } = body;
    if (matriculaId && !podeAcessarMatricula(auth.sessao, matriculaId)) return respostaProibida();

    if (!matriculaId || !canalNome) {
      return NextResponse.json(
        { sucesso: false, erro: "matriculaId e canalNome são obrigatórios." },
        { status: 400 }
      );
    }

    const { data: canal, error } = await supabaseAdmin
      .from("canais_mentorados")
      .upsert(
        {
          matricula_id: matriculaId,
          canal_nome: canalNome,
          status: status || "ativo",
          url_canal: urlCanal || null,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "matricula_id,canal_nome" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ sucesso: false, erro: error.message }, { status: 400 });
    }

    return NextResponse.json({
      sucesso: true,
      canal,
      mensagem: "Canal de atração atualizado com sucesso.",
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
