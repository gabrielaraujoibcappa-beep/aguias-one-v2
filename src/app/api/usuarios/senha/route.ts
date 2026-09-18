import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * POST /api/usuarios/senha { novaSenha } — o próprio usuário troca a senha.
 * Limpa `precisa_trocar_senha`, liberando o acesso total.
 */
export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;
  try {
    if (!auth.sessao.authId) {
      return NextResponse.json(
        { sucesso: false, erro: "Conta sem vínculo de acesso. Fale com a coordenação." },
        { status: 400 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const novaSenha = typeof body?.novaSenha === "string" ? body.novaSenha : "";
    if (novaSenha.length < 6) {
      return NextResponse.json(
        { sucesso: false, erro: "A nova senha deve conter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    const { error: authErro } = await supabaseAdmin.auth.admin.updateUserById(auth.sessao.authId, {
      password: novaSenha,
    });
    if (authErro) {
      return NextResponse.json({ sucesso: false, erro: "Não foi possível trocar a senha. Tente novamente." }, { status: 500 });
    }

    const { error: dbErro } = await supabaseAdmin
      .from("usuarios")
      .update({ precisa_trocar_senha: false })
      .eq("id", auth.sessao.usuarioId);
    if (dbErro) {
      console.error("[Troca de senha]:", dbErro.message);
      return NextResponse.json({ sucesso: false, erro: "Senha trocada, mas a liberação falhou. Faça login novamente." }, { status: 500 });
    }

    return NextResponse.json({ sucesso: true, mensagem: "Senha atualizada com sucesso." });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: "Não foi possível trocar a senha." }, { status: 500 });
  }
}
