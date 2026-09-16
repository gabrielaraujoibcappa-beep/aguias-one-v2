-- ==============================================================================
-- ÁGUIAS ONE v2 - Papel resgate (Adelayne), histórico semanal do semáforo e
-- registro de contatos de resgate
-- Data: 2026-09-16
-- Fonte: SPEC-DIAGNOSTICO-E-ACOMPANHAMENTO.md §3, §7.2 (vermelhos 28d, semáforo 12 meses), §7.4
--
-- resgate NÃO é equipe: eh_equipe() continua sem ele, então nenhuma política
-- existente passa a valer para a Adelayne. Tudo dela passa pelas rotas /api/resgate.
-- ==============================================================================

-- 1. Papel resgate
DO $$
DECLARE
  c record;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public' AND rel.relname = 'usuarios' AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%papel%'
  LOOP
    EXECUTE format('ALTER TABLE public.usuarios DROP CONSTRAINT %I', c.conname);
  END LOOP;
END
$$;

ALTER TABLE public.usuarios
  ADD CONSTRAINT usuarios_papel_check
  CHECK (papel IN ('admin', 'concierge', 'anjo', 'mentor', 'resgate', 'mentorado'));

-- 2. Foto semanal do semáforo (semana começa na segunda). Uma linha por matrícula/semana.
CREATE TABLE IF NOT EXISTS public.semaforo_semanal (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  semana DATE NOT NULL CHECK (extract(isodow FROM semana) = 1),
  cor TEXT NOT NULL CHECK (cor IN ('verde', 'amarelo', 'vermelho')),
  motivo TEXT,
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (matricula_id, semana)
);

CREATE INDEX IF NOT EXISTS semaforo_semanal_semana_idx ON public.semaforo_semanal (semana DESC);

-- 3. Contatos do resgate (append-only): canal e resultado, sem números nem frases
CREATE TABLE IF NOT EXISTS public.contato_resgate (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  canal TEXT NOT NULL CHECK (canal IN ('whatsapp', 'ligacao', 'email', 'outro')),
  resultado TEXT NOT NULL CHECK (resultado IN ('contato_feito', 'sem_resposta', 'retorno_agendado', 'encaminhado_concierge', 'desistencia')),
  observacao TEXT CHECK (observacao IS NULL OR char_length(observacao) <= 1000),
  motivo_contato TEXT NOT NULL CHECK (motivo_contato IN ('vermelho_duplo', 'diagnostico_atrasado', 'outro')),
  autor_id UUID NOT NULL REFERENCES public.usuarios(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS contato_resgate_matricula_idx ON public.contato_resgate (matricula_id, criado_em DESC);

DROP TRIGGER IF EXISTS trg_append_only ON public.contato_resgate;
CREATE TRIGGER trg_append_only BEFORE UPDATE ON public.contato_resgate
  FOR EACH ROW EXECUTE FUNCTION public.bloquear_alteracao_append_only();

-- 4. RLS: sem acesso direto de clientes (tudo via /api com service_role)
ALTER TABLE public.semaforo_semanal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.semaforo_semanal FORCE ROW LEVEL SECURITY;
ALTER TABLE public.contato_resgate ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contato_resgate FORCE ROW LEVEL SECURITY;
REVOKE ALL ON public.semaforo_semanal, public.contato_resgate FROM anon;

DROP POLICY IF EXISTS equipe_le ON public.semaforo_semanal;
CREATE POLICY equipe_le ON public.semaforo_semanal
  FOR SELECT TO authenticated
  USING ((SELECT public.eh_equipe((SELECT auth.uid()))));

-- 5. Asserções
DO $$
BEGIN
  IF (SELECT public.eh_equipe(NULL)) THEN
    RAISE EXCEPTION 'eh_equipe inesperado';
  END IF;
  IF pg_get_functiondef('public.eh_equipe(uuid)'::regprocedure) ILIKE '%resgate%' THEN
    RAISE EXCEPTION 'resgate não pode ser equipe';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public'
             AND tablename IN ('semaforo_semanal', 'contato_resgate') AND cmd <> 'SELECT') THEN
    RAISE EXCEPTION 'Escrita direta não permitida';
  END IF;
END
$$;
