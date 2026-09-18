# Story v3-A2 — UI botão Export PDF + filtros

**Epic:** `docs/epics/v3-EPIC-A-auditoria-pdf.md` | **Depende:** v3-A1 backend pronto
**Status:** Draft | **Prioridade:** P0 — sem print CSS, download blob PDF

## User story
Como Concierge, quero clicar Exportar PDF com os filtros atuais, para baixar o dossiê sem remontar busca.

## Aceite
- [ ] Botão em `/painel/auditoria` + `/painel/aluno/[id]` chama `GET /api/auditoria/export` com filtros e baixa blob `application/pdf` (sem print CSS)
- [ ] Estados: loading, erro legível (sem `alert()`), vazio tratado — padrão relatórios 16/09
- [ ] Só exibe se `canAudit(papelAtual)`; mentorado nunca vê botão de outro aluno
- [ ] Reusa `.card`, `btn-*`, tokens `globals.css`, sem Tailwind; `<Suspense>` onde usa `useSearchParams`
- [ ] Typecheck + teste componente (mock fetch 200/403) verdes

## Contexto técnico
- Ler: `FilaAuditoria.tsx`, `TabelaHistoricoAuditoria.tsx`, `Tabs`, `notificar`, `canAudit`
- Não quebrar abas WAI-ARIA nem `auditarComDesfazer`

## Tarefas
1. Adicionar botão + querystring filtros, download blob com nome `dossie-{matricula}.pdf`
2. Loading/erro/vazio + `notificar` sucesso
3. Gate `canAudit` + teste papel

## Gates
- CodeRabbit; acessibilidade; Cohere sem emoji colorido

## Handoff
Após pronto → A3 layout pdf-lib.
