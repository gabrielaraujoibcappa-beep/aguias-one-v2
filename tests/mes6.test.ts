import { describe, it, expect } from "vitest";
import { avaliarMes6, comparar, mesesAvaliados, naJanelaMes6 } from "../src/lib/acompanhamento/mes6";
import { dataValida, passouAAtivo, validarPlano } from "../src/lib/acompanhamento/plano";
import { dataMes6 } from "../src/lib/diagnostico/parametros";

const base = new Date("2027-03-14T12:00:00Z");
const fat = (mes: string, reais: number) => ({ mesReferencia: `${mes}-01`, valorBruto: reais });

describe("Mês 6 — régua (§10.4)", () => {
  it("avalia os 3 últimos meses fechados até a data base", () => {
    expect(mesesAvaliados(base)).toEqual(["2026-12-01", "2027-01-01", "2027-02-01"]);
  });

  it("média de entrada: abaixo → sessão obrigatória", () => {
    const r = avaliarMes6({
      mediaEntradaCentavos: 500000,
      metaCentavos: 800000,
      faturamentos: [fat("2026-12", 3000), fat("2027-01", 4000), fat("2027-02", 5000), fat("2026-11", 99999)],
      dataBase: base,
      regua: "media_entrada",
    });
    expect(r.media3m).toBe(400000);
    expect(r.comparativo).toBe("abaixo");
    expect(r.sessaoObrigatoria).toBe(true);
  });

  it("meta declarada como régua e tolerância de 5%", () => {
    const r = avaliarMes6({
      mediaEntradaCentavos: 100000,
      metaCentavos: 800000,
      faturamentos: [fat("2027-01", 7700), fat("2027-02", 8100)],
      dataBase: base,
      regua: "meta_declarada",
    });
    expect(r.media3m).toBe(790000);
    expect(r.comparativo).toBe("igual");
    expect(r.sessaoObrigatoria).toBe(false);
  });

  it("sem faturamento declarado = não sei = sessão", () => {
    const r = avaliarMes6({ mediaEntradaCentavos: 300000, metaCentavos: 500000, faturamentos: [], dataBase: base, regua: "media_entrada" });
    expect(r.naoSei).toBe(true);
    expect(r.comparativo).toBeNull();
    expect(r.sessaoObrigatoria).toBe(true);
  });

  it("placar de entrada 'não sei' força sessão mesmo acima", () => {
    const r = avaliarMes6({
      mediaEntradaCentavos: null,
      metaCentavos: 100000,
      faturamentos: [fat("2027-02", 9000)],
      dataBase: base,
      regua: "media_entrada",
      placarNaoSei: true,
    });
    expect(r.sessaoObrigatoria).toBe(true);
  });

  it("comparar e janela de 7 dias", () => {
    expect(comparar(106, 100)).toBe("acima");
    expect(comparar(95, 100)).toBe("igual");
    expect(comparar(94, 100)).toBe("abaixo");
    const agora = new Date("2027-03-10T12:00:00Z");
    expect(naJanelaMes6(new Date("2027-03-17T12:00:00Z"), agora)).toBe(true);
    expect(naJanelaMes6(new Date("2027-03-20T12:00:00Z"), agora)).toBe(false);
    expect(naJanelaMes6(new Date("2027-01-01T12:00:00Z"), agora)).toBe(true);
  });

  it("data do mês 6: 180 dias da matrícula ou da primeira quarta", () => {
    expect(dataMes6("2026-09-15T12:00:00Z", "2026-09-23", "matricula").toISOString()).toBe("2027-03-14T12:00:00.000Z");
    expect(dataMes6("2026-09-15T12:00:00Z", "2026-09-23", "primeira_quarta").toISOString()).toBe("2027-03-22T21:15:00.000Z");
  });
});

describe("Plano do Anjo — validação", () => {
  const valido = {
    tipo: "B_estrutura_sem_venda",
    peca1: "Preço escrito na prateleira",
    evidencia1: "Print da prateleira no WhatsApp",
    data1: "2027-04-10",
    cadenciaDias: 30,
    status: "ativo",
  };

  it("aceita plano completo e normaliza opcionais", () => {
    const r = validarPlano({ ...valido, peca2: "  ", horarioReal: " terça 7h " });
    expect(r.erro).toBeUndefined();
    expect(r.plano?.peca2).toBeNull();
    expect(r.plano?.horarioReal).toBe("terça 7h");
  });

  it("recusa tipo, data, cadência e status inválidos", () => {
    expect(validarPlano({ ...valido, tipo: "E" }).erro?.campo).toBe("tipo");
    expect(validarPlano({ ...valido, data1: "2027-02-30" }).erro?.campo).toBe("data1");
    expect(validarPlano({ ...valido, cadenciaDias: 0 }).erro?.campo).toBe("cadenciaDias");
    expect(validarPlano({ ...valido, status: "pausado" }).erro?.campo).toBe("status");
    expect(validarPlano({ ...valido, peca1: "x" }).erro?.campo).toBe("peca1");
    expect(validarPlano({ ...valido, evidencia1: "a".repeat(501) }).erro?.codigo).toBe("texto_longo");
  });

  it("data válida e transição para ativo", () => {
    expect(dataValida("2027-02-28")).toBe(true);
    expect(dataValida("28/02/2027")).toBe(false);
    expect(passouAAtivo("rascunho", "ativo")).toBe(true);
    expect(passouAAtivo("ativo", "ativo")).toBe(false);
    expect(passouAAtivo(null, "reavaliar")).toBe(false);
  });
});
