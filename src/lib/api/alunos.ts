import { PapelUsuario } from "@/lib/auth/roles";

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
  papel?: PapelUsuario;
}

export interface DadosCriacaoUsuario extends AlunoCadastro {
  senha: string;
  papel: PapelUsuario;
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

export function validarCriacaoUsuario(dados: Partial<DadosCriacaoUsuario>): { valido: boolean; erros: string[] } {
  const base = validarDadosAluno(dados);
  const erros = [...base.erros];

  if (!dados.senha || dados.senha.length < 6) {
    erros.push("senha");
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

/**
 * Gera mensagem profissional formatada para envio via WhatsApp com as credenciais de acesso
 */
export function gerarMensagemAcessoWhatsApp({
  nome,
  email,
  senha,
  linkAcesso = "http://localhost:3000/login",
}: {
  nome: string;
  email: string;
  senha: string;
  linkAcesso?: string;
}): string {
  return (
    `Olá, ${nome}! 🦅\n\n` +
    `Seu acesso à plataforma de acompanhamento *ÁGUIAS ONE* foi liberado com sucesso!\n\n` +
    `🔗 *Acesse:* ${linkAcesso}\n` +
    `📧 *Email:* ${email}\n` +
    `🔑 *Senha inicial:* ${senha}\n\n` +
    `Se precisar de suporte no primeiro acesso, nosso Concierge está à sua disposição. Bons voos!`
  );
}

/**
 * Envia os dados para a API server-side de provisionamento no Supabase
 */
export async function criarContaUsuario(
  dados: DadosCriacaoUsuario
): Promise<{ sucesso: boolean; id?: string; erro?: string }> {
  try {
    const res = await fetch("/api/admin/usuarios", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });

    const json = await res.json();
    if (!res.ok || !json.sucesso) {
      return { sucesso: false, erro: json.erro || "Falha ao criar usuário." };
    }

    return { sucesso: true, id: json.usuario?.id };
  } catch (err: any) {
    return { sucesso: false, erro: err?.message || "Erro ao conectar com servidor." };
  }
}
