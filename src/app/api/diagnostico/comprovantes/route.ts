import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, podeAcessarMatricula } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { caminhoPertenceAoUsuario, caminhoSeguro } from "@/lib/arquivos/regras";
import {
  PAPEIS_LEITURA_DIAGNOSTICO,
  buscarMatricula,
  buscarOuCriarDiagnostico,
  erroApi,
  matriculaDoAluno,
  registrarEvento,
} from "@/lib/diagnostico/servidor";

const SELECT_LISTA = "id, diagnostico_id, matricula_id, storage_path, nome_arquivo, tamanho_bytes, criado_em";

/**
 * Comprovantes do placar de entrada: extratos que sustentam os números.
 * Arquivo sobe pelo /api/upload (bucket `comprovantes`) e é vinculado aqui.
 * Congelado → só a coordenação mexe (mesma regra da correção).
 */

// GET → lista (aluno: próprios; equipe: ?matriculaId)
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

    const { data, error } = await supabaseAdmin
      .from("diagnostico_comprovantes")
      .select(SELECT_LISTA)
      .eq("matricula_id", matriculaId)
      .order("criado_em", { ascending: true });
    if (error) return erroApi(500, { codigo: "erro_consulta", mensagem: error.message });

    return NextResponse.json({ sucesso: true, comprovantes: data ?? [] });
  } catch (err: any) {
    return erroApi(500, { codigo: "erro_interno", mensagem: err?.message || "Erro ao listar comprovantes." });
  }
}

// POST { storagePath, nomeArquivo, tamanhoBytes? } → vincula (aluno; não congelado)
export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req, ["mentorado"]);
  if (auth.erro) return auth.erro;
  try {
    const matricula = await matriculaDoAluno(auth.sessao);
    if (!matricula) return erroApi(404, { codigo: "sem_matricula", mensagem: "Você não tem matrícula ativa." });
    const diag = await buscarOuCriarDiagnostico(matricula.id);
    if (diag.status === "congelado") {
      return erroApi(409, { codigo: "congelado", mensagem: "O placar está congelado. Comprovantes só pela coordenação." });
    }

    const body = await req.json().catch(() => ({}));
    const storagePath = typeof body?.storagePath === "string" ? body.storagePath : "";
    const nomeArquivo = typeof body?.nomeArquivo === "string" ? body.nomeArquivo.trim().slice(0, 200) : "";
    const tamanhoBytes = Number.isFinite(body?.tamanhoBytes) ? Math.max(0, Math.floor(body.tamanhoBytes)) : null;

    if (!caminhoSeguro(storagePath) || !caminhoPertenceAoUsuario(storagePath, auth.sessao.usuarioId)) {
      return erroApi(400, { codigo: "arquivo_invalido", mensagem: "Arquivo inválido." });
    }
    if (!nomeArquivo) {
      return erroApi(400, { codigo: "nome_obrigatorio", mensagem: "Informe o nome do arquivo." });
    }

    // Confere que o arquivo existe no bucket antes de vincular
    const { error: existeErro } = await supabaseAdmin.storage.from("comprovantes").createSignedUrl(storagePath, 60);
    if (existeErro) {
      return erroApi(404, { codigo: "arquivo_nao_encontrado", mensagem: "Arquivo não encontrado no armazenamento." });
    }

    const { data, error } = await supabaseAdmin
      .from("diagnostico_comprovantes")
      .upsert(
        {
          diagnostico_id: diag.id,
          matricula_id: matricula.id,
          storage_path: storagePath,
          nome_arquivo: nomeArquivo,
          tamanho_bytes: tamanhoBytes,
        },
        { onConflict: "storage_path" }
      )
      .select(SELECT_LISTA)
      .single();
    if (error) return erroApi(400, { codigo: "erro_gravacao", mensagem: error.message });

    await registrarEvento("diagnostico.comprovante_adicionado", {
      matriculaId: matricula.id,
      sessao: auth.sessao,
      dados: { nome: nomeArquivo },
    });

    return NextResponse.json({ sucesso: true, comprovante: data });
  } catch (err: any) {
    return erroApi(500, { codigo: "erro_interno", mensagem: err?.message || "Erro ao vincular comprovante." });
  }
}

// DELETE { id } → desvincula (aluno dono e não congelado; equipe qualquer)
export async function DELETE(req: NextRequest) {
  const auth = await exigirSessao(req, ["mentorado", ...PAPEIS_LEITURA_DIAGNOSTICO]);
  if (auth.erro) return auth.erro;
  try {
    const body = await req.json().catch(() => ({}));
    const id = typeof body?.id === "string" ? body.id : "";
    if (!id) return erroApi(400, { codigo: "id_obrigatorio", mensagem: "Informe o comprovante." });

    const { data: linha, error: buscaErro } = await supabaseAdmin
      .from("diagnostico_comprovantes")
      .select("id, diagnostico_id, matricula_id, nome_arquivo")
      .eq("id", id)
      .maybeSingle();
    if (buscaErro) return erroApi(500, { codigo: "erro_consulta", mensagem: buscaErro.message });
    if (!linha) return erroApi(404, { codigo: "nao_encontrado", mensagem: "Comprovante não encontrado." });

    if (auth.sessao.papel === "mentorado") {
      if (!auth.sessao.matriculaIds.includes(linha.matricula_id)) {
        return erroApi(404, { codigo: "nao_encontrado", mensagem: "Comprovante não encontrado." });
      }
      const matricula = await buscarMatricula(linha.matricula_id);
      const diag = matricula ? await buscarOuCriarDiagnostico(matricula.id) : null;
      if (diag?.status === "congelado") {
        return erroApi(409, { codigo: "congelado", mensagem: "O placar está congelado. Comprovantes só pela coordenação." });
      }
    }

    // Desvincula o registro; o objeto no Storage é preservado (trilha de auditoria)
    const { error: deleteErro } = await supabaseAdmin.from("diagnostico_comprovantes").delete().eq("id", id);
    if (deleteErro) return erroApi(500, { codigo: "erro_remocao", mensagem: deleteErro.message });

    await registrarEvento("diagnostico.comprovante_removido", {
      matriculaId: linha.matricula_id,
      sessao: auth.sessao,
      dados: { nome: linha.nome_arquivo },
    });

    return NextResponse.json({ sucesso: true, mensagem: "Comprovante removido." });
  } catch (err: any) {
    return erroApi(500, { codigo: "erro_interno", mensagem: err?.message || "Erro ao remover comprovante." });
  }
}
