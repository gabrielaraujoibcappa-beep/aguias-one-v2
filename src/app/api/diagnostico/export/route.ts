import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { exigirSessao, podeAcessarMatricula } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { slugMaterial } from "@/lib/arquivos/regras";
import {
  PAPEIS_LEITURA_DIAGNOSTICO,
  buscarOuCriarDiagnostico,
  erroApi,
  matriculaDoAluno,
  registrarEvento,
} from "@/lib/diagnostico/servidor";

const LIMITE_ZIP_BYTES = 100 * 1024 * 1024;

// GET /api/diagnostico/export[?matriculaId=] → ZIP (placar.json + comprovantes)
export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req, ["mentorado", ...PAPEIS_LEITURA_DIAGNOSTICO]);
  if (auth.erro) return auth.erro;
  try {
    let matriculaId: string | null = null;
    if (auth.sessao.papel === "mentorado") {
      matriculaId = (await matriculaDoAluno(auth.sessao))?.id ?? null;
      if (!matriculaId) return erroApi(404, { codigo: "sem_matricula", mensagem: "Você não tem matrícula ativa." });
    } else {
      matriculaId = new URL(req.url).searchParams.get("matriculaId");
      if (!matriculaId || !podeAcessarMatricula(auth.sessao, matriculaId)) {
        return erroApi(400, { codigo: "matricula_obrigatoria", mensagem: "Informe matriculaId." });
      }
    }

    const diag = await buscarOuCriarDiagnostico(matriculaId);
    const { data: comps, error: compsErro } = await supabaseAdmin
      .from("diagnostico_comprovantes")
      .select("id, storage_path, nome_arquivo, tamanho_bytes, criado_em")
      .eq("matricula_id", matriculaId)
      .order("criado_em", { ascending: true });
    if (compsErro) return erroApi(500, { codigo: "erro_consulta", mensagem: compsErro.message });

    const zip = new JSZip();
    zip.file(
      "placar.json",
      JSON.stringify(
        {
          geradoEm: new Date().toISOString(),
          matriculaId,
          diagnostico: {
            status: diag.status,
            versao: diag.versao,
            enviadoEm: diag.enviado_em,
            congeladoEm: diag.congelado_em,
            payload: diag.payload,
            scores: diag.scores,
          },
        },
        null,
        2
      )
    );
    zip.file(
      "LEIA-ME.txt",
      "Placar de entrada — ÁGUIAS ONE\nplacar.json: dados declarados do placar.\ncomprovantes/: extratos e arquivos vinculados.\n"
    );

    const ausentes: string[] = [];
    let totalBytes = 0;
    for (const c of comps ?? []) {
      const { data: blob, error: dlErro } = await supabaseAdmin.storage.from("comprovantes").download(c.storage_path);
      if (dlErro || !blob) {
        ausentes.push(c.nome_arquivo);
        continue;
      }
      const bytes = new Uint8Array(await blob.arrayBuffer());
      if (totalBytes + bytes.length > LIMITE_ZIP_BYTES) {
        ausentes.push(`${c.nome_arquivo} (excede o limite do pacote)`);
        continue;
      }
      totalBytes += bytes.length;
      const seguro = `${slugMaterial(c.nome_arquivo.replace(/\.[^.]+$/, "") || "arquivo")}${extensaoSegura(c.nome_arquivo)}`;
      zip.file(`comprovantes/${seguro}`, bytes);
    }

    const buffer = await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" });
    const bytes: Uint8Array<ArrayBuffer> = Uint8Array.from(buffer);

    await registrarEvento("diagnostico.exportado", {
      matriculaId,
      sessao: auth.sessao,
      dados: { arquivos: (comps ?? []).length - ausentes.length, ausentes },
    });

    const nomeZip = `placar-${slugMaterial(`placar-${matriculaId.slice(0, 8)}`)}.zip`;
    return new NextResponse(bytes, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="${nomeZip}"`,
        "Content-Length": String(bytes.length),
      },
    });
  } catch (err: any) {
    return erroApi(500, { codigo: "erro_interno", mensagem: err?.message || "Erro ao exportar o placar." });
  }
}

function extensaoSegura(nome: string): string {
  const m = /\.([a-z0-9]{1,5})$/i.exec(nome.trim());
  return m ? `.${m[1].toLowerCase()}` : "";
}
