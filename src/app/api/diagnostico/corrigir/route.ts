import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import { MIN_MOTIVO, filtrarParaPapel, sanearPayload, segmentoMudou } from "@/lib/diagnostico/regras";
import {
  aplicarCiclo,
  buscarMatricula,
  buscarOuCriarDiagnostico,
  erroApi,
  gravarVersao,
  matriculaDoAluno,
  registrarEvento,
  respostaAluno,
} from "@/lib/diagnostico/servidor";

/**
 * POST /api/diagnostico/corrigir
 * - mentorado: { campos, motivo≥10 } — só enquanto enviado (até o prazo).
 * - admin:     { matriculaId, campos, motivo≥10 } — também depois de congelado.
 */
export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req, ["mentorado", "admin"]);
  if (auth.erro) return auth.erro;
  const { sessao } = auth;
  try {
    const body = await req.json().catch(() => ({}));
    const motivo = typeof body?.motivo === "string" ? body.motivo.trim() : "";
    if (motivo.length < MIN_MOTIVO) {
      return erroApi(422, {
        codigo: "motivo_curto",
        mensagem: `Explique a correção em pelo menos ${MIN_MOTIVO} caracteres.`,
        campo: "motivo",
      });
    }

    const admin = sessao.papel === "admin";
    const matricula = admin
      ? typeof body?.matriculaId === "string"
        ? await buscarMatricula(body.matriculaId)
        : null
      : await matriculaDoAluno(sessao);
    if (!matricula) return erroApi(404, { codigo: "sem_matricula", mensagem: "Matrícula não encontrada." });

    const diag = await aplicarCiclo(await buscarOuCriarDiagnostico(matricula.id), matricula);

    if (diag.status === "rascunho") {
      return erroApi(409, { codigo: "nao_enviado", mensagem: "O placar ainda não foi enviado." });
    }
    if (diag.status === "congelado" && !admin) {
      return erroApi(409, {
        codigo: "congelado",
        mensagem: "O prazo de correção terminou. Peça à coordenação para corrigir.",
      });
    }

    const payload = sanearPayload(body?.campos, matricula.matriculado_em);
    const resultado = await gravarVersao({
      diag,
      payload,
      sessao,
      statusFinal: diag.status,
      motivo: admin ? `admin: ${motivo}` : `correcao_aluno: ${motivo}`,
      statusEsperado: admin ? ["enviado", "congelado"] : ["enviado"],
    });
    if (resultado.erro) {
      return erroApi(resultado.erro.codigo === "conflito" ? 409 : 422, resultado.erro);
    }

    await registrarEvento("diagnostico.corrigido", {
      matriculaId: matricula.id,
      sessao,
      dados: {
        versao: resultado.diag.versao,
        motivo,
        segmento_mudou: segmentoMudou(diag.scores, resultado.diag.scores),
        segmento_anterior: diag.scores?.icp_segmento ?? null,
        segmento_novo: resultado.diag.scores?.icp_segmento ?? null,
      },
    });

    if (admin) {
      const visao = filtrarParaPapel("admin", resultado.diag.payload, resultado.diag.scores);
      return NextResponse.json({ sucesso: true, diagnostico: { ...resultado.diag, ...visao } });
    }
    return NextResponse.json(respostaAluno(resultado.diag, matricula));
  } catch (err: any) {
    return erroApi(500, { codigo: "erro_interno", mensagem: err?.message || "Erro ao corrigir o placar." });
  }
}
