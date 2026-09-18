# EPIC C — Transcrição Call Quarta MVP Manual (v3 P2, depois)

**PRD base:** `docs/PRD-v3.md` §2-C
**Objetivo:** direcionar vínculo call→check-in com custo zero IA nesta fase.
**Rota:** `/admin/chamadas` + auditoria

## Escopo MVP manual
- Campos: upload áudio opcional + colar transcrição + resumo + combinados + `moduloId` + link dúvida/trava + flag consentimento LGPD
- Tabela `call_transcripts(id, data_call, modulo_id, resumo, transcricao, combinados, consentimento, criado_por)`
- Auditoria exibe “resumo call + ver transcrição” + fonte. Editável.
- Fora: transcrição automática realtime, IA resumo auto (futuro, provider retenção zero)

## Stories previstas
1. C1 — Modelo + RLS + upload bucket permitido
2. C2 — UI chamadas + vínculo módulo + consentimento
3. C3 — Exibição auditoria + edição + testes

## Aceite
- Piloto 30d ≥60% calls com link; fonte sempre visível
- Sem consentimento → bloqueia upload

## Gates
- CodeRabbit; revisão LGPD; validação Mentor

## Agentes
- @architect valida storage/RLS → @dev → @qa
