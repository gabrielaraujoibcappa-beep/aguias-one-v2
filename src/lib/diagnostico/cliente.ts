/** Helpers de navegador para as telas do placar de entrada. */
import { TODOS_CAMPOS } from "./campos";
import type { AnjoTipoT0, IcpSegmento, RiscoParcela, StatusDiagnostico } from "./regras";

export interface ErroApiDiagnostico {
  codigo: string;
  mensagem: string;
  campo?: string;
}

export class FalhaApi extends Error {
  constructor(public status: number, public erro: ErroApiDiagnostico) {
    super(erro.mensagem);
  }
}

/** fetch same-origin (cookie de sessão) que devolve JSON ou lança FalhaApi com o envelope do spec. */
export async function chamarApi<T = any>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    cache: "no-store",
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json?.sucesso === false) {
    const erro: ErroApiDiagnostico =
      typeof json?.erro === "object" && json.erro
        ? json.erro
        : { codigo: "erro", mensagem: typeof json?.erro === "string" ? json.erro : "Não foi possível concluir." };
    throw new FalhaApi(res.status, erro);
  }
  return json as T;
}

export function formatarCentavos(v: number | null | undefined): string {
  if (v === null || v === undefined) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 })
    .format(v / 100)
    .replace(/ /g, " ");
}

/** "R$ 1.234,56" | "1234" | "1.234,5" → centavos (inteiro) ou null. */
export function parseCentavos(texto: string): number | null {
  const limpo = texto.replace(/[^\d,]/g, "");
  if (!limpo) return null;
  const [inteiro, dec = ""] = limpo.split(",");
  const n = Number(inteiro || "0") * 100 + Number((dec + "00").slice(0, 2));
  return Number.isFinite(n) ? n : null;
}

export function formatarMesCurto(ref: string): string {
  const [ano, mes] = ref.split("-").map(Number);
  const nome = new Date(Date.UTC(ano, mes - 1, 1)).toLocaleDateString("pt-BR", { month: "short", timeZone: "UTC" });
  return `${nome.replace(".", "")}/${String(ano).slice(2)}`;
}

export function formatarData(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatarDataHora(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
}

export const ROTULOS_STATUS_DIAGNOSTICO: Record<StatusDiagnostico, string> = {
  rascunho: "Rascunho",
  enviado: "Enviado",
  congelado: "Congelado",
};

export const ROTULOS_SEGMENTO: Record<IcpSegmento, string> = {
  A_iniciante: "A · Iniciante",
  B_contador_bico: "B · Contador com bico",
  C_perito_solo: "C · Perito solo",
  D_escritorio: "D · Escritório",
};

export const ROTULOS_TIPO_ANJO: Record<AnjoTipoT0 | "D_vida", string> = {
  A_nada: "A · Nada de pé",
  B_estrutura_sem_venda: "B · Estrutura sem venda",
  C_vendeu_sem_sobrar: "C · Vendeu sem sobrar",
  D_vida: "D · Vida em cima",
  indefinido: "Indefinido",
};

export const ROTULOS_RISCO: Record<RiscoParcela, string> = {
  alto: "Risco alto",
  medio: "Risco médio",
  baixo: "Risco baixo",
};

/** Rótulo legível de uma opção de enum/multi pelo campo_id. */
export function rotuloOpcao(campoId: string, valor: string): string {
  const campo = TODOS_CAMPOS.find((c) => c.id === campoId);
  return campo?.opcoes?.find((o) => o.valor === valor)?.rotulo ?? valor;
}

export function rotuloCampo(campoId: string): string {
  return TODOS_CAMPOS.find((c) => c.id === campoId)?.rotulo ?? campoId;
}

/** CSV com BOM (Excel abre acentos) e aspas escapadas. */
export function gerarCsv(linhas: Record<string, string | number | boolean | null | undefined>[]): string {
  if (!linhas.length) return "";
  const colunas = Object.keys(linhas[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return "﻿" + [colunas.map(esc).join(";"), ...linhas.map((l) => colunas.map((c) => esc(l[c])).join(";"))].join("\r\n");
}

export function baixarArquivo(nome: string, conteudo: string, tipo = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }));
  const a = document.createElement("a");
  a.href = url;
  a.download = nome;
  a.click();
  URL.revokeObjectURL(url);
}
