import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import type { PapelUsuario } from "@/lib/auth/roles";

// Parecer: admin, concierge e mentor. Anjo não edita check-in nem faturamento (SPEC diagnóstico §3)
const PAPEIS_PARECER: PapelUsuario[] = ["admin", "concierge", "mentor"];
import { supabaseAdmin } from "@/lib/supabase/admin";
import { destinatarioDaMatricula, dispararEmail, link } from "@/lib/email/disparos";
import { gerarEmailFaturamentoAuditoria } from "@/lib/email/templates";
import { formatarMesReferencia } from "@/lib/api/faturamento";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await exigirSessao(req, PAPEIS_PARECER);
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
      .select("*, matriculas (id)")
      .single();

    if (error) {
      return NextResponse.json({ sucesso: false, erro: error.message }, { status: 400 });
    }

    // Avisa o mentorado do parecer; falha de e-mail não desfaz a auditoria
    if (statusAuditoria !== "pendente") {
      const matriculaId = (faturamento as any).matricula_id ?? (faturamento as any).matriculas?.id;
      const aluno = matriculaId ? await destinatarioDaMatricula(matriculaId) : null;
      if (aluno) {
        await dispararEmail(
          aluno,
          "faturamento_auditoria",
          `faturamento.${statusAuditoria}`,
          gerarEmailFaturamentoAuditoria({
            nome: aluno.nome,
            mesReferencia: formatarMesReferencia((faturamento as any).mes_referencia),
            valorBruto: Number((faturamento as any).valor_bruto) || 0,
            statusAuditoria,
            parecerAuditoria: parecerAuditoria ? String(parecerAuditoria).trim() : undefined,
            linkFaturamento: link("/faturamento"),
          }),
          { matriculaId }
        );
      }
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
