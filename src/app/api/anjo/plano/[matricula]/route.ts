import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, podeAcessarMatricula } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { buscarMatricula, erroApi, registrarEvento } from "@/lib/diagnostico/servidor";
import { passouAAtivo, planoDoBanco, validarPlano, type StatusPlano } from "@/lib/acompanhamento/plano";

interface RouteParams {
  params: Promise<{ matricula: string }>;
}

// GET /api/anjo/plano/:matricula — anjo, mentor, admin; mentorado só o próprio
export async function GET(req: NextRequest, { params }: RouteParams) {
  const auth = await exigirSessao(req, ["anjo", "mentor", "admin", "mentorado"]);
  if (auth.erro) return auth.erro;
  try {
    const { matricula: matriculaId } = await params;
    if (auth.sessao.papel === "mentorado" && !podeAcessarMatricula(auth.sessao, matriculaId)) {
      return erroApi(404, { codigo: "nao_encontrado", mensagem: "Plano não encontrado." });
    }
    const { data, error } = await supabaseAdmin.from("anjo_plano").select("*").eq("matricula_id", matriculaId).maybeSingle();
    if (error) return erroApi(500, { codigo: "erro_consulta", mensagem: error.message });

    const plano = planoDoBanco(data);
    // Aluno só vê plano em andamento (rascunho é do Anjo)
    if (auth.sessao.papel === "mentorado" && plano && !["ativo", "reavaliar"].includes(plano.status)) {
      return NextResponse.json({ sucesso: true, plano: null });
    }
    return NextResponse.json({ sucesso: true, plano });
  } catch (err: any) {
    return erroApi(500, { codigo: "erro_interno", mensagem: err?.message || "Erro ao carregar o plano." });
  }
}

// PUT /api/anjo/plano/:matricula — só anjo; upsert enquanto não encerrado
export async function PUT(req: NextRequest, { params }: RouteParams) {
  const auth = await exigirSessao(req, ["anjo"]);
  if (auth.erro) return auth.erro;
  try {
    const { matricula: matriculaId } = await params;
    const matricula = await buscarMatricula(matriculaId);
    if (!matricula) return erroApi(404, { codigo: "nao_encontrado", mensagem: "Matrícula não encontrada." });

    const body = await req.json().catch(() => ({}));
    const validacao = validarPlano(body);
    if (validacao.erro) return erroApi(422, validacao.erro);
    const { plano } = validacao;

    const { data: atual, error: erroAtual } = await supabaseAdmin
      .from("anjo_plano")
      .select("status")
      .eq("matricula_id", matricula.id)
      .maybeSingle();
    if (erroAtual) return erroApi(500, { codigo: "erro_consulta", mensagem: erroAtual.message });
    if (atual?.status === "encerrado") {
      return erroApi(409, { codigo: "plano_encerrado", mensagem: "Plano encerrado não pode ser alterado." });
    }

    const agora = new Date().toISOString();
    const { data, error } = await supabaseAdmin
      .from("anjo_plano")
      .upsert(
        {
          matricula_id: matricula.id,
          tipo: plano.tipo,
          peca_1: plano.peca1,
          evidencia_1: plano.evidencia1,
          data_1: plano.data1,
          peca_2: plano.peca2,
          cadencia_dias: plano.cadenciaDias,
          horario_real: plano.horarioReal,
          status: plano.status,
          atualizado_em: agora,
        },
        { onConflict: "matricula_id" }
      )
      .select("*")
      .single();
    if (error) return erroApi(400, { codigo: "erro_gravacao", mensagem: error.message });

    if (passouAAtivo(atual?.status as StatusPlano | undefined, plano.status)) {
      await registrarEvento("anjo.plano_ativo", {
        matriculaId: matricula.id,
        sessao: auth.sessao,
        dados: { tipo: plano.tipo, data1: plano.data1 },
      });
    }

    return NextResponse.json({ sucesso: true, plano: planoDoBanco(data) });
  } catch (err: any) {
    return erroApi(500, { codigo: "erro_interno", mensagem: err?.message || "Erro ao salvar o plano." });
  }
}
