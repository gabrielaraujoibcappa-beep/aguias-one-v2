import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, parecerTexto, avaliadorEmail } = body;

    if (!status || !["aprovado", "ajuste_solicitado"].includes(status)) {
      return NextResponse.json(
        { sucesso: false, erro: "O status de auditoria deve ser 'aprovado' ou 'ajuste_solicitado'." },
        { status: 400 }
      );
    }

    let avaliadorId: string | null = null;
    if (avaliadorEmail) {
      const { data: u } = await supabaseAdmin
        .from("usuarios")
        .select("id")
        .eq("email", avaliadorEmail.toLowerCase())
        .maybeSingle();
      avaliadorId = u?.id || null;
    }

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
