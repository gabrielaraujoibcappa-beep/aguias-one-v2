-- ==============================================================================
-- ÁGUIAS ONE v2 - Matrícula exclusiva de mentorados + normalização de usuários
-- Data: 2026-09-16
--
-- Problema: o cadastro criava matrícula para contas da equipe (concierge, anjo...)
-- quando uma turma era escolhida, fazendo a equipe aparecer como aluno.
-- ==============================================================================

-- 1. Remove matrículas de contas da equipe (somente se não tiverem histórico)
DO $$
DECLARE
  v_historico int;
BEGIN
  SELECT
    (SELECT count(*) FROM public.checkins_modulo c   JOIN public.matriculas m ON m.id = c.matricula_id JOIN public.usuarios u ON u.id = m.usuario_id WHERE u.papel <> 'mentorado') +
    (SELECT count(*) FROM public.faturamentos f      JOIN public.matriculas m ON m.id = f.matricula_id JOIN public.usuarios u ON u.id = m.usuario_id WHERE u.papel <> 'mentorado') +
    (SELECT count(*) FROM public.presencas_encontro p JOIN public.matriculas m ON m.id = p.matricula_id JOIN public.usuarios u ON u.id = m.usuario_id WHERE u.papel <> 'mentorado') +
    (SELECT count(*) FROM public.canais_mentorados c JOIN public.matriculas m ON m.id = c.matricula_id JOIN public.usuarios u ON u.id = m.usuario_id WHERE u.papel <> 'mentorado')
  INTO v_historico;

  IF v_historico > 0 THEN
    RAISE EXCEPTION 'Matrículas da equipe possuem % registro(s) de histórico; revisar manualmente antes de remover', v_historico;
  END IF;

  DELETE FROM public.matriculas m
  USING public.usuarios u
  WHERE u.id = m.usuario_id AND u.papel <> 'mentorado';
END
$$;

-- 2. Matrícula só pode pertencer a mentorado
CREATE OR REPLACE FUNCTION public.garantir_matricula_de_mentorado()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.usuarios u WHERE u.id = NEW.usuario_id AND u.papel = 'mentorado') THEN
    RAISE EXCEPTION 'Somente usuários com papel mentorado podem ser matriculados'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_matricula_somente_mentorado ON public.matriculas;
CREATE TRIGGER trg_matricula_somente_mentorado
  BEFORE INSERT OR UPDATE OF usuario_id ON public.matriculas
  FOR EACH ROW EXECUTE FUNCTION public.garantir_matricula_de_mentorado();

-- 3. Usuários: normaliza nome/e-mail e impede virar equipe com matrícula ativa
CREATE OR REPLACE FUNCTION public.normalizar_e_validar_usuario()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.nome := regexp_replace(btrim(NEW.nome), '\s+', ' ', 'g');
  NEW.email := lower(btrim(NEW.email));

  IF TG_OP = 'UPDATE' AND NEW.papel <> 'mentorado' AND OLD.papel = 'mentorado'
     AND EXISTS (SELECT 1 FROM public.matriculas m WHERE m.usuario_id = NEW.id) THEN
    RAISE EXCEPTION 'Usuário possui matrícula; remova-a antes de alterar o papel para %', NEW.papel
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS trg_usuarios_normalizar ON public.usuarios;
CREATE TRIGGER trg_usuarios_normalizar
  BEFORE INSERT OR UPDATE ON public.usuarios
  FOR EACH ROW EXECUTE FUNCTION public.normalizar_e_validar_usuario();

REVOKE ALL ON FUNCTION public.garantir_matricula_de_mentorado() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.normalizar_e_validar_usuario() FROM PUBLIC, anon, authenticated;

-- 4. Normaliza cadastros existentes (dispara o trigger acima)
UPDATE public.usuarios
SET nome = nome
WHERE nome <> regexp_replace(btrim(nome), '\s+', ' ', 'g')
   OR email <> lower(btrim(email));

-- 5. Asserções
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.matriculas m JOIN public.usuarios u ON u.id = m.usuario_id WHERE u.papel <> 'mentorado') THEN
    RAISE EXCEPTION 'Ainda existem matrículas de contas da equipe';
  END IF;
  IF EXISTS (SELECT 1 FROM public.usuarios WHERE nome <> regexp_replace(btrim(nome), '\s+', ' ', 'g')) THEN
    RAISE EXCEPTION 'Ainda existem nomes não normalizados';
  END IF;
END
$$;
