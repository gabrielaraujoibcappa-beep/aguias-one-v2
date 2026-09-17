import { randomUUID } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { MIME_POR_TIPO, REGRAS_BUCKET, detectarTipoArquivo, ehBucketArquivo } from "@/lib/arquivos/regras";

function recusar(erro: string, status = 400) {
  return NextResponse.json({ sucesso: false, erro }, { status });
}

export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;
  try {
    const formData = await req.formData();
    const file = formData.get("file");
    const bucket = formData.get("bucket") || "evidencias";
    if (!ehBucketArquivo(bucket)) return recusar("Bucket não permitido.");
    if (!(file instanceof File)) return recusar("Nenhum arquivo enviado no corpo da requisição.");

    const regras = REGRAS_BUCKET[bucket];
    if (file.size === 0) return recusar("O arquivo está vazio.");
    if (file.size > regras.tamanhoMaximoBytes) {
      return recusar(`O arquivo excede o limite de ${regras.tamanhoMaximoBytes / (1024 * 1024)} MB.`);
    }

    // O tipo vem do conteúdo do arquivo; nome e content-type do navegador não são confiáveis
    const buffer = Buffer.from(await file.arrayBuffer());
    const tipo = detectarTipoArquivo(buffer);
    if (!tipo || !regras.tipos.includes(tipo)) {
      return recusar(`Formato não aceito. Envie ${regras.tipos.map((t) => t.toUpperCase()).join(", ")}.`);
    }

    // Mentorado grava sempre sob o próprio id; a equipe grava sob o id de quem enviou
    const pasta = auth.sessao.usuarioId;
    const storagePath = `${pasta}/${new Date().toISOString().slice(0, 7)}/${randomUUID()}.${tipo}`;

    const { error: uploadError } = await supabaseAdmin.storage.from(bucket).upload(storagePath, buffer, {
      contentType: MIME_POR_TIPO[tipo],
      upsert: false,
    });

    if (uploadError) {
      console.error("[Upload Storage]:", bucket, uploadError.message);
      return recusar("Não foi possível salvar o arquivo. Tente novamente.", 500);
    }

    return NextResponse.json({
      sucesso: true,
      storagePath,
      bucket,
      nomeArquivo: file.name,
      tamanhoBytes: file.size,
      tipo,
      mensagem: "Arquivo enviado com sucesso.",
    });
  } catch (err: any) {
    console.error("[Upload]:", err?.message || err);
    return recusar("Não foi possível processar o envio do arquivo.", 500);
  }
}
