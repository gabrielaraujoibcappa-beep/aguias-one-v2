import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, PAPEIS_GESTAO } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;
  try {
    const { data: turmas, error } = await supabaseAdmin
      .from("turmas")
      .select("*, matriculas (id, status)")
      .order("criado_em", { ascending: false });

    if (error) {
      return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
    }

    const turmasFormatadas = (turmas || []).map((t) => ({
      id: t.id,
      codigo: t.codigo,
      nome: t.nome,
      dataInicio: t.data_inicio,
      dataFim: t.data_fim,
      horarioEncontro: t.horario_encontro,
      limiteVagas: t.limite_vagas,
      status: t.status,
      totalAlunos: (t.matriculas || []).length,
      alunosAtivos: (t.matriculas || []).filter((m: any) => m.status === "ativo").length,
    }));

    return NextResponse.json({ sucesso: true, turmas: turmasFormatadas });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req, PAPEIS_GESTAO);
  if (auth.erro) return auth.erro;
  try {
    const body = await req.json();
    const { nome, codigo, dataInicio, dataFim, horarioEncontro, limiteVagas = 40 } = body;

    if (!nome || !codigo || !dataInicio) {
      return NextResponse.json(
        { sucesso: false, erro: "Nome, código e data de início são obrigatórios." },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseAdmin
      .from("turmas")
      .insert({
        nome: nome.trim(),
        codigo: codigo.trim().toUpperCase(),
        data_inicio: dataInicio,
        data_fim: dataFim || null,
        horario_encontro: horarioEncontro || "Quartas, 18:15 às 19:45",
        limite_vagas: limiteVagas,
        status: "em_andamento",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ sucesso: false, erro: error.message }, { status: 400 });
    }

    return NextResponse.json({ sucesso: true, turma: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
