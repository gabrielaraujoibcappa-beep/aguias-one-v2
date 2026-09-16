import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { linkWhatsAppResgate, validarContatoResgate } from "../src/lib/acompanhamento/resgate";

const ler = (rel: string) => fs.readFileSync(path.resolve(__dirname, "..", rel), "utf-8");

describe("Resgate (Adelayne) — nunca vê números nem frases", () => {
  const lista = ler("src/app/api/resgate/route.ts");
  const contatos = ler("src/app/api/resgate/contatos/route.ts");

  it("GET da lista não seleciona payload, scores, faturamento nem notas do Anjo", () => {
    for (const proibido of ["payload", "scores", "valor_bruto", "faturamentos", "anjo_nota", "job_frase", "media_6m"]) {
      expect(lista).not.toContain(proibido);
    }
    expect(lista).toContain('.from("diagnostico").select("matricula_id, status")');
    expect(lista).toContain('exigirSessao(req, ["resgate", "concierge", "admin"])');
  });

  it("contatos: escrita só resgate e admin; sem dinheiro", () => {
    expect(contatos).toContain('exigirSessao(req, ["resgate", "admin"])');
    for (const proibido of ["payload", "scores", "valor_bruto", "anjo_nota"]) expect(contatos).not.toContain(proibido);
  });

  it("valida os enums da tabela contato_resgate", () => {
    const base = { matriculaId: "m1", canal: "whatsapp", resultado: "sem_resposta", motivoContato: "vermelho_duplo" };
    expect(validarContatoResgate(base).ok).toBe(true);
    expect(validarContatoResgate({ ...base, canal: "telegrama" })).toMatchObject({ ok: false, campo: "canal" });
    expect(validarContatoResgate({ ...base, resultado: "x" })).toMatchObject({ ok: false, campo: "resultado" });
    expect(validarContatoResgate({ ...base, motivoContato: "x" })).toMatchObject({ ok: false, campo: "motivoContato" });
    expect(validarContatoResgate({ ...base, observacao: "a".repeat(1001) })).toMatchObject({ ok: false, campo: "observacao" });
    expect(validarContatoResgate({ ...base, matriculaId: "" })).toMatchObject({ ok: false, campo: "matriculaId" });
  });

  it("enums do código batem com os CHECK da migration", () => {
    const sql = ler("supabase/migrations/20260916070000_resgate_semaforo_semanal.sql");
    expect(sql).toContain("CHECK (canal IN ('whatsapp', 'ligacao', 'email', 'outro'))");
    expect(sql).toContain(
      "CHECK (resultado IN ('contato_feito', 'sem_resposta', 'retorno_agendado', 'encaminhado_concierge', 'desistencia'))"
    );
    expect(sql).toContain("CHECK (motivo_contato IN ('vermelho_duplo', 'diagnostico_atrasado', 'outro'))");
  });

  it("link de WhatsApp com mensagem neutra, sem valores", () => {
    const link = linkWhatsAppResgate("Dr. Carlos Eduardo", "(11) 98765-4321");
    expect(link).toContain("https://wa.me/5511987654321");
    const texto = decodeURIComponent(link!.split("text=")[1]);
    expect(texto).toContain("Carlos");
    expect(texto).not.toMatch(/R\$|\d{3,}/);
    expect(linkWhatsAppResgate("Ana", null)).toBeNull();
  });
});
