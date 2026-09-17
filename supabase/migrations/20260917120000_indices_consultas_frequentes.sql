-- Índices das consultas que as telas fazem a cada sincronização.
-- Só o que ainda falta: chaves estrangeiras usadas em filtro e junção não ganham
-- índice automático no Postgres, e as chaves únicas existentes já cobrem
-- (matricula_id, modulo_id), (matricula_id, mes_referencia), (turma_id, modulo_id),
-- (usuario_id, turma_id), (encontro_id, matricula_id) e (matricula_id, semana).

-- Listas por turma (painel, relatórios, chamada)
CREATE INDEX IF NOT EXISTS matriculas_turma_idx ON public.matriculas (turma_id);

-- Fila de auditoria: filtra por status e ordena por data de envio
CREATE INDEX IF NOT EXISTS checkins_modulo_status_idx ON public.checkins_modulo (status, enviado_em DESC);

-- Evidências de cada check-in (junção da fila e troca de evidências no reenvio)
CREATE INDEX IF NOT EXISTS checkin_evidencias_checkin_idx ON public.checkin_evidencias (checkin_id);

-- Bloqueio vigente do aluno, consultado a cada sincronização
CREATE INDEX IF NOT EXISTS bloqueios_acesso_usuario_idx ON public.bloqueios_acesso (usuario_id, status);

-- Encontros da turma, do mais recente para o mais antigo
CREATE INDEX IF NOT EXISTS encontros_turma_turma_idx ON public.encontros_turma (turma_id, data_encontro DESC);

-- Presenças do aluno (relatório de presença e ficha)
CREATE INDEX IF NOT EXISTS presencas_encontro_matricula_idx ON public.presencas_encontro (matricula_id);
