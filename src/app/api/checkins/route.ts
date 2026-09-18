import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, podeAcessarMatricula, respostaProibida } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { normalizarEvidencias } from "@/lib/api/checkin";
import { caminhoPertenceAoUsuario, caminhoSeguro } from "@/lib/arquivos/regras";

export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;
  try {
    const { searchParams } = new URL(req.url);
    // pendentes=true: só a fila (aguardando/ajuste); todas=true: fila + histórico avaliado
    const pendentes = searchParams.get("pendentes") === "true";
    const todas = searchParams.get("todas") === "true";
    const matriculaId = searchParams.get("matriculaId");
    const moduloNumero = searchParams.get("moduloNumero");
    const moduloId = searchParams.get("moduloId");
    if ((pendentes || todas) && !auth.sessao.equipe) return respostaProibida();
    if (matriculaId && !podeAcessarMatricula(auth.sessao, matriculaId)) return respostaProibida();

    // 1. Fila e histórico de auditoria da equipe (/painel/auditoria)
    if (pendentes || todas) {
      let consulta = supabaseAdmin
        .from("checkins_modulo")
        .select(`
          id, status, travou, duvida_call, parecer_texto, enviado_em, avaliado_em,
          avaliador:usuarios!avaliado_por (nome),
          matriculas (
            id, status,
            usuarios (id, nome, email, whatsapp, area_pericial),
            turmas (id, codigo, nome)
          ),
          modulos (id, numero, titulo, disciplina_ref),
          checkin_evidencias (id, tipo, rotulo, valor_url, storage_path, nome_arquivo)
        `)
        .order("enviado_em", { ascending: true });
      if (!todas) consulta = consulta.in("status", ["aguardando_avaliacao", "ajuste_solicitado"]);
      const { data: checkins, error } = await consulta;

      if (error) {
        return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
      }

      const formatados = (checkins || []).map((c: any) => ({
        id: c.id,
        status: c.status,
        matricula_id: c.matriculas?.id ?? null,
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
        avaliadoEm: c.avaliado_em || null,
        avaliadoPor: c.avaliador?.nome || null,
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

function erroCheckin(erro: string, status: number) {
  return NextResponse.json({ sucesso: false, erro }, { status });
}

export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;
  try {
    const body = await req.json();
    const { matriculaId, moduloId, moduloNumero, travou, duvidaCall, evidencias } = body;
    if (typeof matriculaId !== "string" || !podeAcessarMatricula(auth.sessao, matriculaId)) {
      return matriculaId ? respostaProibida() : erroCheckin("matriculaId é obrigatório.", 400);
    }

    // 1. Módulo: pelo id ou pelo número
    let moduloQuery = supabaseAdmin.from("modulos").select("id, numero");
    if (typeof moduloId === "string" && moduloId) moduloQuery = moduloQuery.eq("id", moduloId);
    else if (Number.isInteger(Number(moduloNumero))) moduloQuery = moduloQuery.eq("numero", Number(moduloNumero));
    else return erroCheckin("moduloId (ou moduloNumero) é obrigatório.", 400);
    const { data: modulo } = await moduloQuery.maybeSingle();
    if (!modulo) return erroCheckin("Módulo não encontrado.", 404);

    // 2. Evidências: links http(s) e arquivos enviados pela rota de upload
    const validarCaminho = (caminho: unknown) =>
      auth.sessao.equipe ? caminhoSeguro(caminho) : caminhoPertenceAoUsuario(caminho, auth.sessao.usuarioId);
    const evid = normalizarEvidencias(evidencias, validarCaminho);
    if (evid.erro !== undefined) return erroCheckin(evid.erro, 400);

    // 3. O módulo precisa estar liberado para a turma (módulo 1 é liberado por padrão)
    const { data: matricula } = await supabaseAdmin
      .from("matriculas")
      .select("turma_id")
      .eq("id", matriculaId)
      .maybeSingle();
    if (!matricula) return erroCheckin("Matrícula não encontrada.", 404);
    const { data: liberacao } = await supabaseAdmin
      .from("modulo_liberacoes")
      .select("status")
      .eq("turma_id", matricula.turma_id)
      .eq("modulo_id", modulo.id)
      .maybeSingle();
    const liberado = liberacao ? liberacao.status === "liberado" : modulo.numero === 1;
    if (!liberado) return erroCheckin("Este módulo ainda não foi liberado para a sua turma.", 409);

    // 4. Entrega já aprovada não volta para a fila
    const { data: existente } = await supabaseAdmin
      .from("checkins_modulo")
      .select("id, status")
      .eq("matricula_id", matriculaId)
      .eq("modulo_id", modulo.id)
      .maybeSingle();
    if (existente?.status === "aprovado") {
      return erroCheckin("Esta entrega já foi aprovada e não pode ser reenviada.", 409);
    }

    const agora = new Date().toISOString();
    const { data: checkin, error: errCheckin } = await supabaseAdmin
      .from("checkins_modulo")
      .upsert(
        {
          matricula_id: matriculaId,
          modulo_id: modulo.id,
          status: "aguardando_avaliacao",
          travou: typeof travou === "string" && travou.trim() ? travou.trim().slice(0, 500) : null,
          duvida_call: typeof duvidaCall === "string" && duvidaCall.trim() ? duvidaCall.trim().slice(0, 500) : null,
          enviado_em: agora,
          atualizado_em: agora,
        },
        { onConflict: "matricula_id,modulo_id" }
      )
      .select()
      .single();

    if (errCheckin || !checkin) {
      console.error("[Check-in upsert]:", errCheckin?.message);
      return erroCheckin("Não foi possível registrar a entrega. Tente novamente.", 500);
    }

    // 5. Troca as evidências: grava as novas antes de apagar as antigas, para nunca ficar sem nenhuma
    const { data: anteriores } = await supabaseAdmin
      .from("checkin_evidencias")
      .select("id")
      .eq("checkin_id", checkin.id);

    const { error: errEvidencias } = await supabaseAdmin
      .from("checkin_evidencias")
      .insert(evid.linhas.map((linha) => ({ ...linha, checkin_id: checkin.id })));
    if (errEvidencias) {
      console.error("[Check-in evidências]:", errEvidencias.message);
      return erroCheckin("Não foi possível salvar as evidências. Tente novamente.", 500);
    }

    const idsAnteriores = (anteriores || []).map((e) => e.id);
    if (idsAnteriores.length > 0) {
      const { error: errLimpeza } = await supabaseAdmin.from("checkin_evidencias").delete().in("id", idsAnteriores);
      if (errLimpeza) console.error("[Check-in limpeza de evidências]:", checkin.id, errLimpeza.message);
    }

    return NextResponse.json({
      sucesso: true,
      checkin,
      mensagem: "Check-in submetido para avaliação com sucesso.",
    });
  } catch (err: any) {
    console.error("[Check-in]:", err?.message || err);
    return erroCheckin("Não foi possível registrar a entrega. Tente novamente.", 500);
  }
}
