import { describe, it, expect } from "vitest";
import {
  inicioSemana,
  semanasVermelhasSeguidas,
  ultimas52,
  vermelhoDuplo,
  vermelhos28d,
  type FotoSemana,
} from "../src/lib/acompanhamento/semaforo-semanal";

describe("Semáforo semanal", () => {
  it("inicioSemana devolve a segunda-feira no fuso de Brasília", () => {
    expect(inicioSemana("2026-09-16T15:00:00Z")).toBe("2026-09-14"); // quarta
    expect(inicioSemana("2026-09-14T03:30:00Z")).toBe("2026-09-14"); // segunda 00h30 em SP
    expect(inicioSemana("2026-09-14T02:30:00Z")).toBe("2026-09-07"); // ainda domingo em SP
    expect(inicioSemana("2026-09-20T12:00:00Z")).toBe("2026-09-14"); // domingo
  });

  const hist: FotoSemana[] = [
    { semana: "2026-08-10", cor: "vermelho" },
    { semana: "2026-08-24", cor: "vermelho" },
    { semana: "2026-08-31", cor: "amarelo" },
    { semana: "2026-09-07", cor: "vermelho" },
    { semana: "2026-09-14", cor: "vermelho" },
  ];

  it("vermelhos28d conta semanas vermelhas iniciadas nos últimos 28 dias", () => {
    expect(vermelhos28d(hist, new Date("2026-09-16T15:00:00Z"))).toBe(3);
    expect(vermelhos28d([], new Date())).toBe(0);
  });

  it("vermelho duplo exige as duas semanas mais recentes vermelhas e consecutivas", () => {
    expect(vermelhoDuplo(hist)).toBe(true);
    expect(semanasVermelhasSeguidas(hist)).toBe(2);
    expect(vermelhoDuplo([{ semana: "2026-09-14", cor: "vermelho" }, { semana: "2026-08-31", cor: "vermelho" }])).toBe(false);
    expect(vermelhoDuplo([{ semana: "2026-09-14", cor: "vermelho" }])).toBe(false);
  });

  it("ultimas52 limita e ordena da mais antiga para a mais recente", () => {
    const muitas = Array.from({ length: 60 }, (_, i) => ({
      semana: new Date(Date.UTC(2025, 0, 6 + i * 7)).toISOString().slice(0, 10),
      cor: "verde" as const,
    }));
    const r = ultimas52(muitas.reverse());
    expect(r).toHaveLength(52);
    expect(r[0].semana < r[51].semana).toBe(true);
    expect(r[51].semana).toBe(muitas[0].semana);
  });
});
