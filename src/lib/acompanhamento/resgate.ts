/**
 * Resgate (Adelayne): enums de contato (espelham os CHECK de contato_resgate)
 * e validação pura do registro. Sem números, sem frases.
 */
export const CANAIS_RESGATE = ["whatsapp", "ligacao", "email", "outro"] as const;
export const RESULTADOS_RESGATE = [
  "contato_feito",
  "sem_resposta",
  "retorno_agendado",
  "encaminhado_concierge",
  "desistencia",
] as const;
export const MOTIVOS_RESGATE = ["vermelho_duplo", "diagnostico_atrasado", "outro"] as const;

export type CanalResgate = (typeof CANAIS_RESGATE)[number];
export type ResultadoResgate = (typeof RESULTADOS_RESGATE)[number];
export type MotivoResgate = (typeof MOTIVOS_RESGATE)[number];

export const ROTULOS_CANAL: Record<CanalResgate, string> = {
  whatsapp: "WhatsApp",
  ligacao: "Ligação",
  email: "E-mail",
  outro: "Outro",
};

export const ROTULOS_RESULTADO: Record<ResultadoResgate, string> = {
  contato_feito: "Contato feito",
  sem_resposta: "Sem resposta",
  retorno_agendado: "Retorno agendado",
  encaminhado_concierge: "Encaminhado ao Concierge",
  desistencia: "Desistência",
};

export const ROTULOS_MOTIVO: Record<MotivoResgate, string> = {
  vermelho_duplo: "Vermelho duas semanas seguidas",
  diagnostico_atrasado: "Placar de entrada atrasado",
  outro: "Outro",
};

export const MAX_OBSERVACAO = 1000;

export interface ContatoResgateEntrada {
  matriculaId: string;
  canal: CanalResgate;
  resultado: ResultadoResgate;
  motivoContato: MotivoResgate;
  observacao: string | null;
}

export function validarContatoResgate(
  body: unknown
): { ok: true; valor: ContatoResgateEntrada } | { ok: false; campo: string; mensagem: string } {
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  if (typeof b.matriculaId !== "string" || !b.matriculaId) return { ok: false, campo: "matriculaId", mensagem: "Informe o aluno." };
  if (!CANAIS_RESGATE.includes(b.canal as CanalResgate)) return { ok: false, campo: "canal", mensagem: "Canal inválido." };
  if (!RESULTADOS_RESGATE.includes(b.resultado as ResultadoResgate))
    return { ok: false, campo: "resultado", mensagem: "Resultado inválido." };
  if (!MOTIVOS_RESGATE.includes(b.motivoContato as MotivoResgate))
    return { ok: false, campo: "motivoContato", mensagem: "Motivo inválido." };
  let observacao: string | null = null;
  if (b.observacao !== undefined && b.observacao !== null) {
    if (typeof b.observacao !== "string") return { ok: false, campo: "observacao", mensagem: "Observação inválida." };
    observacao = b.observacao.trim() || null;
    if (observacao && observacao.length > MAX_OBSERVACAO)
      return { ok: false, campo: "observacao", mensagem: `Observação com até ${MAX_OBSERVACAO} caracteres.` };
  }
  return {
    ok: true,
    valor: {
      matriculaId: b.matriculaId,
      canal: b.canal as CanalResgate,
      resultado: b.resultado as ResultadoResgate,
      motivoContato: b.motivoContato as MotivoResgate,
      observacao,
    },
  };
}

/** Mensagem neutra de retomada: sem valores, sem frases do diagnóstico. */
export function linkWhatsAppResgate(nome: string, whatsapp: string | null, remetente = "Adelayne"): string | null {
  const digitos = (whatsapp ?? "").replace(/\D/g, "");
  if (digitos.length < 10) return null;
  const numero = digitos.startsWith("55") ? digitos : `55${digitos}`;
  const primeiroNome = nome.split(" ").find((p) => !/^(dr|dra|prof)\.?$/i.test(p)) ?? nome;
  const texto = `Oi, ${primeiroNome}! Aqui é a ${remetente}, da Mentoria ÁGUIAS ONE. Senti sua falta nas últimas semanas e queria saber como você está. Posso te ajudar a retomar?`;
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}
