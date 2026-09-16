import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { buscarMatricula, erroApi } from "@/lib/diagnostico/servidor";

interface RouteParams {
  params: Promise<{ matricula: string }>;
}

// POST /api/anjo/notas/:matricula { corpo } → nota append-only (anjo ou mentor)
export async function POST(req: NextRequest, { params }: RouteParams) {
  const auth = await exigirSessao(req, ["anjo", "mentor"]);
  if (auth.erro) return auth.erro;
  try {
    const { matricula: matriculaId } = await params;
    const body = await req.json().catch(() => ({}));
    const corpo = typeof body?.corpo === "string" ? body.corpo.trim() : "";
    if (corpo.length < 3 || corpo.length > 4000) {
      return erroApi(422, { codigo: "corpo_invalido", mensagem: "A nota precisa ter entre 3 e 4.000 caracteres.", campo: "corpo" });
    }
    const matricula = await buscarMatricula(matriculaId);
    if (!matricula) return erroApi(404, { codigo: "nao_encontrado", mensagem: "Matrícula não encontrada." });

    const { data, error } = await supabaseAdmin
      .from("anjo_nota")
      .insert({ matricula_id: matricula.id, corpo, autor_id: auth.sessao.usuarioId })
      .select("id, corpo, criado_em")
      .single();
    if (error) return erroApi(400, { codigo: "erro_gravacao", mensagem: error.message });

    return NextResponse.json({
      sucesso: true,
      nota: { id: data.id, corpo: data.corpo, criadoEm: data.criado_em, autor: auth.sessao.nome, autorPapel: auth.sessao.papel },
    });
  } catch (err: any) {
    return erroApi(500, { codigo: "erro_interno", mensagem: err?.message || "Erro ao gravar a nota." });
  }
}
