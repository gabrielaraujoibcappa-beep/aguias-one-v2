-- ==============================================================================
-- ÁGUIAS ONE v2 - Comprovantes do placar de entrada (diagnóstico)
-- Data: 2026-09-18
--
-- Contexto: o aluno anexa extratos/comprovantes que sustentam os números do
-- placar; a exportação do placar é um ZIP (placar.json + arquivos).
-- Arquivos ficam no bucket `comprovantes` (por usuário); esta tabela vincula
-- cada arquivo ao diagnóstico. Segue o padrão do placar: RLS FORCE, nenhuma
-- escrita direta por authenticated, leitura direta só do próprio.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.diagnostico_comprovantes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id UUID NOT NULL REFERENCES public.diagnostico(id) ON DELETE CASCADE,
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  nome_arquivo TEXT NOT NULL,
  tamanho_bytes INT,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS diagnostico_comprovantes_diag_idx
  ON public.diagnostico_comprovantes (diagnostico_id, criado_em DESC);

ALTER TABLE public.diagnostico_comprovantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostico_comprovantes FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.diagnostico_comprovantes FROM anon;

-- Aluno lê só os comprovantes do próprio diagnóstico. Equipe lê pela API (service_role).
DROP POLICY IF EXISTS leitura_propria ON public.diagnostico_comprovantes;
CREATE POLICY leitura_propria ON public.diagnostico_comprovantes
  FOR SELECT TO authenticated
  USING (matricula_id IN (
    SELECT m.id FROM public.matriculas m JOIN public.usuarios u ON u.id = m.usuario_id
    WHERE u.auth_id = (SELECT auth.uid())
  ));

-- Asserções
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'diagnostico_comprovantes' AND cmd <> 'SELECT'
  ) THEN
    RAISE EXCEPTION 'diagnostico_comprovantes não pode ter política de escrita para clientes';
  END IF;
END
$$;
