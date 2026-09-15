export interface TurmaCadastro {
  id: string;
  codigo: string;
  nome: string;
  dataInicio: string;
  dataFim?: string;
  horarioEncontro: string;
  limiteVagas: number;
  totalMatriculados: number;
  status: "aberta" | "em_andamento" | "concluida";
}

export function validarDadosTurma(dados: Partial<TurmaCadastro>): { valido: boolean; erros: string[] } {
  const erros: string[] = [];

  if (!dados.codigo || dados.codigo.trim().length < 3) {
    erros.push("codigo");
  }

  if (!dados.nome || dados.nome.trim().length < 3) {
    erros.push("nome");
  }

  if (!dados.dataInicio) {
    erros.push("dataInicio");
  }

  if (dados.limiteVagas !== undefined && dados.limiteVagas <= 0) {
    erros.push("limiteVagas");
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}

export function podeMatricular(turma: TurmaCadastro): boolean {
  if (turma.status === "concluida") return false;
  return turma.totalMatriculados < turma.limiteVagas;
}
