export interface AlunoSemaforoStatus {
  id: string;
  nome: string;
  whatsapp: string;
  semaforoAtual: "verde" | "amarelo" | "vermelho";
  historicoSemaforos: ("verde" | "amarelo" | "vermelho")[];
  travouEmLinha?: string;
  duvidaCall?: string;
  moduloAtual: string;
  checkinEntregue: boolean;
  precisaResgate: boolean;
}

export function verificarNecessidadeResgate(
  historico: ("verde" | "amarelo" | "vermelho")[],
  limiteConsecutivo = 2
): { precisaResgate: boolean; semanasVermelhas: number } {
  let count = 0;
  for (const s of historico) {
    if (s === "vermelho") {
      count++;
    } else {
      break;
    }
  }

  return {
    precisaResgate: count >= limiteConsecutivo,
    semanasVermelhas: count,
  };
}

export function gerarLinkWhatsAppResgate(aluno: AlunoSemaforoStatus, nomeConcierge = "Flávio Lopes"): string {
  const cleanPhone = aluno.whatsapp.replace(/\D/g, "");
  const ddiPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

  const mensagem = `Olá, ${aluno.nome}! Aqui é o ${nomeConcierge} da Mentoria ÁGUIAS ONE. Notei que você não enviou o check-in das últimas semanas e quero te ajudar a destravar o ${aluno.moduloAtual}. Como você está por aí? Vamos conversar?`;

  return `https://wa.me/${ddiPhone}?text=${encodeURIComponent(mensagem)}`;
}

export const ALUNOS_SEMAFORO_MOCK: AlunoSemaforoStatus[] = [
  {
    id: "aluno-1",
    nome: "Dr. Roberto Silva",
    whatsapp: "(11) 98765-4321",
    semaforoAtual: "amarelo",
    historicoSemaforos: ["amarelo", "verde"],
    travouEmLinha: "Dúvida no cálculo de juros compostos para ação revisional",
    duvidaCall: "Como apresentar o laudo prévio ao advogado parceiro?",
    moduloAtual: "Módulo 1 — Árvore de Pastas",
    checkinEntregue: true,
    precisaResgate: false,
  },
  {
    id: "aluno-2",
    nome: "Dra. Mariana Costa",
    whatsapp: "(21) 99887-7665",
    semaforoAtual: "verde",
    historicoSemaforos: ["verde", "verde"],
    moduloAtual: "Módulo 1 — Árvore de Pastas",
    checkinEntregue: true,
    precisaResgate: false,
  },
  {
    id: "aluno-3",
    nome: "Dr. André Martins",
    whatsapp: "(31) 97766-5544",
    semaforoAtual: "vermelho",
    historicoSemaforos: ["vermelho", "vermelho"],
    travouEmLinha: "Sem tempo para mexer na infraestrutura do escritório",
    moduloAtual: "Módulo 1 — Árvore de Pastas",
    checkinEntregue: false,
    precisaResgate: true,
  },
];
