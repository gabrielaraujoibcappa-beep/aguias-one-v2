/**
 * Plano dos 6 meses do Anjo — validação pura (SPEC diagnóstico §7.2, playbook do Anjo §5).
 */
import type { ErroDiagnostico } from "@/lib/diagnostico/regras";

export const TIPOS_PLANO = ["A_nada", "B_estrutura_sem_venda", "C_vendeu_sem_sobrar", "D_vida"] as const;
export const STATUS_PLANO = ["rascunho", "ativo", "reavaliar", "encerrado"] as const;

export type TipoPlano = (typeof TIPOS_PLANO)[number];
export type StatusPlano = (typeof STATUS_PLANO)[number];

export const ROTULOS_STATUS_PLANO: Record<StatusPlano, string> = {
  rascunho: "Rascunho",
  ativo: "Ativo",
  reavaliar: "Reavaliar",
  encerrado: "Encerrado",
};

export const MAX_PECA = 200;
export const MAX_EVIDENCIA = 500;
export const MAX_HORARIO = 120;

export interface PlanoEntrada {
  tipo: TipoPlano;
  peca1: string;
  evidencia1: string;
  data1: string; // YYYY-MM-DD
  peca2: string | null;
  cadenciaDias: number;
  horarioReal: string | null;
  status: StatusPlano;
}

/** Linha do banco (anjo_plano) → formato da API. */
export function planoDoBanco(l: any) {
  if (!l) return null;
  return {
    tipo: l.tipo as TipoPlano,
    peca1: l.peca_1 as string,
    evidencia1: l.evidencia_1 as string,
    data1: l.data_1 as string,
    peca2: (l.peca_2 as string | null) ?? null,
    cadenciaDias: l.cadencia_dias as number,
    horarioReal: (l.horario_real as string | null) ?? null,
    status: l.status as StatusPlano,
    criadoEm: l.criado_em as string | undefined,
    atualizadoEm: (l.atualizado_em as string | null) ?? null,
  };
}

function textoObrigatorio(v: unknown, campo: string, rotulo: string, max: number): { valor?: string; erro?: ErroDiagnostico } {
  const t = typeof v === "string" ? v.trim() : "";
  if (t.length < 3) return { erro: { codigo: "campo_obrigatorio", mensagem: `Preencha: ${rotulo}.`, campo } };
  if (t.length > max) return { erro: { codigo: "texto_longo", mensagem: `${rotulo}: no máximo ${max} caracteres.`, campo } };
  return { valor: t };
}

function textoOpcional(v: unknown, campo: string, rotulo: string, max: number): { valor?: string | null; erro?: ErroDiagnostico } {
  const t = typeof v === "string" ? v.trim() : "";
  if (!t) return { valor: null };
  if (t.length > max) return { erro: { codigo: "texto_longo", mensagem: `${rotulo}: no máximo ${max} caracteres.`, campo } };
  return { valor: t };
}

export function dataValida(v: unknown): v is string {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(`${v}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
}

/** Valida o corpo do PUT. Devolve o plano normalizado ou o primeiro erro. */
export function validarPlano(corpo: unknown): { plano: PlanoEntrada; erro?: undefined } | { erro: ErroDiagnostico; plano?: undefined } {
  const b = corpo && typeof corpo === "object" ? (corpo as Record<string, unknown>) : {};

  if (!TIPOS_PLANO.includes(b.tipo as TipoPlano)) {
    return { erro: { codigo: "tipo_invalido", mensagem: "Escolha o tipo A, B, C ou D.", campo: "tipo" } };
  }
  const peca1 = textoObrigatorio(b.peca1, "peca1", "Peça 1", MAX_PECA);
  if (peca1.erro) return { erro: peca1.erro };
  const evidencia1 = textoObrigatorio(b.evidencia1, "evidencia1", "Evidência da peça 1", MAX_EVIDENCIA);
  if (evidencia1.erro) return { erro: evidencia1.erro };
  if (!dataValida(b.data1)) {
    return { erro: { codigo: "data_invalida", mensagem: "Informe a data da peça 1.", campo: "data1" } };
  }
  const peca2 = textoOpcional(b.peca2, "peca2", "Peça 2", MAX_PECA);
  if (peca2.erro) return { erro: peca2.erro };
  const cadencia = typeof b.cadenciaDias === "number" ? b.cadenciaDias : Number(b.cadenciaDias);
  if (!Number.isInteger(cadencia) || cadencia <= 0 || cadencia > 365) {
    return { erro: { codigo: "cadencia_invalida", mensagem: "Cadência em dias: número inteiro entre 1 e 365.", campo: "cadenciaDias" } };
  }
  const horario = textoOpcional(b.horarioReal, "horarioReal", "Horário real", MAX_HORARIO);
  if (horario.erro) return { erro: horario.erro };
  const status = (b.status ?? "rascunho") as StatusPlano;
  if (!STATUS_PLANO.includes(status)) {
    return { erro: { codigo: "status_invalido", mensagem: "Status inválido.", campo: "status" } };
  }

  return {
    plano: {
      tipo: b.tipo as TipoPlano,
      peca1: peca1.valor as string,
      evidencia1: evidencia1.valor as string,
      data1: b.data1 as string,
      peca2: peca2.valor ?? null,
      cadenciaDias: cadencia,
      horarioReal: horario.valor ?? null,
      status,
    },
  };
}

/** Evento anjo.plano_ativo só na transição para ativo. */
export function passouAAtivo(statusAnterior: StatusPlano | null | undefined, novo: StatusPlano): boolean {
  return novo === "ativo" && statusAnterior !== "ativo";
}
