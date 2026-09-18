# Handoff PM → Architect — Validar modelo/RLS EPIC A+B

**De:** Morgan (@pm) — 17/09/2026
**Para:** Aria (@architect)
**Base:** `docs/PRD-v3.md` + `docs/epics/v3-EPIC-A-auditoria-pdf.md` + `docs/epics/v3-EPIC-B-alerta-precoce.md`

## Pedido
Validar antes de codar:
- EPIC A: tabela `audit_exports`, RLS por papel, log acesso, performance 50 itens <5s, print A4
- EPIC B: lógica `atencaoPrecoce` em `turma-semaforo`, const configurável, sem WhatsApp auto, regressão 2-vermelhas intacta
- Confirmar policies espelhadas auditoria/alunos, índices, `supabase db lint` limpo
- Riscos LGPD: export só próprio aluno, consentimento calls (C futuro)

## Último comando PM
`create-epic` A+B prontos para revisão arquitetura
