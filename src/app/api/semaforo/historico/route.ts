import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, PAPEIS_EQUIPE } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";

// GET /api/semaforo/historico?matricula=&semanas=52 → fotos semanais do semáforo (equipe)
export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req, PAPEIS_EQUIPE);
  if (auth.erro) return auth.erro;
  try {
    const { searchParams } = new URL(req.url);
    const matriculaId = searchParams.get("matricula");
    if (!matriculaId) {
      return NextResponse.json({ sucesso: false, erro: "Informe a matrícula." }, { status: 400 });
    }
    const semanas = Math.min(104, Math.max(1, Number(searchParams.get("semanas")) || 52));
    const desde = new Date(Date.now() - semanas * 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const { data, error } = await supabaseAdmin
      .from("semaforo_semanal")
      .select("semana, cor, motivo")
      .eq("matricula_id", matriculaId)
      .gte("semana", desde)
      .order("semana", { ascending: true });
    if (error) return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });

    return NextResponse.json({ sucesso: true, historico: data || [] });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
