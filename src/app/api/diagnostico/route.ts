import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sanearPayload } from "@/lib/diagnostico/regras";
import {
  aplicarCiclo,
  buscarOuCriarDiagnostico,
  erroApi,
  matriculaDoAluno,
  respostaAluno,
  type LinhaDiagnostico,
} from "@/lib/diagnostico/servidor";

// GET /api/diagnostico → rascunho ou enviado do próprio aluno
export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req, ["mentorado"]);
  if (auth.erro) return auth.erro;
  try {
    const matricula = await matriculaDoAluno(auth.sessao);
    if (!matricula) return erroApi(404, { codigo: "sem_matricula", mensagem: "Você não tem matrícula ativa." });
    const diag = await aplicarCiclo(await buscarOuCriarDiagnostico(matricula.id), matricula);
    return NextResponse.json(respostaAluno(diag, matricula));
  } catch (err: any) {
    return erroApi(500, { codigo: "erro_interno", mensagem: err?.message || "Erro ao carregar o placar." });
  }
}

// PUT /api/diagnostico { campos } → salva rascunho (a cada bloco)
export async function PUT(req: NextRequest) {
  const auth = await exigirSessao(req, ["mentorado"]);
  if (auth.erro) return auth.erro;
  try {
    const matricula = await matriculaDoAluno(auth.sessao);
    if (!matricula) return erroApi(404, { codigo: "sem_matricula", mensagem: "Você não tem matrícula ativa." });
    const diag = await aplicarCiclo(await buscarOuCriarDiagnostico(matricula.id), matricula);

    if (diag.status !== "rascunho") {
      return erroApi(409, {
        codigo: diag.status === "congelado" ? "congelado" : "ja_enviado",
        mensagem:
          diag.status === "congelado"
            ? "O placar está congelado. Correções só pela coordenação."
            : "O placar já foi enviado. Use “corrigir” para alterar.",
      });
    }

    const body = await req.json().catch(() => ({}));
    const payload = sanearPayload(body?.campos, matricula.matriculado_em);
    const { data, error } = await supabaseAdmin
      .from("diagnostico")
      .update({ payload, atualizado_em: new Date().toISOString() })
      .eq("id", diag.id)
      .eq("status", "rascunho")
      .select("*")
      .single();
    if (error) return erroApi(400, { codigo: "erro_gravacao", mensagem: error.message });

    return NextResponse.json(respostaAluno(data as LinhaDiagnostico, matricula));
  } catch (err: any) {
    return erroApi(500, { codigo: "erro_interno", mensagem: err?.message || "Erro ao salvar o rascunho." });
  }
}
