# PRD Brownfield v3 — ÁGUIAS ONE v2 (Cópia Seletiva)

**Status:** Aprovado escopo A+B+D agora, C MVP manual depois. Gerado por @pm 17/09/2026.
**Base:** v2 Next.js 14 + Supabase. Não quebrar auditoria, semáforo, liberação, RLS por papel.

## 1. Visão
Escalonar resultado pericial com prova auditável, prever risco antes do vermelho e vincular aprendizado da call ao check-in — mantendo operação Anjo ≠ Resgate ≠ Concierge ≠ Mentor.

## 2. Escopo aprovado

### A — Export PDF auditoria anti-reembolso [P0]
**Onde:** `/painel/auditoria` + `/painel/aluno/[id]`
**Requisitos:**
- Botão Exportar PDF com filtros aplicados (perito/módulo/decisão/período)
- Geração via biblioteca PDF server-side (`pdf-lib`, sem print CSS): rota retorna `application/pdf` com header, timeline data/hora (entregas, pareceres, feedbacks, presenças quarta), decisão aprova/ajuste + justificativa obrigatória, identificação turma/módulo/versão, numeração páginas
- Performance: 50 entregas <5s
- Acesso: só papel autorizado (Anjo/Concierge/Mentor/Admin via RLS). Log de quem exportou.
- Tabelas novas: `audit_exports(id, aluno_id, filtros_json, gerado_por, created_at)`
**Aceite:**
- 100% aprovados exportáveis, PDF abre com timeline ordenada
- Teste Vitest: montagem timeline + permissão negada para papel sem acesso
- 0 vazamento LGPD entre alunos
**Fora:** assinatura ICP-Brasil.

### B — Alerta preditivo 1 amarela [P0]
**Onde:** `/painel/turma` (fila Atenção precoce) + modelo `turma-semaforo`
**Regra v3:**
- Se `semaforoAtual=amarelo` E (atraso entrega >40% em 7d OU faltou call quarta) → `atencaoPrecoce=true`
- Não dispara WhatsApp automático. Só fila Anjo com motivo visível.
- Regra configurável (const, não hardcode mágico). Log motivo.
**Aceite:**
- Verde+vermelho não geram alerta. Amarela sem gatilho não gera.
- Regressão: 2 vermelhas → resgate existente intacto (`semaforo-resgate.test.ts` passa)
- Teste novo: matriz verde/amarelo/vermelho x atraso/falta
**Alvo:** -30% amarelo→vermelho.

### D — Badges conclusão módulo [P1]
**Onde:** `/dashboard` (aluno) + progresso turma
**Regra:** `auditoria=aprovado` → concede badge do módulo (idempotente, sem duplicar).
- Sem ranking público v3. Visual Cohere (hairline, sem emoji colorido), acessível.
- Tabela nova: `badges(aluno_id, modulo_id, auditoria_id, created_at, unique aluno+modulo)`
**Aceite:**
- Re-auditoria não duplica. Módulo reprovado não gera badge.
- Teste Vitest + axe/tabs pattern existente.

### C — Transcrição IA call quarta → vínculo check-in [P2, MVP manual]
**Onde:** `/admin/chamadas` + auditoria
**MVP manual v3:**
- Campos: upload áudio (opcional) + colar transcrição + resumo + combinados + vínculo `moduloId` + link dúvida/trava check-in
- Exibir na auditoria: “resumo call + ver transcrição”. Edição permitida. Flag consentimento gravação (LGPD).
- Sem transcrição automática realtime nesta fase.
**Aceite:** ≥60% calls piloto com link em 30d. Fonte exibida.
**Tabela nova:** `call_transcripts(id, data_call, modulo_id, resumo, transcricao, combinados, consentimento, criado_por)`

## 3. Métricas v3 (fontes auditáveis)

| # | Métrica | Definição | Fonte | Alvo 60-90d | Dono |
|---|---|---|---|---|---|
| 1 | Conclusão módulo | aprovados/submetidos semana | auditoria | ≥70% (baseline 2 sem v2) | Anjo |
| 2 | Tempo auditoria | mediana checkin→parecer | auditoria | -25% sem subir retrabalho | Equipe |
| 3 | Reversão precoce | % amarelas→verde 14d; % amarelas→vermelha | turma-semaforo | ≥40% reversão, -30% piora | Anjo/Resgate |
| 4 | Prova auditável | PDFs/semana; % com timeline válida | audit_exports | 100% exportável <5s | Concierge |
| 5 | Vínculo call | % dúvidas com transcript linkado | call_transcripts | ≥60% piloto 30d | Mentor |
| 6 | Faturamento (norte) | % declarações mensais + mediana R$ | faturamento | monitorar, sem meta v3 | Admin |

MVP enxuto: acompanhar 1-2-3 semanal; 4-5 por safra; 6 mensal.

## 4. Restrições técnicas
- Manter RLS Supabase por papel; novas tabelas com policies espelhadas de auditoria/alunos.
- Vitest + `npm run typecheck` verdes. Zero regressão rotas existentes.
- LGPD: consentimento calls, export só próprio aluno, log acesso.
- Design: Cohere Enterprise 2026 (`DESIGN.md`), Tabs WAI-ARIA existente.

## 5. Riscos
- Custo IA se auto-transcrever cedo → mitigado com MVP manual.
- Gaming faturamento/conclusão → mitigado com métrica norte + retrabalho monitorado.
- Sobrecarga Anjo com fila precoce → fila sem WhatsApp auto, limite + priorização Dúvidas Call/Trava.

## 6. Rollout
1. Semana 1-2: medir baseline 1-2-3 em v2, implementar A+B + testes
2. Semana 3: D + fila precoce em produção piloto 1 turma
3. Semana 4: C manual piloto + relatório PDF semanal Anjo
4. Handoff: @architect valida modelo/RLS → @sm fatia stories → @dev implementa

## 7. Validação pendente
- Confirmar baseline 2 semanas antes de travar alvos % (decisão @pm + Anjo).
- Confirmar provider IA futuro com retenção zero (fora v3).
