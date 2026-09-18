# Story v3-B3 — Configuração de Gatilhos, Log de Ações & Resumo Semanal do Anjo

**Epic:** `docs/epics/v3-EPIC-B-alerta-precoce.md` | **Depende:** v3-B1 e v3-B2
**Status:** Draft | **Prioridade:** P1

## User story
Como Coordenação (Admin / Mentor Chefe), quero registrar em log os alertas precoces ativados e emitir um resumo semanal das intervenções preventivas realizadas pelos Anjos, para medir a eficácia da reversão antes do semáforo vermelho.

## Aceite (obrigatório)
- [ ] Registro em `evento_sistema` (ou tabela de histórico) quando um aluno entra no status de atenção precoce (`codigo: 'alerta.atencao_precoce'`)
- [ ] Parâmetros de tolerância configuráveis (atraso percentual e janela de dias) isolados em arquivo de configuração sem hardcoding no meio do código
- [ ] Relatório consolidado ou card no resumo semanal do Anjo indicando:
  - Total de alertas precoces gerados na semana
  - Alunos que reverteram para verde em até 14 dias
  - Alunos que evoluíram para vermelho (indicador de risco)
- [ ] Endpoint seguro para leitura do resumo semanal com autorização restrita à equipe
- [ ] `npm test` e `npx tsc --noEmit` verdes

## Contexto técnico
- Consultar tabela `evento_sistema` criada na migration `20260916060000_diagnostico_acompanhamento.sql`
- Utilizar os serviços existentes de registro de eventos em `src/lib/diagnostico/servidor.ts` (`registrarEvento`)
- Preservar integridade append-only: logs não podem ser alterados ou deletados

## Tarefas
1. Mapear constantes de configuração em `src/lib/config/alertas-preditivos.ts`
2. Criar hook/helper de persistência de evento ao disparar o alerta
3. Adicionar sumário de métricas de prevenção para o Anjo e Mentor
4. Escrever testes automatizados validando o registro de log e cálculo de taxas de reversão

## Gates
- CodeRabbit review; integridade relacional validada; teste de não-regressão
