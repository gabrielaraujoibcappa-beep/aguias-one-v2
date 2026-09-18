-- ==============================================================================
-- ÁGUIAS ONE v2 - Troca obrigatória de senha no primeiro acesso
-- Data: 2026-09-18
--
-- Contexto: contas criadas pela equipe nascem com senha temporária repassada
-- pelo WhatsApp. `precisa_trocar_senha` trava o acesso até a troca
-- (middleware redireciona para /trocar-senha). Default false protege as
-- contas existentes — só criações e resets marcam true (via /api).
-- ==============================================================================

ALTER TABLE public.usuarios
  ADD COLUMN IF NOT EXISTS precisa_trocar_senha BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.usuarios.precisa_trocar_senha IS
  'True quando a senha atual é temporária (criação ou reset pela equipe) e o usuário precisa trocá-la no próximo login.';

-- Asserções
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'usuarios' AND column_name = 'precisa_trocar_senha'
  ) THEN
    RAISE EXCEPTION 'Coluna precisa_trocar_senha ausente em usuarios';
  END IF;
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE precisa_trocar_senha IS DISTINCT FROM false AND criado_em < now() - interval '1 minute') THEN
    RAISE EXCEPTION 'Contas existentes marcadas para troca de senha';
  END IF;
END
$$;
