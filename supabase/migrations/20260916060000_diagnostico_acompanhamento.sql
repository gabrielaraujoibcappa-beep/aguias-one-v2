-- ==============================================================================
-- ÁGUIAS ONE v2 - Placar de entrada (diagnóstico), notas/plano do Anjo e logs
-- Data: 2026-09-16
-- Fonte: 06-sistema/SPEC-DIAGNOSTICO-E-ACOMPANHAMENTO.md §8
--
-- Adaptação v1 → v2: a v2 não tem Edge Functions. Toda escrita e toda leitura
-- de terceiros passa pelas rotas /api (service_role), que filtram campos por
-- papel e gravam acesso_faturamento_log / evento_sistema. Por isso:
--   * RLS FORCE em todas as tabelas novas;
--   * nenhuma política de INSERT/UPDATE/DELETE para authenticated;
--   * leitura direta só do próprio diagnóstico e do próprio plano (aluno).
-- ==============================================================================

-- 1. Diagnóstico: 1 linha por matrícula
CREATE TABLE IF NOT EXISTS public.diagnostico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID NOT NULL UNIQUE REFERENCES public.matriculas(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'enviado', 'congelado')),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  scores JSONB NOT NULL DEFAULT '{}'::jsonb,
  enviado_em TIMESTAMPTZ,
  congelado_em TIMESTAMPTZ,
  versao INT NOT NULL DEFAULT 1,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT diagnostico_enviado_coerente CHECK (status = 'rascunho' OR enviado_em IS NOT NULL),
  CONSTRAINT diagnostico_congelado_coerente CHECK (status <> 'congelado' OR congelado_em IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS diagnostico_status_idx ON public.diagnostico (status);
CREATE INDEX IF NOT EXISTS diagnostico_segmento_idx ON public.diagnostico ((scores->>'icp_segmento'));

-- 2. Histórico de versões (envio, correção do aluno, correção/import do admin)
CREATE TABLE IF NOT EXISTS public.diagnostico_historico (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  diagnostico_id UUID NOT NULL REFERENCES public.diagnostico(id) ON DELETE CASCADE,
  versao INT NOT NULL,
  payload JSONB NOT NULL,
  scores JSONB,
  motivo TEXT,
  autor_papel TEXT NOT NULL,
  autor_id UUID REFERENCES public.usuarios(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS diagnostico_historico_diag_idx ON public.diagnostico_historico (diagnostico_id, versao);

-- 3. Notas do Anjo (append-only)
CREATE TABLE IF NOT EXISTS public.anjo_nota (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  corpo TEXT NOT NULL CHECK (char_length(corpo) BETWEEN 3 AND 4000),
  autor_id UUID NOT NULL REFERENCES public.usuarios(id),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS anjo_nota_matricula_idx ON public.anjo_nota (matricula_id, criado_em DESC);

-- 4. Plano dos 6 meses do Anjo (entrega 6 do spec — tabela criada já, telas em outubro)
CREATE TABLE IF NOT EXISTS public.anjo_plano (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID NOT NULL UNIQUE REFERENCES public.matriculas(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('A_nada', 'B_estrutura_sem_venda', 'C_vendeu_sem_sobrar', 'D_vida')),
  peca_1 TEXT NOT NULL,
  evidencia_1 TEXT NOT NULL,
  data_1 DATE NOT NULL,
  peca_2 TEXT,
  cadencia_dias INT NOT NULL DEFAULT 30 CHECK (cadencia_dias > 0),
  horario_real TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'ativo', 'reavaliar', 'encerrado')),
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now(),
  atualizado_em TIMESTAMPTZ
);

-- 5. Eventos do sistema (diagnostico.enviado, .atrasado, .congelado, .corrigido, leitura_icp_frases…)
CREATE TABLE IF NOT EXISTS public.evento_sistema (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL,
  matricula_id UUID REFERENCES public.matriculas(id) ON DELETE SET NULL,
  ator_id UUID REFERENCES public.usuarios(id),
  ator_papel TEXT,
  dados JSONB NOT NULL DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS evento_sistema_codigo_idx ON public.evento_sistema (codigo, criado_em DESC);
CREATE INDEX IF NOT EXISTS evento_sistema_matricula_idx ON public.evento_sistema (matricula_id, criado_em DESC);
-- Eventos de ciclo de vida acontecem uma vez por matrícula
CREATE UNIQUE INDEX IF NOT EXISTS evento_sistema_unico_ciclo_idx
  ON public.evento_sistema (codigo, matricula_id)
  WHERE codigo IN ('diagnostico.atrasado', 'diagnostico.congelado');

-- 6. Quem leu dinheiro de quem, quando e de onde
CREATE TABLE IF NOT EXISTS public.acesso_faturamento_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leitor_id UUID NOT NULL REFERENCES public.usuarios(id),
  leitor_papel TEXT NOT NULL,
  matricula_id UUID REFERENCES public.matriculas(id) ON DELETE SET NULL,
  origem TEXT NOT NULL,
  criado_em TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS acesso_faturamento_log_matricula_idx ON public.acesso_faturamento_log (matricula_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS acesso_faturamento_log_leitor_idx ON public.acesso_faturamento_log (leitor_id, criado_em DESC);

-- ==============================================================================
-- Append-only: notas, histórico e logs não se editam nem se apagam
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.bloquear_alteracao_append_only()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  RAISE EXCEPTION 'Tabela % é append-only: % não permitido', TG_TABLE_NAME, TG_OP
    USING ERRCODE = 'insufficient_privilege';
END
$$;

REVOKE ALL ON FUNCTION public.bloquear_alteracao_append_only() FROM PUBLIC, anon, authenticated;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['anjo_nota', 'diagnostico_historico', 'evento_sistema', 'acesso_faturamento_log'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_append_only ON public.%I', t);
    -- Só UPDATE: DELETE em cascata da matrícula (LGPD/remoção de aluno) continua possível
    EXECUTE format(
      'CREATE TRIGGER trg_append_only BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.bloquear_alteracao_append_only()',
      t);
  END LOOP;
END
$$;

-- ==============================================================================
-- Matrícula ativa cria o rascunho do diagnóstico
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.criar_diagnostico_rascunho()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'ativo' THEN
    INSERT INTO public.diagnostico (matricula_id) VALUES (NEW.id)
    ON CONFLICT (matricula_id) DO NOTHING;
  END IF;
  RETURN NEW;
END
$$;

REVOKE ALL ON FUNCTION public.criar_diagnostico_rascunho() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS trg_matricula_cria_diagnostico ON public.matriculas;
CREATE TRIGGER trg_matricula_cria_diagnostico
  AFTER INSERT OR UPDATE OF status ON public.matriculas
  FOR EACH ROW EXECUTE FUNCTION public.criar_diagnostico_rascunho();

INSERT INTO public.diagnostico (matricula_id)
SELECT m.id FROM public.matriculas m WHERE m.status = 'ativo'
ON CONFLICT (matricula_id) DO NOTHING;

-- ==============================================================================
-- View agregada de ICP (sem matricula_id, sem nome, sem frases)
-- Só service_role: a rota /api/icp/agregado exige mentor ou admin.
-- ==============================================================================
CREATE OR REPLACE VIEW public.vw_icp_agregado
WITH (security_invoker = true)
AS
SELECT
  m.turma_id,
  d.scores->>'icp_segmento' AS icp_segmento,
  COALESCE((d.scores->>'flag_e_aluno_casa')::boolean, false) AS flag_e_aluno_casa,
  d.scores->>'fit_one' AS fit_one,
  d.scores->>'anjo_tipo_t0' AS anjo_tipo_t0,
  d.scores->>'risco_parcela' AS risco_parcela,
  (d.scores->>'pct_pericia')::int AS pct_pericia,
  (d.scores->>'pct_at')::int AS pct_at,
  (d.scores->>'pct_escritorio')::int AS pct_escritorio,
  (d.scores->>'pct_outro')::int AS pct_outro,
  CASE
    WHEN (d.scores->>'pecas_de_pe')::int <= 2 THEN '0-2'
    WHEN (d.scores->>'pecas_de_pe')::int <= 5 THEN '3-5'
    ELSE '6-10'
  END AS pecas_de_pe_bucket,
  d.payload->>'forca_push' AS forca_push,
  d.payload->>'forca_pull' AS forca_pull,
  d.payload->>'forca_anxiety' AS forca_anxiety,
  d.payload->>'forca_habit' AS forca_habit,
  d.payload->'ultimo_origem' AS ultimo_origem,
  d.payload->>'ultimo_preco_escrito' AS ultimo_preco_escrito,
  d.payload->'pagou_casa' AS pagou_casa
FROM public.diagnostico d
JOIN public.matriculas m ON m.id = d.matricula_id
WHERE d.status IN ('enviado', 'congelado');

REVOKE ALL ON public.vw_icp_agregado FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.vw_icp_agregado TO service_role;

-- ==============================================================================
-- RLS
-- ==============================================================================
ALTER TABLE public.diagnostico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostico FORCE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostico_historico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostico_historico FORCE ROW LEVEL SECURITY;
ALTER TABLE public.anjo_nota ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anjo_nota FORCE ROW LEVEL SECURITY;
ALTER TABLE public.anjo_plano ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anjo_plano FORCE ROW LEVEL SECURITY;
ALTER TABLE public.evento_sistema ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evento_sistema FORCE ROW LEVEL SECURITY;
ALTER TABLE public.acesso_faturamento_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acesso_faturamento_log FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.diagnostico, public.diagnostico_historico, public.anjo_nota,
  public.anjo_plano, public.evento_sistema, public.acesso_faturamento_log FROM anon;

-- Aluno lê só o próprio diagnóstico e o próprio plano. Equipe lê pela API (com log).
DROP POLICY IF EXISTS leitura_propria ON public.diagnostico;
CREATE POLICY leitura_propria ON public.diagnostico
  FOR SELECT TO authenticated
  USING (matricula_id IN (
    SELECT m.id FROM public.matriculas m JOIN public.usuarios u ON u.id = m.usuario_id
    WHERE u.auth_id = (SELECT auth.uid())
  ));

DROP POLICY IF EXISTS leitura_propria ON public.anjo_plano;
CREATE POLICY leitura_propria ON public.anjo_plano
  FOR SELECT TO authenticated
  USING (matricula_id IN (
    SELECT m.id FROM public.matriculas m JOIN public.usuarios u ON u.id = m.usuario_id
    WHERE u.auth_id = (SELECT auth.uid())
  ));

-- ==============================================================================
-- Asserções
-- ==============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('diagnostico', 'diagnostico_historico', 'anjo_nota', 'anjo_plano', 'evento_sistema', 'acesso_faturamento_log')
      AND cmd <> 'SELECT'
  ) THEN
    RAISE EXCEPTION 'Tabelas do diagnóstico não podem ter política de escrita para clientes';
  END IF;
  IF has_table_privilege('authenticated', 'public.vw_icp_agregado', 'SELECT') THEN
    RAISE EXCEPTION 'vw_icp_agregado não pode ser lida por authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM public.matriculas m WHERE m.status = 'ativo'
             AND NOT EXISTS (SELECT 1 FROM public.diagnostico d WHERE d.matricula_id = m.id)) THEN
    RAISE EXCEPTION 'Matrícula ativa sem diagnóstico';
  END IF;
END
$$;
