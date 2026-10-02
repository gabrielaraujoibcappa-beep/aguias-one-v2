import { NextRequest, NextResponse } from "next/server";
import { exigirSessao, podeAcessarMatricula, respostaProibida } from "@/lib/auth/sessao-api";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { caminhoPertenceAoUsuario, caminhoSeguro } from "@/lib/arquivos/regras";
import { mesesDoPlacar } from "@/lib/diagnostico/regras";
import { ANJO_LE_FATURAMENTO } from "@/lib/diagnostico/parametros";
import type { PayloadDiagnostico } from "@/lib/diagnostico/campos";
import type { MesPlacarEntrada } from "@/lib/api/faturamento";
import type { Sessao } from "@/lib/auth/sessao-api";
import {
  ERRO_FATURAMENTO_APROVADO,
  ERRO_FATURAMENTO_SEM_COMPROVANTE,
  normalizarMesReferencia,
  normalizarValorBruto,
} from "@/lib/api/faturamento";

/**
 * Meses do Placar de entrada (diagnóstico enviado) para o gráfico de meta anual.
 * Mesma regra de leitura do diagnóstico: concierge não lê faturamento mensal e o
 * Anjo só lê com ANJO_LE_FATURAMENTO ligado.
 */
async function buscarPlacarEntrada(sessao: Sessao, matriculaId: string | null, turmaId: string | null): Promise<MesPlacarEntrada[]> {
  if (sessao.papel === "concierge" || (sessao.papel === "anjo" && !ANJO_LE_FATURAMENTO)) return [];

  let query = supabaseAdmin
    .from("diagnostico")
    .select("matricula_id, payload, matriculas!inner (matriculado_em, turma_id, usuarios (id))")
    .in("status", ["enviado", "congelado"]);
  if (matriculaId) query = query.eq("matricula_id", matriculaId);
  else if (!sessao.equipe) query = query.in("matricula_id", sessao.matriculaIds);
  if (turmaId) query = query.eq("matriculas.turma_id", turmaId);

  const { data, error } = await query;
  if (error) {
    console.error("[Faturamento placar]:", error.message);
    return [];
  }
  return (data || []).flatMap((d: any) => {
    const matricula = d.matriculas;
    if (!matricula?.matriculado_em) return [];
    return mesesDoPlacar((d.payload ?? {}) as PayloadDiagnostico, matricula.matriculado_em).map((m) => ({
      ...m,
      matriculaId: d.matricula_id,
      alunoId: matricula.usuarios?.id ?? null,
    }));
  });
}

export async function GET(req: NextRequest) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;
  try {
    const { searchParams } = new URL(req.url);
    const matriculaId = searchParams.get("matriculaId");
    const turmaId = searchParams.get("turmaId");
    if (matriculaId && !podeAcessarMatricula(auth.sessao, matriculaId)) return respostaProibida();

    let query = supabaseAdmin
      .from("faturamentos")
      .select(`
        id, matricula_id, mes_referencia, valor_bruto, storage_zip_path,
        status_auditoria, parecer_auditoria, auditado_em, criado_em,
        matriculas (
          id, status,
          usuarios (id, nome, email, whatsapp),
          turmas (id, codigo, nome)
        )
      `)
      .order("mes_referencia", { ascending: false });

    if (matriculaId) {
      query = query.eq("matricula_id", matriculaId);
    } else if (!auth.sessao.equipe) {
      query = query.in("matricula_id", auth.sessao.matriculaIds);
    }

    const { data: faturamentos, error } = await query;

    if (error) {
      return NextResponse.json({ sucesso: false, erro: error.message }, { status: 500 });
    }

    let formatados = (faturamentos || []).map((f: any) => ({
      id: f.id,
      matriculaId: f.matricula_id,
      // id do usuário dono da matrícula: as telas agrupam declarações por aluno
      alunoId: f.matriculas?.usuarios?.id ?? null,
      alunoNome: f.matriculas?.usuarios?.nome || "Mentorado",
      alunoEmail: f.matriculas?.usuarios?.email || "",
      turmaId: f.matriculas?.turmas?.id || "",
      turmaNome: f.matriculas?.turmas?.nome || "",
      mesReferencia: f.mes_referencia,
      valorBruto: Number(f.valor_bruto),
      storageZipPath: f.storage_zip_path,
      statusAuditoria: f.status_auditoria || "pendente",
      parecerAuditoria: f.parecer_auditoria,
      auditadoEm: f.auditado_em,
      criadoEm: f.criado_em,
    }));

    if (turmaId) {
      formatados = formatados.filter((f) => f.turmaId === turmaId);
    }

    // Calcula agregação de faturamento
    const totalFaturado = formatados.reduce((acc, curr) => acc + curr.valorBruto, 0);
    const pendentesAuditoria = formatados.filter((f) => f.statusAuditoria === "pendente").length;

    const placarEntrada = await buscarPlacarEntrada(auth.sessao, matriculaId, turmaId);

    return NextResponse.json({
      sucesso: true,
      totalFaturado,
      pendentesAuditoria,
      faturamentos: formatados,
      placarEntrada,
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const auth = await exigirSessao(req);
  if (auth.erro) return auth.erro;
  try {
    const body = await req.json();
    let { matriculaId, mesReferencia, valorBruto, storageZipPath } = body;
    // Declaração é do próprio aluno. Na equipe, só admin lança em nome dele (Anjo/Concierge não editam faturamento)
    if (auth.sessao.equipe && auth.sessao.papel !== "admin") {
      return respostaProibida("Somente o próprio mentorado ou a coordenação (admin) declaram faturamento.");
    }

    // Se o mentorado não enviou matriculaId (ou enviou id local mock como "mat-atual"), usa a da sessão
    if ((!matriculaId || typeof matriculaId !== "string" || matriculaId.startsWith("mat-") || matriculaId === "1") && !auth.sessao.equipe && auth.sessao.matriculaIds.length > 0) {
      matriculaId = auth.sessao.matriculaIds[0];
    }

    if (matriculaId && !podeAcessarMatricula(auth.sessao, matriculaId)) return respostaProibida();

    if (!matriculaId) {
      return NextResponse.json({ sucesso: false, erro: "matriculaId é obrigatório." }, { status: 400 });
    }

    const dataFormatada = normalizarMesReferencia(mesReferencia);
    if (!dataFormatada) {
      return NextResponse.json(
        { sucesso: false, erro: "Informe o mês de referência no formato AAAA-MM." },
        { status: 400 }
      );
    }

    const valor = normalizarValorBruto(valorBruto);
    if (valor === null) {
      return NextResponse.json(
        { sucesso: false, erro: "Informe um valor bruto maior que zero." },
        { status: 400 }
      );
    }

    // Mentorado sempre anexa comprovante; a coordenação pode lançar sem (ex.: declaração por telefone)
    if (!storageZipPath && !auth.sessao.equipe) {
      return NextResponse.json({ sucesso: false, erro: ERRO_FATURAMENTO_SEM_COMPROVANTE }, { status: 400 });
    }

    // Comprovante precisa ter vindo da rota de upload (mentorado: só da própria pasta)
    if (storageZipPath) {
      const caminhoValido = auth.sessao.equipe
        ? caminhoSeguro(storageZipPath)
        : caminhoPertenceAoUsuario(storageZipPath, auth.sessao.usuarioId);
      if (!caminhoValido) {
        return NextResponse.json(
          { sucesso: false, erro: "Comprovante anexado inválido. Envie o arquivo novamente." },
          { status: 400 }
        );
      }
    }

    // Declaração aprovada não volta para a fila (a equipe corrige pelo PATCH, se preciso)
    const { data: existente } = await supabaseAdmin
      .from("faturamentos")
      .select("id, status_auditoria")
      .eq("matricula_id", matriculaId)
      .eq("mes_referencia", dataFormatada)
      .maybeSingle();
    if (existente?.status_auditoria === "aprovado") {
      return NextResponse.json({ sucesso: false, erro: ERRO_FATURAMENTO_APROVADO }, { status: 409 });
    }

    const { data: faturamento, error } = await supabaseAdmin
      .from("faturamentos")
      .upsert(
        {
          matricula_id: matriculaId,
          mes_referencia: dataFormatada,
          valor_bruto: valor,
          storage_zip_path: storageZipPath || null,
          status_auditoria: "pendente",
          // Reenvio abre nova auditoria: o parecer anterior não vale mais
          parecer_auditoria: null,
          atualizado_em: new Date().toISOString(),
        },
        { onConflict: "matricula_id,mes_referencia" }
      )
      .select()
      .single();

    if (error) {
      console.error("[Faturamento POST]:", error.message);
      return NextResponse.json({ sucesso: false, erro: "Não foi possível salvar a declaração." }, { status: 500 });
    }

    return NextResponse.json({
      sucesso: true,
      faturamento,
      mensagem: "Faturamento declarado e submetido para auditoria com sucesso.",
    });
  } catch (err: any) {
    return NextResponse.json({ sucesso: false, erro: err?.message }, { status: 500 });
  }
}
