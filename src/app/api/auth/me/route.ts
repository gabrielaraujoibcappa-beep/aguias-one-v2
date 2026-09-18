import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/auth/me → perfil do usuário autenticado (nunca de terceiros)
export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req, undefined, { permitirBloqueado: true });
  if (auth.erro) {
    return NextResponse.json({ autenticado: false, usuario: null }, { status: auth.erro.status });
  }
  const { sessao } = auth;

  try {
    const [{ data: usuario }, { data: matriculas }] = await Promise.all([
      supabaseAdmin.from("usuarios").select("whatsapp, cpf, area_pericial").eq("id", sessao.usuarioId).maybeSingle(),
      supabaseAdmin
        .from("matriculas")
        .select("id, status, meta_faturamento_anual, turmas (id, codigo, nome, status)")
        .eq("usuario_id", sessao.usuarioId)
        .order("matriculado_em", { ascending: false })
        .limit(1),
    ]);

    const matricula = matriculas?.[0] ?? null;

    return NextResponse.json({
      autenticado: true,
      usuario: {
        id: sessao.usuarioId,
        authId: sessao.authId,
        nome: sessao.nome,
        email: sessao.email,
        whatsapp: usuario?.whatsapp ?? null,
        cpf: usuario?.cpf ?? null,
        areaPericial: usuario?.area_pericial ?? null,
        papel: sessao.papel,
        status: sessao.status,
        precisaTrocarSenha: sessao.precisaTrocarSenha,
        matriculaId: matricula?.id ?? null,
        metaFaturamentoAnual:
          (matricula as any)?.meta_faturamento_anual != null ? Number((matricula as any).meta_faturamento_anual) : null,
        turma: matricula?.turmas ?? null,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { autenticado: false, erro: err?.message || "Erro ao identificar usuário logado." },
      { status: 500 }
    );
  }
}
