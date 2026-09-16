-- ==============================================================================
-- ÁGUIAS ONE v2 - Endurecimento de RLS e da função eh_equipe
-- Data: 2026-09-16
--
-- Contexto: todas as escritas da v2 passam pelas rotas /api (service role, que
-- ignora RLS). As políticas abaixo valem só para acesso direto ao Supabase com a
-- chave anon (pública) + JWT do usuário.
--
-- Corrige:
--   * aluno podia aprovar o próprio check-in (FOR ALL sem restrição) e inserir
--     faturamento já aprovado — escrita direta agora é exclusiva da equipe;
--   * políticas aplicadas a {public} (incluindo anon) — agora só authenticated;
--   * advisors: auth_rls_initplan, multiple_permissive_policies,
--     function_search_path_mutable e execução de SECURITY DEFINER por anon.
-- ==============================================================================

-- 1. eh_equipe: search_path fixo, STABLE e sem execução por anon
CREATE OR REPLACE FUNCTION public.eh_equipe(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE auth_id = uid AND papel IN ('admin', 'concierge', 'anjo', 'mentor')
  );
$$;

REVOKE ALL ON FUNCTION public.eh_equipe(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.eh_equipe(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.eh_equipe(uuid) IS
  'True quando o auth uid pertence à equipe (admin, concierge, anjo, mentor). Usada nas políticas RLS.';

-- 2. Remove as políticas anteriores
DROP POLICY IF EXISTS "Acesso a bloqueios para equipe" ON public.bloqueios_acesso;
DROP POLICY IF EXISTS "Permissao de escrita de checkins para aluno e equipe" ON public.checkins_modulo;
DROP POLICY IF EXISTS "Permissao de leitura de checkins" ON public.checkins_modulo;
DROP POLICY IF EXISTS "Equipe pode gerenciar log de emails" ON public.emails_enviados;
DROP POLICY IF EXISTS "Alunos leem encontros da sua turma" ON public.encontros_turma;
DROP POLICY IF EXISTS "Equipe gerencia encontros" ON public.encontros_turma;
DROP POLICY IF EXISTS "Aluno insere seu proprio faturamento" ON public.faturamentos;
DROP POLICY IF EXISTS "Aluno le apenas seu proprio faturamento" ON public.faturamentos;
DROP POLICY IF EXISTS "Alunos leem apenas suas proprias presencas" ON public.presencas_encontro;
DROP POLICY IF EXISTS "Equipe gerencia presencas" ON public.presencas_encontro;

-- 3. Tabelas exclusivas da equipe
CREATE POLICY equipe_gerencia ON public.bloqueios_acesso
  FOR ALL TO authenticated
  USING ((SELECT public.eh_equipe((SELECT auth.uid()))))
  WITH CHECK ((SELECT public.eh_equipe((SELECT auth.uid()))));

CREATE POLICY equipe_gerencia ON public.emails_enviados
  FOR ALL TO authenticated
  USING ((SELECT public.eh_equipe((SELECT auth.uid()))))
  WITH CHECK ((SELECT public.eh_equipe((SELECT auth.uid()))));

-- 4. Tabelas com leitura do próprio aluno: 1 política de SELECT + escrita só da equipe
--    (políticas de escrita por comando, para não sobrepor o SELECT)
DO $$
DECLARE
  cfg record;
  cmd text;
BEGIN
  FOR cfg IN
    SELECT * FROM (VALUES
      ('checkins_modulo',
       'matricula_id IN (SELECT m.id FROM public.matriculas m JOIN public.usuarios u ON u.id = m.usuario_id WHERE u.auth_id = (SELECT auth.uid()))'),
      ('faturamentos',
       'matricula_id IN (SELECT m.id FROM public.matriculas m JOIN public.usuarios u ON u.id = m.usuario_id WHERE u.auth_id = (SELECT auth.uid()))'),
      ('presencas_encontro',
       'matricula_id IN (SELECT m.id FROM public.matriculas m JOIN public.usuarios u ON u.id = m.usuario_id WHERE u.auth_id = (SELECT auth.uid()))'),
      ('encontros_turma',
       'turma_id IN (SELECT m.turma_id FROM public.matriculas m JOIN public.usuarios u ON u.id = m.usuario_id WHERE u.auth_id = (SELECT auth.uid()))')
    ) AS v(tabela, filtro_proprio)
  LOOP
    EXECUTE format(
      'CREATE POLICY leitura_propria_ou_equipe ON public.%I FOR SELECT TO authenticated USING ((%s) OR (SELECT public.eh_equipe((SELECT auth.uid()))))',
      cfg.tabela, cfg.filtro_proprio);

    FOREACH cmd IN ARRAY ARRAY['INSERT', 'UPDATE', 'DELETE'] LOOP
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR %s TO authenticated %s',
        'equipe_' || lower(cmd), cfg.tabela, cmd,
        CASE cmd
          WHEN 'INSERT' THEN 'WITH CHECK ((SELECT public.eh_equipe((SELECT auth.uid()))))'
          WHEN 'UPDATE' THEN 'USING ((SELECT public.eh_equipe((SELECT auth.uid())))) WITH CHECK ((SELECT public.eh_equipe((SELECT auth.uid()))))'
          ELSE 'USING ((SELECT public.eh_equipe((SELECT auth.uid()))))'
        END);
    END LOOP;
  END LOOP;
END
$$;

-- 5. Asserções
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND 'public' = ANY (roles)) THEN
    RAISE EXCEPTION 'Ainda existem políticas aplicadas a PUBLIC';
  END IF;
  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public') <> 18 THEN
    RAISE EXCEPTION 'Quantidade inesperada de políticas: %',
      (SELECT count(*) FROM pg_policies WHERE schemaname = 'public');
  END IF;
  IF has_function_privilege('anon', 'public.eh_equipe(uuid)', 'EXECUTE') THEN
    RAISE EXCEPTION 'anon ainda executa eh_equipe';
  END IF;
END
$$;
