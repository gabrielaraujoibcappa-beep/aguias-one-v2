import { describe, it, expect } from "vitest";
import { isStaff, canAudit, canManageCohorts, canManageUsers, PapelUsuario } from "../src/lib/auth/roles";

describe("RBAC Permissions (ÁGUIAS ONE v2)", () => {
  it("deve identificar papeis de equipe corretamente", () => {
    expect(isStaff("anjo" as PapelUsuario)).toBe(true);
    expect(isStaff("concierge" as PapelUsuario)).toBe(true);
    expect(isStaff("admin" as PapelUsuario)).toBe(true);
    expect(isStaff("mentor" as PapelUsuario)).toBe(true);
    expect(isStaff("mentorado" as PapelUsuario)).toBe(false);
  });

  it("apenas equipe autorizada pode auditar e liberar módulos", () => {
    expect(canAudit("anjo" as PapelUsuario)).toBe(true);
    expect(canAudit("concierge" as PapelUsuario)).toBe(true);
    expect(canAudit("admin" as PapelUsuario)).toBe(true);
    expect(canAudit("mentor" as PapelUsuario)).toBe(false);
    expect(canAudit("mentorado" as PapelUsuario)).toBe(false);
  });

  it("apenas admin e concierge podem gerenciar turmas", () => {
    expect(canManageCohorts("admin" as PapelUsuario)).toBe(true);
    expect(canManageCohorts("concierge" as PapelUsuario)).toBe(true);
    expect(canManageCohorts("anjo" as PapelUsuario)).toBe(false);
    expect(canManageCohorts("mentorado" as PapelUsuario)).toBe(false);
  });

  it("tanto admin quanto concierge (operação) podem criar e gerenciar usuários", () => {
    expect(canManageUsers("admin" as PapelUsuario)).toBe(true);
    expect(canManageUsers("concierge" as PapelUsuario)).toBe(true);
    expect(canManageUsers("anjo" as PapelUsuario)).toBe(false);
    expect(canManageUsers("mentor" as PapelUsuario)).toBe(false);
    expect(canManageUsers("mentorado" as PapelUsuario)).toBe(false);
  });
});

