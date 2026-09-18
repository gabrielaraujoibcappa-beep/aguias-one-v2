-- ==============================================================================
-- ÁGUIAS ONE v2 - Exclusão de usuário com rastro de autoria/auditoria
-- Data: 2026-09-18
--
-- Problema (FALHA-002): DELETE /api/alunos/[id] retornava 400 para qualquer
-- usuário com rastro, pois as FKs de autoria para usuarios(id) não tinham
-- regra de delete (padrão NO ACTION). O desenho previa a exclusão ("DELETE em
-- cascata da matrícula continua possível") — as FKs de autor foram esquecidas.
--
-- Regra: colunas de autoria anuláveis passam a ON DELETE SET NULL (a auditoria
-- é preservada, sem travar o delete). As colunas NOT NULL de auditoria
-- (anjo_nota.autor_id, acesso_faturamento_log.leitor_id,
-- contato_resgate.autor_id) seguem bloqueando — a rota responde 409 explícito.
-- ==============================================================================

ALTER TABLE public.modulo_liberacoes
  DROP CONSTRAINT IF EXISTS modulo_liberacoes_liberado_por_fkey,
  ADD CONSTRAINT modulo_liberacoes_liberado_por_fkey
  FOREIGN KEY (liberado_por) REFERENCES public.usuarios(id) ON DELETE SET NULL;

ALTER TABLE public.checkins_modulo
  DROP CONSTRAINT IF EXISTS checkins_modulo_avaliado_por_fkey,
  ADD CONSTRAINT checkins_modulo_avaliado_por_fkey
  FOREIGN KEY (avaliado_por) REFERENCES public.usuarios(id) ON DELETE SET NULL;

ALTER TABLE public.faturamentos
  DROP CONSTRAINT IF EXISTS faturamentos_auditado_por_fkey,
  ADD CONSTRAINT faturamentos_auditado_por_fkey
  FOREIGN KEY (auditado_por) REFERENCES public.usuarios(id) ON DELETE SET NULL;

ALTER TABLE public.diagnostico_historico
  DROP CONSTRAINT IF EXISTS diagnostico_historico_autor_id_fkey,
  ADD CONSTRAINT diagnostico_historico_autor_id_fkey
  FOREIGN KEY (autor_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;

ALTER TABLE public.evento_sistema
  DROP CONSTRAINT IF EXISTS evento_sistema_ator_id_fkey,
  ADD CONSTRAINT evento_sistema_ator_id_fkey
  FOREIGN KEY (ator_id) REFERENCES public.usuarios(id) ON DELETE SET NULL;

-- Asserções: as 5 FKs de autoria anulável são SET NULL; as 3 de auditoria
-- NOT NULL seguem NO ACTION de propósito; matriculas/audit_exports mantêm
-- CASCADE/SET NULL. Qualquer outra FK para usuarios sem regra falha alto.
DO $$
DECLARE
  v_inesperado text;
BEGIN
  SELECT string_agg(format('%s.%s', c.conrelid::regclass, a.attname), ', ')
  INTO v_inesperado
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
  JOIN pg_class cl ON cl.oid = c.confrelid
  JOIN pg_namespace n ON n.oid = cl.relnamespace
  WHERE c.contype = 'f'
    AND n.nspname = 'public'
    AND cl.relname = 'usuarios'
    AND NOT (
      (c.conrelid::regclass::text IN (
        'public.modulo_liberacoes', 'public.checkins_modulo', 'public.faturamentos',
        'public.diagnostico_historico', 'public.evento_sistema') AND c.confdeltype = 'n')
      OR (c.conrelid::regclass::text IN ('public.matriculas', 'public.bloqueios_acesso') AND c.confdeltype = 'c')
      OR (c.conrelid::regclass::text = 'public.audit_exports' AND c.confdeltype = 'n')
      OR (c.conrelid::regclass::text IN (
        'public.anjo_nota', 'public.acesso_faturamento_log', 'public.contato_resgate')
        AND c.confdeltype = 'a')
    );

  IF v_inesperado IS NOT NULL THEN
    RAISE EXCEPTION 'FKs para usuarios sem regra de delete esperada: %', v_inesperado;
  END IF;
END
$$;
