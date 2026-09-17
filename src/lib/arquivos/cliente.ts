import type { BucketArquivo } from "./regras";

export type ResultadoEnvioArquivo =
  | { sucesso: true; storagePath: string; tipo: string }
  | { sucesso: false; erro: string };

/** Envia um arquivo para /api/upload e devolve o caminho gravado no Storage. */
export async function enviarArquivo(file: File, bucket: BucketArquivo): Promise<ResultadoEnvioArquivo> {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("bucket", bucket);
  try {
    const res = await fetch("/api/upload", { method: "POST", body: formData });
    const json = await res.json().catch(() => ({}));
    if (!res.ok || !json.sucesso || !json.storagePath) {
      return { sucesso: false, erro: json.erro || "Falha ao enviar o arquivo." };
    }
    return { sucesso: true, storagePath: json.storagePath, tipo: json.tipo };
  } catch {
    return { sucesso: false, erro: "Sem conexão com o servidor. Tente novamente." };
  }
}
