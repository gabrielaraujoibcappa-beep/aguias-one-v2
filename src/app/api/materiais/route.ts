import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, PAPEIS_GESTAO } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { randomUUID } from "crypto";
import {
  PASTA_MATERIAIS,
  caminhoMaterialLink,
  caminhoSeguro,
  formatarTamanhoBytes,
  tituloDoCaminhoMaterial,
  urlArquivo,
  validarUrlMaterial,
} from "@/lib/arquivos/regras";

/**
 * Catálogo de materiais de apoio: listagem do bucket `materiais` (pasta geral)
 * via service_role. Qualquer usuário autenticado lê; publicar/remover é da equipe.
 * Dois formatos: arquivo (upload) e link externo (arquivo `.url` com a URL).
 */

function rotuloTipo(caminho: string): "PDF" | "ZIP" | "IMAGEM" | "LINK" {
  if (caminho.endsWith(".url")) return "LINK";
  if (caminho.endsWith(".zip")) return "ZIP";
  if (caminho.endsWith(".png") || caminho.endsWith(".jpg")) return "IMAGEM";
  return "PDF";
}

export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;
  try {
    const { data, error } = await supabaseAdmin.storage
      .from("materiais")
      .list(PASTA_MATERIAIS, { limit: 200, sortBy: { column: "created_at", order: "desc" } });

    if (error) {
      console.error("[Materiais lista]:", error.message);
      return NextResponse.json({ sucesso: false, erro: "Não foi possível carregar os materiais." }, { status: 500 });
    }

    const arquivos = (data ?? []).filter((f) => f.name && !f.name.startsWith("."));

    const materiais = (
      await Promise.all(
        arquivos.map(async (f) => {
          const path = `${PASTA_MATERIAIS}/${f.name}`;
          const titulo = tituloDoCaminhoMaterial(path) ?? f.name;
          const tipo = rotuloTipo(path);
          // Link externo: a URL está no conteúdo do arquivo `.url`
          if (tipo === "LINK") {
            const { data: blob, error: dlError } = await supabaseAdmin.storage.from("materiais").download(path);
            if (dlError || !blob) return null;
            const url = (await blob.text()).trim();
            if (!validarUrlMaterial(url)) return null;
            return {
              path,
              titulo,
              tipo,
              tamanho: "Link externo",
              tamanhoBytes: null,
              publicadoEm: f.created_at ?? null,
              downloadUrl: url,
            };
          }
          const tamanhoBytes = typeof f.metadata?.size === "number" ? f.metadata.size : null;
          return {
            path,
            titulo,
            tipo,
            tamanho: formatarTamanhoBytes(tamanhoBytes),
            tamanhoBytes,
            publicadoEm: f.created_at ?? null,
            downloadUrl: urlArquivo("materiais", path),
          };
        })
      )
    ).filter((m) => m !== null);

    return NextResponse.json({ sucesso: true, materiais });
  } catch (err: any) {
    console.error("[Materiais lista]:", err?.message || err);
    return NextResponse.json({ sucesso: false, erro: "Não foi possível carregar os materiais." }, { status: 500 });
  }
}

/** Publica um material do tipo link (equipe). Corpo: { titulo, url }. */
export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req, PAPEIS_GESTAO);
  if (auth.erro) return auth.erro;
  try {
    const body = await req.json().catch(() => ({}));
    const titulo = typeof body?.titulo === "string" ? body.titulo.trim().slice(0, 120) : "";
    const url = typeof body?.url === "string" ? body.url.trim() : "";
    if (titulo.length < 3) {
      return NextResponse.json({ sucesso: false, erro: "Informe um título com ao menos 3 caracteres." }, { status: 400 });
    }
    if (!validarUrlMaterial(url)) {
      return NextResponse.json({ sucesso: false, erro: "Informe uma URL válida (http/https)." }, { status: 400 });
    }

    const path = caminhoMaterialLink(titulo, randomUUID());
    const { error } = await supabaseAdmin.storage.from("materiais").upload(path, url, {
      contentType: "text/plain",
      upsert: false,
    });
    if (error) {
      console.error("[Materiais link]:", error.message);
      return NextResponse.json({ sucesso: false, erro: "Não foi possível publicar o link." }, { status: 500 });
    }

    return NextResponse.json({ sucesso: true, mensagem: "Link publicado.", path });
  } catch (err: any) {
    console.error("[Materiais link]:", err?.message || err);
    return NextResponse.json({ sucesso: false, erro: "Não foi possível publicar o link." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const auth = await exigirSessao(req, PAPEIS_GESTAO);
  if (auth.erro) return auth.erro;
  try {
    const body = await req.json().catch(() => ({}));
    const path = body?.path;
    if (typeof path !== "string" || !caminhoSeguro(path) || !path.startsWith(`${PASTA_MATERIAIS}/`)) {
      return NextResponse.json({ sucesso: false, erro: "Arquivo inválido." }, { status: 400 });
    }

    const { error } = await supabaseAdmin.storage.from("materiais").remove([path]);
    if (error) {
      console.error("[Materiais remover]:", error.message);
      return NextResponse.json({ sucesso: false, erro: "Não foi possível remover o material." }, { status: 500 });
    }

    return NextResponse.json({ sucesso: true, mensagem: "Material removido." });
  } catch (err: any) {
    console.error("[Materiais remover]:", err?.message || err);
    return NextResponse.json({ sucesso: false, erro: "Não foi possível remover o material." }, { status: 500 });
  }
}
