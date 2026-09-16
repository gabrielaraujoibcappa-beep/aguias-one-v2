-- Tabela de Auditoria e Log de E-mails Enviados pelo Sistema ÁGUIAS ONE
CREATE TABLE IF NOT EXISTS public.emails_enviados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  destinatario TEXT NOT NULL,
  template_id TEXT NOT NULL,
  assunto TEXT NOT NULL,
  corpo_html TEXT,
  status TEXT NOT NULL DEFAULT 'enviado',
  metadados JSONB DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.emails_enviados ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'emails_enviados' AND policyname = 'Equipe pode gerenciar log de emails'
  ) THEN
    CREATE POLICY "Equipe pode gerenciar log de emails"
      ON public.emails_enviados FOR ALL
      USING (public.eh_equipe(auth.uid()));
  END IF;
END
$$;
