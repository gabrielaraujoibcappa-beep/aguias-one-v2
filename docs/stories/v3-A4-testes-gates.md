# Story v3-A4 — Testes Automatizados, Performance & Gates de Auditoria

**Epic:** `docs/epics/v3-EPIC-A-auditoria-pdf.md` | **Depende:** v3-A1, v3-A2, v3-A3
**Status:** Draft | **Prioridade:** P0

## User story
Como Arquiteto / Tech Lead, quero uma bateria de testes automatizados e validações de segurança cobrindo o fluxo de exportação de auditoria, para garantir isolamento multi-inquilino (LGPD) e tempo de resposta < 5s com volume de 50 itens.

## Aceite (obrigatório)
- [ ] Teste unitário e de integração no Vitest para `GET /api/auditoria/export`
- [ ] Validação de permissões: 200 para Admin, Concierge, Anjo, Mentor (dentro do escopo); 403 Forbidden para papéis sem permissão ou mentorado solicitando outro aluno
- [ ] Teste de isolamento LGPD: mentorado autenticado tentando acessar `alunoId` alheio é bloqueado com 403
- [ ] Teste de integridade de log: cada chamada com sucesso gera obrigatoriamente 1 linha em `public.audit_exports` com `gerado_por` da sessão
- [ ] Teste de performance de montagem da timeline: 50 entregas + histórico compilados em menos de 5000ms
- [ ] `npm test` e `npx tsc --noEmit` executados com 100% de aprovação

## Contexto técnico
- Testes em `tests/auditoria-export.test.ts`
- Utilizar mocks de sessão com `criarSessaoMock()` ou chamadas ao `resolverPerfil`
- Seguir padrão de testes de RLS e papéis existentes em `tests/auth-roles.test.ts` e `tests/sessao-core.test.ts`

## Tarefas
1. Criar `tests/auditoria-export.test.ts` cobrindo cenários 200, 403, 404 e erro de banco
2. Implementar teste de carga sintética com 50 registros verificando tempo limite
3. Validar tipagens estritas em `npx tsc --noEmit`
4. Executar verificação de linter e integridade de schema

## Gates
- 0 falhas em testes; cobertura dos novos handlers > 90%; sem warnings de compilação
