import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { statusAuditoria, parecerAuditoria, auditadoPorEmail } = body;

    if (!statusAuditoria || !["aprovado", "ajuste_solicitado", "pendente"].includes(statusAuditoria)) {
      return NextResponse.json(
        { sucesso: false, erro: "O status de auditoria deve ser 'aprovado', 'ajuste_solicitado' ou 'pendente'." },
        { status: 400 }
      );
    }

    let auditadoPorId: string | null = null;
    if (auditadoPorEmail) {
      const { data: u } = await supabaseAdmin
        .from("usuarios")
        .select("id")
        .eq("email", auditadoPorEmail.toLowerCase())
        .maybeSingle();
      auditadoPorId = u?.id || null;
    }

    const { data: faturamento, error } = await supabaseAdmin
      .from("faturamentos")
      .update({
        status_auditoria: statusAuditoria,
        parecer_auditoria: parecerAuditoria ? parecerAuditoria.trim() : null,
        auditado_por: auditadoPorId,
        auditado_em: new Date().toISOString(),
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
      faturamento,
      mensagem: `Auditoria de faturamento concluída: ${statusAuditoria}.`,
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
