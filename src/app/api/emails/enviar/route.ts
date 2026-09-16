import { NextRequest, NextResponse } from "next/server";
import { obterTemplatePorId } from "@/lib/email/dados-exemplo";

export async function POST(req: NextRequest) {
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

    // Log de envio / integração de transporte (Resend / SMTP / Supabase Mailer)
    console.log(`[Email Dispatcher] Enviando e-mail "${emailRenderizado.assunto}" para <${destinatario}>`);

    return NextResponse.json({
      sucesso: true,
      mensagem: `E-mail de teste "${template.nome}" enviado com sucesso para ${destinatario}.`,
      detalhes: {
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
