import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import type { PapelUsuario } from "@/lib/auth/roles";

// Parecer: admin, concierge e mentor. Anjo não edita check-in nem faturamento (SPEC diagnóstico §3)
const PAPEIS_PARECER: PapelUsuario[] = ["admin", "concierge", "mentor"];
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await exigirSessao(req, PAPEIS_PARECER);
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
      .neq("status", "aprovado")
      .select()
      .maybeSingle();

    if (error) {
      console.error("[Auditar check-in]:", id, error.message);
      return NextResponse.json({ sucesso: false, erro: "Não foi possível salvar a avaliação." }, { status: 500 });
    }
    if (!checkin) {
      return NextResponse.json(
        { sucesso: false, erro: "Entrega não encontrada ou já aprovada." },
        { status: 409 }
      );
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
