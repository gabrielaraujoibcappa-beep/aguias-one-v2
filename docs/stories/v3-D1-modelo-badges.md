# Story v3-D1 — Modelo badges idempotente

**Epic:** D | **Status:** Draft P1

## Story
Como sistema, quero conceder badge 1x por módulo aprovado, para base do reconhecimento.

## Aceite
- [ ] Tabela `badges(aluno_id, modulo_id, auditoria_id, created_at, unique aluno+modulo)` + RLS equipe/mentorado-próprio
- [ ] Trigger/função concede só se `auditoria=aprovado`; re-auditoria não duplica; reprovado não gera
- [ ] Migration + `db lint` limpos; teste Vitest duplicidade

## Gates
CodeRabbit; LGPD. Handoff → D2.
