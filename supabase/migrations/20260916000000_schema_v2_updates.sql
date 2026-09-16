-- Atualizações de Schema para Back-end ÁGUIAS ONE v2
-- Data: 2026-09-16

ALTER TABLE public.usuarios ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ativo';

ALTER TABLE public.faturamentos ADD COLUMN IF NOT EXISTS status_auditoria TEXT DEFAULT 'pendente';
ALTER TABLE public.faturamentos ADD COLUMN IF NOT EXISTS parecer_auditoria TEXT;
ALTER TABLE public.faturamentos ADD COLUMN IF NOT EXISTS auditado_por UUID REFERENCES public.usuarios(id);
ALTER TABLE public.faturamentos ADD COLUMN IF NOT EXISTS auditado_em TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS public.bloqueios_acesso (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  motivo TEXT NOT NULL,
  observacoes TEXT,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'encerrado')),
  bloqueado_por TEXT NOT NULL,
  bloqueado_em TIMESTAMPTZ DEFAULT now(),
  desbloqueado_por TEXT,
  desbloqueado_em TIMESTAMPTZ,
  justificativa_desbloqueio TEXT
);

ALTER TABLE public.bloqueios_acesso ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bloqueios_acesso' AND policyname = 'Acesso a bloqueios para equipe'
  ) THEN
    CREATE POLICY "Acesso a bloqueios para equipe"
      ON public.bloqueios_acesso FOR ALL
      USING (public.eh_equipe(auth.uid()));
  END IF;
END
$$;
