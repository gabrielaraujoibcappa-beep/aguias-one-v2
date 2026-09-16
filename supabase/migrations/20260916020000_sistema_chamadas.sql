-- ==============================================================================
-- ÁGUIAS ONE v2 - Sistema de Chamadas e Encontros
-- Data: 2026-09-16
-- ==============================================================================

-- 1. Tabela de Encontros por Turma
CREATE TABLE IF NOT EXISTS public.encontros_turma (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  data_encontro DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'agendado' CHECK (status IN ('agendado', 'realizado', 'cancelado')),
  observacoes TEXT,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Presenças por Encontro
CREATE TABLE IF NOT EXISTS public.presencas_encontro (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encontro_id UUID NOT NULL REFERENCES public.encontros_turma(id) ON DELETE CASCADE,
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'falta' CHECK (status IN ('presente', 'falta', 'justificada')),
  criado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(encontro_id, matricula_id)
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.encontros_turma ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.presencas_encontro ENABLE ROW LEVEL SECURITY;

-- Políticas para Equipe: Permissão total para gerenciar encontros e presenças
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'encontros_turma' AND policyname = 'Equipe gerencia encontros'
  ) THEN
    CREATE POLICY "Equipe gerencia encontros"
      ON public.encontros_turma FOR ALL
      USING (public.eh_equipe(auth.uid()));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'presencas_encontro' AND policyname = 'Equipe gerencia presencas'
  ) THEN
    CREATE POLICY "Equipe gerencia presencas"
      ON public.presencas_encontro FOR ALL
      USING (public.eh_equipe(auth.uid()));
  END IF;
END
$$;

-- Políticas para Alunos: Permissão de leitura apenas dos seus encontros e presenças
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'encontros_turma' AND policyname = 'Alunos leem encontros da sua turma'
  ) THEN
    CREATE POLICY "Alunos leem encontros da sua turma"
      ON public.encontros_turma FOR SELECT
      USING (
        turma_id IN (
          SELECT t.id FROM public.turmas t
          JOIN public.matriculas m ON m.turma_id = t.id
          JOIN public.usuarios u ON u.id = m.usuario_id
          WHERE u.auth_id = auth.uid()
        )
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'presencas_encontro' AND policyname = 'Alunos leem apenas suas proprias presencas'
  ) THEN
    CREATE POLICY "Alunos leem apenas suas proprias presencas"
      ON public.presencas_encontro FOR SELECT
      USING (
        matricula_id IN (
          SELECT m.id FROM public.matriculas m
          JOIN public.usuarios u ON u.id = m.usuario_id
          WHERE u.auth_id = auth.uid()
        )
      );
  END IF;
END
$$;
