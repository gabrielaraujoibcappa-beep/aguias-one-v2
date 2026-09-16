/**
 * Envio de e-mails transacionais via API REST da Resend (somente servidor).
 * Requer RESEND_API_KEY; o remetente deve pertencer a um domínio verificado na Resend.
 */

const RESEND_API_URL = "https://api.resend.com/emails";
const REMETENTE_PADRAO = "Aguias One <nao-responda@contrateumperito.com.br>";

export interface EnvioEmail {
  para: string | string[];
  assunto: string;
  html: string;
  texto?: string;
  responderPara?: string;
  /** Tags de rastreio na Resend (apenas letras, números, _ e -) */
  tags?: Record<string, string>;
}

export class ErroEnvioEmail extends Error {
  constructor(mensagem: string, public status?: number) {
    super(mensagem);
    this.name = "ErroEnvioEmail";
  }
}

export function resendConfigurado(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

const sanitizarTag = (valor: string) => valor.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 256);

/** Envia o e-mail e devolve o id gerado pela Resend. */
export async function enviarEmail(envio: EnvioEmail): Promise<{ id: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new ErroEnvioEmail("RESEND_API_KEY não configurada no servidor.");
  }

  const res = await fetch(RESEND_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_REMETENTE || REMETENTE_PADRAO,
      to: Array.isArray(envio.para) ? envio.para : [envio.para],
      subject: envio.assunto,
      html: envio.html,
      text: envio.texto,
      reply_to: envio.responderPara || process.env.EMAIL_RESPONDER_PARA || undefined,
      tags: envio.tags
        ? Object.entries(envio.tags).map(([name, value]) => ({ name: sanitizarTag(name), value: sanitizarTag(value) }))
        : undefined,
    }),
    cache: "no-store",
  });

  const json = await res.json().catch(() => null);
  if (!res.ok || !json?.id) {
    throw new ErroEnvioEmail(json?.message || `Resend respondeu com status ${res.status}.`, res.status);
  }
  return { id: json.id };
}
