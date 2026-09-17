import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, limparCacheMatriculas, PAPEIS_GESTAO } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { dispararEmail, link } from "@/lib/email/disparos";
import { gerarEmailBoasVindas } from "@/lib/email/templates";

export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req, PAPEIS_GESTAO);
  if (auth.erro) return auth.erro;
  try {
    const body = await req.json();
    const {
      nome,
      email,
      senha,
      whatsapp,
      cpf,
      areaPericial,
      turmaId,
      papel = "mentorado",
      status = "ativo",
    } = body;
    if (!["admin", "concierge", "anjo", "mentor", "mentorado"].includes(papel)) {
      return NextResponse.json({ sucesso: false, erro: "Papel inválido." }, { status: 400 });
    }
    if (papel !== "mentorado" && auth.sessao.papel !== "admin") {
      return NextResponse.json(
        { sucesso: false, erro: "Apenas administradores podem criar contas da equipe." },
        { status: 403 }
      );
    }

    // 1. Validação dos campos obrigatórios
    if (!nome || typeof nome !== "string" || nome.trim().length < 3) {
      return NextResponse.json(
        { sucesso: false, erro: "O nome completo deve ter pelo menos 3 caracteres." },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      return NextResponse.json(
        { sucesso: false, erro: "Por favor informe um endereço de email válido." },
        { status: 400 }
      );
    }

    if (!senha || typeof senha !== "string" || senha.length < 6) {
      return NextResponse.json(
        { sucesso: false, erro: "A senha inicial deve conter pelo menos 6 caracteres." },
        { status: 400 }
      );
    }

    if (!whatsapp || typeof whatsapp !== "string" || whatsapp.replace(/\D/g, "").length < 10) {
      return NextResponse.json(
        { sucesso: false, erro: "Por favor informe um número de WhatsApp válido com DDD." },
        { status: 400 }
      );
    }

    // 2. Provisiona o login no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: senha,
      email_confirm: true,
      user_metadata: {
        nome: nome.trim(),
        papel,
        whatsapp,
      },
    });

    if (authError || !authData?.user) {
      const mensagem = authError?.message ?? "";
      if (mensagem.includes("already registered") || mensagem.includes("already been registered")) {
        return NextResponse.json(
          { sucesso: false, erro: "Já existe uma conta cadastrada com este endereço de email." },
          { status: 409 }
        );
      }
      console.error("[Supabase Auth Admin]:", mensagem || "createUser sem usuário");
      return falhaCriacao();
    }
    const authUserId = authData.user.id;

    // 3. Gravação na tabela public.usuarios; se falhar, remove o login recém-criado
    const { data: usuarioDb, error: dbError } = await supabaseAdmin
      .from("usuarios")
      .insert({
        auth_id: authUserId,
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        whatsapp: whatsapp.trim(),
        cpf: cpf ? cpf.trim() : null,
        area_pericial: areaPericial ? areaPericial.trim() : null,
        papel,
      })
      .select()
      .single();

    if (dbError || !usuarioDb) {
      console.error("[Supabase DB usuarios]:", dbError?.message);
      await desfazerCriacao(authUserId, null);
      return falhaCriacao();
    }
    const usuarioCriadoId: string = usuarioDb.id;

    // 4. Vincula a matrícula da turma caso informada (matrícula é exclusiva de mentorados)
    if (turmaId && papel === "mentorado") {
      const { error: matriculaError } = await supabaseAdmin.from("matriculas").insert({
        usuario_id: usuarioCriadoId,
        turma_id: turmaId,
        status,
      });
      limparCacheMatriculas(usuarioCriadoId);
      if (matriculaError) {
        console.error("[Supabase DB matriculas]:", matriculaError.message);
        await desfazerCriacao(authUserId, usuarioCriadoId);
        return falhaCriacao();
      }
    }

    // Boas-vindas sem senha: a senha inicial vai pelo WhatsApp do Concierge
    const { data: turma } = turmaId
      ? await supabaseAdmin.from("turmas").select("nome").eq("id", turmaId).maybeSingle()
      : { data: null };

    await dispararEmail(
      { nome: nome.trim(), email: email.trim().toLowerCase() },
      "boas_vindas",
      "usuario.criado",
      gerarEmailBoasVindas({
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        turmaNome: turma?.nome,
        linkLogin: link("/login"),
      })
    );

    return NextResponse.json({
      sucesso: true,
      mensagem: "Usuário criado e provisionado com sucesso.",
      usuario: {
        id: usuarioCriadoId,
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        whatsapp: whatsapp.trim(),
        cpf: cpf || null,
        areaPericial: areaPericial || null,
        turmaId,
        papel,
        status,
      },
    });
  } catch (err: any) {
    console.error("[Criação de usuário]:", err?.message || err);
    return falhaCriacao();
  }
}

function falhaCriacao() {
  return NextResponse.json(
    { sucesso: false, erro: "Não foi possível criar a conta. Nenhum dado foi gravado; tente novamente." },
    { status: 500 }
  );
}

// Remove o que já foi gravado para não deixar login sem cadastro, nem cadastro sem matrícula
async function desfazerCriacao(authUserId: string, usuarioId: string | null) {
  if (usuarioId) {
    const { error } = await supabaseAdmin.from("usuarios").delete().eq("id", usuarioId);
    if (error) console.error("[Rollback usuarios]:", usuarioId, error.message);
  }
  const { error } = await supabaseAdmin.auth.admin.deleteUser(authUserId);
  if (error) console.error("[Rollback Auth]:", authUserId, error.message);
}
