import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import { MIN_MOTIVO, sanearPayload } from "@/lib/diagnostico/regras";
import {
  aplicarCiclo,
  buscarMatricula,
  buscarOuCriarDiagnostico,
  erroApi,
  gravarVersao,
  registrarEvento,
} from "@/lib/diagnostico/servidor";

/**
 * POST /api/diagnostico/import { matriculaId, payload, motivo } — ponte da Turma 1 (§14).
 * Usa o mesmo saneamento, validação e scores do wizard (aceite 9).
 */
export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req, ["admin"]);
  if (auth.erro) return auth.erro;
  try {
    const body = await req.json().catch(() => ({}));
    const motivo = typeof body?.motivo === "string" ? body.motivo.trim() : "";
    if (motivo.length < MIN_MOTIVO) {
      return erroApi(422, { codigo: "motivo_curto", mensagem: `Motivo com pelo menos ${MIN_MOTIVO} caracteres.`, campo: "motivo" });
    }
    const matricula = typeof body?.matriculaId === "string" ? await buscarMatricula(body.matriculaId) : null;
    if (!matricula) return erroApi(404, { codigo: "sem_matricula", mensagem: "Matrícula não encontrada.", campo: "matriculaId" });

    const diag = await aplicarCiclo(await buscarOuCriarDiagnostico(matricula.id), matricula);
    const payload = sanearPayload(body?.payload, matricula.matriculado_em);
    const primeiro = diag.status === "rascunho";

    const resultado = await gravarVersao({
      diag,
      payload,
      sessao: auth.sessao,
      statusFinal: primeiro ? "enviado" : diag.status === "congelado" ? "congelado" : "enviado",
      motivo: `import: ${motivo}`,
      statusEsperado: [diag.status],
    });
    if (resultado.erro) return erroApi(resultado.erro.codigo === "conflito" ? 409 : 422, resultado.erro);

    await registrarEvento(primeiro ? "diagnostico.enviado" : "diagnostico.corrigido", {
      matriculaId: matricula.id,
      sessao: auth.sessao,
      dados: { origem: "import", motivo, versao: resultado.diag.versao },
    });

    return NextResponse.json({
      sucesso: true,
      diagnostico: {
        matriculaId: matricula.id,
        status: resultado.diag.status,
        versao: resultado.diag.versao,
        scores: resultado.diag.scores,
      },
    });
  } catch (err: any) {
    return erroApi(500, { codigo: "erro_interno", mensagem: err?.message || "Erro ao importar o placar." });
  }
}
