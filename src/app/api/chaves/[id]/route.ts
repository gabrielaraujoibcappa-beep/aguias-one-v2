import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PAPEIS_CHAVES } from "@/lib/api/chaves";

interface Params {
  params: { id: string };
}

/** DELETE /api/chaves/:id — revoga (soft delete). Admin e concierge. */
export async function DELETE(req: NextRequest, { params }: Params) {
  const auth = await exigirSessao(req, [...PAPEIS_CHAVES]);
  if (auth.erro) return auth.erro;

  const { data, error } = await supabaseAdmin
    .from("chaves_api")
    .update({ revogada_em: new Date().toISOString() })
    .eq("id", params.id)
    .is("revogada_em", null)
    .select("id")
    .maybeSingle();

  if (error) {
    return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
  }
  if (!data) {
    return NextResponse.json({ sucesso: false, erro: "Chave não encontrada ou já revogada." }, { status: 404 });
  }
  return NextResponse.json({ sucesso: true, mensagem: "Chave revogada. Integrações com ela param de funcionar." });
}
