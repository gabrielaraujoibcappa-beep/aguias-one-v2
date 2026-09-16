import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, PAPEIS_EQUIPE } from "@/lib/auth/sessao-api";
import { obterTemplatePorId } from "@/lib/email/dados-exemplo";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { enviarEmail } from "@/lib/email/resend";

export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req, PAPEIS_EQUIPE);
  if (auth.erro) return auth.erro;
  try {
    const body = await req.json();
    const { destinatario, templateId } = body;

    if (!destinatario || !destinatario.includes("@")) {
      return NextResponse.json(
        { sucesso: false, erro: "Por favor informe um endereço de e-mail válido para envio." },
        { status: 400 }
      );
    }

    if (!templateId) {
      return NextResponse.json(
        { sucesso: false, erro: "O templateId é obrigatório." },
        { status: 400 }
      );
    }

    const template = obterTemplatePorId(templateId);
    if (!template) {
      return NextResponse.json(
        { sucesso: false, erro: `Template '${templateId}' não encontrado.` },
        { status: 404 }
      );
    }

    const emailRenderizado = template.renderizar();

    // Envio real via Resend
    let resendId: string | null = null;
    let erroEnvio: string | null = null;
    try {
      const resultado = await enviarEmail({
        para: destinatario.trim(),
        assunto: emailRenderizado.assunto,
        html: emailRenderizado.html,
        texto: emailRenderizado.textoPuro,
        tags: { template: templateId, categoria: template.categoria },
      });
      resendId = resultado.id;
    } catch (e: any) {
      erroEnvio = e?.message || "Falha desconhecida no envio.";
      console.error("[Email Dispatcher] Falha no envio via Resend:", erroEnvio);
    }

    // Log de envio / gravação na tabela de auditoria public.emails_enviados
    let logId: string | null = null;
    try {
      const { data: logData, error: logError } = await supabaseAdmin
        .from("emails_enviados")
        .insert({
          destinatario,
          template_id: templateId,
          assunto: emailRenderizado.assunto,
          corpo_html: emailRenderizado.html,
          status: erroEnvio ? "falha" : "enviado",
          metadados: {
            preheader: emailRenderizado.preheader,
            canal: "email",
            categoria: template.categoria,
            provedor: "resend",
            resend_id: resendId,
            erro: erroEnvio,
            enviado_por: auth.sessao.email,
          },
        })
        .select("id")
        .single();

      if (!logError && logData) {
        logId = logData.id;
      } else if (logError) {
        console.warn("[Email Dispatcher] Aviso ao gravar log no Supabase:", logError.message);
      }
    } catch (e: any) {
      console.warn("[Email Dispatcher] Erro ao persistir log:", e.message);
    }

    if (erroEnvio) {
      return NextResponse.json(
        { sucesso: false, erro: `Não foi possível enviar o e-mail: ${erroEnvio}`, detalhes: { id: logId } },
        { status: 502 }
      );
    }

    console.log(`[Email Dispatcher] Enviado "${emailRenderizado.assunto}" para <${destinatario}> (resend: ${resendId}, log: ${logId || "local"})`);

    return NextResponse.json({
      sucesso: true,
      mensagem: `E-mail de teste "${template.nome}" enviado com sucesso para ${destinatario}.`,
      detalhes: {
        id: logId,
        resendId,
        destinatario,
        assunto: emailRenderizado.assunto,
        preheader: emailRenderizado.preheader,
        enviadoEm: new Date().toISOString(),
      },
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
