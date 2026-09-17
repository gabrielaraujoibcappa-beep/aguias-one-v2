import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, podeAcessarMatricula, respostaProibida } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { caminhoPertenceAoUsuario, caminhoSeguro } from "@/lib/arquivos/regras";
import { normalizarMesReferencia, normalizarValorBruto } from "@/lib/api/faturamento";

export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;
  try {
    const { searchParams } = new URL(req.url);
    const matriculaId = searchParams.get("matriculaId");
    const turmaId = searchParams.get("turmaId");
    if (matriculaId && !podeAcessarMatricula(auth.sessao, matriculaId)) return respostaProibida();

    let query = supabaseAdmin
      .from("faturamentos")
      .select(`
        id, matricula_id, mes_referencia, valor_bruto, storage_zip_path,
        status_auditoria, parecer_auditoria, auditado_em, criado_em,
        matriculas (
          id, status,
          usuarios (id, nome, email, whatsapp),
          turmas (id, codigo, nome)
        )
      `)
      .order("mes_referencia", { ascending: false });

    if (matriculaId) {
      query = query.eq("matricula_id", matriculaId);
    } else if (!auth.sessao.equipe) {
      query = query.in("matricula_id", auth.sessao.matriculaIds);
    }

    const { data: faturamentos, error } = await query;

    if (error) {
      return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
    }

    let formatados = (faturamentos || []).map((f: any) => ({
      id: f.id,
      matriculaId: f.matricula_id,
      // id do usuário dono da matrícula: as telas agrupam declarações por aluno
      alunoId: f.matriculas?.usuarios?.id ?? null,
      alunoNome: f.matriculas?.usuarios?.nome || "Mentorado",
      alunoEmail: f.matriculas?.usuarios?.email || "",
      turmaId: f.matriculas?.turmas?.id || "",
      turmaNome: f.matriculas?.turmas?.nome || "",
      mesReferencia: f.mes_referencia,
      valorBruto: Number(f.valor_bruto),
      storageZipPath: f.storage_zip_path,
      statusAuditoria: f.status_auditoria || "pendente",
      parecerAuditoria: f.parecer_auditoria,
      auditadoEm: f.auditado_em,
      criadoEm: f.criado_em,
    }));

    if (turmaId) {
      formatados = formatados.filter((f) => f.turmaId === turmaId);
    }

    // Calcula agregação de faturamento
    const totalFaturado = formatados.reduce((acc, curr) => acc + curr.valorBruto, 0);
    const pendentesAuditoria = formatados.filter((f) => f.statusAuditoria === "pendente").length;

    return NextResponse.json({
      sucesso: true,
      totalFaturado,
      pendentesAuditoria,
      faturamentos: formatados,
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;
  try {
    const body = await req.json();
    let { matriculaId, mesReferencia, valorBruto, storageZipPath } = body;
    // Declaração é do próprio aluno. Na equipe, só admin lança em nome dele (Anjo/Concierge não editam faturamento)
    if (auth.sessao.equipe && auth.sessao.papel !== "admin") {
      return respostaProibida("Somente o próprio mentorado ou a coordenação (admin) declaram faturamento.");
    }

    // Se o mentorado não enviou matriculaId (ou enviou id local mock como "mat-atual"), usa a da sessão
    if ((!matriculaId || typeof matriculaId !== "string" || matriculaId.startsWith("mat-") || matriculaId === "1") && !auth.sessao.equipe && auth.sessao.matriculaIds.length > 0) {
      matriculaId = auth.sessao.matriculaIds[0];
    }

    if (matriculaId && !podeAcessarMatricula(auth.sessao, matriculaId)) return respostaProibida();

    if (!matriculaId) {
      return NextResponse.json({ sucesso: false, erro: "matriculaId é obrigatório." }, { status: 400 });
    }

    const dataFormatada = normalizarMesReferencia(mesReferencia);
    if (!dataFormatada) {
      return NextResponse.json(
        { sucesso: false, erro: "Informe o mês de referência no formato AAAA-MM." },
        { status: 400 }
      );
    }

    const valor = normalizarValorBruto(valorBruto);
    if (valor === null) {
      return NextResponse.json(
        { sucesso: false, erro: "Informe um valor bruto maior que zero." },
        { status: 400 }
      );
    }

    // Comprovante precisa ter vindo da rota de upload (mentorado: só da própria pasta)
    if (storageZipPath) {
      const caminhoValido = auth.sessao.equipe
        ? caminhoSeguro(storageZipPath)
        : caminhoPertenceAoUsuario(storageZipPath, auth.sessao.usuarioId);
      if (!caminhoValido) {
        return NextResponse.json(
          { sucesso: false, erro: "Comprovante anexado inválido. Envie o arquivo novamente." },
          { status: 400 }
        );
      }
    }

    const { data: faturamento, error } = await supabaseAdmin
      .from("faturamentos")
      .upsert(
        {
          matricula_id: matriculaId,
          mes_referencia: dataFormatada,
          valor_bruto: valor,
          storage_zip_path: storageZipPath || null,
          status_auditoria: "pendente",
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "matricula_id,mes_referencia" }
      )
      .select()
      .single();

    if (error) {
      console.error("[Faturamento POST]:", error.message);
      return NextResponse.json({ sucesso: false, erro: "Não foi possível salvar a declaração." }, { status: 500 });
    }

    return NextResponse.json({
      sucesso: true,
      faturamento,
      mensagem: "Faturamento declarado e submetido para auditoria com sucesso.",
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
