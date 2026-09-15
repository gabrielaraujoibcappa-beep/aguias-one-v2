import { EvidenciaLinkItem, EvidenciaArquivoItem } from "./checkin";

export interface EntregaPendente {
  id: string;
  alunoNome: string;
  alunoEmail?: string;
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

export const ENTREGAS_MOCK: EntregaPendente[] = [
  {
    id: "ent-1",
    alunoNome: "Dr. Roberto Silva",
    alunoEmail: "roberto@pericia.com.br",
    moduloTitulo: "Módulo 1 — Árvore de Pastas no Google Drive",
    links: [{ rotulo: "Site no Ar", url: "https://periciaroberto.com.br" }],
    arquivos: [
      { rotulo: "Print das 8 Pastas", path: "uploads/pastas_roberto.png", nome: "pastas_drive.png" },
      { rotulo: "Print E-mail Hostinger", path: "uploads/email_roberto.png", nome: "email_hostinger.png" },
    ],
    travou: "DNS levou 12 horas para propagar, mas já está ativo",
    duvidaCall: "Como estruturar o primeiro contato com escritório de advocacia trabalhista?",
    status: "aguardando_avaliacao",
    enviadoEm: "2026-09-15T14:30:00Z",
  },
  {
    id: "ent-2",
    alunoNome: "Dra. Mariana Costa",
    alunoEmail: "mariana@advpericia.com.br",
    moduloTitulo: "Módulo 1 — Árvore de Pastas no Google Drive",
    links: [],
    arquivos: [
      { rotulo: "Print das Pastas", path: "uploads/pastas_mariana.png", nome: "pastas_drive.png" },
    ],
    status: "aguardando_avaliacao",
    enviadoEm: "2026-09-15T16:15:00Z",
  },
  {
    id: "ent-3",
    alunoNome: "Dr. Marcelo Mendes",
    alunoEmail: "marcelo@mendesengenharia.com.br",
    moduloTitulo: "Módulo 1 — Árvore de Pastas no Google Drive",
    links: [{ rotulo: "Site Ativo", url: "https://mendespericias.com.br" }],
    arquivos: [{ rotulo: "Print Pastas", path: "uploads/pastas_marcelo.png", nome: "pastas_drive.png" }],
    status: "aprovado",
    parecerTexto: "Estrutura de 8 pastas e nomenclatura em conformidade total com o PPC do ÁGUIAS ONE.",
    avaliadoPor: "Ana Carolina (Anjo)",
    avaliadoEm: "2026-09-14T18:20:00Z",
    enviadoEm: "2026-09-14T12:10:00Z",
  },
  {
    id: "ent-4",
    alunoNome: "Dra. Camila Nunes",
    alunoEmail: "camila@nunesgrafotécnica.com.br",
    moduloTitulo: "Módulo 1 — Árvore de Pastas no Google Drive",
    links: [],
    arquivos: [{ rotulo: "Print Pastas", path: "uploads/pastas_camila.png", nome: "pastas_drive.png" }],
    status: "ajuste_solicitado",
    parecerTexto: "Faltou comprovar permissão compartilhada de leitura na pasta de modelos contratuais.",
    avaliadoPor: "Flávio Lopes",
    avaliadoEm: "2026-09-14T19:10:00Z",
    enviadoEm: "2026-09-14T13:40:00Z",
  },
];
