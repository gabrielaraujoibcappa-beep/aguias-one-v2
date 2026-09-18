import { randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, PAPEIS_GESTAO } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";

/** Senha temporária legível para repasse por WhatsApp (8 caracteres). */
export function gerarSenhaTemporaria(): string {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let senha = "AG";
  for (let i = 0; i < 4; i++) senha += String(randomInt(0, 10));
  for (let i = 0; i < 2; i++) senha += letras[randomInt(0, letras.length)];
  return senha;
}

/**
 * POST /api/admin/usuarios/reset-senha { usuarioId } — equipe gera senha
 * temporária para o usuário e marca troca obrigatória no próximo login.
 * A senha volta na resposta para repasse (WhatsApp); nunca por e-mail.
 */
export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req, PAPEIS_GESTAO);
  if (auth.erro) return auth.erro;
  try {
    const body = await req.json().catch(() => ({}));
    const usuarioId = typeof body?.usuarioId === "string" ? body.usuarioId : "";
    if (!usuarioId) {
      return NextResponse.json({ sucesso: false, erro: "Informe o usuário." }, { status: 400 });
    }

    const { data: alvo, error: buscaErro } = await supabaseAdmin
      .from("usuarios")
      .select("id, auth_id, nome")
      .eq("id", usuarioId)
      .maybeSingle();
    if (buscaErro || !alvo) {
      return NextResponse.json({ sucesso: false, erro: "Usuário não encontrado." }, { status: 404 });
    }
    if (!alvo.auth_id) {
      return NextResponse.json(
        { sucesso: false, erro: "Conta sem vínculo de acesso. Fale com a coordenação." },
        { status: 400 }
      );
    }

    const senhaTemporaria = gerarSenhaTemporaria();
    const { error: authErro } = await supabaseAdmin.auth.admin.updateUserById(alvo.auth_id, {
      password: senhaTemporaria,
    });
    if (authErro) {
      return NextResponse.json({ sucesso: false, erro: "Não foi possível redefinir a senha." }, { status: 500 });
    }

    const { error: dbErro } = await supabaseAdmin
      .from("usuarios")
      .update({ precisa_trocar_senha: true })
      .eq("id", usuarioId);
    if (dbErro) {
      console.error("[Reset de senha]:", dbErro.message);
    }

    return NextResponse.json({
      sucesso: true,
      mensagem: `Senha temporária gerada para ${alvo.nome}. Repasse pelo WhatsApp: ele trocará no próximo login.`,
      senhaTemporaria,
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: "Não foi possível redefinir a senha." }, { status: 500 });
  }
}
