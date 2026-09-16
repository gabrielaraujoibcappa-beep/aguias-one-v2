import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sanearPayload } from "@/lib/diagnostico/regras";
import {
  aplicarCiclo,
  buscarOuCriarDiagnostico,
  erroApi,
  gravarVersao,
  matriculaDoAluno,
  registrarEvento,
  respostaAluno,
} from "@/lib/diagnostico/servidor";

// POST /api/diagnostico/enviar { campos } → valida, calcula scores, status=enviado
export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req, ["mentorado"]);
  if (auth.erro) return auth.erro;
  try {
    const matricula = await matriculaDoAluno(auth.sessao);
    if (!matricula) return erroApi(404, { codigo: "sem_matricula", mensagem: "Você não tem matrícula ativa." });
    const diag = await aplicarCiclo(await buscarOuCriarDiagnostico(matricula.id), matricula);

    const body = await req.json().catch(() => ({}));
    const payload = sanearPayload(body?.campos, matricula.matriculado_em);

    // Idempotente: reenviar o mesmo placar já enviado devolve o estado atual
    if (diag.status !== "rascunho") {
      if (diag.status === "enviado" && JSON.stringify(diag.payload) === JSON.stringify(payload)) {
        return NextResponse.json(respostaAluno(diag, matricula));
      }
      return erroApi(409, {
        codigo: diag.status === "congelado" ? "congelado" : "ja_enviado",
        mensagem: diag.status === "congelado" ? "O placar está congelado." : "O placar já foi enviado. Use “corrigir”.",
      });
    }

    const resultado = await gravarVersao({
      diag,
      payload,
      sessao: auth.sessao,
      statusFinal: "enviado",
      motivo: "envio_aluno",
      statusEsperado: ["rascunho"],
    });

    if (resultado.erro) {
      // Rascunho preservado: grava o que veio antes de recusar
      if (resultado.erro.codigo !== "conflito") {
        await supabaseAdmin
          .from("diagnostico")
          .update({ payload, atualizado_em: new Date().toISOString() })
          .eq("id", diag.id)
          .eq("status", "rascunho");
      }
      const status = resultado.erro.codigo === "conflito" ? 409 : resultado.erro.codigo === "erro_gravacao" ? 400 : 422;
      return erroApi(status, resultado.erro);
    }

    await registrarEvento("diagnostico.enviado", {
      matriculaId: matricula.id,
      sessao: auth.sessao,
      dados: { versao: resultado.diag.versao },
    });

    return NextResponse.json(respostaAluno(resultado.diag, matricula));
  } catch (err: any) {
    return erroApi(500, { codigo: "erro_interno", mensagem: err?.message || "Erro ao enviar o placar." });
  }
}
