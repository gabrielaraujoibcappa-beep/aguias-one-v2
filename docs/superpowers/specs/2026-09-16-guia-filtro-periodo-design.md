# Guia Arquitetural de UX & Especificação de Filtros de Período e Filtros Ativos

Este documento estabelece o padrão oficial de experiência do usuário (UX), arquitetura da informação, acessibilidade (W3C WAI-ARIA) e engenharia de interface para **Filtros de Período** e **Resumo de Filtros Ativos** no **Sistema ÁGUIAS ONE (v2)**.

Ele consolida as diretrizes normativas do **Câmara UX**, **Baymard Institute**, **IBM Carbon Design System**, **Red Hat PatternFly** e **W3C WCAG 2.2 / WAI-ARIA**.

---

## 1. Fundamentos & Modelo Mental

### 1.1 O Papel do Período em Dashboards
Filtros de período definem a janela temporal usada para ler métricas em dashboards. Eles afetam gráficos, cards, tabelas, comparações, alertas e diagnósticos. Por isso, o período **não deve ser tratado apenas como um controle de calendário**: ele faz parte essencial do **contexto da informação**.

Em dashboards analíticos e operacionais, a pessoa precisa saber rapidamente:
1. Qual intervalo está ativo no momento;
2. Se esse período é **relativo** (dinâmico) ou **fixo** (absoluto);
3. Qual é o **escopo** do filtro (se afeta todo o painel ou seções específicas);
4. Quando os dados foram atualizados pela última vez e qual é o fuso horário de referência;
5. Se todos os painéis e cards seguem a mesma janela ou se existem exceções deliberadas.

### 1.2 O Papel dos Filtros Ativos
Aplicar um filtro muda o conjunto de resultados, mas a tarefa não termina nesse momento. Depois da seleção, a pessoa precisa entender por que aquela lista ou dashboard está menor, quais critérios estão ativos e como ampliar novamente o resultado.

Um indicador vago como *"3 filtros"* confirma que existe um recorte, mas não explica qual é o recorte. A interface deve:
* Mostrar o nome e o valor de cada critério aplicado (ex.: `Semáforo: Em Risco`, `Período: Últimos 30 dias`);
* Ficar posicionada em uma área previsível (acima dos resultados e tabelas);
* Permitir remover cada escolha individualmente sem obrigar a pessoa a reabrir painéis;
* Oferecer uma ação explícita para limpar tudo (`Limpar filtros`);
* Sincronizar todas as representações (controles originais, chips ativos, contagem de resultados).

---

## 2. Diretrizes de UX: Práticas Recomendadas vs. Práticas a Evitar

### Práticas Recomendadas (Faça)
* **Mostre o período ativo explicitamente:** O botão disparador (*trigger*) deve exibir o intervalo legível por extenso (ex.: `Últimos 30 dias (17/08/2026 – 16/09/2026)`), nunca apenas um ícone silencioso.
* **Declare o escopo do filtro:** Deixe visível se o filtro é global (`Escopo: Global (Painel da Turma)`) ou se afeta apenas uma seção.
* **Exiba nome e valor em cada filtro ativo:** Prefira combinações compreensíveis como `Semáforo: Em Risco` ou `Período: Últimos 30 dias`.
* **Permita remoção individual:** Cada chip de filtro ativo possui botão de exclusão próprio com rótulo acessível (`aria-label="Remover filtro Semáforo: Em Risco"`).
* **Ofereça ação clara para limpar tudo:** Botão visível *"Limpar filtros"* quando houver filtros aplicados além do padrão.
* **Separe período e granularidade:** Trate a granularidade em um grupo de controle independente (`Dia`, `Semana`, `Mês`).
* **Mostre a última atualização e fuso horário:** Exiba o timestamp da sincronização e explicite o fuso (`Horário de Brasília / UTC-3`), com ação de recarga imediata.
* **Sincronize contagem de resultados com região de status:** Comunique quantos itens restam (ex.: `Exibindo 2 de 4 peritos`) usando `role="status"` ou `aria-live="polite"` sem roubar o foco.
* **Explique exceções no próprio card:** Cards que operam em tempo real (fora da janela do filtro de período) exibem uma tag informando seu recorte temporal próprio.
* **Estratégia híbrida de aplicação:** Aplicação automática para presets leves; aplicação manual com botão *"Aplicar Filtro"* para intervalo personalizado com validação.
* **Preserve o contexto ao navegar:** Ao voltar ou alternar abas, o estado aplicado deve ser mantido.

### Práticas a Evitar (Evite)
* **Usar apenas ícone de calendário:** Esconder datas atrás de um ícone genérico sem texto.
* **Esconder filtros aplicados:** Obrigar a pessoa a reabrir menus ou gavetas para saber quais filtros estão restringindo a tela.
* **Mostrar apenas contadores numéricos vazios:** Exibir apenas *"Filtros (2)"* sem dizer quais são.
* **Chips sem ação real de remoção:** Elementos visuais que parecem filtros removíveis, mas não respondem ao clique ou teclado.
* **Apagar filtros sem aviso:** Limpar filtros secundários (ex.: status ou busca) ao alterar o período, ou vice-versa.
* **Aplicar consulta pesada a cada clique:** Disparar requisições para cada dígito ou clique parcial de data no calendário.
* **Depender apenas de cor:** Indicar estados ou erros de validação apenas por cores sem rótulos e mensagens textuais acessíveis.
* **Ignorar fuso horário:** Não explicitar o fuso em produtos com usuários e turmas em múltiplos estados ou países.

---

## 3. Matriz de Conformidade Heurística Consolidada

| # | Critério de Avaliação | Como o Sistema ÁGUIAS ONE v2 Atende |
| :-: | :--- | :--- |
| **1** | **Período Ativo Visível** | O botão disparador exibe o nome do preset e o intervalo por extenso (`17/08/2026 – 16/09/2026`). |
| **2** | **Diferenciação Relativo vs. Fixo** | Tag explícita: `[Relativo]` para presets dinâmicos e `[Fixo]` para datas customizadas. |
| **3** | **Escopo Global Declarado** | Header contextual com `Escopo: Global (Painel da Turma 2026.1)`. |
| **4** | **Resumo de Filtros Ativos Visível** | Barra de chips removíveis logo acima da tabela e resultados da turma. |
| **5** | **Nome e Valor em Cada Chip** | Cada chip estampa `Atributo: Valor` (ex.: `Semáforo: Em Risco`, `Busca: "Ana"`). |
| **6** | **Remoção Individual Acessível** | Botão individual `×` com `aria-label="Remover filtro [Atributo]: [Valor]"`. |
| **7** | **Ação "Limpar Tudo"** | Botão contextual *"Limpar filtros"* visível quando há critérios ativos além do default. |
| **8** | **Contagem de Resultados Sincronizada** | Indicador `role="status"` anunciando `Exibindo X de Y peritos` em tempo real. |
| **9** | **Validação de Intervalo Personalizado** | Bloqueia `dataInicio > dataFim` e datas futuras, com mensagem em `role="alert"`. |
| **10** | **Separação de Granularidade** | Controles de período e granularidade (`Dia` \| `Semana` \| `Mês`) operam de forma ortogonal. |
| **11** | **Última Atualização e Fuso Horário** | Timestamp `Atualizado há X min` e `Fuso: Horário de Brasília (UTC-3)` com botão de reload. |
| **12** | **Declaração de Exceções nos Cards** | Cards operacionais em tempo real exibem badge `Janela: Tempo Real (fora do período)`. |
| **13** | **Acessibilidade Completa (WCAG 2.2 / APG)** | Suporte W3C APG: `role="dialog"`, `role="status"`, foco gerenciado, tecla `Escape` e navegação por teclado. |

---

## 4. Especificação Técnica dos Componentes de UI

### 4.1 Componente `src/components/ui/FiltroPeriodo.tsx`

```typescript
export type TipoPeriodo = "relativo" | "customizado";
export type AtalhoPeriodo = "hoje" | "ultimos_7d" | "ultimos_30d" | "mes_atual" | "ciclo_atual";
export type Granularidade = "dia" | "semana" | "mes";

export interface PeriodoFiltroState {
  tipo: TipoPeriodo;
  atalho?: AtalhoPeriodo;
  dataInicio: string; // ISO YYYY-MM-DD
  dataFim: string;    // ISO YYYY-MM-DD
  granularidade: Granularidade;
  fusoHorario: string;
  ultimaAtualizacao: Date;
  escopo: string;
}

export interface FiltroPeriodoProps {
  valor: PeriodoFiltroState;
  onChange: (novoPeriodo: PeriodoFiltroState) => void;
  onAtualizarDados?: () => void;
  carregando?: boolean;
  escopoNome?: string;
}
```

* **Semântica ARIA do Filtro de Período:**
  * Disparador: `role="button"`, `aria-haspopup="dialog"`, `aria-expanded="true|false"`.
  * Painel: `role="dialog"`, `aria-modal="true"`, `aria-label="Selecionar período temporal"`.
  * Atalhos: `role="button"` com indicação visual e textual de estado ativo.
  * Botão Restaurar Padrão: volta para `ultimos_30d` sem interferir nos filtros de tabela.

---

### 4.2 Componente `src/components/ui/ResumoFiltrosAtivos.tsx`

```typescript
export interface FiltroAtivoItem {
  id: string;
  categoria: string; // ex: "Semáforo", "Período", "Módulo", "Busca"
  valorRotulo: string; // ex: "Em Risco", "Últimos 30 dias"
  onRemover?: () => void;
  removivel?: boolean; // false se for valor padrão obrigatório
}

export interface ResumoFiltrosAtivosProps {
  filtros: FiltroAtivoItem[];
  totalResultados?: number;
  totalGeral?: number;
  entidadeNome?: string; // ex: "peritos", "entregas"
  onLimparTudo?: () => void;
}
```

* **Semântica ARIA do Resumo de Filtros Ativos:**
  * Container: `role="region"`, `aria-label="Filtros aplicados"`.
  * Chip: elemento com botão de remoção nomeado programaticamente (`aria-label="Remover filtro Semáforo: Em Risco"`).
  * Região de Status: `<div role="status" aria-live="polite" class="sr-only">Exibindo 2 de 4 peritos</div>`.
  * Botão Limpar Tudo: `role="button"` com rótulo descritivo *"Limpar todos os filtros"*.

---

## 5. Aplicação no Sistema ÁGUIAS ONE v2 (`/painel/turma`)

1. **Barra Superior de Contexto Temporal:**
   - Exibe o `FiltroPeriodo` com escopo `"Global (Painel da Turma)"`, fuso `America/Sao_Paulo (UTC-3)` e granularidade.
2. **Cards com Exceção:**
   - O card do *Semáforo da Turma* e a *Fila de Auditoria* exibem badge: `Janela: Tempo Real (não afetado pelo período)`, eliminando interpretações errôneas.
3. **Resumo de Filtros Ativos Acima da Tabela de Alunos:**
   - Conecta a seleção do semáforo (ex.: *"Em Risco"*, *"Resgate Necessário"*) e busca em um resumo dinâmico com contagem sincronizada (*"Exibindo 2 de 4 peritos"*), remoção por chip e botão *"Limpar filtros"*.

---

## 6. Estratégia de Testes Automatizados (`tests/filtro-periodo.test.ts` & `tests/filtros-ativos.test.ts`)

1. **Cálculo e Normalização de Datas:** Testes unitários para `hoje`, `ultimos_7d`, `ultimos_30d`, `mes_atual`.
2. **Validação de Erros:** Garantir que `dataInicio > dataFim` produza erro e impeça aplicação.
3. **Resumo de Filtros Ativos:** Testar renderização de chips `Atributo: Valor`, remoção individual e botão limpar tudo.
4. **Sincronização de Resultados:** Validar contagem e mensagem acessível `role="status"`.
5. **Acessibilidade WAI-ARIA:** Validar `aria-expanded`, `aria-label`, foco ao fechar com `Escape` e labels nos botões de remoção.
