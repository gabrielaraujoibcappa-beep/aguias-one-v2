-- Chaves de API do Gateway (ÁGUIAS ONE v2).
-- A chave em texto claro NUNCA é gravada: só o hash SHA-256 + prefixo p/ identificação.
-- Gerenciada em /admin/chaves (admin, concierge). Autentica o gateway via Bearer aq1_...

CREATE TABLE IF NOT EXISTS public.chaves_api (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id uuid NOT NULL REFERENCES public.usuarios (id) ON DELETE CASCADE,
  nome text NOT NULL,
  prefixo text NOT NULL,
  hash text NOT NULL UNIQUE,
  escopos text[] NOT NULL DEFAULT '{}',
  expira_em timestamptz NULL,
  revogada_em timestamptz NULL,
  ultimo_uso_em timestamptz NULL,
  criado_em timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS chaves_api_usuario_idx ON public.chaves_api (usuario_id);
CREATE INDEX IF NOT EXISTS chaves_api_hash_idx ON public.chaves_api (hash);

-- Service role opera livremente (rotas validam papel via exigirSessao).
ALTER TABLE public.chaves_api ENABLE ROW LEVEL SECURITY;
