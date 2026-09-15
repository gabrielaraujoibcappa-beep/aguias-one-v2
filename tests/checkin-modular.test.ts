import { describe, it, expect } from "vitest";
import { validarSubmissaoCheckin, SubmissaoCheckin } from "../src/lib/api/checkin";

describe("Check-in Modular (ÁGUIAS ONE v2)", () => {
  it("deve validar links no formato http ou https", () => {
    const submissaoInvalida: SubmissaoCheckin = {
      matriculaId: "mat-1",
      moduloId: "mod-4",
      links: [{ rotulo: "Site no Ar", url: "site-invalido-sem-protocolo" }],
      arquivos: [{ rotulo: "Print Pastas", path: "uploads/print.png", nome: "print.png" }],
    };

    const res = validarSubmissaoCheckin(submissaoInvalida);
    expect(res.valido).toBe(false);
    expect(res.erros).toContain("Site no Ar: link deve iniciar com http:// ou https://");
  });

  it("deve aceitar submissão com links e múltiplos arquivos válidos", () => {
    const submissaoValida: SubmissaoCheckin = {
      matriculaId: "mat-1",
      moduloId: "mod-1",
      links: [{ rotulo: "Site no Ar", url: "https://periciaroberto.com.br" }],
      arquivos: [
        { rotulo: "Print 8 Pastas", path: "uploads/pastas.png", nome: "pastas.png" },
        { rotulo: "Print E-mail", path: "uploads/email.pdf", nome: "email.pdf" },
      ],
      travou: "Nenhuma trava, tudo rodando bem",
      duvidaCall: "Como abordar advogado que não responde no direct?",
    };

    const res = validarSubmissaoCheckin(submissaoValida);
    expect(res.valido).toBe(true);
    expect(res.erros.length).toBe(0);
  });
});
