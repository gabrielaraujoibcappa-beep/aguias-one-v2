import { randomInt } from "crypto";

/** Senha temporária legível para repasse por WhatsApp (8 caracteres). */
export function gerarSenhaTemporaria(): string {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  let senha = "AG";
  for (let i = 0; i < 4; i++) senha += String(randomInt(0, 10));
  for (let i = 0; i < 2; i++) senha += letras[randomInt(0, letras.length)];
  return senha;
}
