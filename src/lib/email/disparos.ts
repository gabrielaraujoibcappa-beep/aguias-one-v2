/**
 * Disparo de e-mail por evento do sistema (somente servidor).
 *
 * Regras destes disparos:
 * - nunca derrubam a operação principal: falha de e-mail vira log, não erro na tela;
 * - todo envio, com sucesso ou falha, é registrado em public.emails_enviados;
 * - sem RESEND_API_KEY o envio é pulado, o que mantém o ambiente local silencioso.
 */
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ResultadoEmail } from "./templates";
import { enviarEmail, resendConfigurado } from "./resend";
import { link } from "@/lib/url-sistema";

export interface DestinatarioEmail {
  nome: string;
  email: string | null | undefined;
}

export { link, urlBase, URL_SISTEMA } from "@/lib/url-sistema";

async function registrarEnvio(params: {
  destinatario: string;
  templateId: string;
  email: ResultadoEmail;
  resendId: string | null;
  erro: string | null;
  evento: string;
  matriculaId?: string | null;
}) {
  const { error } = await supabaseAdmin.from("emails_enviados").insert({
    destinatario: params.destinatario,
    template_id: params.templateId,
    assunto: params.email.assunto,
    corpo_html: params.email.html,
    status: params.erro ? "falha" : "enviado",
    metadados: {
      canal: "email",
      provedor: "resend",
      origem: "evento",
      evento: params.evento,
      matricula_id: params.matriculaId ?? null,
      resend_id: params.resendId,
      erro: params.erro,
    },
  });
  if (error) console.error("[emails_enviados]", params.evento, error.message);
}

export interface ResultadoDisparo {
  enviado: boolean;
  motivo?: "sem_destinatario" | "sem_configuracao" | "falha_envio";
}

/**
 * Envia o e-mail do evento e registra o resultado. Devolve o que aconteceu para
 * quem quiser registrar, mas quem chama não precisa tratar: nada aqui lança erro.
 */
export async function dispararEmail(
  destinatario: DestinatarioEmail,
  templateId: string,
  evento: string,
  email: ResultadoEmail,
  opcoes: { matriculaId?: string | null } = {}
): Promise<ResultadoDisparo> {
  try {
    const para = destinatario.email?.trim();
    if (!para || !para.includes("@")) {
      console.warn("[E-mail]", evento, "sem endereço de destino");
      return { enviado: false, motivo: "sem_destinatario" };
    }
    if (!resendConfigurado()) {
      console.warn("[E-mail]", evento, "pulado: RESEND_API_KEY ausente");
      return { enviado: false, motivo: "sem_configuracao" };
    }

    let resendId: string | null = null;
    let erro: string | null = null;
    try {
      const { id } = await enviarEmail({
        para,
        assunto: email.assunto,
        html: email.html,
        texto: email.textoPuro,
        tags: { template: templateId, evento },
      });
      resendId = id;
    } catch (e: any) {
      erro = e?.message || "Falha desconhecida no envio.";
      console.error("[E-mail]", evento, "falhou:", erro);
    }

    await registrarEnvio({
      destinatario: para,
      templateId,
      email,
      resendId,
      erro,
      evento,
      matriculaId: opcoes.matriculaId,
    });

    return erro ? { enviado: false, motivo: "falha_envio" } : { enviado: true };
  } catch (e: any) {
    // Nenhuma falha de e-mail pode derrubar a operação que o disparou
    console.error("[E-mail]", evento, "erro inesperado:", e?.message || e);
    return { enviado: false, motivo: "falha_envio" };
  }
}

/** Dados do mentorado de uma matrícula, para endereçar o e-mail. */
export async function destinatarioDaMatricula(
  matriculaId: string
): Promise<(DestinatarioEmail & { matriculaId: string }) | null> {
  const { data, error } = await supabaseAdmin
    .from("matriculas")
    .select("id, usuarios (nome, email)")
    .eq("id", matriculaId)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[E-mail] destinatário da matrícula", matriculaId, error.message);
    return null;
  }
  const usuario = (data as any).usuarios;
  return usuario ? { nome: usuario.nome, email: usuario.email, matriculaId: data.id } : null;
}
