-- ==============================================================================
-- ÁGUIAS ONE v2 - Histórico/eventos voltam a NO ACTION (conflito append-only)
-- Data: 2026-09-18
--
-- Contexto: a migração 20260918110000 colocou ON DELETE SET NULL em
-- diagnostico_historico.autor_id e evento_sistema.ator_id, mas essas tabelas
-- são append-only com trigger que bloqueia UPDATE — e o SET NULL do delete é
-- um UPDATE implícito ("Tabela diagnostico_historico é append-only: UPDATE
-- não permitido"). Além do erro, anular autor de trilha de auditoria seria
-- adulteração. Estas duas voltam a NO ACTION; a rota responde 409 explícito.
-- As outras três (modulo_liberacoes, checkins_modulo, faturamentos) seguem
-- SET NULL — são dados operacionais, sem trigger append-only.
-- ==============================================================================

ALTER TABLE public.diagnostico_historico
  DROP CONSTRAINT IF EXISTS diagnostico_historico_autor_id_fkey,
  ADD CONSTRAINT diagnostico_historico_autor_id_fkey
  FOREIGN KEY (autor_id) REFERENCES public.usuarios(id);

ALTER TABLE public.evento_sistema
  DROP CONSTRAINT IF EXISTS evento_sistema_ator_id_fkey,
  ADD CONSTRAINT evento_sistema_ator_id_fkey
  FOREIGN KEY (ator_id) REFERENCES public.usuarios(id);

-- Asserção do estado final: 3 operacionais SET NULL; 5 de auditoria NO ACTION
-- (anjo_nota, acesso_faturamento_log, contato_resgate, diagnostico_historico,
-- evento_sistema); matriculas/bloqueios CASCADE; audit_exports SET NULL.
DO $$
DECLARE
  v_inesperado text;
BEGIN
  SELECT string_agg(format('%s.%s (%s)', tabela, a.attname, c.confdeltype), ', ')
  INTO v_inesperado
  FROM pg_constraint c
  JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
  JOIN pg_class cl ON cl.oid = c.confrelid
  JOIN pg_namespace n ON n.oid = cl.relnamespace
  JOIN LATERAL (
    SELECT n2.nspname || '.' || cl2.relname AS tabela
    FROM pg_class cl2 JOIN pg_namespace n2 ON n2.oid = cl2.relnamespace
    WHERE cl2.oid = c.conrelid
  ) t ON true
  WHERE c.contype = 'f'
    AND n.nspname = 'public'
    AND cl.relname = 'usuarios'
    AND NOT (
      (tabela IN (
        'public.modulo_liberacoes', 'public.checkins_modulo', 'public.faturamentos') AND c.confdeltype = 'n')
      OR (tabela IN (
        'public.anjo_nota', 'public.acesso_faturamento_log', 'public.contato_resgate',
        'public.diagnostico_historico', 'public.evento_sistema') AND c.confdeltype = 'a')
      OR (tabela IN ('public.matriculas', 'public.bloqueios_acesso') AND c.confdeltype = 'c')
      OR (tabela = 'public.audit_exports' AND c.confdeltype = 'n')
    );

  IF v_inesperado IS NOT NULL THEN
    RAISE EXCEPTION 'FKs para usuarios sem regra de delete esperada: %', v_inesperado;
  END IF;
END
$$;
