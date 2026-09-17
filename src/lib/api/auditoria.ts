import { EvidenciaLinkItem, EvidenciaArquivoItem } from "./checkin";

export interface EntregaPendente {
  id: string;
  alunoNome: string;
  alunoEmail?: string;
  /** Matrícula do dono da entrega — preferir ao nome (homônimos). */
  matriculaId?: string;
  moduloTitulo: string;
  links: EvidenciaLinkItem[];
  arquivos: EvidenciaArquivoItem[];
  travou?: string;
  duvidaCall?: string;
  status: "aguardando_avaliacao" | "ajuste_solicitado" | "aprovado";
  parecerTexto?: string;
  avaliadoPor?: string;
  avaliadoEm?: string;
  enviadoEm: string;
}

export function processarParecerAuditoria(
  entrega: EntregaPendente,
  decisao: "aprovado" | "ajuste_solicitado",
  parecerTexto: string,
  avaliadorNome: string
): EntregaPendente {
  if (decisao === "ajuste_solicitado" && (!parecerTexto || parecerTexto.trim().length === 0)) {
    throw new Error("Motivo do ajuste é obrigatório");
  }

  return {
    ...entrega,
    status: decisao,
    parecerTexto: parecerTexto.trim() || undefined,
    avaliadoPor: avaliadorNome,
    avaliadoEm: new Date().toISOString(),
  };
}

export interface FiltrosAuditoria {
  busca?: string;
  modulo?: string;
  apenasComDuvida?: boolean;
  apenasComTrava?: boolean;
  decisao?: "aprovado" | "ajuste_solicitado";
  avaliador?: string;
}

export function filtrarEntregasAuditoria(
  entregas: EntregaPendente[],
  filtros: FiltrosAuditoria
): EntregaPendente[] {
  return entregas.filter((e) => {
    // 1. Busca textual
    if (filtros.busca && filtros.busca.trim().length > 0) {
      const termo = filtros.busca.toLowerCase();
      const bateuNome = e.alunoNome.toLowerCase().includes(termo);
      const bateuModulo = e.moduloTitulo.toLowerCase().includes(termo);
      const bateuParecer = e.parecerTexto ? e.parecerTexto.toLowerCase().includes(termo) : false;
      const bateuDuvida = e.duvidaCall ? e.duvidaCall.toLowerCase().includes(termo) : false;
      if (!bateuNome && !bateuModulo && !bateuParecer && !bateuDuvida) {
        return false;
      }
    }

    // 2. Filtro por módulo
    if (filtros.modulo && filtros.modulo !== "todos" && e.moduloTitulo !== filtros.modulo) {
      return false;
    }

    // 3. Apenas com dúvida de call
    if (filtros.apenasComDuvida && (!e.duvidaCall || e.duvidaCall.trim().length === 0)) {
      return false;
    }

    // 4. Apenas com relato de trava
    if (filtros.apenasComTrava && (!e.travou || e.travou.trim().length === 0)) {
      return false;
    }

    // 5. Filtro por decisão
    if (filtros.decisao && e.status !== filtros.decisao) {
      return false;
    }

    // 6. Filtro por avaliador
    if (filtros.avaliador && filtros.avaliador !== "todos" && e.avaliadoPor !== filtros.avaliador) {
      return false;
    }

    return true;
  });
}

