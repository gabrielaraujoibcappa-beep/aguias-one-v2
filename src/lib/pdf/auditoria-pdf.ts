import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface ItemDossie {
  data: string;
  tipo: string;
  titulo: string;
  detalhe?: string;
}

export interface DossieAuditoria {
  alunoNome: string;
  matricula: string;
  turma?: string;
  geradoEm: string;
  totalItens: number;
  itens: ItemDossie[];
}

const MARGEM = 48;
const LARGURA_TEXTO = 500;

function quebrarLinha(texto: string, max = 92): string[] {
  const palavras = texto.split(/\s+/).filter(Boolean);
  const linhas: string[] = [];
  let atual = "";
  for (const p of palavras) {
    const tentativa = atual ? `${atual} ${p}` : p;
    if (tentativa.length > max) {
      if (atual) linhas.push(atual);
      atual = p;
    } else {
      atual = tentativa;
    }
  }
  if (atual) linhas.push(atual);
  return linhas.length > 0 ? linhas : [""];
}

export async function gerarPdfDossie(dossie: DossieAuditoria): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const fonte = await doc.embedFont(StandardFonts.Helvetica);
  const fonteNegrito = await doc.embedFont(StandardFonts.HelveticaBold);

  let pagina = doc.addPage([595, 842]);
  let y = 800;
  let numeroPagina = 1;

  const rodape = () => {
    pagina.drawText(`Pagina ${numeroPagina} — Aguias One`, {
      x: MARGEM,
      y: 32,
      size: 8,
      font: fonte,
      color: rgb(0.45, 0.45, 0.45),
    });
  };

  const novaPagina = () => {
    rodape();
    pagina = doc.addPage([595, 842]);
    numeroPagina += 1;
    y = 800;
  };

  const escrever = (texto: string, opts: { negrito?: boolean; tamanho?: number; espaco?: number } = {}) => {
    const tamanho = opts.tamanho ?? 10;
    const altura = tamanho + 4;
    for (const linha of quebrarLinha(texto)) {
      if (y < 70) novaPagina();
      pagina.drawText(linha.slice(0, 200), {
        x: MARGEM,
        y,
        size: tamanho,
        font: opts.negrito ? fonteNegrito : fonte,
        color: rgb(0.12, 0.12, 0.12),
      });
      y -= altura;
    }
    y -= opts.espaco ?? 4;
  };

  escrever("AGUIAS ONE — Dossie de acompanhamento", { negrito: true, tamanho: 14, espaco: 2 });
  escrever(`Aluno: ${dossie.alunoNome} — Matricula: ${dossie.matricula}`, { tamanho: 10 });
  if (dossie.turma) escrever(`Turma: ${dossie.turma}`, { tamanho: 10 });
  escrever(`Gerado em: ${dossie.geradoEm} — Itens: ${dossie.totalItens}`, { tamanho: 9, espaco: 10 });

  if (dossie.itens.length === 0) {
    escrever("Nenhum item no periodo/filtros aplicados.", { tamanho: 10 });
  }

  for (const item of dossie.itens) {
    if (y < 110) novaPagina();
    escrever(`${item.data} — [${item.tipo}] ${item.titulo}`, { negrito: true, tamanho: 10, espaco: 0 });
    if (item.detalhe) escrever(item.detalhe.slice(0, 600), { tamanho: 9, espaco: 6 });
  }

  rodape();
  return doc.save();
}

export function montarItensDossie(input: {
  checkins: Array<{ modulo?: string; status?: string; parecer?: string | null; enviadoEm?: string; avaliadoEm?: string | null }>;
  presencas: Array<{ data?: string; status?: string }>;
  filtros: { moduloId?: string; decisao?: string; from?: string; to?: string };
}): ItemDossie[] {
  const itens: ItemDossie[] = [];

  for (const c of input.checkins) {
    if (input.filtros.moduloId && c.modulo !== input.filtros.moduloId) continue;
    if (input.filtros.decisao && c.status !== input.filtros.decisao) continue;
    itens.push({
      data: (c.avaliadoEm || c.enviadoEm || "").slice(0, 16).replace("T", " "),
      tipo: c.status === "aprovado" ? "aprovado" : c.status === "ajuste_solicitado" ? "ajuste" : "entrega",
      titulo: `Entrega ${c.modulo ?? ""}`.trim(),
      detalhe: c.parecer ? `Parecer: ${c.parecer}` : undefined,
    });
  }

  for (const p of input.presencas) {
    itens.push({
      data: (p.data || "").slice(0, 16).replace("T", " "),
      tipo: "presenca",
      titulo: `Presenca call: ${p.status ?? "registrada"}`,
    });
  }

  return itens
    .filter((i) => {
      if (input.filtros.from && i.data < input.filtros.from) return false;
      if (input.filtros.to && i.data > input.filtros.to) return false;
      return true;
    })
    .sort((a, b) => (a.data < b.data ? -1 : a.data > b.data ? 1 : 0));
}
