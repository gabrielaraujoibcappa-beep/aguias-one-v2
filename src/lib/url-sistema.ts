/**
 * Endereço público do sistema. Fica em um módulo próprio para servir tanto ao
 * servidor (links dos e-mails) quanto ao navegador (mensagem de acesso, metadados),
 * sem criar dependência circular entre e-mail e templates.
 */
export const URL_SISTEMA = "https://mentoria.one.axelpro.com.br";

/** Base efetiva: a variável de ambiente vence, para ambientes de teste e prévia. */
export function urlBase(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL || URL_SISTEMA).replace(/\/$/, "");
}

/** Link absoluto para um caminho do sistema. */
export function link(caminho: string): string {
  return `${urlBase()}${caminho.startsWith("/") ? caminho : `/${caminho}`}`;
}
