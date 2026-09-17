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
  faturamentoAtual?: number;
  /** Campos vindos de /api/semaforo */
  matriculaId?: string;
  motivoSemaforo?: string;
  vermelhos28d?: number;
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

export const LIMIAR_ATRASO_ATENCAO_PRECOCE = 0.4;
const MS_7D = 7 * 24 * 60 * 60 * 1000;

/** Proporção de entregas aguardando há +7d (0..1). Entrada mínima p/ teste sem DOM. */
export function calcularAtraso7d(
  entregas: Array<{ status?: string; enviadoEm?: string }>,
  agora = Date.now()
): number {
  const total = entregas.length;
  if (total === 0) return 0;
  const atrasadas = entregas.filter(
    (e) => e.status === "aguardando_avaliacao" && e.enviadoEm && agora - new Date(e.enviadoEm).getTime() > MS_7D
  ).length;
  return atrasadas / total;
}

export interface SinalAtencaoPrecoce {
  atraso7d: number;
  faltouCall: boolean;
}

export function verificarAtencaoPrecoce(
  semaforoAtual: "verde" | "amarelo" | "vermelho",
  sinal: SinalAtencaoPrecoce,
  limiarAtraso = LIMIAR_ATRASO_ATENCAO_PRECOCE
): { atencaoPrecoce: boolean; motivos: Array<"atraso" | "falta_call"> } {
  if (semaforoAtual !== "amarelo") return { atencaoPrecoce: false, motivos: [] };
  const motivos: Array<"atraso" | "falta_call"> = [];
  if (sinal.atraso7d > limiarAtraso) motivos.push("atraso");
  if (sinal.faltouCall) motivos.push("falta_call");
  return { atencaoPrecoce: motivos.length > 0, motivos };
}

export function gerarLinkWhatsAppResgate(aluno: AlunoSemaforoStatus, nomeConcierge = "Flávio Lopes"): string {
  const cleanPhone = aluno.whatsapp.replace(/\D/g, "");
  const ddiPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

  const mensagem = `Olá, ${aluno.nome}! Aqui é o ${nomeConcierge} da Mentoria ÁGUIAS ONE. Notei que você não enviou o check-in das últimas semanas e quero te ajudar a destravar o ${aluno.moduloAtual}. Como você está por aí? Vamos conversar?`;

  return `https://wa.me/${ddiPhone}?text=${encodeURIComponent(mensagem)}`;
}

