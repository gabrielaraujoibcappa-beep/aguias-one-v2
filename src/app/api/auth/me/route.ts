import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    let authId: string | null = null;
    let email: string | null = null;

    // 1. Tenta extrair token do cabeçalho Authorization ou cookies
    const authHeader = req.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const { data: authData } = await supabaseAdmin.auth.getUser(token);
      if (authData?.user) {
        authId = authData.user.id;
        email = authData.user.email || null;
      }
    }

    // 2. Se não veio pelo header, tenta pelos cookies da sessão
    if (!authId) {
      const cookieHeader = req.headers.get("cookie") || "";
      const matchToken = cookieHeader.match(/sb-[^=]+-auth-token=([^;]+)/);
      if (matchToken) {
        try {
          const decoded = decodeURIComponent(matchToken[1]);
          const parsed = JSON.parse(decoded);
          const accessToken = Array.isArray(parsed) ? parsed[0] : parsed?.access_token;
          if (accessToken) {
            const { data } = await supabaseAdmin.auth.getUser(accessToken);
            if (data?.user) {
              authId = data.user.id;
              email = data.user.email || null;
            }
          }
        } catch {
          // segue para fallback
        }
      }
    }

    // 3. Fallback de busca por query param (para testes/integração)
    if (!authId && !email) {
      const searchEmail = req.nextUrl.searchParams.get("email");
      if (searchEmail) {
        email = searchEmail;
      }
    }

    // Se nenhum identificador for encontrado
    if (!authId && !email) {
      return NextResponse.json(
        { autenticado: false, usuario: null },
        { status: 200 }
      );
    }

    // 4. Busca dados do perfil em public.usuarios
    let query = supabaseAdmin.from("usuarios").select("*");
    if (authId) {
      query = query.eq("auth_id", authId);
    } else if (email) {
      query = query.eq("email", email.toLowerCase());
    }

    const { data: usuario, error: userError } = await query.maybeSingle();

    if (userError || !usuario) {
      return NextResponse.json(
        { autenticado: false, usuario: null, erro: "Perfil de usuário não encontrado no banco." },
        { status: 200 }
      );
    }

    // 5. Busca matrículas e turmas ativas
    const { data: matriculas } = await supabaseAdmin
      .from("matriculas")
      .select("id, status, matriculado_em, turma_id, turmas (id, codigo, nome, status)")
      .eq("usuario_id", usuario.id);

    const matriculaAtiva = matriculas && matriculas.length > 0 ? matriculas[0] : null;

    return NextResponse.json({
      autenticado: true,
      usuario: {
        id: usuario.id,
        authId: usuario.auth_id,
        nome: usuario.nome,
        email: usuario.email,
        whatsapp: usuario.whatsapp,
        cpf: usuario.cpf,
        areaPericial: usuario.area_pericial,
        papel: usuario.papel,
        status: usuario.status || "ativo",
        matriculaId: matriculaAtiva?.id || null,
        turma: matriculaAtiva?.turmas || null,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { autenticado: false, erro: err?.message || "Erro ao identificar usuário logado." },
      { status: 500 }
    );
  }
}
