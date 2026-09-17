import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, PAPEIS_EQUIPE } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { dispararEmail, link } from "@/lib/email/disparos";
import { gerarEmailModuloLiberado } from "@/lib/email/templates";

/** Avisa os mentorados ativos da turma que o módulo abriu. */
async function avisarTurma(turmaId: string, moduloId: string) {
  const [{ data: modulo }, { data: matriculas }] = await Promise.all([
    supabaseAdmin.from("modulos").select("numero, titulo, descricao, disciplina_ref, itens_roteiro").eq("id", moduloId).maybeSingle(),
    supabaseAdmin.from("matriculas").select("id, usuarios (nome, email, papel)").eq("turma_id", turmaId).eq("status", "ativo"),
  ]);
  if (!modulo || !matriculas?.length) return { enviados: 0, total: 0 };

  const destinos = matriculas
    .map((m: any) => ({ matriculaId: m.id, nome: m.usuarios?.nome, email: m.usuarios?.email, papel: m.usuarios?.papel }))
    .filter((d) => d.email && (!d.papel || d.papel === "mentorado"));

  const resultados = await Promise.allSettled(
    destinos.map((destino) =>
      dispararEmail(
        destino,
        "modulo_liberado",
        "modulo.liberado",
        gerarEmailModuloLiberado({
          nome: destino.nome,
          moduloNumero: modulo.numero,
          moduloTitulo: modulo.titulo,
          disciplinaRef: modulo.disciplina_ref ?? undefined,
          descricao: modulo.descricao ?? undefined,
          itensRoteiro: Array.isArray(modulo.itens_roteiro) ? modulo.itens_roteiro : undefined,
          linkCheckin: link(`/checkin/mod-${modulo.numero}`),
        }),
        { matriculaId: destino.matriculaId }
      )
    )
  );

  const enviados = resultados.filter((r) => r.status === "fulfilled" && r.value.enviado).length;
  return { enviados, total: destinos.length };
}

export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req, PAPEIS_EQUIPE);
  if (auth.erro) return auth.erro;
  try {
    const body = await req.json();
    const { turmaId, moduloId, moduloNumero, status = "liberado" } = body;

    if (!["liberado", "bloqueado"].includes(status)) {
      return NextResponse.json({ sucesso: false, erro: "Status deve ser 'liberado' ou 'bloqueado'." }, { status: 400 });
    }
    let targetModuloId = moduloId;

    // Se passou moduloNumero em vez de UUID
    if (!targetModuloId && moduloNumero) {
      const { data: mod } = await supabaseAdmin
        .from("modulos")
        .select("id")
        .eq("numero", moduloNumero)
        .single();
      targetModuloId = mod?.id;
    }

    if (!turmaId || !targetModuloId) {
      return NextResponse.json(
        { sucesso: false, erro: "turmaId e moduloId (ou moduloNumero) são obrigatórios." },
        { status: 400 }
      );
    }

    // Busca usuário que realizou a liberação se fornecido
    const liberadoPorId: string | null = auth.sessao.usuarioId;

    // Upsert na tabela public.modulo_liberacoes
    const { data: upsertData, error } = await supabaseAdmin
      .from("modulo_liberacoes")
      .upsert(
        {
          turma_id: turmaId,
          modulo_id: targetModuloId,
          status,
          liberado_por: liberadoPorId,
          liberado_em: new Date().toISOString(),
        },
        { onConflict: "turma_id,modulo_id" }
      )
      .select()
      .single();

    if (error) {
      return NextResponse.json({ sucesso: false, erro: error.message }, { status: 400 });
    }

    // Só a abertura avisa a turma; o bloqueio é operação interna
    const aviso = status === "liberado" ? await avisarTurma(turmaId, targetModuloId) : null;

    return NextResponse.json({
      sucesso: true,
      liberacao: upsertData,
      avisos: aviso,
      mensagem: `Módulo ${status === "liberado" ? "liberado" : "bloqueado"} com sucesso.`,
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
