import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const bucket = (formData.get("bucket") as string) || "evidencias";
    const subfolder = (formData.get("subfolder") as string) || "uploads";

    if (!file) {
      return NextResponse.json(
        { sucesso: false, erro: "Nenhum arquivo enviado no corpo da requisição." },
        { status: 400 }
      );
    }

    const TAMANHO_MAXIMO = 26214400; // 25 MB
    if (file.size > TAMANHO_MAXIMO) {
      return NextResponse.json(
        { sucesso: false, erro: "O arquivo excede o limite máximo permitido de 25 MB." },
        { status: 400 }
      );
    }

    const extensao = file.name.split(".").pop() || "bin";
    const nomeLimpo = file.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .substring(0, 40);
    const timestamp = Date.now();
    const storagePath = `${subfolder}/${timestamp}_${nomeLimpo}.${extensao}`;

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Upload no Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from(bucket)
      .upload(storagePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json(
        { sucesso: false, erro: `Falha ao salvar no Storage: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Gera URL pública ou assinada
    let fileUrl = "";
    const { data: publicUrlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(storagePath);

    fileUrl = publicUrlData?.publicUrl || "";

    // Se o bucket for privado, gera URL assinada de 7 dias
    if (!fileUrl || bucket === "comprovantes") {
      const { data: signedData } = await supabaseAdmin.storage
        .from(bucket)
        .createSignedUrl(storagePath, 60 * 60 * 24 * 7); // 7 dias
      if (signedData?.signedUrl) {
        fileUrl = signedData.signedUrl;
      }
    }

    return NextResponse.json({
      sucesso: true,
      storagePath,
      bucket,
      nomeArquivo: file.name,
      tamanhoBytes: file.size,
      url: fileUrl,
      mensagem: "Arquivo enviado com sucesso.",
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
