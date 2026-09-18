-- Dossiê PDF auditoria (v3-A1): log de exports, sem dados pessoais além do necessário
CREATE TABLE IF NOT EXISTS public.audit_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID REFERENCES public.matriculas(id) ON DELETE SET NULL,
  filtros_json JSONB DEFAULT '{}'::jsonb,
  gerado_por UUID REFERENCES public.usuarios(id) ON DELETE SET NULL,
  criado_em TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.audit_exports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "equipe_gerencia_exports" ON public.audit_exports;
CREATE POLICY equipe_gerencia_exports ON public.audit_exports
  FOR ALL TO authenticated
  USING ((SELECT public.eh_equipe((SELECT auth.uid()))))
  WITH CHECK ((SELECT public.eh_equipe((SELECT auth.uid()))));

CREATE INDEX IF NOT EXISTS idx_audit_exports_matricula ON public.audit_exports (matricula_id);
CREATE INDEX IF NOT EXISTS idx_audit_exports_criado ON public.audit_exports (criado_em DESC);
