# Guia Arquitetural de UX & Especificação de Abas (Tabs)

Este documento estabelece as diretrizes oficiais de experiência do usuário (UX), acessibilidade (W3C WAI-ARIA) e engenharia de interface para o componente **Abas (Tabs)** no **Sistema ÁGUIAS ONE (v2)**.

---

## 1. Fundamentos & Modelo Mental

Abas organizam conteúdos relacionados em painéis alternáveis, mostrando um painel por vez. Elas funcionam quando as opções pertencem ao **mesmo contexto** e têm **importância semelhante**, mas a pessoa não precisa ver tudo simultaneamente.

> [!IMPORTANT]
> **Abas não são uma mera decoração visual.**
> Ao esconder painéis, elas reduzem a visibilidade imediata e aumentam o custo cognitivo de descoberta e comparação de informações. A decisão de usar abas deve decorrer da **relação entre os conteúdos e da tarefa**, nunca apenas da quantidade de texto.

### Bases Normativas e Heurísticas de Referência
* **NN/g (Nielsen Norman Group):** Conteúdos no mesmo contexto, rótulos previsíveis, sem exigir que o usuário memorize informações para comparar entre painéis.
* **Carbon Design System (IBM):** Rótulos breves, poucos grupos, aba inicial útil e indicação clara de foco e estado ativo.
* **W3C WAI-ARIA Authoring Practices (APG 1.2):** Estrutura semântica (`role="tablist"`, `role="tab"`, `role="tabpanel"`) e navegação completa por teclado com *roving tabindex*.
* **Material Design:** Distinção rigorosa entre abas, paginação, carrosséis e filtros.
* **GOV.BR (Padrão Digital de Governo):** Proibição de aninhamento de abas e garantia de usabilidade em telas móveis sem quebra em múltiplas linhas.
* **Baymard Institute:** Alerta contra esconder seções essenciais ou etapas críticas atrás de abas secundárias.

---

## 2. Matriz de Decisão: Quando Usar vs. Quando NÃO Usar

| Cenário | Usar Abas? | Solução Recomendada |
| :--- | :---: | :--- |
| **Visões equivalentes do mesmo contexto** (ex.: tarefas pendentes vs. concluídas) | **SIM** | Abas horizontais com badge de contagem |
| **Configurações complementares do mesmo objeto** | **SIM** | Abas organizadas por categoria |
| **Etapas obrigatórias de um processo ou submissão** | **NÃO** | Wizard, Stepper ou fluxo linear de passos |
| **Comparação simultânea de métricas ou dados** | **NÃO** | Página aberta com cards lado a lado ou tabela comparativa |
| **Conteúdo crítico para tomada de decisão imediata** | **NÃO** | Página aberta (sempre visível ao rolar) |
| **Filtros ou modos sobre o mesmo conjunto de dados** | **NÃO** | Chips ou pills de filtro (`role="button"`) |
| **Navegação entre módulos ou seções principais do sistema** | **NÃO** | Navbar, menu de navegação ou páginas separadas |
| **Abas dentro de abas (duplo nível)** | **NÃO** | Reestruturar a arquitetura da informação |

---

## 3. Aplicação Prática no Sistema ÁGUIAS ONE (v2)

### A) Onde Abas FORAM Adotadas: Esteira de Auditoria (`/painel/auditoria`)
* **Contexto:** Validação de entregas pelo Anjo (Ana Carolina) e Concierge (Flávio Lopes).
* **Relação entre os painéis:** Duas visões equivalentes do mesmo fluxo de trabalho.
  1. **Aba 1 (Inicial):** `Aguardando Avaliação (N)` — foco na ação imediata (aprovar ou solicitar ajuste).
  2. **Aba 2:** `Histórico Avaliado (N)` — consulta de pareceres técnicos e histórico de auditoria.
* **Benefício:** Reduz o ruído visual imediato mantendo o auditor focado na fila pendente, sem fragmentar o fluxo em rotas desconectadas.

### B) Onde Abas foram DELIBERADAMENTE EVITADAS (Conformidade com a Norma):
1. **Dashboard do Perito Solo (`/dashboard`):**
   * *Decisão:* Mantido como **página aberta**.
   * *Justificativa:* O mentorado precisa ver simultaneamente seu semáforo, os atalhos prioritários para o módulo liberado e os materiais de apoio. Ocultar o check-in ou travas atrás de uma aba secundária geraria risco de esquecimento e perda de prazos.
2. **Semáforo da Turma (`/painel/turma`):**
   * *Decisão:* Mantidos como **Chips de Filtro**.
   * *Justificativa:* Os botões "Todos", "Regulares", "Atenção" e "Em Risco" filtram a mesma lista de peritos. Classificá-los como abas violaria a distinção do Material Design e Carbon.
3. **Formulário de Check-in (`/checkin/[moduloId]`):**
   * *Decisão:* Mantido como **fluxo de preenchimento modular contínuo**.
   * *Justificativa:* Enviar links, prints, relato de travas e dúvidas para a call de quarta são etapas da mesma submissão unificada.

---

## 4. Especificação Técnica do Componente (`src/components/ui/Tabs.tsx`)

### Semântica W3C WAI-ARIA
* **Container de Abas:** `role="tablist"` com `aria-label` descritivo e `aria-orientation="horizontal"`.
* **Botão da Aba:** `role="tab"`, com identificadores vinculados:
  * `id="tab-{id}"`
  * `aria-controls="panel-{id}"`
  * `aria-selected="true|false"`
  * `tabindex="0"` (para a aba ativa) ou `tabindex="-1"` (para abas inativas).
* **Painel da Aba:** `role="tabpanel"`, vinculado à aba por:
  * `id="panel-{id}"`
  * `aria-labelledby="tab-{id}"`
  * `tabindex="0"` para acessibilidade de leitura via leitores de tela.

### Navegação por Teclado (Roving Tabindex)
* **Seta para Direita (`ArrowRight`):** Move o foco e ativa a próxima aba disponível (com wrap-around para a primeira ao atingir o fim).
* **Seta para Esquerda (`ArrowLeft`):** Move o foco e ativa a aba anterior (com wrap-around para a última).
* **Tecla `Home`:** Move diretamente para a primeira aba habilitada.
* **Tecla `End`:** Move diretamente para a última aba habilitada.
* **Ignora abas desabilitadas:** Teclas de navegação pulam automaticamente abas com `disabled: true`.

### Responsividade em Dispositivos Móveis
* **Sem múltiplas linhas:** Nunca empilha abas em 2 ou mais linhas (o que desorientaria a relação espacial com o painel).
* **Rolagem horizontal fluida:** `overflow-x: auto` com suporte a toque suave (`-webkit-overflow-scrolling: touch`) e sem cortar rótulos essenciais.
* **Destaque visual da aba ativa:** Linha inferior de 2px em `var(--cor-deep-green)` (`#003c33`), texto de alto contraste (`#111827`, peso 600) e anel de foco `:focus-visible`.
