import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Migration do placar de entrada (SPEC diagnóstico §8)", () => {
  const sql = fs.readFileSync(
    path.resolve(__dirname, "../supabase/migrations/20260916060000_diagnostico_acompanhamento.sql"),
    "utf-8"
  );

  it("cria as tabelas do spec e os logs de auditoria", () => {
    for (const tabela of ["diagnostico", "diagnostico_historico", "anjo_nota", "anjo_plano", "evento_sistema", "acesso_faturamento_log"]) {
      expect(sql).toContain(`CREATE TABLE IF NOT EXISTS public.${tabela} (`);
      expect(sql).toContain(`ALTER TABLE public.${tabela} FORCE ROW LEVEL SECURITY;`);
    }
  });

  it("não concede escrita a clientes: só políticas de SELECT", () => {
    const politicas = sql.match(/CREATE POLICY[\s\S]*?;/g) ?? [];
    expect(politicas.length).toBeGreaterThan(0);
    for (const p of politicas) expect(p).toMatch(/FOR SELECT TO authenticated/);
  });

  it("status e tipos com CHECK do spec", () => {
    expect(sql).toContain("CHECK (status IN ('rascunho', 'enviado', 'congelado'))");
    expect(sql).toContain("CHECK (tipo IN ('A_nada', 'B_estrutura_sem_venda', 'C_vendeu_sem_sobrar', 'D_vida'))");
    expect(sql).toContain("CHECK (char_length(corpo) BETWEEN 3 AND 4000)");
  });

  it("notas, histórico e logs são append-only", () => {
    expect(sql).toMatch(/ARRAY\['anjo_nota', 'diagnostico_historico', 'evento_sistema', 'acesso_faturamento_log'\]/);
    expect(sql).toContain("bloquear_alteracao_append_only");
  });

  it("view de ICP fechada para anon/authenticated e sem frases", () => {
    expect(sql).toContain("REVOKE ALL ON public.vw_icp_agregado FROM PUBLIC, anon, authenticated;");
    const view = sql.slice(sql.indexOf("CREATE OR REPLACE VIEW public.vw_icp_agregado"), sql.indexOf("REVOKE ALL ON public.vw_icp_agregado"));
    for (const frase of ["job_frase", "frase_sabado", "frase_preco", "frase_sozinho", "ultima_vez_organizou"]) {
      expect(view).not.toContain(frase);
    }
    expect(view).not.toMatch(/AS matricula_id|usuarios/);
  });

  it("matrícula ativa cria rascunho", () => {
    expect(sql).toContain("trg_matricula_cria_diagnostico");
  });
});
