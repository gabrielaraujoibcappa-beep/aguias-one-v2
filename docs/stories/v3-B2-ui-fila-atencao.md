# Story v3-B2 — UI Fila "Atenção Precoce" + Badge + Filtro no Painel da Turma

**Epic:** `docs/epics/v3-EPIC-B-alerta-precoce.md` | **Depende:** v3-B1 (Regra Preditiva)
**Status:** Draft | **Prioridade:** P0

## User story
Como Anjo / Mentor, quero visualizar uma aba ou filtro dedicado de "Atenção Precoce" no Painel da Turma, para priorizar meus atendimentos da semana antes que os alunos fiquem vermelhos.

## Aceite (obrigatório)
- [ ] Inclusão da visualização / filtro "Atenção Precoce" em `src/app/(equipe)/painel/turma/page.tsx`
- [ ] Badge visual distinto (ex: tag âmbar / aviso de atenção preventiva) indicando claramente o motivo do alerta (ex: "Atraso crítico 45%", "Falta encontro 18/09")
- [ ] Ordenação da fila de atenção priorizando:
  1. Alunos com trava declarada ou dúvidas registradas para a quarta
  2. Maior atraso relativo em entregas
- [ ] Exibição acessível sem quebrar as abas WAI-ARIA existentes do semáforo
- [ ] **NENHUM disparo automático de WhatsApp** — o sistema exibe apenas o atalho manual para contato caso o Anjo decida conversar com o aluno
- [ ] Design System: reuso das variáveis CSS de `--cor-alerta`, `--cor-bg-alerta`, sem adição de bibliotecas externas

## Contexto técnico
- Ler `src/app/(equipe)/painel/turma/page.tsx`
- Seguir os padrões de acessibilidade e layout já implementados nas tabelas e abas de equipe
- Garantir que mentores e anjos vejam os badges sem interferir na visualização de notas

## Tarefas
1. Integrar o cálculo de `atencaoPrecoce` na renderização da lista de alunos
2. Criar componente ou pill de Badge "Atenção Precoce" com tooltip/texto explicativo do motivo
3. Adicionar filtro rápido "Apenas Atenção Precoce" no cabeçalho de filtros da turma
4. Testar responsividade e acessibilidade via teclado

## Gates
- CodeRabbit review; sem violações de contraste WCAG AA; testes de renderização de componente verdes
