# Story v3-B1 — Regra atenção precoce 1 amarela

**Epic:** `docs/epics/v3-EPIC-B-alerta-precoce.md` | **PRD:** `docs/PRD-v3.md` §2-B
**Status:** Draft | **Prioridade:** P0

## User story
Como Anjo, quero ver fila “Atenção precoce” com motivo, para agir antes do vermelho sem WhatsApp auto.

## Aceite
- [ ] Regra pura em `src/lib/api/turma-semaforo.ts`: `amarelo` E (atraso >40% 7d OU faltou call) → `atencaoPrecoce=true + motivo[]`; verde/vermelho nunca; amarela sem gatilho não alerta
- [ ] Const configurável (ex. `LIMIAR_ATRASO=0.4`), sem hardcode mágico
- [ ] Regressão: `verificarNecessidadeResgate([vermelho,vermelho])` intacto
- [ ] Vitest matriz 3x2 + typecheck verdes

## Tarefas
1. Implementar `verificarAtencaoPrecoce()` + testes `tests/atencao-precoce.test.ts`
2. Expor motivo para UI turma (sem UI completa neste story)
3. Rodar `semaforo-resgate.test.ts` existente

## Gates
- CodeRabbit; revisão regra com Anjo; sem WhatsApp auto neste story

## Handoff
Após pronto → B2 UI fila.
