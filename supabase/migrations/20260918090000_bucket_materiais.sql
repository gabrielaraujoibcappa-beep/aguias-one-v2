-- ==============================================================================
-- ÁGUIAS ONE v2 - Bucket compartilhado de materiais de apoio
-- Data: 2026-09-18
--
-- Contexto: a seção "Materiais de Apoio & Templates" do dashboard do aluno
-- exibia itens mockados. Fonte real: bucket privado `materiais`, publicado
-- pela equipe e lido pelos mentorados via /api (service_role + signed URLs).
-- Catálogo = listagem do bucket (GET /api/materiais); sem tabela nova.
--
-- Acesso direto (anon key + JWT): somente equipe. Mentorados abrem arquivos
-- exclusivamente pela rota /api/arquivos (URL assinada curta, service_role).
-- ==============================================================================

-- 1. Bucket privado (idempotente)
INSERT INTO storage.buckets (id, name, public)
VALUES ('materiais', 'materiais', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Acesso direto só da equipe (leitura do mentorado passa pelo /api/arquivos)
DROP POLICY IF EXISTS materiais_equipe_gerencia ON storage.objects;
CREATE POLICY materiais_equipe_gerencia ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'materiais' AND (SELECT public.eh_equipe((SELECT auth.uid()))))
  WITH CHECK (bucket_id = 'materiais' AND (SELECT public.eh_equipe((SELECT auth.uid()))));

-- 3. Asserções
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'materiais' AND public = false) THEN
    RAISE EXCEPTION 'Bucket materiais não criado ou público';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'materiais_equipe_gerencia'
  ) THEN
    RAISE EXCEPTION 'Política materiais_equipe_gerencia ausente';
  END IF;
END
$$;
