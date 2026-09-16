import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, podeAcessarMatricula, respostaProibida } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;
  try {
    const { searchParams } = new URL(req.url);
    const pendentes = searchParams.get("pendentes") === "true";
    const matriculaId = searchParams.get("matriculaId");
    const moduloNumero = searchParams.get("moduloNumero");
    const moduloId = searchParams.get("moduloId");
    if (pendentes && !auth.sessao.equipe) return respostaProibida();
    if (matriculaId && !podeAcessarMatricula(auth.sessao, matriculaId)) return respostaProibida();

    // 1. Fila de Auditoria da Equipe (/painel/auditoria)
    if (pendentes) {
      const { data: checkins, error } = await supabaseAdmin
        .from("checkins_modulo")
        .select(`
          id, status, travou, duvida_call, parecer_texto, enviado_em, avaliado_em,
          matriculas (
            id, status,
            usuarios (id, nome, email, whatsapp, area_pericial),
            turmas (id, codigo, nome)
          ),
          modulos (id, numero, titulo, disciplina_ref),
          checkin_evidencias (id, tipo, rotulo, valor_url, storage_path, nome_arquivo)
        `)
        .in("status", ["aguardando_avaliacao", "ajuste_solicitado"])
        .order("enviado_em", { ascending: true });

      if (error) {
        return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
      }

      const formatados = (checkins || []).map((c: any) => ({
        id: c.id,
        status: c.status,
        alunoNome: c.matriculas?.usuarios?.nome || "Mentorado",
        alunoEmail: c.matriculas?.usuarios?.email || "",
        alunoWhatsapp: c.matriculas?.usuarios?.whatsapp || "",
        areaPericial: c.matriculas?.usuarios?.area_pericial || "Perícia Geral",
        turmaNome: c.matriculas?.turmas?.nome || "Águias ONE",
        moduloNumero: c.modulos?.numero || 1,
        moduloTitulo: c.modulos?.titulo || "",
        disciplina: c.modulos?.disciplina_ref || "Organização",
        travou: c.travou || "",
        duvidaCall: c.duvida_call || "",
        parecerTexto: c.parecer_texto || "",
        dataEnvio: c.enviado_em,
        evidencias: c.checkin_evidencias || [],
      }));

      return NextResponse.json({ sucesso: true, entregas: formatados });
    }

    // 2. Busca check-in específico de um aluno
    let query = supabaseAdmin
      .from("checkins_modulo")
      .select(`
        *,
        modulos (*),
        checkin_evidencias (*)
      `);

    if (matriculaId) {
      query = query.eq("matricula_id", matriculaId);
    } else if (!auth.sessao.equipe) {
      query = query.in("matricula_id", auth.sessao.matriculaIds);
    }

    if (moduloId) {
      query = query.eq("modulo_id", moduloId);
    } else if (moduloNumero) {
      const { data: m } = await supabaseAdmin
        .from("modulos")
        .select("id")
        .eq("numero", Number(moduloNumero))
        .single();
      if (m) query = query.eq("modulo_id", m.id);
    }

    const { data, error } = await query;
    if (error) {
      return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
    }

    return NextResponse.json({ sucesso: true, checkins: data });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;
  try {
    const body = await req.json();
    const { matriculaId, moduloId, moduloNumero, travou, duvidaCall, evidencias = [] } = body;
    if (matriculaId && !podeAcessarMatricula(auth.sessao, matriculaId)) return respostaProibida();

    let targetModuloId = moduloId;

    if (!targetModuloId && moduloNumero) {
      const { data: m } = await supabaseAdmin
        .from("modulos")
        .select("id")
        .eq("numero", Number(moduloNumero))
        .single();
      targetModuloId = m?.id;
    }

    if (!matriculaId || !targetModuloId) {
      return NextResponse.json(
        { sucesso: false, erro: "matriculaId e moduloId (ou moduloNumero) são obrigatórios." },
        { status: 400 }
      );
    }

    // 1. Upsert do checkin
    const { data: checkin, error: errCheckin } = await supabaseAdmin
      .from("checkins_modulo")
      .upsert(
        {
          matricula_id: matriculaId,
          modulo_id: targetModuloId,
          status: "aguardando_avaliacao",
          travou: travou ? travou.trim() : null,
          duvida_call: duvidaCall ? duvidaCall.trim() : null,
          enviado_em: new Date().toISOString(),
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "matricula_id,modulo_id" }
      )
      .select()
      .single();

    if (errCheckin) {
      return NextResponse.json({ sucesso: false, erro: errCheckin.message }, { status: 400 });
    }

    // 2. Insere evidências se houverem
    if (Array.isArray(evidencias) && evidencias.length > 0) {
      // Limpa evidências anteriores desse check-in para evitar duplicados
      await supabaseAdmin
        .from("checkin_evidencias")
        .delete()
        .eq("checkin_id", checkin.id);

      const rowsParaInserir = evidencias.map((ev: any) => ({
        checkin_id: checkin.id,
        tipo: ev.tipo || "link",
        rotulo: ev.rotulo || "Evidência",
        valor_url: ev.valorUrl || null,
        storage_path: ev.storagePath || null,
        nome_arquivo: ev.nomeArquivo || null,
      }));

      await supabaseAdmin
        .from("checkin_evidencias")
        .insert(rowsParaInserir);
    }

    return NextResponse.json({
      sucesso: true,
      checkin,
      mensagem: "Check-in submetido para avaliação com sucesso.",
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
