import { describe, it, expect } from "vitest";
import { isStaff, canAudit, canManageCohorts, canManageUsers, ehResgate, PapelUsuario } from "../src/lib/auth/roles";
import { PAPEIS_EQUIPE } from "../src/lib/auth/sessao-core";

describe("RBAC Permissions (ÁGUIAS ONE v2)", () => {
  it("deve identificar papeis de equipe corretamente", () => {
    expect(isStaff("anjo" as PapelUsuario)).toBe(true);
    expect(isStaff("concierge" as PapelUsuario)).toBe(true);
    expect(isStaff("admin" as PapelUsuario)).toBe(true);
    expect(isStaff("mentor" as PapelUsuario)).toBe(true);
    expect(isStaff("mentorado" as PapelUsuario)).toBe(false);
  });

  it("resgate não é equipe: não herda rotas de faturamento, check-in e alunos", () => {
    expect(isStaff("resgate")).toBe(false);
    expect(PAPEIS_EQUIPE).not.toContain("resgate");
    expect(ehResgate("resgate")).toBe(true);
    expect(ehResgate("concierge")).toBe(false);
  });

  it("parecer de auditoria: admin, concierge e mentor; Anjo não edita check-in nem faturamento", () => {
    expect(canAudit("concierge")).toBe(true);
    expect(canAudit("admin")).toBe(true);
    expect(canAudit("mentor")).toBe(true);
    expect(canAudit("anjo")).toBe(false);
    expect(canAudit("resgate")).toBe(false);
    expect(canAudit("mentorado")).toBe(false);
  });

  it("apenas admin e concierge podem gerenciar turmas", () => {
    expect(canManageCohorts("admin" as PapelUsuario)).toBe(true);
    expect(canManageCohorts("concierge" as PapelUsuario)).toBe(true);
    expect(canManageCohorts("anjo" as PapelUsuario)).toBe(false);
    expect(canManageCohorts("mentorado" as PapelUsuario)).toBe(false);
  });

  it("equipe (admin, concierge, mentor, anjo) pode criar e gerenciar usuários", () => {
    expect(canManageUsers("admin" as PapelUsuario)).toBe(true);
    expect(canManageUsers("concierge" as PapelUsuario)).toBe(true);
    expect(canManageUsers("anjo" as PapelUsuario)).toBe(true);
    expect(canManageUsers("mentor" as PapelUsuario)).toBe(true);
    expect(canManageUsers("mentorado" as PapelUsuario)).toBe(false);
  });
});
