# Story v3-A1 — Backend export auditoria + RLS + log

**Epic:** `docs/epics/v3-EPIC-A-auditoria-pdf.md` | **PRD:** `docs/PRD-v3.md` §2-A
**Status:** Draft | **Prioridade:** P0
**Para @dev implementar, @architect já valida modelo em paralelo.**

## User story
Como Concierge, quero gerar o dossiê de 1 aluno com filtros aplicados, para provar acompanhamento com data/hora em caso de disputa.

## Aceite (obrigatório)
- [ ] `GET /api/auditoria/export?alunoId=&...` monta timeline ordenada e gera PDF via `pdf-lib` (sem print CSS), retorna `application/pdf` com header/timeline/paginação
- [ ] 403 se papel sem `canAudit` ou mentorado tentando outro `alunoId`; 200 só Anjo/Concierge/Mentor/Admin no próprio escopo
- [ ] Cada export grava `audit_exports(aluno_id, filtros_json, gerado_por, created_at)` com `gerado_por` da sessão (nunca do body)
- [ ] 50 entregas <5s em dev; erro retorna JSON `{erro}` sem vazar CPF/WhatsApp
- [ ] `npm test` + `npm run typecheck` verdes

## Contexto técnico (não adivinhar)
- Ler: `src/app/(equipe)/painel/auditoria/page.tsx`, `src/lib/api/auditoria.ts`, `src/lib/auth/sessao-api.ts` (`exigirSessao`), `src/lib/auth/roles.ts` (`canAudit`), padrão rotas servidor em `src/app/api/chamadas/*` (GET com sessão + RLS)
- Tabelas v2 têm 13 tabelas + RLS `authenticated` apenas; seguir migration pattern `supabase/migrations/*_endurecer_rls_v2.sql`
- Autor de auditoria/liberação vem da sessão (ver relatório 16/09/2026) — repetir aqui

## Tarefas
1. Criar migration `audit_exports` + RLS (escrita equipe, leitura equipe; mentorado nunca lista outro)
2. Criar `GET /api/auditoria/export` com validação sessão + `canAudit` + `podeAcessarMatricula`
3. Montar timeline server-side (entregas + pareceres + presenças via `/api/chamadas` existente, sem query direta client)
4. Teste Vitest: ordenação, 403 por papel, mentorado isolado, 50 itens <5s

## Gates
- CodeRabbit review; `supabase db lint` limpo; teste troca-matricula LGPD
- Métrica: log `audit_exports` conta como PDFs/semana

## Handoff
Após pronto → A2 (UI botão). Não implementar UI neste story.
