export type PapelUsuario = "admin" | "concierge" | "anjo" | "mentor" | "mentorado";

export interface UsuarioSessao {
  id: string;
  authId: string;
  nome: string;
  email: string;
  papel: PapelUsuario;
}

export function isStaff(papel: PapelUsuario): boolean {
  return ["admin", "concierge", "anjo", "mentor"].includes(papel);
}

export function canAudit(papel: PapelUsuario): boolean {
  return ["admin", "concierge", "anjo"].includes(papel);
}

export function canManageCohorts(papel: PapelUsuario): boolean {
  return ["admin", "concierge"].includes(papel);
}

export function canManageUsers(papel: PapelUsuario): boolean {
  return papel === "admin";
}
