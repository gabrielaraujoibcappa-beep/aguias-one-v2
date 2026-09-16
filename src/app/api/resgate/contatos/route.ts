import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validarContatoResgate } from "@/lib/acompanhamento/resgate";
import { registrarEvento } from "@/lib/diagnostico/servidor";

// GET /api/resgate/contatos?matricula= → histórico de contatos (resgate, concierge, admin)
export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req, ["resgate", "concierge", "admin"]);
  if (auth.erro) return auth.erro;
  try {
    const matriculaId = new URL(req.url).searchParams.get("matricula");
    if (!matriculaId) return NextResponse.json({ sucesso: false, erro: "Informe a matrícula." }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("contato_resgate")
      .select("id, canal, resultado, motivo_contato, observacao, criado_em, usuarios:autor_id (nome)")
      .eq("matricula_id", matriculaId)
      .order("criado_em", { ascending: false });
    if (error) return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });

    return NextResponse.json({
      sucesso: true,
      contatos: (data || []).map((c: any) => ({
        id: c.id,
        canal: c.canal,
        resultado: c.resultado,
        motivoContato: c.motivo_contato,
        observacao: c.observacao,
        em: c.criado_em,
        autor: c.usuarios?.nome ?? "Equipe",
      })),
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}

// POST /api/resgate/contatos { matriculaId, canal, resultado, motivoContato, observacao? } → append-only
export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req, ["resgate", "admin"]);
  if (auth.erro) return auth.erro;
  try {
    const validacao = validarContatoResgate(await req.json().catch(() => ({})));
    if (!validacao.ok) {
      return NextResponse.json(
        { sucesso: false, erro: { codigo: "invalido", mensagem: validacao.mensagem, campo: validacao.campo } },
        { status: 422 }
      );
    }
    const v = validacao.valor;

    const { data: matricula } = await supabaseAdmin
      .from("matriculas")
      .select("id, usuarios (papel)")
      .eq("id", v.matriculaId)
      .maybeSingle();
    if (!matricula || (matricula as any).usuarios?.papel !== "mentorado") {
      return NextResponse.json({ sucesso: false, erro: "Matrícula não encontrada." }, { status: 404 });
    }

    const { data, error } = await supabaseAdmin
      .from("contato_resgate")
      .insert({
        matricula_id: v.matriculaId,
        canal: v.canal,
        resultado: v.resultado,
        motivo_contato: v.motivoContato,
        observacao: v.observacao,
        autor_id: auth.sessao.usuarioId,
      })
      .select("id, canal, resultado, motivo_contato, observacao, criado_em")
      .single();
    if (error) return NextResponse.json({ sucesso: false, erro: error.message }, { status: 400 });

    await registrarEvento("resgate.contato", {
      matriculaId: v.matriculaId,
      sessao: auth.sessao,
      dados: { canal: v.canal, resultado: v.resultado, motivo: v.motivoContato },
    });

    return NextResponse.json({
      sucesso: true,
      contato: {
        id: data.id,
        canal: data.canal,
        resultado: data.resultado,
        motivoContato: data.motivo_contato,
        observacao: data.observacao,
        em: data.criado_em,
        autor: auth.sessao.nome,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
