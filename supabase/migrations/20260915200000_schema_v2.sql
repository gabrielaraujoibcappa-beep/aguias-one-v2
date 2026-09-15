-- ==============================================================================
-- ÁGUIAS ONE v2 - Migration Oficial de Banco de Dados
-- Data: 2026-09-15
-- Compatibilidade: PostgreSQL 15+ / Supabase
-- ==============================================================================

-- 1. Tabela de Usuários (RBAC)
CREATE TABLE IF NOT EXISTS public.usuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID UNIQUE,
  nome TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  whatsapp TEXT NOT NULL,
  cpf TEXT,
  area_pericial TEXT,
  papel TEXT NOT NULL DEFAULT 'mentorado' CHECK (papel IN ('admin', 'concierge', 'anjo', 'mentor', 'mentorado')),
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabela de Turmas
CREATE TABLE IF NOT EXISTS public.turmas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  horario_encontro TEXT DEFAULT 'Quartas, 18:15 às 19:45',
  limite_vagas INT DEFAULT 40,
  status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('aberta', 'em_andamento', 'concluida')),
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 3. Tabela de Matrículas (Vínculo Aluno <-> Turma)
CREATE TABLE IF NOT EXISTS public.matriculas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'trancado', 'inativo', 'concluido')),
  matriculado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(usuario_id, turma_id)
);

-- 4. Tabela de Módulos da Mentoria
CREATE TABLE IF NOT EXISTS public.modulos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero INT NOT NULL UNIQUE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  disciplina_ref TEXT,
  ordem INT NOT NULL,
  itens_roteiro JSONB DEFAULT '[]'::jsonb,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 5. Tabela de Liberação de Módulos por Turma (Controle do Anjo / Flávio)
CREATE TABLE IF NOT EXISTS public.modulo_liberacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turma_id UUID NOT NULL REFERENCES public.turmas(id) ON DELETE CASCADE,
  modulo_id UUID NOT NULL REFERENCES public.modulos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'liberado' CHECK (status IN ('liberado', 'bloqueado')),
  liberado_por UUID REFERENCES public.usuarios(id),
  liberado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(turma_id, modulo_id)
);

-- 6. Tabela de Check-ins por Módulo
CREATE TABLE IF NOT EXISTS public.checkins_modulo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  modulo_id UUID NOT NULL REFERENCES public.modulos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'aguardando_avaliacao' CHECK (status IN ('rascunho', 'aguardando_avaliacao', 'ajuste_solicitado', 'aprovado')),
  travou TEXT,
  duvida_call TEXT,
  parecer_texto TEXT,
  avaliado_por UUID REFERENCES public.usuarios(id),
  avaliado_em TIMESTAMPTZ,
  enviado_em TIMESTAMPTZ DEFAULT now(),
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(matricula_id, modulo_id)
);

-- 7. Tabela de Evidências Múltiplas do Check-in (Links e Uploads)
CREATE TABLE IF NOT EXISTS public.checkin_evidencias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  checkin_id UUID NOT NULL REFERENCES public.checkins_modulo(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('link', 'arquivo')),
  rotulo TEXT NOT NULL,
  valor_url TEXT,
  storage_path TEXT,
  nome_arquivo TEXT,
  criado_em TIMESTAMPTZ DEFAULT now()
);

-- 8. Tabela de Faturamentos Declarados (com Suporte a ZIP de Comprovantes)
CREATE TABLE IF NOT EXISTS public.faturamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  mes_referencia DATE NOT NULL,
  valor_bruto NUMERIC(12, 2) NOT NULL,
  storage_zip_path TEXT,
  criado_em TIMESTAMPTZ DEFAULT now(),
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(matricula_id, mes_referencia)
);

-- 9. Tabela de Canais do Mentorado
CREATE TABLE IF NOT EXISTS public.canais_mentorados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matricula_id UUID NOT NULL REFERENCES public.matriculas(id) ON DELETE CASCADE,
  canal_nome TEXT NOT NULL,
  url_canal TEXT,
  status TEXT NOT NULL DEFAULT 'nao_iniciado' CHECK (status IN ('nao_iniciado', 'ativo')),
  atualizado_em TIMESTAMPTZ DEFAULT now(),
  UNIQUE(matricula_id, canal_nome)
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ==============================================================================

ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.turmas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matriculas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.modulo_liberacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins_modulo ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_evidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faturamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.canais_mentorados ENABLE ROW LEVEL SECURITY;

-- Helper Function para verificar papel da equipe
CREATE OR REPLACE FUNCTION public.eh_equipe(uid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE auth_id = uid AND papel IN ('admin', 'concierge', 'anjo', 'mentor')
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Políticas de Faturamentos (Privacidade Total: Aluno só vê o seu, Equipe vê todos)
CREATE POLICY "Aluno le apenas seu proprio faturamento"
  ON public.faturamentos FOR SELECT
  USING (
    matricula_id IN (
      SELECT m.id FROM public.matriculas m
      JOIN public.usuarios u ON u.id = m.usuario_id
      WHERE u.auth_id = auth.uid()
    )
    OR public.eh_equipe(auth.uid())
  );

CREATE POLICY "Aluno insere seu proprio faturamento"
  ON public.faturamentos FOR INSERT
  WITH CHECK (
    matricula_id IN (
      SELECT m.id FROM public.matriculas m
      JOIN public.usuarios u ON u.id = m.usuario_id
      WHERE u.auth_id = auth.uid()
    )
    OR public.eh_equipe(auth.uid())
  );

-- Políticas de Check-ins (Aluno edita seus checkins, equipe visualiza e audita)
CREATE POLICY "Permissao de leitura de checkins"
  ON public.checkins_modulo FOR SELECT
  USING (
    matricula_id IN (
      SELECT m.id FROM public.matriculas m
      JOIN public.usuarios u ON u.id = m.usuario_id
      WHERE u.auth_id = auth.uid()
    )
    OR public.eh_equipe(auth.uid())
  );

CREATE POLICY "Permissao de escrita de checkins para aluno e equipe"
  ON public.checkins_modulo FOR ALL
  USING (
    matricula_id IN (
      SELECT m.id FROM public.matriculas m
      JOIN public.usuarios u ON u.id = m.usuario_id
      WHERE u.auth_id = auth.uid()
    )
    OR public.eh_equipe(auth.uid())
  );
