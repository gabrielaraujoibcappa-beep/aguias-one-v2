import { NextRequest, NextResponse } from "next/server";
import { exigirSessao } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { diagnosticoAtrasado, type StatusDiagnostico } from "@/lib/diagnostico/regras";
import { semanasVermelhasSeguidas, vermelhoDuplo, type FotoSemana } from "@/lib/acompanhamento/semaforo-semanal";
import type { MotivoResgate } from "@/lib/acompanhamento/resgate";

const DIA_MS = 24 * 60 * 60 * 1000;

/**
 * GET /api/resgate?turma= — alunos para a Adelayne resgatar (resgate, concierge, admin).
 * Motivos: vermelho duas semanas seguidas ou placar de entrada atrasado (T+48h).
 * Sem números, sem conteúdo do placar de entrada, sem frases e sem notas do Anjo.
 */
export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req, ["resgate", "concierge", "admin"]);
  if (auth.erro) return auth.erro;
  try {
    const turmaId = new URL(req.url).searchParams.get("turma");

    let query = supabaseAdmin
      .from("matriculas")
      .select(`
        id, status, matriculado_em, turma_id,
        turmas (nome),
        usuarios (nome, whatsapp, papel, status),
        checkins_modulo (enviado_em)
      `)
      .eq("status", "ativo");
    if (turmaId) query = query.eq("turma_id", turmaId);

    const { data: matriculas, error } = await query;
    if (error) return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });

    const mentorados = (matriculas || []).filter((m: any) => m.usuarios?.papel === "mentorado");
    const ids = mentorados.map((m: any) => m.id);
    if (!ids.length) return NextResponse.json({ sucesso: true, alunos: [] });

    const desde = new Date(Date.now() - 12 * 7 * DIA_MS).toISOString().slice(0, 10);
    const [diagnosticos, fotos, contatos] = await Promise.all([
      // Só o status: nada de conteúdo do placar
      supabaseAdmin.from("diagnostico").select("matricula_id, status").in("matricula_id", ids),
      supabaseAdmin.from("semaforo_semanal").select("matricula_id, semana, cor").in("matricula_id", ids).gte("semana", desde),
      supabaseAdmin
        .from("contato_resgate")
        .select("matricula_id, canal, resultado, criado_em, usuarios:autor_id (nome)")
        .in("matricula_id", ids)
        .order("criado_em", { ascending: false }),
    ]);

    const statusPorMatricula = new Map<string, StatusDiagnostico>(
      (diagnosticos.data || []).map((d: any) => [d.matricula_id, d.status])
    );
    const fotosPorMatricula = new Map<string, FotoSemana[]>();
    for (const f of fotos.data || []) {
      const lista = fotosPorMatricula.get(f.matricula_id) ?? [];
      lista.push({ semana: f.semana, cor: f.cor });
      fotosPorMatricula.set(f.matricula_id, lista);
    }
    const ultimoContato = new Map<string, any>();
    for (const c of contatos.data || []) if (!ultimoContato.has(c.matricula_id)) ultimoContato.set(c.matricula_id, c);

    const agora = Date.now();
    const alunos = mentorados
      .map((m: any) => {
        const historico = fotosPorMatricula.get(m.id) ?? [];
        let duplo: boolean;
        let seguidas: number;
        if (historico.length) {
          duplo = vermelhoDuplo(historico);
          seguidas = semanasVermelhasSeguidas(historico);
        } else {
          // Sem histórico: mesma regra do semáforo atual (mais de 14 dias sem check-in = vermelho)
          const envios = (m.checkins_modulo || []).map((c: any) => new Date(c.enviado_em).getTime());
          const ultimo = envios.length ? Math.max(...envios) : new Date(m.matriculado_em).getTime();
          const vermelhoAtual = m.usuarios?.status === "bloqueado" || agora - ultimo > 14 * DIA_MS;
          duplo = vermelhoAtual;
          seguidas = vermelhoAtual ? 1 : 0;
        }

        const status = statusPorMatricula.get(m.id) ?? "rascunho";
        const atrasado = diagnosticoAtrasado(status, m.matriculado_em);
        const motivos: MotivoResgate[] = [];
        if (duplo) motivos.push("vermelho_duplo");
        if (atrasado) motivos.push("diagnostico_atrasado");

        const contato = ultimoContato.get(m.id);
        return {
          matriculaId: m.id,
          nome: m.usuarios?.nome ?? "Mentorado",
          whatsapp: m.usuarios?.whatsapp ?? null,
          turma: m.turmas?.nome ?? null,
          motivos,
          semanasVermelhasSeguidas: seguidas,
          diagnosticoStatus: status,
          ultimoContato: contato
            ? { canal: contato.canal, resultado: contato.resultado, em: contato.criado_em, autor: contato.usuarios?.nome ?? "Equipe" }
            : null,
        };
      })
      .filter((a) => a.motivos.length > 0)
      .sort((a, b) => b.motivos.length - a.motivos.length || a.nome.localeCompare(b.nome, "pt-BR"));

    return NextResponse.json({ sucesso: true, alunos });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
