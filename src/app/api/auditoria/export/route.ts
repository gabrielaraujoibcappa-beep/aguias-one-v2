import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, podeAcessarMatricula } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { gerarPdfDossie, montarItensDossie } from "@/lib/pdf/auditoria-pdf";

// GET /api/auditoria/export?matriculaId=...&moduloId=...&decisao=...&from=...&to=...
// Leitura: equipe (admin/concierge/anjo/mentor) ou mentorado dono. Gera PDF via pdf-lib.
export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;

  try {
    const params = new URL(req.url).searchParams;
    const matriculaId = params.get("matriculaId");
    const moduloId = params.get("moduloId") ?? undefined;
    const decisao = params.get("decisao") ?? undefined;
    const from = params.get("from") ?? undefined;
    const to = params.get("to") ?? undefined;

    if (!matriculaId) {
      return NextResponse.json({ sucesso: false, erro: "matriculaId é obrigatório." }, { status: 400 });
    }
    if (!podeAcessarMatricula(auth.sessao, matriculaId)) {
      return NextResponse.json({ sucesso: false, erro: "Você não tem permissão para acessar estes dados." }, { status: 403 });
    }

    const [matRes, checkRes, presRes] = await Promise.all([
      supabaseAdmin
        .from("matriculas")
        .select("id, turma_id, usuarios (nome), turmas (nome)")
        .eq("id", matriculaId)
        .maybeSingle(),
      supabaseAdmin
        .from("checkins_modulo")
        .select("modulo_id, status, parecer_texto, enviado_em, avaliado_em, modulos (titulo)")
        .eq("matricula_id", matriculaId)
        .order("enviado_em", { ascending: true })
        .limit(200),
      supabaseAdmin
        .from("presencas_encontro")
        .select("status, criado_em")
        .eq("matricula_id", matriculaId)
        .order("criado_em", { ascending: true })
        .limit(200),
    ]);

    if (matRes.error || checkRes.error || presRes.error) {
      return NextResponse.json({ sucesso: false, erro: "Não foi possível montar o dossiê." }, { status: 500 });
    }
    if (!matRes.data) {
      return NextResponse.json({ sucesso: false, erro: "Matrícula não encontrada." }, { status: 404 });
    }

    const alunoNome = (matRes.data as any)?.usuarios?.nome ?? "Mentorado";
    const turmaNome = (matRes.data as any)?.turmas?.nome ?? undefined;

    const itens = montarItensDossie({
      checkins: (checkRes.data || []).map((c: any) => ({
        modulo: c.modulos?.titulo ?? c.modulo_id,
        status: c.status,
        parecer: c.parecer_texto,
        enviadoEm: c.enviado_em,
        avaliadoEm: c.avaliado_em,
      })),
      presencas: (presRes.data || []).map((p: any) => ({ data: p.criado_em, status: p.status })),
      filtros: { moduloId, decisao, from, to },
    });

    const pdf = await gerarPdfDossie({
      alunoNome,
      matricula: matriculaId.slice(0, 8),
      turma: turmaNome,
      geradoEm: new Date().toISOString().slice(0, 16).replace("T", " "),
      totalItens: itens.length,
      itens,
    });

    // Log best-effort (tabela pode ainda não existir em banco antigo)
    await supabaseAdmin.from("audit_exports").insert({
      matricula_id: matriculaId,
      filtros_json: { moduloId: moduloId ?? null, decisao: decisao ?? null, from: from ?? null, to: to ?? null },
      gerado_por: auth.sessao.usuarioId,
    }).then(() => undefined, () => undefined);

    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="dossie-${matriculaId.slice(0, 8)}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message ?? "Erro interno." }, { status: 500 });
  }
}
