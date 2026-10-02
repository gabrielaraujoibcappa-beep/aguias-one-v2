import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import {
  PAPEIS_CHAVES,
  gerarTextoChave,
  hashChave,
  mapearChave,
  validarPedidoChave,
  veTodasAsChaves,
} from "@/lib/api/chaves";

/** GET /api/chaves — lista chaves (sem o segredo). Admin e concierge: do time; mentor e anjo: as próprias. */
export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req, [...PAPEIS_CHAVES]);
  if (auth.erro) return auth.erro;

  let consulta = supabaseAdmin
    .from("chaves_api")
    .select("id, nome, prefixo, escopos, expira_em, revogada_em, ultimo_uso_em, criado_em")
    .order("criado_em", { ascending: false });
  if (!veTodasAsChaves(auth.sessao.papel)) consulta = consulta.eq("usuario_id", auth.sessao.usuarioId);
  const { data, error } = await consulta;
  if (error) {
    return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
  }
  return NextResponse.json({ sucesso: true, chaves: (data ?? []).map(mapearChave) });
}

/**
 * POST /api/chaves { nome, expiraDias? } — gera chave e devolve o texto
 * claro UMA única vez. Admin, concierge, mentor e anjo (a chave fica no nome de quem gerou).
 */
export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req, [...PAPEIS_CHAVES]);
  if (auth.erro) return auth.erro;

  let corpo: { nome?: unknown; expiraDias?: unknown };
  try {
    corpo = await req.json();
  } catch {
    return NextResponse.json({ sucesso: false, erro: "Corpo JSON inválido." }, { status: 400 });
  }

  const validado = validarPedidoChave(corpo.nome, corpo.expiraDias ?? 0);
  if ("erro" in validado) {
    return NextResponse.json({ sucesso: false, erro: validado.erro }, { status: 422 });
  }

  const texto = gerarTextoChave();
  const expiraEm =
    validado.expiraDias > 0
      ? new Date(Date.now() + validado.expiraDias * 86_400_000).toISOString()
      : null;

  const { data, error } = await supabaseAdmin
    .from("chaves_api")
    .insert({
      usuario_id: auth.sessao.usuarioId,
      nome: validado.nome,
      prefixo: texto.slice(0, 12),
      hash: hashChave(texto),
      escopos: ["gateway"],
      expira_em: expiraEm,
    })
    .select("id, nome, prefixo, escopos, expira_em, revogada_em, ultimo_uso_em, criado_em")
    .single();

  if (error || !data) {
    return NextResponse.json({ sucesso: false, erro: error?.message ?? "Falha ao gerar chave." }, { status: 500 });
  }

  return NextResponse.json(
    {
      sucesso: true,
      chave: mapearChave(data),
      // ATENÇÃO: exibido uma única vez — a interface mostra com copiar e avisa.
      textoClaro: texto,
      aviso: "Copie agora: este segredo não será exibido novamente.",
    },
    { status: 201 }
  );
}
