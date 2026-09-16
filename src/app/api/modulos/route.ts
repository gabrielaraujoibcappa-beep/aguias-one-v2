import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;
  try {
    const { searchParams } = new URL(req.url);
    // Mentorado vê apenas a própria turma
    let turmaId = auth.sessao.equipe ? searchParams.get("turmaId") : auth.sessao.turmaIds[0] ?? null;
    if (!auth.sessao.equipe && !turmaId) {
      return NextResponse.json({ sucesso: true, turmaId: null, modulos: [] });
    }

    // Se turmaId não foi passada, pega a primeira turma em andamento
    if (!turmaId) {
      const { data: primeiraTurma } = await supabaseAdmin
        .from("turmas")
        .select("id")
        .eq("status", "em_andamento")
        .limit(1)
        .maybeSingle();

      turmaId = primeiraTurma?.id || null;
    }

    // 1. Busca os 10 módulos
    const { data: modulos, error: errMod } = await supabaseAdmin
      .from("modulos")
      .select("*")
      .order("ordem", { ascending: true });

    if (errMod) {
      return NextResponse.json({ sucesso: false, erro: errMod.message }, { status: 500 });
    }

    // 2. Busca as liberações da turma
    let liberacoesMap: Record<string, any> = {};
    if (turmaId) {
      const { data: liberacoes } = await supabaseAdmin
        .from("modulo_liberacoes")
        .select("modulo_id, status, liberado_em, liberado_por, usuarios (nome)")
        .eq("turma_id", turmaId);

      (liberacoes || []).forEach((lib) => {
        liberacoesMap[lib.modulo_id] = lib;
      });
    }

    const modulosComStatus = (modulos || []).map((m) => {
      const lib = liberacoesMap[m.id];
      // Módulo 1 é liberado por padrão no início do ciclo
      const liberado = lib ? lib.status === "liberado" : m.numero === 1;

      return {
        id: m.id,
        numero: m.numero,
        titulo: m.titulo,
        descricao: m.descricao,
        disciplinaRef: m.disciplina_ref,
        ordem: m.ordem,
        itensRoteiro: m.itens_roteiro || [],
        liberado,
        status: liberado ? "liberado" : "bloqueado",
        liberadoEm: lib?.liberado_em || null,
        liberadoPorNome: (lib?.usuarios as any)?.nome || null,
      };
    });

    return NextResponse.json({
      sucesso: true,
      turmaId,
      modulos: modulosComStatus,
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
