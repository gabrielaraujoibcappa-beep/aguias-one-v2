-- Meta de faturamento anual do mentorado, por matrícula.
-- Antes existia só no navegador (dados de demonstração); passa a ser persistida.
-- NULL = meta não definida: a interface usa o padrão de R$ 240.000 (R$ 20.000/mês).

ALTER TABLE public.matriculas
  ADD COLUMN IF NOT EXISTS meta_faturamento_anual NUMERIC(12, 2)
  CHECK (meta_faturamento_anual IS NULL OR meta_faturamento_anual > 0);

COMMENT ON COLUMN public.matriculas.meta_faturamento_anual IS
  'Meta anual de faturamento bruto em reais; dividida igualmente em 12 metas mensais.';
