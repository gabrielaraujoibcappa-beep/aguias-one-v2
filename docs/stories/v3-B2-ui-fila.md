# Story v3-B2 — UI fila atenção precoce

**Epic:** B | **Depende:** B1 | **Status:** Draft P0

## Story
Como Anjo, quero fila “Atenção precoce” em `/painel/turma` com motivo, para priorizar quem precisa.

## Aceite
- [ ] Seção/filtro “Atenção precoce” lista só `atencaoPrecoce=true` com motivo (atraso/falta call) + link aluno/módulo
- [ ] Reusa padrão turma existente, sem quebrar semáforo/resgate; sem WhatsApp auto
- [ ] Gate `canAudit`/equipe; loading/erro/vazio sem `alert()`; typecheck verde

## Tarefas
1. Consumir `verificarAtencaoPrecoce()` na página turma
2. Filtro + badge + ordenação por risco
3. Teste componente mock

## Gates
CodeRabbit; acessibilidade. Handoff → B3.
