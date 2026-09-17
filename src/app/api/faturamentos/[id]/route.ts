import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, PAPEIS_EQUIPE, PAPEIS_GESTAO } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizarMesReferencia, normalizarValorBruto } from "@/lib/api/faturamento";

const STATUS_AUDITORIA = ["pendente", "aprovado", "ajuste_solicitado"];

// PATCH /api/faturamentos/:id → equipe corrige mês, valor ou situação da declaração
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await exigirSessao(req, PAPEIS_EQUIPE);
  if (auth.erro) return auth.erro;
  try {
    const body = await req.json();
    const updates: Record<string, unknown> = { atualizado_em: new Date().toISOString() };

    if (body.mesReferencia !== undefined) {
      const mes = normalizarMesReferencia(body.mesReferencia);
      if (!mes) return NextResponse.json({ sucesso: false, erro: "Mês de referência inválido." }, { status: 400 });
      updates.mes_referencia = mes;
    }
    if (body.valorBruto !== undefined) {
      const valor = normalizarValorBruto(body.valorBruto);
      if (valor === null) {
        return NextResponse.json({ sucesso: false, erro: "Valor bruto deve ser maior que zero." }, { status: 400 });
      }
      updates.valor_bruto = valor;
    }
    if (body.statusAuditoria !== undefined) {
      if (!STATUS_AUDITORIA.includes(body.statusAuditoria)) {
        return NextResponse.json({ sucesso: false, erro: "Situação de auditoria inválida." }, { status: 400 });
      }
      updates.status_auditoria = body.statusAuditoria;
      updates.parecer_auditoria = typeof body.parecerAuditoria === "string" && body.parecerAuditoria.trim() ? body.parecerAuditoria.trim() : null;
      updates.auditado_por = auth.sessao.usuarioId;
      updates.auditado_em = new Date().toISOString();
    }

    const { data, error } = await supabaseAdmin.from("faturamentos").update(updates).eq("id", params.id).select("id").maybeSingle();
    if (error) {
      const duplicado = error.code === "23505";
      return NextResponse.json(
        { sucesso: false, erro: duplicado ? "Já existe declaração deste aluno para esse mês." : "Não foi possível salvar a declaração." },
        { status: duplicado ? 409 : 500 }
      );
    }
    if (!data) return NextResponse.json({ sucesso: false, erro: "Declaração não encontrada." }, { status: 404 });
    return NextResponse.json({ sucesso: true });
  } catch {
    return NextResponse.json({ sucesso: false, erro: "Não foi possível salvar a declaração." }, { status: 500 });
  }
}

// DELETE /api/faturamentos/:id → gestão exclui uma declaração lançada por engano
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await exigirSessao(req, PAPEIS_GESTAO);
  if (auth.erro) return auth.erro;
  const { data, error } = await supabaseAdmin.from("faturamentos").delete().eq("id", params.id).select("id").maybeSingle();
  if (error) return NextResponse.json({ sucesso: false, erro: "Não foi possível excluir a declaração." }, { status: 500 });
  if (!data) return NextResponse.json({ sucesso: false, erro: "Declaração não encontrada." }, { status: 404 });
  return NextResponse.json({ sucesso: true });
}
