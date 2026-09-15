import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Database Schema v2 Migration", () => {
  const sqlPath = path.resolve(__dirname, "../supabase/migrations/20260915200000_schema_v2.sql");

  it("deve existir o arquivo de migração SQL", () => {
    expect(fs.existsSync(sqlPath)).toBe(true);
  });

  it("deve criar todas as tabelas essenciais da especificação", () => {
    const sql = fs.readFileSync(sqlPath, "utf-8");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.usuarios");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.turmas");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.matriculas");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.modulos");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.modulo_liberacoes");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.checkins_modulo");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.checkin_evidencias");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.faturamentos");
    expect(sql).toContain("CREATE TABLE IF NOT EXISTS public.canais_mentorados");
  });

  it("deve suportar storage_zip_path e tipos de evidencias múltiplos", () => {
    const sql = fs.readFileSync(sqlPath, "utf-8");
    expect(sql).toContain("storage_zip_path");
    expect(sql).toContain("valor_url");
    expect(sql).toContain("storage_path");
  });

  it("deve habilitar Row Level Security (RLS) e políticas em tabelas críticas", () => {
    const sql = fs.readFileSync(sqlPath, "utf-8");
    expect(sql).toContain("ALTER TABLE public.faturamentos ENABLE ROW LEVEL SECURITY;");
    expect(sql).toContain("ALTER TABLE public.checkins_modulo ENABLE ROW LEVEL SECURITY;");
  });
});
