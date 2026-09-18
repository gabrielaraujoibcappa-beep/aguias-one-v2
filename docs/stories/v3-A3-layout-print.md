# Story v3-A3 — Layout PDF / Impressão A4 Timeline Auditoria

**Epic:** `docs/epics/v3-EPIC-A-auditoria-pdf.md` | **Depende:** v3-A1 (Backend) e v3-A2 (UI Botão)
**Status:** Draft | **Prioridade:** P0

## User story
Como Auditor / Concierge, quero um layout limpo de impressão A4 com timeline cronológica e metadados, para gerar PDFs auditáveis sem poluição de interface ou quebras inadequadas de página.

## Aceite (obrigatório)
- [ ] CSS `@media print` com `@page { size: A4 portrait; margin: 12mm; }`
- [ ] Ocultar elementos de navegação na impressão: `.nao-imprimir`, `.sidebar`, breadcrumbs e botões de ação
- [ ] Cabeçalho oficial do relatório: identificação da mentoria ÁGUIAS ONE, dados do mentorado (nome, turma, módulo atual, data/hora da emissão, autor da emissão)
- [ ] Timeline ordenada de eventos: entregas, pareceres de auditoria (aprovação ou ajuste com justificativa obrigatória) e presenças nos encontros de quarta
- [ ] Regras de quebra de página: `page-break-inside: avoid` em cada bloco de evento da timeline
- [ ] Compatível com modo headless / visualização nativa de impressão do navegador (`window.print()`)
- [ ] Sem vazamento de dados sensíveis (CPF desnecessário oculto por padrão, apenas identificação pericial e matrícula)

## Contexto técnico
- Seguir o padrão visual e de design tokens de `src/app/(equipe)/admin/relatorios/lista-geral/page.tsx` e `presencas/page.tsx`
- Classes utilitárias: `.rel-barra`, `.rel-folha`, `.rel-cabecalho`, `.rel-tabela`
- Zero dependência de bibliotecas pesadas de PDF no cliente (usar motor nativo do browser com estilos `@media print`)

## Tarefas
1. Criar componente de visualização / impressão do dossiê auditável
2. Definir regras de estilos CSS print no `globals.css` ou escopo do relatório
3. Montar cabeçalho com carimbo temporal e hash/id de auditoria (`audit_exports.id`)
4. Testar quebra de página com 20 e 50 itens de timeline

## Gates
- CodeRabbit review; validação visual em pré-visualização A4 (retrato); sem corte de texto em quebra de página
