import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, respostaProibida } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { caminhoPertenceAoUsuario, caminhoSeguro, ehBucketArquivo } from "@/lib/arquivos/regras";

const VALIDADE_LINK_SEGUNDOS = 300;

/**
 * Abre um arquivo privado do Storage: confere a permissão e redireciona para
 * uma URL assinada curta. Equipe abre qualquer arquivo; mentorado, só os próprios.
 */
export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;

  const { searchParams } = new URL(req.url);
  const bucket = searchParams.get("bucket");
  const caminho = searchParams.get("path");
  if (!ehBucketArquivo(bucket) || !caminhoSeguro(caminho)) {
    return NextResponse.json({ sucesso: false, erro: "Arquivo inválido." }, { status: 400 });
  }
  if (!auth.sessao.equipe && !caminhoPertenceAoUsuario(caminho, auth.sessao.usuarioId)) {
    return respostaProibida();
  }

  const { data, error } = await supabaseAdmin.storage.from(bucket).createSignedUrl(caminho, VALIDADE_LINK_SEGUNDOS);
  if (error || !data?.signedUrl) {
    return NextResponse.json({ sucesso: false, erro: "Arquivo não encontrado." }, { status: 404 });
  }

  const resposta = NextResponse.redirect(data.signedUrl, 302);
  resposta.headers.set("Cache-Control", "no-store");
  return resposta;
}
