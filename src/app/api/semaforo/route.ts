import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, PAPEIS_EQUIPE } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ajustarSemaforoPorDiagnostico } from "@/lib/diagnostico/regras";
import { inicioSemana, vermelhos28d, type FotoSemana } from "@/lib/acompanhamento/semaforo-semanal";

export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req, PAPEIS_EQUIPE);
  if (auth.erro) return auth.erro;
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
        ),
        diagnostico (status)
      `)
      .eq("turma_id", turmaId);

    if (error) {
      return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
    }

    const agora = new Date();

    // Semáforo é de alunos: matrículas de contas da equipe (admin, anjo...) ficam de fora
    const matriculasDeMentorados = (matriculas || []).filter((m: any) => m.usuarios?.papel === "mentorado");

    const alunosSemaforo = matriculasDeMentorados.map((m: any) => {
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

      // Semana 1 (SPEC diagnóstico §6): sem placar de entrada enviado não fecha verde
      const diag = Array.isArray(m.diagnostico) ? m.diagnostico[0] : m.diagnostico;
      const placarEnviado = !!diag && diag.status !== "rascunho";
      if (usuario.status !== "bloqueado" && !placarEnviado) {
        const diasMatricula = (agora.getTime() - new Date(m.matriculado_em).getTime()) / (1000 * 60 * 60 * 24);
        const ajustado = ajustarSemaforoPorDiagnostico(statusSemaforo, false, checkins.length > 0, diasMatricula >= 7);
        if (ajustado !== statusSemaforo) {
          statusSemaforo = ajustado;
          motivo = ajustado === "vermelho" ? "Sem check-in e sem placar de entrada" : "Placar de entrada não enviado";
        }
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

    // Foto da semana corrente + histórico para "vermelhos em 28 dias"
    const semanaAtual = inicioSemana(agora);
    const historicoPorMatricula = new Map<string, FotoSemana[]>();
    if (alunosSemaforo.length) {
      // Lê antes de gravar: a foto da semana quase sempre já existe e não mudou de cor
      const desde = new Date(agora.getTime() - 35 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const { data: fotos, error: erroHist } = await supabaseAdmin
        .from("semaforo_semanal")
        .select("matricula_id, semana, cor")
        .in("matricula_id", alunosSemaforo.map((a) => a.matriculaId))
        .gte("semana", desde);
      if (erroHist) console.error("[semaforo_semanal] leitura", erroHist.message);
      for (const f of fotos || []) {
        const lista = historicoPorMatricula.get(f.matricula_id) ?? [];
        lista.push({ semana: f.semana, cor: f.cor });
        historicoPorMatricula.set(f.matricula_id, lista);
      }

      const corGravada = new Map(
        (fotos || []).filter((f) => f.semana === semanaAtual).map((f) => [f.matricula_id, f.cor])
      );
      const mudaram = alunosSemaforo.filter((a) => corGravada.get(a.matriculaId) !== a.statusSemaforo);
      if (mudaram.length) {
        const { error: erroFoto } = await supabaseAdmin.from("semaforo_semanal").upsert(
          mudaram.map((a) => ({
            matricula_id: a.matriculaId,
            semana: semanaAtual,
            cor: a.statusSemaforo,
            motivo: a.motivoSemaforo,
            atualizado_em: agora.toISOString(),
          })),
          { onConflict: "matricula_id,semana" }
        );
        if (erroFoto) console.error("[semaforo_semanal] upsert", erroFoto.message);
        else {
          for (const a of mudaram) {
            const lista = (historicoPorMatricula.get(a.matriculaId) ?? []).filter((f) => f.semana !== semanaAtual);
            lista.push({ semana: semanaAtual, cor: a.statusSemaforo });
            historicoPorMatricula.set(a.matriculaId, lista);
          }
        }
      }
    }
    const alunosComHistorico = alunosSemaforo.map((a) => {
      const hist = historicoPorMatricula.get(a.matriculaId) ?? [];
      // Sem foto gravada (falha no upsert), a semana corrente conta pelo cálculo atual
      if (!hist.some((f) => f.semana === semanaAtual)) hist.push({ semana: semanaAtual, cor: a.statusSemaforo });
      return { ...a, vermelhos28d: vermelhos28d(hist, agora) };
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
      alunos: alunosComHistorico,
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
