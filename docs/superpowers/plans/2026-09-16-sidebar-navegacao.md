# Sidebar Lateral Unificada — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar a Sidebar Lateral Unificada substituindo a Navbar superior, integrando seletor de persona, busca rápida, navegação hierárquica por perfil (Mentorado e Equipe) com badges e drawer mobile acessível.

**Architecture:** Componente `Sidebar.tsx` posicionado à esquerda do shell principal (`app-shell`), com estado responsivo (desktop persistente 260px/72px e mobile drawer sobreposto), conectado à store global de personas (`useSistemaStore`) e ao modal de busca rápida (`BuscaRapidaModal`).

**Tech Stack:** React 18, Next.js 14, TypeScript, CSS customizado responsivo, Vitest (`renderToStaticMarkup`).

**Spec:** `docs/superpowers/specs/2026-09-16-sidebar-navegacao-design.md`

## Global Constraints

- Sidebar posicionada verticalmente à esquerda substituindo a Navbar superior.
- Suporte a modo recolhido (72px) e expandido (260px) no desktop.
- No mobile (< 1024px), barra móvel com botão hambúrguer que abre drawer com overlay e foco acessível.
- Seletor de persona acessível no topo da barra permitindo alternar papéis.
- Atalho de busca rápida integrado acionando `BuscaRapidaModal` (`Ctrl+K`).
- Links de navegação com `aria-current="page"` na rota ativa.
- Badge dinâmico de entregas pendentes na fila de auditoria para equipe.

---

### Task 1: Ícones de Suporte & Classes CSS no Layout

**Files:**
- Modify: `src/components/ui/Icons.tsx`
- Modify: `src/app/globals.css`

- [ ] **Step 1: Adicionar ícones de menu, fechar e recolher em `Icons.tsx`**
  - `IconMenu`
  - `IconX`
  - `IconChevronLeft`
  - `IconChevronRight`

- [ ] **Step 2: Adicionar estilos responsivos de layout da Sidebar em `globals.css`**
  - Classes `.app-shell`, `.app-main`, `.sidebar-desktop`, `.sidebar-mobile-header`, `.sidebar-drawer-overlay`.

---

### Task 2: Componente `src/components/Sidebar.tsx`

**Files:**
- Create: `src/components/Sidebar.tsx`

- [ ] **Step 1: Implementar o componente `Sidebar`**
  - Cabeçalho institucional com logo ÁGUIAS ONE.
  - Seletor de Persona & Papel com dropdown de alternância.
  - Gatilho de busca rápida acionando `BuscaRapidaModal`.
  - Navegação agrupada por seções:
    - Mentorado: Visão Geral, Minha Jornada, Faturamento & ZIP, 7 Canais.
    - Equipe: Turma & Semáforo, Liberação de Módulos, Fila de Auditoria (com badge), Gestão de Alunos, Gestão de Turmas.
  - Botão de ação rápida contextual (`+ Declarar Faturamento` ou `+ Novo Mentorado`).
  - Drawer mobile com overlay escuro, foco e tecla `Escape`.
  - Toggle de recolhimento desktop (260px / 72px).

---

### Task 3: Testes Automatizados da Sidebar (`tests/sidebar.test.ts`)

**Files:**
- Create: `tests/sidebar.test.ts`
- Modify: `tests/navigation.test.ts` (se necessário)

- [ ] **Step 1: Escrever testes unitários e de acessibilidade da Sidebar**
  - Renderização semântica (`<aside>`, `<nav aria-label="Navegação lateral principal">`).
  - Renderização das rotas do mentorado e de equipe.
  - Presença de atalhos e rótulos acessíveis.
- [ ] **Step 2: Executar testes com vitest**

---

### Task 4: Atualização do Shell da Aplicação (`src/app/layout.tsx`)

**Files:**
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Substituir `<Navbar />` por `<Sidebar />` no RootLayout**
- [ ] **Step 2: Garantir alinhamento de Breadcrumbs, Main e Footer dentro de `.app-main`**

---

### Task 5: Validação Global & Typecheck

- [ ] **Step 1: Executar `npm run test` (todos os testes passando)**
- [ ] **Step 2: Executar `npm run typecheck` (0 erros de tipagem)**
- [ ] **Step 3: Commit no git**
