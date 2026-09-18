import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { exigirSessao, Sessao } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { detectarTipoArquivo, slugMaterial } from "@/lib/arquivos/regras";
import { MIN_MOTIVO, sanearPayload } from "@/lib/diagnostico/regras";
import {
  aplicarCiclo,
  buscarMatricula,
  buscarOuCriarDiagnostico,
  erroApi,
  gravarVersao,
  registrarEvento,
  type MatriculaContexto,
} from "@/lib/diagnostico/servidor";

const LIMITE_ZIP_BYTES = 100 * 1024 * 1024;
const LIMITE_ARQUIVO_BYTES = 25 * 1024 * 1024;
const MAX_ARQUIVOS = 50;

/**
 * POST /api/diagnostico/import — ponte da Turma 1 (§14), só admin.
 * Dois formatos (mesmo saneamento, validação e scores do wizard):
 *  - JSON legado: { matriculaId, payload, motivo }
 *  - ZIP (round-trip do /api/diagnostico/export): FormData { file (.zip), matriculaId, motivo }
 *    com placar.json + comprovantes/* (validados por assinatura e regravados no Storage).
 */
export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req, ["admin"]);
  if (auth.erro) return auth.erro;
  try {
    const tipo = req.headers.get("content-type") || "";
    if (tipo.includes("multipart/form-data")) {
      return importarZip(req, auth.sessao);
    }

    const body = await req.json().catch(() => ({}));
    const motivo = typeof body?.motivo === "string" ? body.motivo.trim() : "";
    if (motivo.length < MIN_MOTIVO) {
      return erroApi(422, { codigo: "motivo_curto", mensagem: `Motivo com pelo menos ${MIN_MOTIVO} caracteres.`, campo: "motivo" });
    }
    const matricula = typeof body?.matriculaId === "string" ? await buscarMatricula(body.matriculaId) : null;
    if (!matricula) return erroApi(404, { codigo: "sem_matricula", mensagem: "Matrícula não encontrada.", campo: "matriculaId" });

    return importarPlacar({ matricula, payloadBruto: body?.payload, motivo, sessao: auth.sessao, origem: "import" });
  } catch (err: any) {
    return erroApi(500, { codigo: "erro_interno", mensagem: err?.message || "Erro ao importar o placar." });
  }
}

async function importarPlacar(opts: {
  matricula: MatriculaContexto;
  payloadBruto: unknown;
  motivo: string;
  sessao: Sessao;
  origem: string;
}) {
  const diag = await aplicarCiclo(await buscarOuCriarDiagnostico(opts.matricula.id), opts.matricula);
  const payload = sanearPayload(opts.payloadBruto, opts.matricula.matriculado_em);
  const primeiro = diag.status === "rascunho";

  const resultado = await gravarVersao({
    diag,
    payload,
    sessao: opts.sessao,
    statusFinal: primeiro ? "enviado" : diag.status === "congelado" ? "congelado" : "enviado",
    motivo: `${opts.origem}: ${opts.motivo}`,
    statusEsperado: [diag.status],
  });
  if (resultado.erro) return erroApi(resultado.erro.codigo === "conflito" ? 409 : 422, resultado.erro);

  await registrarEvento(primeiro ? "diagnostico.enviado" : "diagnostico.corrigido", {
    matriculaId: opts.matricula.id,
    sessao: opts.sessao,
    dados: { origem: opts.origem, motivo: opts.motivo, versao: resultado.diag.versao },
  });

  return NextResponse.json({
    sucesso: true,
    diagnostico: {
      matriculaId: opts.matricula.id,
      status: resultado.diag.status,
      versao: resultado.diag.versao,
      scores: resultado.diag.scores,
    },
  });
}

async function importarZip(req: NextRequest, sessao: Sessao) {
  const form = await req.formData();
  const file = form.get("file");
  const motivo = typeof form.get("motivo") === "string" ? (form.get("motivo") as string).trim() : "";
  const matriculaId = typeof form.get("matriculaId") === "string" ? (form.get("matriculaId") as string) : "";

  if (motivo.length < MIN_MOTIVO) {
    return erroApi(422, { codigo: "motivo_curto", mensagem: `Motivo com pelo menos ${MIN_MOTIVO} caracteres.`, campo: "motivo" });
  }
  if (!(file instanceof File)) {
    return erroApi(400, { codigo: "arquivo_obrigatorio", mensagem: "Envie o pacote .zip do placar." });
  }
  if (file.size === 0 || file.size > LIMITE_ZIP_BYTES) {
    return erroApi(400, { codigo: "zip_invalido", mensagem: "Pacote vazio ou acima de 100 MB." });
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  if (detectarTipoArquivo(bytes) !== "zip") {
    return erroApi(400, { codigo: "zip_invalido", mensagem: "O arquivo não é um pacote .zip válido." });
  }

  let zip: JSZip;
  try {
    zip = await JSZip.loadAsync(bytes);
  } catch {
    return erroApi(400, { codigo: "zip_invalido", mensagem: "Não foi possível abrir o pacote .zip." });
  }

  const placarFile = zip.file("placar.json");
  if (!placarFile) {
    return erroApi(400, { codigo: "placar_ausente", mensagem: "O pacote não contém placar.json." });
  }
  let placar: any;
  try {
    placar = JSON.parse(await placarFile.async("string"));
  } catch {
    return erroApi(400, { codigo: "placar_invalido", mensagem: "placar.json inválido." });
  }
  if (!placar || typeof placar !== "object" || !placar.diagnostico || typeof placar.diagnostico.payload !== "object") {
    return erroApi(400, { codigo: "placar_invalido", mensagem: "placar.json fora do formato do export." });
  }

  const matricula = matriculaId ? await buscarMatricula(matriculaId) : null;
  if (!matricula) return erroApi(404, { codigo: "sem_matricula", mensagem: "Matrícula não encontrada.", campo: "matriculaId" });
  if (!matricula.usuario_id) {
    return erroApi(400, { codigo: "sem_usuario", mensagem: "Matrícula sem usuário vinculado." });
  }

  const resposta = await importarPlacar({
    matricula,
    payloadBruto: placar.diagnostico.payload,
    motivo,
    sessao,
    origem: "import-zip",
  });
  if (!resposta.ok) return resposta;

  // Comprovantes do pacote: valida assinatura, regrava no Storage e vincula
  const diag = await buscarOuCriarDiagnostico(matricula.id);
  const entradas = Object.values(zip.files).filter(
    (f) => !f.dir && f.name.startsWith("comprovantes/") && !f.name.endsWith("/")
  );
  const importados: string[] = [];
  const ignorados: string[] = [];
  for (const entrada of entradas.slice(0, MAX_ARQUIVOS)) {
    const nome = entrada.name.split("/").pop() || "arquivo";
    const conteudo = new Uint8Array(await entrada.async("uint8array"));
    const tipo = detectarTipoArquivo(conteudo);
    if (conteudo.length === 0 || conteudo.length > LIMITE_ARQUIVO_BYTES || !tipo) {
      ignorados.push(nome);
      continue;
    }
    const storagePath = `${matricula.usuario_id}/diagnostico/${randomUUID()}_${slugMaterial(nome.replace(/\.[^.]+$/, "") || "arquivo")}.${tipo}`;
    const { error: upErro } = await supabaseAdmin.storage.from("comprovantes").upload(storagePath, conteudo, {
      contentType: tipo === "pdf" ? "application/pdf" : tipo === "zip" ? "application/zip" : `image/${tipo === "png" ? "png" : "jpeg"}`,
      upsert: false,
    });
    if (upErro) {
      ignorados.push(nome);
      continue;
    }
    const { error: vincErro } = await supabaseAdmin.from("diagnostico_comprovantes").upsert(
      {
        diagnostico_id: diag.id,
        matricula_id: matricula.id,
        storage_path: storagePath,
        nome_arquivo: nome.slice(0, 200),
        tamanho_bytes: conteudo.length,
      },
      { onConflict: "storage_path" }
    );
    if (vincErro) {
      ignorados.push(nome);
      continue;
    }
    importados.push(nome);
  }

  await registrarEvento("diagnostico.comprovantes_importados", {
    matriculaId: matricula.id,
    sessao,
    dados: { importados: importados.length, ignorados },
  });

  const corpo = await resposta.json();
  return NextResponse.json({ ...corpo, comprovantes: { importados, ignorados } });
}
