-- ==============================================================================
-- ÁGUIAS ONE v2 - Remoção do esquema legado da v1 (sistema desativado)
-- Data: 2026-09-16
--
-- Backup completo (estrutura + dados) gerado antes desta migration em:
--   supabase/backups/v1-legado-2026-09-16/  (fora do git: contém dados pessoais)
--
-- Verificado antes de aplicar:
--   * nenhum código da v2 referencia estes objetos;
--   * nenhuma tabela, política ou coluna da v2 depende deles (pg_depend);
--   * dependências externas eram só da própria v1: trigger em auth.users e
--     políticas de storage dos buckets evidencias/kits.
--
-- Mantido: public.eh_equipe(uuid), usada pelas políticas RLS da v2.
-- ==============================================================================

-- 1. Trigger da v1 em auth.users (disparava em todo login/cadastro)
DROP TRIGGER IF EXISTS trg_vincular_aluno_ao_login ON auth.users;

-- 2. Jobs agendados da v1
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'cron') THEN
    PERFORM cron.unschedule(jobname)
    FROM cron.job
    WHERE jobname IN ('apurar-gate-mes', 'fechar-semanas-vencidas');
  END IF;
END
$$;

-- 3. Políticas de storage da v1
DROP POLICY IF EXISTS evidencia_leitura_dono_e_equipe ON storage.objects;
DROP POLICY IF EXISTS evidencia_upload_na_propria_pasta ON storage.objects;
DROP POLICY IF EXISTS kits_admin_escreve ON storage.objects;
DROP POLICY IF EXISTS kits_leitura ON storage.objects;

-- 4. Views da v1
DROP VIEW IF EXISTS
  public.vw_candidatos_botao,
  public.vw_elegiveis_gate,
  public.vw_equipe,
  public.vw_fila_encontro,
  public.vw_historico_checkin,
  public.vw_indicadores_turma,
  public.vw_mentorados,
  public.vw_meu_plano,
  public.vw_painel_semanas,
  public.vw_resgate_vermelhos,
  public.vw_usuarios
CASCADE;

-- 5. Tabelas da v1 (CASCADE remove apenas FKs, triggers e políticas destas próprias tabelas)
DROP TABLE IF EXISTS
  public.acesso_faturamento_log,
  public.aluno,
  public.aula,
  public.canal_negocio,
  public.checkin_item,
  public.checkin_semana,
  public.contato_resgate,
  public.duvida,
  public.encontro,
  public.evento_sistema,
  public.evidencia,
  public.faturamento_mes,
  public.faturamento_mes_historico,
  public.fila_botao_na_tela,
  public.funcao_negocio,
  public.gate_evento,
  public.item_canal,
  public.kit_item,
  public.kit_produto,
  public.lancamento_caixa,
  public.lead,
  public.material_aula,
  public.matricula,
  public.notificacao,
  public.plano_item,
  public.plano_item_catalogo,
  public.presenca_encontro,
  public.turma,
  public.usuario_papel
CASCADE;

-- 6. Funções da v1 (todas do schema public, exceto eh_equipe)
DO $$
DECLARE
  f record;
BEGIN
  FOR f IN
    SELECT p.oid::regprocedure AS assinatura, p.prokind
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.prokind IN ('f', 'p')
      AND p.proname <> 'eh_equipe'
      AND NOT EXISTS (SELECT 1 FROM pg_depend d WHERE d.objid = p.oid AND d.deptype = 'e')
  LOOP
    IF f.prokind = 'p' THEN
      EXECUTE format('DROP PROCEDURE IF EXISTS %s CASCADE', f.assinatura);
    ELSE
      EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', f.assinatura);
    END IF;
  END LOOP;
END
$$;

-- 7. Tipos enum da v1 (a v2 usa TEXT + CHECK)
DROP TYPE IF EXISTS
  public.duvida_st,
  public.duvida_t,
  public.estagio_lead_t,
  public.evidencia_t,
  public.gate_st,
  public.matricula_t,
  public.natureza_lancamento_t,
  public.ocupante_funcao_t,
  public.papel_t,
  public.plano_st,
  public.semaforo_t,
  public.turma_st
CASCADE;

-- 8. Asserções: se algo da v2 tiver sido afetado, a transação inteira é desfeita
DO $$
DECLARE
  tabela text;
BEGIN
  FOREACH tabela IN ARRAY ARRAY[
    'usuarios', 'turmas', 'matriculas', 'modulos', 'modulo_liberacoes', 'checkins_modulo',
    'checkin_evidencias', 'faturamentos', 'canais_mentorados', 'bloqueios_acesso',
    'emails_enviados', 'encontros_turma', 'presencas_encontro'
  ]
  LOOP
    IF to_regclass('public.' || tabela) IS NULL THEN
      RAISE EXCEPTION 'Tabela da v2 ausente após limpeza: %', tabela;
    END IF;
  END LOOP;

  IF to_regprocedure('public.eh_equipe(uuid)') IS NULL THEN
    RAISE EXCEPTION 'Função public.eh_equipe(uuid) ausente após limpeza';
  END IF;

  IF (SELECT count(*) FROM pg_policies WHERE schemaname = 'public'
      AND tablename IN ('bloqueios_acesso', 'emails_enviados', 'encontros_turma', 'presencas_encontro',
                        'checkins_modulo', 'faturamentos')) < 10 THEN
    RAISE EXCEPTION 'Políticas RLS da v2 foram removidas indevidamente';
  END IF;
END
$$;
