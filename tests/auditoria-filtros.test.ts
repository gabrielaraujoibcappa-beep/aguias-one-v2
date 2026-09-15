import { describe, it, expect } from "vitest";
import { filtrarEntregasAuditoria, EntregaPendente } from "../src/lib/api/auditoria";

describe("Filtros da Esteira de Auditoria de Entregas (ÁGUIAS ONE v2)", () => {
  const entregasExemplo: EntregaPendente[] = [
    {
      id: "ent-1",
      alunoNome: "Dr. Roberto Silva",
      alunoEmail: "roberto@pericia.com.br",
      moduloTitulo: "Módulo 1 — Árvore de Pastas no Google Drive",
      links: [{ rotulo: "Site no Ar", url: "https://periciaroberto.com.br" }],
      arquivos: [{ rotulo: "Print Pastas", path: "uploads/pastas_roberto.png", nome: "pastas_drive.png" }],
      travou: "DNS levou 12 horas para propagar",
      duvidaCall: "Como estruturar o primeiro contato com escritório?",
      status: "aguardando_avaliacao",
      enviadoEm: "2026-09-15T14:30:00Z",
    },
    {
      id: "ent-2",
      alunoNome: "Dra. Mariana Costa",
      alunoEmail: "mariana@advpericia.com.br",
      moduloTitulo: "Módulo 2 — Presença Digital",
      links: [],
      arquivos: [{ rotulo: "Print Perfil", path: "uploads/perfil.png", nome: "perfil.png" }],
      status: "aguardando_avaliacao",
      enviadoEm: "2026-09-15T16:15:00Z",
    },
    {
      id: "ent-3",
      alunoNome: "Dr. Marcelo Mendes",
      alunoEmail: "marcelo@mendes.com.br",
      moduloTitulo: "Módulo 1 — Árvore de Pastas no Google Drive",
      links: [],
      arquivos: [],
      status: "aprovado",
      parecerTexto: "Estrutura de 8 pastas correta.",
      avaliadoPor: "Ana Carolina (Anjo)",
      avaliadoEm: "2026-09-14T18:20:00Z",
      enviadoEm: "2026-09-14T12:10:00Z",
    },
    {
      id: "ent-4",
      alunoNome: "Dra. Camila Nunes",
      alunoEmail: "camila@nunes.com.br",
      moduloTitulo: "Módulo 1 — Árvore de Pastas no Google Drive",
      links: [],
      arquivos: [],
      status: "ajuste_solicitado",
      parecerTexto: "Faltou comprovar permissão compartilhada.",
      avaliadoPor: "Flávio Lopes",
      avaliadoEm: "2026-09-14T19:10:00Z",
      enviadoEm: "2026-09-14T13:40:00Z",
    },
  ];

  it("deve filtrar por busca de texto (nome ou módulo)", () => {
    const resRoberto = filtrarEntregasAuditoria(entregasExemplo, { busca: "roberto" });
    expect(resRoberto.length).toBe(1);
    expect(resRoberto[0].id).toBe("ent-1");

    const resModulo2 = filtrarEntregasAuditoria(entregasExemplo, { busca: "Presença Digital" });
    expect(resModulo2.length).toBe(1);
    expect(resModulo2[0].id).toBe("ent-2");
  });

  it("deve filtrar por módulo específico", () => {
    const resModulo1 = filtrarEntregasAuditoria(entregasExemplo, { modulo: "Módulo 1 — Árvore de Pastas no Google Drive" });
    expect(resModulo1.length).toBe(3);
  });

  it("deve filtrar apenas entregas com dúvida para a call de 4ª-feira", () => {
    const resDuvidas = filtrarEntregasAuditoria(entregasExemplo, { apenasComDuvida: true });
    expect(resDuvidas.length).toBe(1);
    expect(resDuvidas[0].id).toBe("ent-1");
  });

  it("deve filtrar apenas entregas com relato de trava", () => {
    const resTravas = filtrarEntregasAuditoria(entregasExemplo, { apenasComTrava: true });
    expect(resTravas.length).toBe(1);
    expect(resTravas[0].id).toBe("ent-1");
  });

  it("deve filtrar por decisão no histórico (aprovado ou ajuste_solicitado)", () => {
    const resAprovados = filtrarEntregasAuditoria(entregasExemplo, { decisao: "aprovado" });
    expect(resAprovados.length).toBe(1);
    expect(resAprovados[0].id).toBe("ent-3");

    const resAjustes = filtrarEntregasAuditoria(entregasExemplo, { decisao: "ajuste_solicitado" });
    expect(resAjustes.length).toBe(1);
    expect(resAjustes[0].id).toBe("ent-4");
  });

  it("deve filtrar por avaliador responsável", () => {
    const resAna = filtrarEntregasAuditoria(entregasExemplo, { avaliador: "Ana Carolina (Anjo)" });
    expect(resAna.length).toBe(1);
    expect(resAna[0].id).toBe("ent-3");

    const resFlavio = filtrarEntregasAuditoria(entregasExemplo, { avaliador: "Flávio Lopes" });
    expect(resFlavio.length).toBe(1);
    expect(resFlavio[0].id).toBe("ent-4");
  });
});
