import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    let turmaId = searchParams.get("turmaId");

    // Se turmaId não especificada, pega a primeira turma em andamento
    if (!turmaId) {
      const { data: turma } = await supabaseAdmin
        .from("turmas")
        .select("id")
        .eq("status", "em_andamento")
        .limit(1)
        .maybeSingle();

      turmaId = turma?.id || null;
    }

    if (!turmaId) {
      return NextResponse.json({
        sucesso: true,
        resumo: { total: 0, verde: 0, amarelo: 0, vermelho: 0 },
        alunos: [],
      });
    }

    // 1. Busca todos os alunos matriculados na turma
    const { data: matriculas, error } = await supabaseAdmin
      .from("matriculas")
      .select(`
        id, status, matriculado_em,
        usuarios (id, nome, email, whatsapp, area_pericial, papel, status),
        checkins_modulo (
          id, modulo_id, status, enviado_em,
          modulos (numero, titulo)
        )
      `)
      .eq("turma_id", turmaId);

    if (error) {
      return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
    }

    const agora = new Date();

    const alunosSemaforo = (matriculas || []).map((m: any) => {
      const usuario = m.usuarios;
      const checkins = (m.checkins_modulo || []).sort(
        (a: any, b: any) => new Date(b.enviado_em).getTime() - new Date(a.enviado_em).getTime()
      );

      const ultimoCheckin = checkins[0];
      const ultimoEnvio = ultimoCheckin ? new Date(ultimoCheckin.enviado_em) : new Date(m.matriculado_em);
      const diffMs = agora.getTime() - ultimoEnvio.getTime();
      const diasSemEntrega = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));

      let statusSemaforo: "verde" | "amarelo" | "vermelho" = "verde";
      let motivo = "Entregas em dia";

      if (usuario.status === "bloqueado") {
        statusSemaforo = "vermelho";
        motivo = "Acesso bloqueado pela coordenação";
      } else if (diasSemEntrega > 14) {
        statusSemaforo = "vermelho";
        motivo = `${diasSemEntrega} dias sem submeter check-in (em risco)`;
      } else if (diasSemEntrega > 7) {
        statusSemaforo = "amarelo";
        motivo = `${diasSemEntrega} dias sem submeter check-in (atenção)`;
      }

      const modulosAprovados = checkins.filter((c: any) => c.status === "aprovado").length;
      const progressoPercentual = Math.min(100, Math.round((modulosAprovados / 10) * 100));

      return {
        id: usuario.id,
        matriculaId: m.id,
        nome: usuario.nome,
        email: usuario.email,
        whatsapp: usuario.whatsapp,
        areaPericial: usuario.area_pericial || "Perícia Geral",
        ultimoModuloConcluido: ultimoCheckin ? `Módulo ${ultimoCheckin.modulos?.numero}` : "Nenhum",
        diasSemEntrega,
        statusSemaforo,
        motivoSemaforo: motivo,
        progressoPercentual,
        totalEntregas: checkins.length,
      };
    });

    const resumo = {
      total: alunosSemaforo.length,
      verde: alunosSemaforo.filter((a) => a.statusSemaforo === "verde").length,
      amarelo: alunosSemaforo.filter((a) => a.statusSemaforo === "amarelo").length,
      vermelho: alunosSemaforo.filter((a) => a.statusSemaforo === "vermelho").length,
    };

    return NextResponse.json({
      sucesso: true,
      turmaId,
      resumo,
      alunos: alunosSemaforo,
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
