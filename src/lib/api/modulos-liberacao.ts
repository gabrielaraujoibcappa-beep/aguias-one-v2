export interface ModuloItem {
  id: string;
  numero: number;
  titulo: string;
  descricao?: string;
  disciplinaRef?: string;
  ordem: number;
  status: "liberado" | "bloqueado" | "aprovado" | "aguardando_avaliacao";
  liberadoPor?: string;
  liberadoEm?: string;
  itensRoteiro?: string[];
}

export function filtrarModulosVisiveis(modulos: ModuloItem[]): ModuloItem[] {
  return modulos.filter((m) => m.status === "liberado" || m.status === "aprovado" || m.status === "aguardando_avaliacao");
}

export function alternarStatusModulo(
  modulo: ModuloItem,
  novoStatus: "liberado" | "bloqueado",
  autorId: string
): ModuloItem {
  return {
    ...modulo,
    status: novoStatus,
    liberadoPor: novoStatus === "liberado" ? autorId : undefined,
    liberadoEm: novoStatus === "liberado" ? new Date().toISOString() : undefined,
  };
}
