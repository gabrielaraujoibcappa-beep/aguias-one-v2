/**
 * ÁGUIAS ONE v2 — API Client para Chamadas e Encontros
 * 
 * Todas as operações passam pelas API routes do Next.js (/api/chamadas)
 * que usam supabaseAdmin no servidor — nunca expondo a service key ao browser.
 */

export type StatusEncontro = "agendado" | "realizado" | "cancelado";
export type StatusPresenca = "presente" | "falta" | "justificada";

export interface Encontro {
  id: string;
  turma_id: string;
  titulo: string;
  data_encontro: string;
  status: StatusEncontro;
  observacoes?: string;
  criado_em: string;
  atualizado_em: string;
}

export interface Presenca {
  id: string;
  encontro_id: string;
  matricula_id: string;
  status: StatusPresenca;
  criado_em: string;
}

export interface TurmaResumida {
  id: string;
  nome: string;
  codigo: string;
  data_inicio?: string;
}

export interface DadosTurmaChamada {
  turma?: TurmaResumida | null;
  encontros: Encontro[];
  alunos: AlunoDaTurma[];
  presencas: Presenca[];
}

/** Aluno retornado pela API de chamadas com dados de matrícula e usuário. */
export interface AlunoDaTurma {
  matricula_id: string;
  status: string;
  nome: string;
  email: string;
  whatsapp?: string;
  area_pericial?: string;
}

/** Alias para compatibilidade com as páginas que importam este tipo. */
export type RelatorioPresencas = DadosTurmaChamada;

// 1. Obter relatório completo de presença de uma turma (encontros + alunos + presenças)
export async function obterRelatorioPresencas(turma_id: string): Promise<DadosTurmaChamada> {
  try {
    const res = await fetch(`/api/chamadas?turmaId=${encodeURIComponent(turma_id)}`);
    const json = await res.json();

    if (!json.sucesso) {
      console.error("Erro ao obter relatório de presenças:", json.erro);
      return { turma: null, encontros: [], alunos: [], presencas: [] };
    }

    return {
      turma: json.turma || null,
      encontros: json.encontros || [],
      alunos: json.alunos || [],
      presencas: json.presencas || [],
    };
  } catch (err) {
    console.error("Erro de rede ao obter relatório de presenças:", err);
    return { turma: null, encontros: [], alunos: [], presencas: [] };
  }
}

// 2. Criar novo encontro via API route
export async function criarEncontro(dados: {
  turma_id: string;
  titulo: string;
  data_encontro: string;
  observacoes?: string;
}): Promise<Encontro | null> {
  try {
    const res = await fetch("/api/chamadas", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    const json = await res.json();

    if (!json.sucesso) {
      console.error("Erro ao criar encontro:", json.erro);
      return null;
    }

    return json.encontro;
  } catch (err) {
    console.error("Erro de rede ao criar encontro:", err);
    return null;
  }
}

// 3. Salvar presenças de um encontro via API route (upsert)
export async function salvarPresencas(
  encontro_id: string,
  presencas: { matricula_id: string; status: StatusPresenca }[]
): Promise<boolean> {
  try {
    const res = await fetch(`/api/chamadas/${encodeURIComponent(encontro_id)}/presencas`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ presencas }),
    });

    const json = await res.json();

    if (!json.sucesso) {
      console.error("Erro ao salvar presenças:", json.erro);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Erro de rede ao salvar presenças:", err);
    return false;
  }
}

// 4. Listar encontros de uma turma (atalho – usa mesma rota GET)
export async function obterEncontrosDaTurma(turma_id: string): Promise<Encontro[]> {
  const dados = await obterRelatorioPresencas(turma_id);
  return dados.encontros;
}
