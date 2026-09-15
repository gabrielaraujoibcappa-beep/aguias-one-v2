export interface ComprovanteItem {
  nome: string;
  path: string;
  tipo: "zip" | "arquivo";
}

export interface DeclaracaoFaturamento {
  id?: string;
  matriculaId: string;
  mesReferencia: string; // YYYY-MM-01
  valorBruto: number;
  comprovantes: ComprovanteItem[];
  criadoEm?: string;
}

const EXTENSOES_PERMITIDAS = [".zip", ".pdf", ".png", ".jpg", ".jpeg"];

export function validarComprovanteFaturamento(nomeArquivo: string): { valido: boolean; motivo?: string } {
  const lower = nomeArquivo.toLowerCase();
  const permitido = EXTENSOES_PERMITIDAS.some((ext) => lower.endsWith(ext));

  if (!permitido) {
    return {
      valido: false,
      motivo: "Formato inválido. Apenas .zip, .pdf, .png e .jpg são aceitos.",
    };
  }

  return { valido: true };
}

export function formatarMoedaReal(valor: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor).replace(/\u00a0/g, " ");
}

export const formatarMoedaBRL = formatarMoedaReal;

export const FATURAMENTOS_HISTORICO_MOCK: DeclaracaoFaturamento[] = [
  {
    id: "fat-1",
    matriculaId: "mat-1",
    mesReferencia: "2026-08-01",
    valorBruto: 14200.0,
    comprovantes: [
      { nome: "extrato_e_recibos_agosto.zip", path: "faturamentos/extrato_agosto.zip", tipo: "zip" },
    ],
    criadoEm: "2026-09-02T10:00:00Z",
  },
  {
    id: "fat-2",
    matriculaId: "mat-1",
    mesReferencia: "2026-07-01",
    valorBruto: 11800.0,
    comprovantes: [
      { nome: "comprovante_julho.pdf", path: "faturamentos/comp_julho.pdf", tipo: "arquivo" },
    ],
    criadoEm: "2026-08-03T11:30:00Z",
  },
];
