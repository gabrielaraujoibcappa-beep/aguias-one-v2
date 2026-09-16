import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, PAPEIS_EQUIPE } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";

const STATUS_VALIDOS = ["presente", "falta", "justificada"];

// PUT /api/chamadas/:encontroId/presencas → grava (upsert) a chamada do encontro
export async function PUT(req: NextRequest, { params }: { params: { encontroId: string } }) {
  const auth = await exigirSessao(req, PAPEIS_EQUIPE);
  if (auth.erro) return auth.erro;
  try {
    const { presencas } = await req.json();

    if (!Array.isArray(presencas) || presencas.some((p) => !p?.matricula_id || !STATUS_VALIDOS.includes(p?.status))) {
      return NextResponse.json({ sucesso: false, erro: "Lista de presenças inválida." }, { status: 400 });
    }

    const { data: encontro, error: erroEncontro } = await supabaseAdmin
      .from("encontros_turma")
      .select("id, turma_id")
      .eq("id", params.encontroId)
      .maybeSingle();

    if (erroEncontro) {
      return NextResponse.json({ sucesso: false, erro: erroEncontro.message }, { status: 500 });
    }
    if (!encontro) {
      return NextResponse.json({ sucesso: false, erro: "Encontro não encontrado." }, { status: 404 });
    }

    // Só aceita matrículas de mentorados da própria turma do encontro
    const { data: matriculas, error: erroMatriculas } = await supabaseAdmin
      .from("matriculas")
      .select("id, usuarios (papel)")
      .eq("turma_id", encontro.turma_id);

    if (erroMatriculas) {
      return NextResponse.json({ sucesso: false, erro: erroMatriculas.message }, { status: 500 });
    }

    const idsDaTurma = new Set(
      (matriculas || []).filter((m: any) => m.usuarios?.papel === "mentorado").map((m: any) => m.id)
    );
    if (presencas.some((p) => !idsDaTurma.has(p.matricula_id))) {
      return NextResponse.json(
        { sucesso: false, erro: "Há alunos que não pertencem à turma deste encontro." },
        { status: 400 }
      );
    }

    if (presencas.length > 0) {
      const { error } = await supabaseAdmin.from("presencas_encontro").upsert(
        presencas.map((p) => ({ encontro_id: encontro.id, matricula_id: p.matricula_id, status: p.status })),
        { onConflict: "encontro_id,matricula_id" }
      );
      if (error) {
        return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
      }
    }

    await supabaseAdmin
      .from("encontros_turma")
      .update({ status: "realizado", atualizado_em: new Date().toISOString() })
      .eq("id", encontro.id);

    return NextResponse.json({ sucesso: true });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
