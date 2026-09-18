# Story v3-B1 — Regra Preditiva 1 Amarela + Matriz de Testes

**Epic:** `docs/epics/v3-EPIC-B-alerta-precoce.md` | **PRD:** `docs/PRD-v3.md` §2-B
**Status:** Draft | **Prioridade:** P0

## User story
Como Anjo da Turma, quero que o sistema sinalize precocemente alunos em estado "Amarelo" com risco iminente de evolução para "Vermelho", para que eu possa agir preventivamente antes que entrem em zona crítica de resgate.

## Aceite (obrigatório)
- [ ] Implementação da função pura `avaliarAlertaPrecoce(dadosAluno)` em `src/lib/api/turma-semaforo.ts`
- [ ] Regra de disparo:
  - Aluno com `semaforoAtual === 'amarelo'`
  - **E** (Atraso na entrega do módulo > 40% do prazo nos últimos 7 dias **OU** falta no encontro ao vivo de quarta-feira)
  - Resulta em: `atencaoPrecoce: true` e `motivoAtencao: string` ("Atraso crítico em entrega", "Falta no encontro semanal" ou ambos)
- [ ] Cenários negativos estritos:
  - Aluno "Verde" **NUNCA** ativa `atencaoPrecoce` mesmo com falta ou atraso leve
  - Aluno "Amarelo" sem atraso > 40% e com presença confirmada **NÃO** ativa `atencaoPrecoce`
  - Aluno "Vermelho" segue a regra padrão de Resgate (não conflita com alerta precoce)
- [ ] Bateria de testes em Vitest (`tests/alerta-precoce.test.ts`) cobrindo toda a matriz de combinações:
  - Verde x Sem Atraso x Presença (False)
  - Verde x Atraso >40% (False)
  - Amarelo x Sem Atraso x Presença (False)
  - Amarelo x Atraso >40% (True + motivo correto)
  - Amarelo x Falta na quarta (True + motivo correto)
  - Amarelo x Ambos (True + motivo consolidado)

## Contexto técnico
- Consultar `src/lib/api/turma-semaforo.ts` e `tests/semaforo-resgate.test.ts`
- Manter constantes isoladas e configuráveis: `LIMITE_ATRASO_PRECOCE_PCT = 0.40`
- Zero impacto nas regras consolidadas do Semáforo e Resgate (2 vermelhas = resgate)

## Tarefas
1. Definir tipos e constantes de alerta preditivo em `src/lib/api/turma-semaforo.ts`
2. Escrever a função pura `avaliarAlertaPrecoce`
3. Criar a suíte `tests/alerta-precoce.test.ts` com a matriz de validação
4. Garantir retrocompatibilidade com chamadas existentes ao store e painel

## Gates
- 100% dos testes da matriz passando; sem regressão em `tests/semaforo-resgate.test.ts`
