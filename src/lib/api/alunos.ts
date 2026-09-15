export interface AlunoCadastro {
  id?: string;
  nome: string;
  email: string;
  whatsapp: string;
  cpf?: string;
  areaPericial?: string;
  turmaId: string;
  turmaNome?: string;
  status: "ativo" | "trancado" | "inativo" | "concluido";
  criadoEm?: string;
}

export function validarDadosAluno(dados: Partial<AlunoCadastro>): { valido: boolean; erros: string[] } {
  const erros: string[] = [];

  if (!dados.nome || dados.nome.trim().length < 3) {
    erros.push("nome");
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!dados.email || !emailRegex.test(dados.email.trim())) {
    erros.push("email");
  }

  const cleanPhone = (dados.whatsapp || "").replace(/\D/g, "");
  if (!dados.whatsapp || cleanPhone.length < 10) {
    erros.push("whatsapp");
  }

  if (!dados.turmaId || dados.turmaId.trim().length === 0) {
    erros.push("turmaId");
  }

  return {
    valido: erros.length === 0,
    erros,
  };
}

export function filtrarAlunosPorBusca(alunos: AlunoCadastro[], termo: string): AlunoCadastro[] {
  if (!termo || termo.trim().length === 0) return alunos;
  const q = termo.toLowerCase().trim();

  return alunos.filter((aluno) => {
    return (
      aluno.nome.toLowerCase().includes(q) ||
      aluno.email.toLowerCase().includes(q) ||
      aluno.whatsapp.includes(q) ||
      (aluno.areaPericial && aluno.areaPericial.toLowerCase().includes(q))
    );
  });
}
