# EPIC A — Export PDF Auditoria Anti-Reembolso (v3 P0)

**PRD base:** `docs/PRD-v3.md` §2-A + §3-4
**Objetivo:** prever prova auditável 1-clique com timeline data/hora para reduzir disputas.
**Rotas:** `/painel/auditoria`, `/painel/aluno/[id]`

## Escopo
- Botão Exportar PDF respeitando filtros aplicados
- Geração via `pdf-lib` server-side (sem print CSS): rota retorna `application/pdf` com header, timeline, pareceres + justificativa, presenças, identificação turma/módulo/versão, paginação
- Tabela `audit_exports(id, aluno_id, filtros_json, gerado_por, created_at)` + log acesso
- RLS: só Anjo/Concierge/Mentor/Admin. Mentorado nunca vê outro aluno.
- Performance: 50 entregas <5s. Sem impressão CSS.

## Stories previstas (delegar @sm `*draft`)
1. A1 — Backend export + RLS + log
2. A2 — UI botão + filtros + estado loading/erro
3. A3 — Layout PDF/print A4 + timeline ordenada
4. A4 — Testes Vitest (montagem, permissão negada, 50 itens <5s) + typecheck

## Aceite
- 100% aprovados exportáveis; ordem cronológica válida
- Papel sem acesso recebe 403; mentorado isolado por matrícula
- `npm test` + `npm run typecheck` verdes

## Gates qualidade
- CodeRabbit review antes merge; RLS lint `supabase db lint`; teste LGPD (troca matrícula)
- Métricas: PDFs/semana, % timeline válida, 0 vazamento

## Agentes previstos
- @architect valida RLS/modelo → @dev implementa → @qa valida gates
