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
  return ["admin", "concierge"].includes(papel);
}

export const ROTULOS_PAPEL: Record<PapelUsuario, string> = {
  admin: "Admin",
  concierge: "Concierge",
  anjo: "Anjo",
  mentor: "Mentor",
  mentorado: "Mentorado",
};

/**
 * Quem aparece nas telas de aluno (turma, faturamento, chamada, ficha).
 * Cadastro sem papel conta como mentorado: dados locais antigos não tinham o campo.
 */
export function ehMentorado(papel?: PapelUsuario | null): boolean {
  return !papel || papel === "mentorado";
}

export function apenasMentorados<T extends { papel?: PapelUsuario | null }>(lista: T[]): T[] {
  return lista.filter((item) => ehMentorado(item.papel));
}

export function separarPorPapel<T extends { papel?: PapelUsuario | null }>(lista: T[]): { mentorados: T[]; equipe: T[] } {
  const mentorados: T[] = [];
  const equipe: T[] = [];
  for (const item of lista) (ehMentorado(item.papel) ? mentorados : equipe).push(item);
  return { mentorados, equipe };
}
