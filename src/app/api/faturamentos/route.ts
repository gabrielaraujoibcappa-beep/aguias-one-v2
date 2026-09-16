import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, podeAcessarMatricula, respostaProibida } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";

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
    const { matriculaId, mesReferencia, valorBruto, storageZipPath } = body;
    if (matriculaId && !podeAcessarMatricula(auth.sessao, matriculaId)) return respostaProibida();

    if (!matriculaId || !mesReferencia || valorBruto === undefined) {
      return NextResponse.json(
        { sucesso: false, erro: "matriculaId, mesReferencia e valorBruto são obrigatórios." },
        { status: 400 }
      );
    }

    // Formata a data de referência para YYYY-MM-01
    const dataRef = new Date(mesReferencia);
    const ano = dataRef.getUTCFullYear();
    const mes = String(dataRef.getUTCMonth() + 1).padStart(2, "0");
    const dataFormatada = `${ano}-${mes}-01`;

    const { data: faturamento, error } = await supabaseAdmin
      .from("faturamentos")
      .upsert(
        {
          matricula_id: matriculaId,
          mes_referencia: dataFormatada,
          valor_bruto: valorBruto,
          storage_zip_path: storageZipPath || null,
          status_auditoria: "pendente",
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "matricula_id,mes_referencia" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ sucesso: false, erro: error.message }, { status: 400 });
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
