# EPIC B — Alerta Preditivo 1 Amarela (v3 P0)

**PRD base:** `docs/PRD-v3.md` §2-B + §3-3
**Objetivo:** esquematizar atenção precoce sem automatizar WhatsApp, reduzindo amarelo→vermelho.
**Rota:** `/painel/turma` + `src/lib/api/turma-semaforo`

## Escopo
- Regra: `semaforoAtual=amarelo` E (atraso entrega >40% 7d OU faltou call) → `atencaoPrecoce=true` + motivo
- Fila “Atenção precoce” com priorização Dúvidas Call/Trava existente
- Const configurável, log motivo. Sem WhatsApp auto.
- Regressão: 2 vermelhas → resgate intacto

## Stories previstas (delegar @sm)
1. B1 — Regra + testes matriz (verde/amarelo/vermelho x atraso/falta)
2. B2 — UI fila + badge + filtro + ordenação
3. B3 — Config + log + relatório semanal Anjo

## Aceite
- Amarela sem gatilho não alerta; verde nunca alerta
- `semaforo-resgate.test.ts` passa; novo teste matriz passa
- Fila exibe motivo auditável

## Gates
- CodeRabbit; teste regressão semáforo; revisão regra com Anjo
- Métricas: % reversão 14d, % piora, tempo até primeira ação

## Agentes
- @dev → @qa; validação operacional Anjo/Resgate
