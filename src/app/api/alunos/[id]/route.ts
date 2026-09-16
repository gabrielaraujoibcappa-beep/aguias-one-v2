import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, PAPEIS_GESTAO } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function PATCH(req: NextRequest, { params }: RouteParams) {
  const auth = await exigirSessao(req, PAPEIS_GESTAO);
  if (auth.erro) return auth.erro;
  try {
    const { id } = await params;
    const body = await req.json();
    const { nome, email, whatsapp, cpf, areaPericial, papel, status, turmaId } = body;
    const { data: atual } = await supabaseAdmin.from("usuarios").select("papel").eq("id", id).maybeSingle();
    // Só bloqueia quando o papel muda de fato (formulários reenviam o papel atual)
    if (papel && atual && papel !== atual.papel && auth.sessao.papel !== "admin") {
      return NextResponse.json(
        { sucesso: false, erro: "Apenas administradores podem alterar o papel de um usuário." },
        { status: 403 }
      );
    }

    const updates: Record<string, any> = {
      atualizado_em: new Date().toISOString(),
    };

    if (nome) updates.nome = nome.trim();
    if (email) updates.email = email.trim().toLowerCase();
    if (whatsapp) updates.whatsapp = whatsapp.trim();
    if (cpf !== undefined) updates.cpf = cpf ? cpf.trim() : null;
    if (areaPericial !== undefined) updates.area_pericial = areaPericial ? areaPericial.trim() : null;
    if (papel) updates.papel = papel;
    if (status) updates.status = status;

    const { data: usuario, error: errUser } = await supabaseAdmin
      .from("usuarios")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (errUser) {
      return NextResponse.json({ sucesso: false, erro: errUser.message }, { status: 400 });
    }

    // Se turmaId foi fornecida, atualiza matrícula (exclusiva de mentorados)
    if (turmaId && usuario?.papel === "mentorado") {
      const { data: matExistente } = await supabaseAdmin
        .from("matriculas")
        .select("id")
        .eq("usuario_id", id)
        .maybeSingle();

      if (matExistente) {
        await supabaseAdmin
          .from("matriculas")
          .update({ turma_id: turmaId })
          .eq("id", matExistente.id);
      } else {
        await supabaseAdmin
          .from("matriculas")
          .insert({ usuario_id: id, turma_id: turmaId, status: "ativo" });
      }
    }

    return NextResponse.json({ sucesso: true, usuario });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  const auth = await exigirSessao(req, PAPEIS_GESTAO);
  if (auth.erro) return auth.erro;
  try {
    const { id } = await params;

    // Busca auth_id para limpar também no Supabase Auth se existir
    const { data: user } = await supabaseAdmin
      .from("usuarios")
      .select("auth_id")
      .eq("id", id)
      .maybeSingle();

    if (user?.auth_id) {
      try {
        await supabaseAdmin.auth.admin.deleteUser(user.auth_id);
      } catch (authErr) {
        console.warn("[Delete Auth User]:", authErr);
      }
    }

    const { error } = await supabaseAdmin
      .from("usuarios")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ sucesso: false, erro: error.message }, { status: 400 });
    }

    return NextResponse.json({ sucesso: true, mensagem: "Aluno excluído com sucesso." });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
