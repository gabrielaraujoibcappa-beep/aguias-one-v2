import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, PAPEIS_EQUIPE } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await exigirSessao(req, PAPEIS_EQUIPE);
  if (auth.erro) return auth.erro;
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, parecerTexto } = body;

    if (!status || !["aprovado", "ajuste_solicitado"].includes(status)) {
      return NextResponse.json(
        { sucesso: false, erro: "O status de auditoria deve ser 'aprovado' ou 'ajuste_solicitado'." },
        { status: 400 }
      );
    }

    // Avaliador é sempre o usuário autenticado (e-mail do body não é confiável)
    const avaliadorId: string | null = auth.sessao.usuarioId;

    const { data: checkin, error } = await supabaseAdmin
      .from("checkins_modulo")
      .update({
        status,
        parecer_texto: parecerTexto ? parecerTexto.trim() : null,
        avaliado_por: avaliadorId,
        avaliado_em: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ sucesso: false, erro: error.message }, { status: 400 });
    }

    return NextResponse.json({
      sucesso: true,
      checkin,
      mensagem: status === "aprovado" ? "Entrega aprovada com sucesso." : "Ajustes solicitados ao mentorado.",
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
