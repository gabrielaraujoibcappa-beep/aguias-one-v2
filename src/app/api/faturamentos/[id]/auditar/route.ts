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
    const { statusAuditoria, parecerAuditoria } = body;

    if (!statusAuditoria || !["aprovado", "ajuste_solicitado", "pendente"].includes(statusAuditoria)) {
      return NextResponse.json(
        { sucesso: false, erro: "O status de auditoria deve ser 'aprovado', 'ajuste_solicitado' ou 'pendente'." },
        { status: 400 }
      );
    }

    // Auditor é sempre o usuário autenticado (e-mail do body não é confiável)
    const auditadoPorId: string | null = auth.sessao.usuarioId;

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
