import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, PAPEIS_GESTAO } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { dispararEmail, link } from "@/lib/email/disparos";
import { gerarEmailStatusAcesso } from "@/lib/email/templates";

/** Avisa o mentorado por e-mail que o acesso foi bloqueado ou liberado. */
async function avisarStatusAcesso(
  usuarioId: string,
  acao: "bloqueado" | "desbloqueado",
  dados: { motivo?: string; observacoes?: string; responsavelNome: string }
) {
  const { data: usuario } = await supabaseAdmin
    .from("usuarios")
    .select("nome, email")
    .eq("id", usuarioId)
    .maybeSingle();
  if (!usuario) return;

  await dispararEmail(
    { nome: usuario.nome, email: usuario.email },
    "status_acesso",
    `acesso.${acao}`,
    gerarEmailStatusAcesso({
      nome: usuario.nome,
      acao,
      motivo: dados.motivo,
      observacoes: dados.observacoes,
      responsavelNome: dados.responsavelNome,
      linkContato: link("/login"),
    })
  );
}

export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req, undefined, { permitirBloqueado: true });
  if (auth.erro) return auth.erro;
  try {
    const { searchParams } = new URL(req.url);
    // Mentorado só enxerga os próprios bloqueios
    const usuarioId = auth.sessao.equipe ? searchParams.get("usuarioId") : auth.sessao.usuarioId;

    let query = supabaseAdmin
      .from("bloqueios_acesso")
      .select(`
        *,
        usuarios (id, nome, email, papel, status)
      `)
      .order("bloqueado_em", { ascending: false });

    if (usuarioId) {
      query = query.eq("usuario_id", usuarioId);
    }

    const { data: bloqueios, error } = await query;

    if (error) {
      return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
    }

    // Mapeia bloqueios ativos por usuario_id
    const vigentes: Record<string, any> = {};
    (bloqueios || []).forEach((b) => {
      if (b.status === "ativo" && !vigentes[b.usuario_id]) {
        vigentes[b.usuario_id] = b;
      }
    });

    return NextResponse.json({
      sucesso: true,
      bloqueiosVigentes: vigentes,
      historico: bloqueios || [],
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req, PAPEIS_GESTAO);
  if (auth.erro) return auth.erro;
  try {
    const body = await req.json();
    const {
      acao = "bloquear", // 'bloquear' | 'desbloquear'
      usuarioId,
      motivo,
      observacoes,
      justificativaDesbloqueio,
    } = body;
    const responsavelNome = auth.sessao.nome;

    if (!usuarioId) {
      return NextResponse.json(
        { sucesso: false, erro: "usuarioId é obrigatório." },
        { status: 400 }
      );
    }

    if (acao === "bloquear") {
      if (!motivo) {
        return NextResponse.json(
          { sucesso: false, erro: "O motivo do bloqueio é obrigatório." },
          { status: 400 }
        );
      }

      // 1. Cria registro em public.bloqueios_acesso
      const { data: novoBloqueio, error: errBloqueio } = await supabaseAdmin
        .from("bloqueios_acesso")
        .insert({
          usuario_id: usuarioId,
          motivo,
          observacoes: observacoes || null,
          status: "ativo",
          bloqueado_por: responsavelNome,
          bloqueado_em: new Date().toISOString(),
        })
        .select()
        .single();

      if (errBloqueio) {
        return NextResponse.json({ sucesso: false, erro: errBloqueio.message }, { status: 400 });
      }

      // 2. Atualiza status em public.usuarios
      await supabaseAdmin
        .from("usuarios")
        .update({ status: "bloqueado", atualizado_em: new Date().toISOString() })
        .eq("id", usuarioId);

      await avisarStatusAcesso(usuarioId, "bloqueado", { motivo, observacoes, responsavelNome });

      return NextResponse.json({
        sucesso: true,
        bloqueio: novoBloqueio,
        mensagem: "Acesso do aluno bloqueado com sucesso.",
      });
    } else if (acao === "desbloquear") {
      // 1. Encerra bloqueios ativos do usuário
      const { error: errDesbloqueio } = await supabaseAdmin
        .from("bloqueios_acesso")
        .update({
          status: "encerrado",
          desbloqueado_por: responsavelNome,
          desbloqueado_em: new Date().toISOString(),
          justificativa_desbloqueio: justificativaDesbloqueio || "Desbloqueio administrativo",
        })
        .eq("usuario_id", usuarioId)
        .eq("status", "ativo");

      if (errDesbloqueio) {
        return NextResponse.json({ sucesso: false, erro: errDesbloqueio.message }, { status: 400 });
      }

      // 2. Restaura status em public.usuarios
      await supabaseAdmin
        .from("usuarios")
        .update({ status: "ativo", atualizado_em: new Date().toISOString() })
        .eq("id", usuarioId);

      await avisarStatusAcesso(usuarioId, "desbloqueado", {
        observacoes: justificativaDesbloqueio || undefined,
        responsavelNome,
      });

      return NextResponse.json({
        sucesso: true,
        mensagem: "Acesso do aluno reativado com sucesso.",
      });
    }

    return NextResponse.json(
      { sucesso: false, erro: "Ação desconhecida. Use 'bloquear' ou 'desbloquear'." },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
