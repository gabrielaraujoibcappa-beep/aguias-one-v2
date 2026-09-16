/**
 * Lista do mês 6 (dados do banco) — usada por /api/anjo/mes6 e pelo job diário.
 * Não registra log: quem expõe números (a rota) registra.
 */
import { supabaseAdmin } from "@/lib/supabase/admin";
import { BASE_MES6, REGUA_MES6, dataMes6 } from "@/lib/diagnostico/parametros";
import { avaliarMes6, diasAte, naJanelaMes6, type ResultadoMes6 } from "./mes6";

export interface ItemMes6 {
  matriculaId: string;
  nome: string;
  turmaId: string;
  dataMes6: string;
  diasAteMes6: number;
  diagnosticoStatus: string;
  mediaEntradaCentavos: number | null;
  metaCentavos: number | null;
  placarNaoSei: boolean;
  faturamentos: { mesReferencia: string; valorBruto: number }[];
  resultado: ResultadoMes6;
  temPlano: boolean;
  statusPlano: string | null;
}

/** turmaId opcional: sem ele, todas as turmas. */
export async function listarJanelaMes6(turmaId: string | null, agora = new Date()): Promise<ItemMes6[]> {
  let query = supabaseAdmin
    .from("matriculas")
    .select(`
      id, status, matriculado_em, turma_id,
      turmas (data_inicio),
      usuarios (nome, papel),
      diagnostico (status, scores, payload),
      anjo_plano (status)
    `)
    .eq("status", "ativo");
  if (turmaId) query = query.eq("turma_id", turmaId);
  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const umDe = <T>(v: T | T[] | null | undefined): T | null => (Array.isArray(v) ? v[0] ?? null : v ?? null);

  const naJanela = (data || [])
    .filter((m: any) => m.usuarios?.papel === "mentorado")
    .map((m: any) => ({ m, data6: dataMes6(m.matriculado_em, umDe<any>(m.turmas)?.data_inicio ?? null, BASE_MES6) }))
    .filter(({ data6 }) => naJanelaMes6(data6, agora));

  if (!naJanela.length) return [];

  const { data: fats, error: erroFat } = await supabaseAdmin
    .from("faturamentos")
    .select("matricula_id, mes_referencia, valor_bruto")
    .in("matricula_id", naJanela.map(({ m }) => m.id))
    .order("mes_referencia", { ascending: true });
  if (erroFat) throw new Error(erroFat.message);

  const fatPorMatricula = new Map<string, { mesReferencia: string; valorBruto: number }[]>();
  for (const f of fats || []) {
    const lista = fatPorMatricula.get(f.matricula_id) ?? [];
    lista.push({ mesReferencia: f.mes_referencia, valorBruto: Number(f.valor_bruto) });
    fatPorMatricula.set(f.matricula_id, lista);
  }

  return naJanela
    .map(({ m, data6 }) => {
      const d = umDe<any>(m.diagnostico);
      const plano = umDe<any>(m.anjo_plano);
      const enviado = d && d.status !== "rascunho";
      const scores = enviado ? d.scores ?? {} : {};
      const meta = enviado && typeof d.payload?.meta_6m === "number" ? d.payload.meta_6m : null;
      const placarNaoSei = !!scores.placar_nao_sei || !enviado;
      const todos = fatPorMatricula.get(m.id) ?? [];
      const resultado = avaliarMes6({
        mediaEntradaCentavos: typeof scores.media_6m_bruta === "number" ? scores.media_6m_bruta : null,
        metaCentavos: meta,
        faturamentos: todos,
        dataBase: data6,
        regua: REGUA_MES6,
        placarNaoSei,
      });
      return {
        matriculaId: m.id,
        nome: m.usuarios?.nome ?? "Mentorado",
        turmaId: m.turma_id,
        dataMes6: data6.toISOString(),
        diasAteMes6: diasAte(data6, agora),
        diagnosticoStatus: d?.status ?? "rascunho",
        mediaEntradaCentavos: typeof scores.media_6m_bruta === "number" ? scores.media_6m_bruta : null,
        metaCentavos: meta,
        placarNaoSei,
        faturamentos: todos.slice(-6),
        resultado,
        temPlano: !!plano,
        statusPlano: plano?.status ?? null,
      };
    })
    .sort((a, b) => Number(b.resultado.sessaoObrigatoria) - Number(a.resultado.sessaoObrigatoria) || a.diasAteMes6 - b.diasAteMes6);
}
