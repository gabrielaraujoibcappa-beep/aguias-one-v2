import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import {
  OPERACOES_GATEWAY,
  buscarOperacao,
  montarRota,
  operacoesDespachaveis,
} from "@/lib/api/gateway-registry";

/**
 * Gateway único de operação de todas as funções.
 *
 * GET  /api/gateway[?operacao=nome] → descoberta (lista o catálogo)
 * POST /api/gateway { operacao, params?, query?, body? } → despacha
 *   para a rota interna correspondente, repassando sessão (cookie/Bearer).
 *
 * A autorização final continua em cada rota destino (exigirSessao com
 * papéis). O gateway só exige sessão válida + rate-limit + log.
 */

// Rate-limit simples em memória: 100 req/min por usuário.
const LIMITE_POR_MINUTO = 100;
const JANELA_MS = 60_000;
const consumo = new Map<string, { janela: number; total: number }>();

function rateLimit(chave: string): { bloqueado: boolean; restantes: number } {
  const agora = Date.now();
  const atual = consumo.get(chave);
  if (!atual || agora - atual.janela > JANELA_MS) {
    consumo.set(chave, { janela: agora, total: 1 });
    return { bloqueado: false, restantes: LIMITE_POR_MINUTO - 1 };
  }
  atual.total += 1;
  if (atual.total > LIMITE_POR_MINUTO) return { bloqueado: true, restantes: 0 };
  return { bloqueado: false, restantes: LIMITE_POR_MINUTO - atual.total };
}

function logGateway(dados: Record<string, unknown>) {
  console.log(JSON.stringify({ timestamp: new Date().toISOString(), gateway: true, ...dados }));
}

export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;

  const { searchParams } = new URL(req.url);
  const nome = searchParams.get("operacao");
  if (nome) {
    const op = buscarOperacao(nome);
    if (!op) {
      return NextResponse.json({ sucesso: false, erro: `Operação desconhecida: ${nome}` }, { status: 404 });
    }
    return NextResponse.json({ sucesso: true, operacao: op });
  }

  return NextResponse.json({
    sucesso: true,
    total: OPERACOES_GATEWAY.length,
    despachaveis: operacoesDespachaveis().length,
    operacoes: OPERACOES_GATEWAY,
    uso: {
      listar: "GET /api/gateway",
      detalhar: "GET /api/gateway?operacao=alunos.listar",
      executar: 'POST /api/gateway { "operacao": "alunos.listar", "query": { "turmaId": "..." } }',
    },
  });
}

interface CorpoGateway {
  operacao?: string;
  params?: Record<string, string>;
  query?: Record<string, string | number | boolean>;
  body?: unknown;
}

export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;
  const { sessao } = auth;

  const limite = rateLimit(sessao.usuarioId);
  if (limite.bloqueado) {
    return NextResponse.json(
      { sucesso: false, erro: "Limite do gateway excedido. Tente novamente em 1 minuto." },
      { status: 429, headers: { "Retry-After": "60" } }
    );
  }

  let corpo: CorpoGateway;
  try {
    corpo = (await req.json()) as CorpoGateway;
  } catch {
    return NextResponse.json({ sucesso: false, erro: "Corpo JSON inválido." }, { status: 400 });
  }

  if (!corpo.operacao) {
    return NextResponse.json(
      { sucesso: false, erro: 'Informe "operacao", ex: { "operacao": "alunos.listar" }.' },
      { status: 422 }
    );
  }

  const op = buscarOperacao(corpo.operacao);
  if (!op) {
    return NextResponse.json({ sucesso: false, erro: `Operação desconhecida: ${corpo.operacao}` }, { status: 404 });
  }
  if (!op.viaGateway) {
    return NextResponse.json(
      {
        sucesso: false,
        erro: `Operação ${op.operacao} não é despachável via gateway. Chame ${op.rota} diretamente com a credencial própria.`,
      },
      { status: 403 }
    );
  }

  let caminho: string;
  try {
    caminho = montarRota(op.rota, corpo.params ?? {});
  } catch (err: unknown) {
    const mensagem = err instanceof Error ? err.message : "Parâmetros de rota inválidos.";
    return NextResponse.json({ sucesso: false, erro: mensagem }, { status: 422 });
  }

  const destino = new URL(caminho, req.url);
  for (const [k, v] of Object.entries(corpo.query ?? {})) {
    if (v !== undefined && v !== null) destino.searchParams.set(k, String(v));
  }

  const inicio = Date.now();
  try {
    const repasse: Record<string, string> = { "Content-Type": "application/json" };
    const cookie = req.headers.get("cookie");
    if (cookie) repasse.cookie = cookie;
    const authorization = req.headers.get("authorization");
    // Repassa Bearer de sessão; nunca repassa CRON_SECRET pelo gateway.
    if (authorization && !authorization.includes(process.env.CRON_SECRET ?? "__sem_segredo__")) {
      repasse.authorization = authorization;
    }

    const resposta = await fetch(destino.toString(), {
      method: op.metodo,
      headers: repasse,
      body: op.metodo === "GET" || op.metodo === "DELETE" ? undefined : JSON.stringify(corpo.body ?? {}),
    });

    const texto = await resposta.text();
    let dados: unknown;
    try {
      dados = texto ? JSON.parse(texto) : null;
    } catch {
      dados = { bruto: texto };
    }

    logGateway({
      operacao: op.operacao,
      metodo: op.metodo,
      rota: destino.pathname + destino.search,
      usuarioId: sessao.usuarioId,
      papel: sessao.papel,
      status: resposta.status,
      ms: Date.now() - inicio,
    });

    return NextResponse.json(
      { sucesso: resposta.ok, operacao: op.operacao, status: resposta.status, dados },
      { status: resposta.status, headers: { "X-RateLimit-Remaining": String(limite.restantes) } }
    );
  } catch (err: unknown) {
    const mensagem = err instanceof Error ? err.message : "Falha ao despachar operação.";
    logGateway({ operacao: op.operacao, erro: mensagem, usuarioId: sessao.usuarioId, ms: Date.now() - inicio });
    return NextResponse.json({ sucesso: false, erro: mensagem }, { status: 502 });
  }
}
