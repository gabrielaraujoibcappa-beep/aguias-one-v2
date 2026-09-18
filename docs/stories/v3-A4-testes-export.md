# Story v3-A4 — Testes finais export PDF

**Epic:** `docs/epics/v3-EPIC-A-auditoria-pdf.md` | **Depende:** A1+A2+A3
**Status:** Draft | **Prioridade:** P0

## User story
Como QA, quero gates verdes do export, para liberar sem regressão LGPD.

## Aceite
- [ ] Vitest: ordenação timeline, 403 papel, isolamento matrícula, buffer `%PDF` válido, 50 itens <5s
- [ ] `npm test` + `npm run typecheck` + `supabase db lint` verdes
- [ ] Manual: 1 export real abre com header/timeline/paginação; log `audit_exports` gravado

## Tarefas
1. Completar `tests/auditoria-export.test.ts` + `tests/pdf-auditoria.test.ts`
2. Rodar suite + typecheck + lint, anexar evidência
3. Checklist LGPD troca-matrícula

## Gates
- CodeRabbit obrigatório antes merge

## Handoff
EPIC-A pronto → @dev → @qa. Depois B1.
