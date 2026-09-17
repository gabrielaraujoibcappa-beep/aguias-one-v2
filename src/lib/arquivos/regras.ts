/**
 * Regras de arquivos enviados ao Supabase Storage. Compartilhado entre as rotas
 * (validação de verdade) e as telas (mensagens antecipadas ao usuário).
 * Os limites espelham a configuração dos buckets no Supabase.
 */

export type BucketArquivo = "evidencias" | "comprovantes";

export type TipoArquivo = "pdf" | "png" | "jpg" | "zip";

export const REGRAS_BUCKET: Record<BucketArquivo, { tipos: TipoArquivo[]; tamanhoMaximoBytes: number }> = {
  evidencias: { tipos: ["pdf", "png", "jpg"], tamanhoMaximoBytes: 10 * 1024 * 1024 },
  comprovantes: { tipos: ["pdf", "png", "jpg", "zip"], tamanhoMaximoBytes: 25 * 1024 * 1024 },
};

export const MIME_POR_TIPO: Record<TipoArquivo, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  zip: "application/zip",
};

/** Extensões aceitas no seletor de arquivos para o bucket. */
export function extensoesDoBucket(bucket: BucketArquivo): string[] {
  return REGRAS_BUCKET[bucket].tipos.flatMap((t) => (t === "jpg" ? [".jpg", ".jpeg"] : [`.${t}`]));
}

export function ehBucketArquivo(valor: unknown): valor is BucketArquivo {
  return valor === "evidencias" || valor === "comprovantes";
}

/** Identifica o tipo pelo conteúdo (assinatura), não pelo nome nem pelo tipo informado pelo navegador. */
export function detectarTipoArquivo(bytes: Uint8Array): TipoArquivo | null {
  const comeca = (...assinatura: number[]) => assinatura.every((b, i) => bytes[i] === b);
  if (comeca(0x25, 0x50, 0x44, 0x46)) return "pdf"; // %PDF
  if (comeca(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "png";
  if (comeca(0xff, 0xd8, 0xff)) return "jpg";
  if (comeca(0x50, 0x4b, 0x03, 0x04) || comeca(0x50, 0x4b, 0x05, 0x06)) return "zip";
  return null;
}

/**
 * Caminho válido dentro do bucket: segmentos simples, sem "..", barra inicial ou
 * caracteres de controle. Não diz nada sobre posse; veja caminhoPertenceAoUsuario.
 */
export function caminhoSeguro(caminho: unknown): caminho is string {
  if (typeof caminho !== "string" || caminho.length === 0 || caminho.length > 300) return false;
  return caminho.split("/").every((seg) => /^[A-Za-z0-9_.-]+$/.test(seg) && seg !== "." && seg !== "..");
}

/** Arquivos de mentorado ficam sempre sob a pasta com o id do próprio usuário. */
export function caminhoPertenceAoUsuario(caminho: unknown, usuarioId: string): boolean {
  return caminhoSeguro(caminho) && caminho.startsWith(`${usuarioId}/`);
}

/** Link interno que abre o arquivo (a rota confere a permissão e redireciona). */
export function urlArquivo(bucket: BucketArquivo, caminho: string): string {
  return `/api/arquivos?bucket=${bucket}&path=${encodeURIComponent(caminho)}`;
}
