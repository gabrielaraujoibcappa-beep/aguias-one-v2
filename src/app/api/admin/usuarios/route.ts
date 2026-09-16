import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, PAPEIS_GESTAO } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

    let authUserId: string | null = null;
    let usuarioCriadoId: string = `user-${Date.now()}`;

    // 2. Tenta provisionar no Supabase Auth com privilégios de Admin
    try {
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

      if (authError) {
        // Se o erro for de email já cadastrado, informa com clareza
        if (authError.message.includes("already registered") || authError.message.includes("already been registered")) {
          return NextResponse.json(
            { sucesso: false, erro: "Já existe uma conta cadastrada com este endereço de email." },
            { status: 409 }
          );
        }
        console.warn("[Supabase Auth Admin]:", authError.message);
      } else if (authData?.user) {
        authUserId = authData.user.id;
        usuarioCriadoId = authData.user.id;
      }
    } catch (authErr: any) {
      console.warn("[Supabase Auth Exceção]:", authErr?.message || authErr);
    }

    // 3. Gravação na tabela public.usuarios
    try {
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

      if (!dbError && usuarioDb) {
        usuarioCriadoId = usuarioDb.id;

        // 4. Vincula a matrícula da turma caso informada (matrícula é exclusiva de mentorados)
        if (turmaId && papel === "mentorado") {
          await supabaseAdmin.from("matriculas").insert({
            usuario_id: usuarioDb.id,
            turma_id: turmaId,
            status,
          });
        }
      }
    } catch (dbErr: any) {
      console.warn("[Supabase DB Exceção]:", dbErr?.message || dbErr);
    }

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
    return NextResponse.json(
      { sucesso: false, erro: err?.message || "Erro interno ao processar criação de conta." },
      { status: 500 }
    );
  }
}
