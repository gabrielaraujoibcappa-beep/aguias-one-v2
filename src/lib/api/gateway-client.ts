/**
 * Client do Gateway (/api/gateway) para as telas.
 *
 * Uso:
 *   const { dados } = await gatewayChamar<{ alunos: Aluno[] }>("alunos.listar", {
 *     query: { turmaId },
 *   });
 */

export interface ChamadaGateway {
  params?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  body?: unknown;
}

export interface RespostaGateway<T = unknown> {
  sucesso: boolean;
  operacao: string;
  status: number;
  dados: T;
  erro?: string;
}

export async function gatewayChamar<T = unknown>(
  operacao: string,
  chamada: ChamadaGateway = {},
  init: RequestInit = {}
): Promise<RespostaGateway<T>> {
  const resposta = await fetch("/api/gateway", {
    ...init,
    method: "POST",
    headers: { "Content-Type": "application/json", ...(init.headers ?? {}) },
    body: JSON.stringify({ operacao, ...chamada }),
  });

  if (!resposta.ok && resposta.status !== 422 && resposta.status !== 404 && resposta.status !== 403) {
    // Mantém o envelope do gateway mesmo em erro HTTP.
  }

  const json = (await resposta.json()) as RespostaGateway<T>;
  if (!json.sucesso) {
    const detalhe =
      typeof json.dados === "object" && json.dados !== null && "erro" in (json.dados as Record<string, unknown>)
        ? String((json.dados as Record<string, unknown>).erro)
        : json.erro;
    throw new Error(detalhe ?? `Falha na operação ${operacao} (HTTP ${json.status}).`);
  }
  return json;
}

export async function gatewayListar(): Promise<{ total: number; operacoes: { operacao: string; metodo: string; rota: string }[] }> {
  const resposta = await fetch("/api/gateway", { method: "GET" });
  const json = await resposta.json();
  return json;
}
