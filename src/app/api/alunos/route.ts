import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const turmaId = searchParams.get("turmaId");
    const status = searchParams.get("status");

    let query = supabaseAdmin
      .from("usuarios")
      .select(`
        id, auth_id, nome, email, whatsapp, cpf, area_pericial, papel, status, criado_em,
        matriculas (
          id, status, matriculado_em, turma_id,
          turmas (id, codigo, nome)
        )
      `)
      .order("nome", { ascending: true });

    if (status && status !== "todos") {
      query = query.eq("status", status);
    }

    const { data: usuarios, error } = await query;

    if (error) {
      return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
    }

    const alunosFormatados = (usuarios || []).map((u) => {
      const matricula = u.matriculas && u.matriculas.length > 0 ? u.matriculas[0] : null;
      const turma = matricula?.turmas as any;

      return {
        id: u.id,
        authId: u.auth_id,
        nome: u.nome,
        email: u.email,
        whatsapp: u.whatsapp,
        cpf: u.cpf,
        areaPericial: u.area_pericial || "Perícia Geral",
        papel: u.papel,
        status: u.status || "ativo",
        matriculaId: matricula?.id || null,
        turmaId: matricula?.turma_id || turma?.id || "",
        turmaNome: turma?.nome || "Sem Turma Vinculada",
      };
    });

    // Filtra por turmaId se fornecido
    const resultado = turmaId && turmaId !== "todas"
      ? alunosFormatados.filter((a) => a.turmaId === turmaId)
      : alunosFormatados;

    return NextResponse.json({ sucesso: true, alunos: resultado });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Encaminha a criação para o endpoint centralizado de criação de usuários
  const body = await req.json();
  const url = new URL("/api/admin/usuarios", req.url);

  return fetch(url.toString(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
