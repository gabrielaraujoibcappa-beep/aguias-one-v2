# Guia Arquitetural de UX & Especificação da Sidebar Lateral Unificada

Este documento estabelece o padrão oficial de experiência do usuário (UX), arquitetura da informação, acessibilidade (W3C WAI-ARIA) e engenharia de interface para a **Sidebar Lateral Unificada** no **Sistema ÁGUIAS ONE (v2)**.

A Sidebar substitui a barra de navegação superior (`Navbar`), consolidando em uma única coluna vertical à esquerda todos os pontos de contato: identidade institucional, seletor de persona, busca rápida, navegação hierárquica por perfil, ações rápidas contextuais e status do ciclo da mentoria.

---

## 1. Fundamentos & Modelo Mental

Em sistemas analíticos e operacionais de alta densidade (como o ÁGUIAS ONE v2), a navegação por barra superior sofre limitações críticas:
* O espaço horizontal é disputado entre links, submenus, busca e perfil;
* Telas com muitos itens acabam exigindo submenus suspensos que ocultam destinos essenciais;
* O fluxo visual de leitura em "F" beneficia uma barra lateral persistente à esquerda, liberando toda a largura útil da tela para dashboards, tabelas e esteiras.

A **Sidebar Lateral Unificada** resolve esses desafios ao:
1. **Centralizar o controle em uma coluna fixa:** 260px de largura no desktop, com navegação estruturada de alto contraste visual;
2. **Oferecer modo compacto (72px):** Permite ao mentor ou aluno recolher a barra para ganhar espaço horizontal em dashboards densos, mantendo ícones intuitivos e tooltips descritivos;
3. **Oferecer Drawer Mobile fluido:** Em telas menores que 1024px, a barra se retrai automaticamente e se abre como gaveta acessível sobreposta com overlay escurecido;
4. **Agrupar destinos por propósito cognitivo:** Separação clara entre tarefas operacionais, acompanhamento de jornada e cadastros administrativos.

---

## 2. Anatomia & Estrutura da Sidebar

```
+---------------------------------------------+
| [Emblema] ÁGUIAS ONE                        |
|           IBCAPPA / UniBCAPPA               |
+---------------------------------------------+
| [Persona Switcher: Dr. Roberto Silva ▼]     |
| Perito Solo · Turma 2026.1                  |
+---------------------------------------------+
| [🔍 Buscar no sistema...          Ctrl+K]   |
+---------------------------------------------+
| PRINCIPAL                                   |
|   [🏠] Visão Geral                          |
| JORNADA                                     |
|   [📋] Check-in Modular                     |
| NEGÓCIO                                     |
|   [💰] Faturamento & ZIP                    |
|   [🌐] 7 Canais de Atração                  |
+---------------------------------------------+
| [+ Declarar Faturamento]                    |
+---------------------------------------------+
| [«] Recolher Barra                          |
+---------------------------------------------+
```

### 2.1 Cabeçalho Institucional
* Logomarca estilizada com o `LogoEmblem` em tom ouro acetinado (`#b89047`), tipografia Space Grotesk e texto *"ÁGUIAS ONE"*.
* Subtítulo institucional *"IBCAPPA · Gestão Estratégica"*.

### 2.2 Seletor de Persona & Papel
* Permite alternância imediata de persona no topo da barra lateral:
  * **Mentorado:** Dr. Roberto Silva (Perito Solo) → rota `/dashboard`
  * **Concierge:** Flávio Lopes (Operação & Turma) → rota `/painel/turma`
  * **Anjo:** Ana Carolina (Suporte & Auditoria) → rota `/painel/modulos`
  * **Mentor:** Prof. Edilson Aguiais (Coordenação) → rota `/painel/turma`
  * **Admin:** Coordenação UniBCAPPA (Gestão) → rota `/admin/alunos`
* Mostra avatar estilizado, nome, cargo e badge do papel ativo.

### 2.3 Busca Rápida Integrada (`Ctrl+K`)
* Campo estético com botão clicável acionando o `BuscaRapidaModal`.
* Atalho visual de teclado destacado (`Ctrl+K` ou `⌘K`).

### 2.4 Menus de Navegação por Papel

#### Visão do Mentorado (`papelAtual === "mentorado"`):
* **SEÇÃO PRINCIPAL:**
  * Visão Geral (`/dashboard`) — Ícone Dashboard
* **SEÇÃO JORNADA:**
  * Check-in Modular (`/checkin/mod-1`) — Ícone CheckCircle
* **SEÇÃO MEU NEGÓCIO:**
  * Faturamento & ZIP (`/faturamento`) — Ícone Currency
  * 7 Canais de Atração (`/canais`) — Ícone Globe
* **AÇÃO RÁPIDA:**
  * Botão em destaque `+ Declarar Faturamento` (`/faturamento`).

#### Visão da Equipe / Staff (`papelAtual !== "mentorado"`):
* **SEÇÃO OPERAÇÃO:**
  * Turma & Semáforo (`/painel/turma`) — Ícone Users
  * Liberação de Módulos (`/painel/modulos`) — Ícone Unlock
  * Fila de Auditoria (`/painel/auditoria`) — Ícone Audit (com badge de contagem de entregas pendentes!)
* **SEÇÃO CADASTROS:**
  * Gestão de Alunos (`/admin/alunos`) — Ícone UserPlus
  * Gestão de Turmas (`/admin/turmas`) — Ícone Building
* **AÇÃO RÁPIDA:**
  * Botão em destaque `+ Novo Mentorado` (abre `ModalAluno`).

### 2.5 Rodapé da Sidebar
* Indicador de turma ativa (*Turma 2026.1*).
* Botão de alternância para recolher/expandir a barra (`Recolher` / `Expandir`).

---

## 3. Comportamento Responsivo & Mobile

* **Breakpoint:** `1024px`
* **Desktop ($\ge$ 1024px):**
  * Sidebar fixa posicionada à esquerda (`position: sticky; top: 0; height: 100vh`).
  * Largura expandida: `260px`.
  * Largura recolhida: `72px` (oculta rótulos de texto, exibe ícones centralizados com atributo `title` para tooltip nativo acessível).
* **Mobile & Tablet (< 1024px):**
  * Barra superior móvel compacta (`height: 56px`) contendo:
    * Botão hambúrguer acessível (`aria-label="Abrir menu de navegação"`).
    * Logo ÁGUIAS ONE centralizado.
    * Botão de busca rápida (`🔍`).
  * Drawer lateral deslizante (`transform: translateX(-100%)` para `translateX(0)`):
    * Fundo com overlay semitransparente escuro (`rgba(0, 0, 0, 0.5)`).
    * Tecla `Escape` fecha o drawer e devolve o foco ao botão hambúrguer.
    * Clique no overlay fecha o drawer.
    * Ao navegar para qualquer rota, o drawer fecha automaticamente.

---

## 4. Acessibilidade W3C WAI-ARIA & Navegação por Teclado

* **Container Semântico:** `<aside>` envolvendo a barra com `<nav aria-label="Navegação principal">`.
* **Identificação de Página Ativa:** `aria-current="page"` no link correspondente à rota ativa.
* **Drawer Mobile:** `role="dialog"`, `aria-modal="true"`, `aria-label="Menu de navegação"`.
* **Teclado:**
  * Ordem sequencial natural de `Tab`.
  * Foco visual destacado (`outline` com anel de foco em alto contraste).
  * `Escape` fecha dropdowns, seletor de persona e drawer mobile.

---

## 5. Estrutura de Arquivos e Alterações

1. **`src/components/Sidebar.tsx` [NOVO]:**
   * Componente completo da Sidebar (desktop persistente + mobile drawer + persona switcher + busca + links).
2. **`src/app/layout.tsx` [MODIFICAR]:**
   * Reestruturar o shell da aplicação para layout flex horizontal (`app-shell`):
   * `<div className="app-shell"> <Sidebar /> <div className="app-main"> <Breadcrumbs /> <main>{children}</main> <footer /> </div> </div>`.
3. **`src/app/globals.css` [MODIFICAR]:**
   * Tokens e classes utilitárias para o novo layout de sidebar responsivo.
4. **`tests/sidebar.test.ts` [NOVO]:**
   * Suíte de testes validando renderização da sidebar, links de mentorado, links de equipe, atributos WAI-ARIA (`aria-current`, `role="dialog"`).
5. **`tests/navigation.test.ts` [VALIDAR]:**
   * Garantir conformidade com as regras de primeiro nível e breadcrumbs.
