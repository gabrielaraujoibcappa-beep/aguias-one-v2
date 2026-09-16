import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { turmaId, moduloId, moduloNumero, status = "liberado", liberadoPorEmail } = body;

    let targetModuloId = moduloId;

    // Se passou moduloNumero em vez de UUID
    if (!targetModuloId && moduloNumero) {
      const { data: mod } = await supabaseAdmin
        .from("modulos")
        .select("id")
        .eq("numero", moduloNumero)
        .single();
      targetModuloId = mod?.id;
    }

    if (!turmaId || !targetModuloId) {
      return NextResponse.json(
        { sucesso: false, erro: "turmaId e moduloId (ou moduloNumero) são obrigatórios." },
        { status: 400 }
      );
    }

    // Busca usuário que realizou a liberação se fornecido
    let liberadoPorId: string | null = null;
    if (liberadoPorEmail) {
      const { data: u } = await supabaseAdmin
        .from("usuarios")
        .select("id")
        .eq("email", liberadoPorEmail.toLowerCase())
        .maybeSingle();
      liberadoPorId = u?.id || null;
    }

    // Upsert na tabela public.modulo_liberacoes
    const { data: upsertData, error } = await supabaseAdmin
      .from("modulo_liberacoes")
      .upsert(
        {
          turma_id: turmaId,
          modulo_id: targetModuloId,
          status,
          liberado_por: liberadoPorId,
          liberado_em: new Date().toISOString(),
        },
        { onConflict: "turma_id,modulo_id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ sucesso: false, erro: error.message }, { status: 400 });
    }

    return NextResponse.json({
      sucesso: true,
      liberacao: upsertData,
      mensagem: `Módulo ${status === "liberado" ? "liberado" : "bloqueado"} com sucesso.`,
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
