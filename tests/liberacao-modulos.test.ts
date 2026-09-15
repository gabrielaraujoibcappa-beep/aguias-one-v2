import { describe, it, expect } from "vitest";
import {
  filtrarModulosVisiveis,
  alternarStatusModulo,
  ModuloItem,
} from "../src/lib/api/modulos-liberacao";

describe("Gestão e Liberação de Módulos (ÁGUIAS ONE v2)", () => {
  it("aluno só enxerga módulos liberados ou aprovados pela equipe", () => {
    const modulos: ModuloItem[] = [
      { id: "1", numero: 1, titulo: "Árvore de Pastas no Google Drive", status: "liberado", ordem: 1 },
      { id: "2", numero: 2, titulo: "Agenda e Semana-Modelo", status: "bloqueado", ordem: 2 },
      { id: "3", numero: 3, titulo: "Prospecção 10 seguir / 5 abordar", status: "aprovado", ordem: 3 },
      { id: "4", numero: 4, titulo: "Presença Digital & Hostinger", status: "bloqueado", ordem: 4 },
    ];

    const visiveis = filtrarModulosVisiveis(modulos);
    expect(visiveis.length).toBe(2);
    expect(visiveis.map((m) => m.numero)).toEqual([1, 3]);
  });

  it("permite ao Anjo ou Flávio liberar um módulo bloqueado", () => {
    const modulo: ModuloItem = {
      id: "2",
      numero: 2,
      titulo: "Agenda e Semana-Modelo",
      status: "bloqueado",
      ordem: 2,
    };

    const atualizado = alternarStatusModulo(modulo, "liberado", "user-flavio");
    expect(atualizado.status).toBe("liberado");
    expect(atualizado.liberadoPor).toBe("user-flavio");
    expect(atualizado.liberadoEm).toBeDefined();
  });
});
