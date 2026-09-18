# Story v3-A3 — Layout PDF via pdf-lib

**Epic:** `docs/epics/v3-EPIC-A-auditoria-pdf.md` | **Depende:** v3-A1
**Status:** Draft | **Prioridade:** P0 — sem print CSS

## User story
Como Concierge, quero um PDF legível com header, timeline e paginação gerado por biblioteca, para anexar como prova.

## Aceite
- [ ] Uso `pdf-lib` (server route, Vercel-friendly, sem Chromium): header com aluno/turma/módulo/versão/data, tabela timeline cronológica, parecer + motivo, presenças, footer com página X/Y
- [ ] Quebra página automática; 50 entregas <5s; arquivo abre em leitor padrão
- [ ] Sem CSS print, sem sidebar/breadcrumb no PDF; fonte padrão embarcada
- [ ] Teste: gera buffer válido `%PDF`, contém nome aluno + total itens, nega papel sem acesso

## Tarefas
1. Adicionar `pdf-lib` (`npm i pdf-lib`), helper `src/lib/pdf/auditoria-pdf.ts` puro (testável sem Next)
2. Ligar helper na rota export existente, `Content-Disposition: attachment`
3. Teste Vitest buffer + paginação + 50 itens

## Gates
- CodeRabbit; typecheck; lint; LGPD (sem CPF/WhatsApp no PDF salvo log mínimo)

## Handoff
Após pronto → A4 testes finais.
