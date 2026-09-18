# EPIC D — Badges Conclusão Módulo (v3 P1)

**PRD base:** `docs/PRD-v3.md` §2-D
**Objetivo:** desenvolver reconhecimento por módulo aprovado, aumentando conclusão.
**Rota:** `/dashboard`

## Escopo
- Regra: `auditoria=aprovado` → concede badge (unique aluno+modulo, idempotente)
- Tabela `badges(aluno_id, modulo_id, auditoria_id, created_at)`
- UI Cohere (hairline, StatusDot, sem emoji colorido), acessível, sem ranking público v3
- Contador progresso turma (agregado, sem expor LGPD)

## Stories previstas
1. D1 — Modelo + concessão idempotente + RLS
2. D2 — UI dashboard + estado vazio + acessibilidade
3. D3 — Testes (duplo aprovado não duplica, reprovado não gera)

## Aceite
- Re-auditoria não duplica; reprovado sem badge
- Typecheck + Vitest verdes; axe/tabs ok

## Gates
- CodeRabbit; review design Cohere; teste LGPD agregado

## Agentes
- @dev → @qa
