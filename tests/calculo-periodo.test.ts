import { describe, it, expect } from "vitest";
import {
  calcularIntervaloAtalho,
  validarIntervaloCustomizado,
  formatarPeriodoLegivel,
  criarPeriodoPadrao,
} from "../src/lib/periodo/calculo-periodo";

describe("Módulo de Cálculo e Validação Temporal de Período", () => {
  const refDate = new Date("2026-09-16T12:00:00Z");

  it("deve calcular corretamente os atalhos relativos", () => {
    const hoje = calcularIntervaloAtalho("hoje", refDate);
    expect(hoje.dataInicio).toBe("2026-09-16");
    expect(hoje.dataFim).toBe("2026-09-16");

    const ultimos7d = calcularIntervaloAtalho("ultimos_7d", refDate);
    expect(ultimos7d.dataInicio).toBe("2026-09-09");
    expect(ultimos7d.dataFim).toBe("2026-09-16");

    const ultimos30d = calcularIntervaloAtalho("ultimos_30d", refDate);
    expect(ultimos30d.dataInicio).toBe("2026-08-17");
    expect(ultimos30d.dataFim).toBe("2026-09-16");

    const mesAtual = calcularIntervaloAtalho("mes_atual", refDate);
    expect(mesAtual.dataInicio).toBe("2026-09-01");
    expect(mesAtual.dataFim).toBe("2026-09-16");

    const ciclo = calcularIntervaloAtalho("ciclo_atual", refDate);
    expect(ciclo.dataInicio).toBe("2026-08-01");
    expect(ciclo.dataFim).toBe("2026-09-16");
  });

  it("deve validar datas inválidas e ordens temporais incorretas", () => {
    // Início posterior ao fim
    const invertido = validarIntervaloCustomizado("2026-09-20", "2026-09-10");
    expect(invertido.valido).toBe(false);
    expect(invertido.erro).toContain("posterior");

    // Início vazio
    const semInicio = validarIntervaloCustomizado("", "2026-09-10");
    expect(semInicio.valido).toBe(false);

    // Datas válidas no passado
    const valido = validarIntervaloCustomizado("2026-08-01", "2026-08-31", true);
    expect(valido.valido).toBe(true);
    expect(valido.erro).toBeUndefined();
  });

  it("deve formatar período legível por extenso", () => {
    const padrao = criarPeriodoPadrao("Painel da Turma");
    expect(padrao.escopo).toBe("Painel da Turma");
    expect(padrao.granularidade).toBe("semana");

    const legivel = formatarPeriodoLegivel({
      tipo: "relativo",
      atalho: "ultimos_30d",
      dataInicio: "2026-08-17",
      dataFim: "2026-09-16",
      granularidade: "semana",
      fusoHorario: "America/Sao_Paulo (UTC-3)",
      ultimaAtualizacao: refDate,
      escopo: "Global (Turma)",
    });

    expect(legivel).toContain("Últimos 30 dias");
    expect(legivel).toContain("17/08/2026");
    expect(legivel).toContain("16/09/2026");
  });
});
