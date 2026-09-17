import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { deveCongelar, diagnosticoAtrasado, scoresDeCard, type StatusDiagnostico } from "@/lib/diagnostico/regras";
import { erroApi } from "@/lib/diagnostico/servidor";
import { vermelhos28d, type FotoSemana } from "@/lib/acompanhamento/semaforo-semanal";

/**
 * GET /api/diagnosticos?turma= — cards da turma para concierge, anjo, mentor e admin.
 * Nunca traz frases. Dinheiro (média dos últimos 3 meses declarados) só para mentor/admin.
 */
export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req, ["concierge", "anjo", "mentor", "admin"]);
  if (auth.erro) return auth.erro;
  const { sessao } = auth;
  try {
    const { searchParams } = new URL(req.url);
    let turmaId = searchParams.get("turma");

    const { data: turmas } = await supabaseAdmin
      .from("turmas")
      .select("id, nome, codigo, status, data_inicio")
      .order("data_inicio", { ascending: false });
    if (!turmaId) turmaId = (turmas || []).find((t) => t.status === "em_andamento")?.id ?? turmas?.[0]?.id ?? null;
    const turma = (turmas || []).find((t) => t.id === turmaId) ?? null;

    if (!turmaId || !turma) {
      return NextResponse.json({ sucesso: true, turma: null, turmas: turmas || [], alunos: [] });
    }

    const { data: matriculas, error } = await supabaseAdmin
      .from("matriculas")
      .select(`
        id, status, matriculado_em,
        usuarios (id, nome, email, whatsapp, papel),
        diagnostico (status, scores, enviado_em),
        checkins_modulo (travou, enviado_em)
      `)
      .eq("turma_id", turmaId)
      .eq("status", "ativo");
    if (error) return erroApi(500, { codigo: "erro_consulta", mensagem: error.message });

    const mentorados = (matriculas || []).filter((m: any) => m.usuarios?.papel === "mentorado");
    const verDinheiro = sessao.papel === "mentor" || sessao.papel === "admin";

    let medias3m = new Map<string, number | null>();
    if (verDinheiro && mentorados.length) {
      const { data: fats } = await supabaseAdmin
        .from("faturamentos")
        .select("matricula_id, mes_referencia, valor_bruto")
        .in("matricula_id", mentorados.map((m: any) => m.id))
        .order("mes_referencia", { ascending: false });
      const porMatricula = new Map<string, number[]>();
      for (const f of fats || []) {
        const lista = porMatricula.get(f.matricula_id) ?? [];
        if (lista.length < 3) lista.push(Number(f.valor_bruto));
        porMatricula.set(f.matricula_id, lista);
      }
      medias3m = new Map(
        mentorados.map((m: any) => {
          const v = porMatricula.get(m.id) ?? [];
          return [m.id, v.length ? Math.round((v.reduce((a, b) => a + b, 0) / v.length) * 100) : null];
        })
      );
    }

    // Histórico do semáforo: uma consulta para a turma inteira
    const fotosPorMatricula = new Map<string, FotoSemana[]>();
    if (mentorados.length) {
      const desde = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      const { data: fotos } = await supabaseAdmin
        .from("semaforo_semanal")
        .select("matricula_id, semana, cor")
        .in("matricula_id", mentorados.map((m: any) => m.id))
        .gte("semana", desde);
      for (const f of fotos || []) {
        const lista = fotosPorMatricula.get(f.matricula_id) ?? [];
        lista.push({ semana: f.semana, cor: f.cor });
        fotosPorMatricula.set(f.matricula_id, lista);
      }
    }

    const alunos = await Promise.all(
      mentorados.map(async (m: any) => {
        const d = Array.isArray(m.diagnostico) ? m.diagnostico[0] : m.diagnostico;
        let status: StatusDiagnostico = d?.status ?? "rascunho";
        // Congelamento aparece na lista; a gravação acontece na próxima leitura da ficha/aluno
        if (deveCongelar(status, d?.enviado_em ?? null, turma.data_inicio)) status = "congelado";
        const atrasado = diagnosticoAtrasado(status, m.matriculado_em);
        // O evento diagnostico.atrasado é gravado pelo cron diário, não a cada leitura

        const checkins = (m.checkins_modulo || []).sort(
          (a: any, b: any) => new Date(b.enviado_em).getTime() - new Date(a.enviado_em).getTime()
        );
        const card = status === "rascunho" ? {} : scoresDeCard(sessao.papel, d?.scores ?? null);

        return {
          matriculaId: m.id,
          usuarioId: m.usuarios?.id,
          nome: m.usuarios?.nome ?? "Mentorado",
          email: m.usuarios?.email ?? "",
          whatsapp: m.usuarios?.whatsapp ?? null,
          matriculadoEm: m.matriculado_em,
          diagnosticoStatus: status,
          diagnosticoAtrasado: atrasado,
          enviadoEm: d?.enviado_em ?? null,
          travou: checkins.find((c: any) => c.travou)?.travou ?? null,
          vermelhos28d: vermelhos28d(fotosPorMatricula.get(m.id) ?? []),
          scores: card,
          ...(verDinheiro ? { media3mCentavos: medias3m.get(m.id) ?? null } : {}),
        };
      })
    );

    alunos.sort((a, b) => a.nome.localeCompare(b.nome, "pt-BR"));

    return NextResponse.json({ sucesso: true, turma, turmas: turmas || [], alunos });
  } catch (err: any) {
    return erroApi(500, { codigo: "erro_interno", mensagem: err?.message || "Erro ao listar os placares." });
  }
}
