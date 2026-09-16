import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, PAPEIS_EQUIPE } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/chamadas?turmaId=... → encontros, alunos matriculados e presenças da turma
export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req, PAPEIS_EQUIPE);
  if (auth.erro) return auth.erro;
  try {
    const turmaId = new URL(req.url).searchParams.get("turmaId");
    if (!turmaId) {
      return NextResponse.json({ sucesso: false, erro: "turmaId é obrigatório." }, { status: 400 });
    }

    // Se não é um UUID válido (ex: vindo de mock local), retorna vazio
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(turmaId)) {
      return NextResponse.json({ sucesso: true, encontros: [], alunos: [], presencas: [] });
    }

    const [encontrosRes, matriculasRes] = await Promise.all([
      supabaseAdmin
        .from("encontros_turma")
        .select("*")
        .eq("turma_id", turmaId)
        .order("data_encontro", { ascending: false }),
      supabaseAdmin
        .from("matriculas")
        .select("id, status, matriculado_em, usuarios (nome, email, whatsapp, area_pericial)")
        .eq("turma_id", turmaId)
        .order("matriculado_em", { ascending: true }),
    ]);

    const erro = encontrosRes.error || matriculasRes.error;
    if (erro) {
      return NextResponse.json({ sucesso: false, erro: erro.message }, { status: 500 });
    }

    const encontros = encontrosRes.data || [];
    let presencas: any[] = [];
    if (encontros.length > 0) {
      const { data, error } = await supabaseAdmin
        .from("presencas_encontro")
        .select("id, encontro_id, matricula_id, status, criado_em")
        .in("encontro_id", encontros.map((e) => e.id));
      if (error) {
        return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
      }
      presencas = data || [];
    }

    const alunos = (matriculasRes.data || [])
      .map((m: any) => ({
        matricula_id: m.id,
        status: m.status,
        matriculado_em: m.matriculado_em,
        nome: m.usuarios?.nome ?? "",
        email: m.usuarios?.email ?? "",
        whatsapp: m.usuarios?.whatsapp ?? null,
        area_pericial: m.usuarios?.area_pericial ?? null,
      }));

    return NextResponse.json({ sucesso: true, encontros, alunos, presencas });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}

// POST /api/chamadas → cria um encontro na turma
export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req, PAPEIS_EQUIPE);
  if (auth.erro) return auth.erro;
  try {
    const { turma_id, titulo, data_encontro, observacoes } = await req.json();

    if (!turma_id || !titulo?.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(data_encontro ?? "")) {
      return NextResponse.json(
        { sucesso: false, erro: "Informe turma, título e data (AAAA-MM-DD)." },
        { status: 400 }
      );
    }

    // Rejeita IDs mock (não-UUID) vindos do store local
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!UUID_RE.test(turma_id)) {
      return NextResponse.json(
        { sucesso: false, erro: "ID da turma inválido. Atualize a página para sincronizar com o servidor." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("encontros_turma")
      .insert({ turma_id, titulo: titulo.trim(), data_encontro, observacoes })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
    }

    return NextResponse.json({ sucesso: true, encontro: data });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
