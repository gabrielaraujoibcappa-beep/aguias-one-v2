# Guia Arquitetural de UX & Especificação de Filtros de Período em Dashboards

Este documento estabelece o padrão oficial de experiência do usuário (UX), arquitetura da informação, acessibilidade (W3C WAI-ARIA) e engenharia de interface para **Filtros de Período** no **Sistema ÁGUIAS ONE (v2)**.

---

## 1. Fundamentos & Modelo Mental

Filtros de período definem a janela temporal usada para ler métricas em dashboards. Eles afetam gráficos, cards, tabelas, comparações, alertas e diagnósticos. Por isso, o período **não deve ser tratado apenas como um controle de calendário**: ele faz parte essencial do **contexto da informação**.

Em dashboards analíticos e operacionais, a pessoa precisa saber rapidamente:
1. Qual intervalo está ativo no momento;
2. Se esse período é **relativo** (dinâmico) ou **fixo** (absoluto);
3. Qual é o **escopo** do filtro (se afeta todo o painel ou seções específicas);
4. Quando os dados foram atualizados pela última vez e qual é o fuso horário de referência;
5. Se todos os painéis e cards seguem a mesma janela ou se existem exceções deliberadas.

> [!IMPORTANT]
> **Filtros de período alteram diretamente a interpretação das métricas.**
> O mesmo número absoluto pode indicar crescimento, queda, estabilidade ou risco grave dependendo da janela temporal, da granularidade e do momento da última sincronização. Quando esse contexto fica ambíguo, decisões operacionais de resgate, auditoria ou faturamento podem ser tomadas com premissas erradas.

---

## 2. Diretrizes de UX: Práticas Recomendadas vs. Práticas a Evitar

### Práticas Recomendadas (Faça)
* **Mostre o período ativo explicitamente:** O botão ou trigger do filtro deve exibir o texto do intervalo legível (ex.: `Últimos 30 dias (17/08/2026 – 16/09/2026)`), nunca apenas um ícone silencioso de calendário.
* **Declare o escopo do filtro:** Deixe claro visualmente o escopo da seleção através de uma badge ou cabeçalho estruturado (ex.: `Escopo: Global (Painel da Turma 2026.1)`).
* **Ofereça atalhos relativos úteis:** Forneça presets estratégicos alinhados à rotina de mentoria (*Hoje*, *Últimos 7 dias*, *Últimos 30 dias*, *Mês Atual*, *Ciclo Atual da Turma*).
* **Permita intervalo personalizado com validação:** Permita seleção customizada de início e fim com validação obrigatória de ordem temporal (`dataInicio <= dataFim`) e bloqueio de datas futuras inválidas.
* **Separe período e granularidade:** Trate a granularidade em um grupo de controle independente (`Dia`, `Semana`, `Mês`), pois um recorte de 90 dias pode ser agregado em diferentes resoluções.
* **Mostre a última atualização e fuso horário:** Exiba o timestamp da última consulta (`Atualizado há 3 min`) e o fuso de referência (`Horário de Brasília / UTC-3`), com ação de recarga imediata.
* **Explique exceções no próprio card:** Cards que operam em tempo real (fora da janela do filtro de período) devem conter tags explícitas declarando seu próprio recorte temporal.
* **Estratégia híbrida de aplicação:** Aplicação automática para seleções leves de atalhos relativos; aplicação manual com botão *"Aplicar Filtro"* para intervalos personalizados, evitando consultas parciais pesadas.
* **Recuperação e restauração seguras:** Forneça um botão *"Restaurar Padrão"* que retorne à janela default sem desmarcar ou limpar outros filtros da tela (como semáforos ou buscas).

### Práticas a Evitar (Evite)
* **Usar apenas ícone de calendário:** Esconder a data aplicada atrás de um ícone genérico sem texto.
* **Esconder o intervalo ativo:** Deixar o usuário adivinhar se a métrica reflete o dia, o mês ou o ano.
* **Aplicar consulta pesada a cada clique:** Disparar requisições para cada data selecionada enquanto a pessoa ainda digita ou escolhe o fim do intervalo.
* **Comparar períodos inconsistentes:** Comparar métricas calculadas em janelas temporais desiguais como se fossem equivalentes.
* **Ocultar dados parciais ou atrasados:** Apresentar dados sem avisar o momento do último processamento.
* **Depender apenas de cor:** Indicar estados ou erros de validação apenas por cores sem rótulos e mensagens textuais acessíveis.
* **Apagar filtros sem aviso:** Zerar configurações de pesquisa ou outros parâmetros de tela ao redefinir a data.
* **Ignorar fuso horário:** Não explicitar o fuso em sistemas acessados por equipes ou alunos em diferentes regiões geográficas.

---

## 3. Matriz de Conformidade Heurística (13 Critérios)

| # | Critério Heurístico | Implementação no Sistema ÁGUIAS ONE v2 |
| :-: | :--- | :--- |
| **1** | **Período Ativo Visível** | O elemento disparador exibe o rótulo do atalho e o intervalo por extenso (`17/08/2026 – 16/09/2026`). |
| **2** | **Diferenciação Relativo vs. Fixo** | Badge indicativa: `[Relativo]` para presets dinâmicos e `[Fixo]` para datas customizadas. |
| **3** | **Escopo Global Declarado** | Tag de contexto fixada no cabeçalho do filtro: `Escopo: Global (Painel da Turma)`. |
| **4** | **Declaração de Exceções** | Cards em tempo real exibem: `Janela: Tempo Real (não afetado pelo filtro de período)`. |
| **5** | **Valor Padrão Coerente** | Padrão inicial: `Últimos 30 dias` com granularidade `Semana` (calibrado para a call semanal de quarta). |
| **6** | **Intervalo Real nos Atalhos** | Ao selecionar ou navegar pelos atalhos, as datas reais são visíveis no preview. |
| **7** | **Validação de Intervalo Personalizado** | Impede `dataInicio > dataFim` e datas futuras, com mensagem em `role="alert"`. |
| **8** | **Separação de Período e Granularidade** | Controles independentes em pills dedicadas (`Dia` \| `Semana` \| `Mês`). |
| **9** | **Exibição da Última Atualização** | Indicação textual `Atualizado há X min` acompanhada de botão de reload manual. |
| **10** | **Fuso Horário Explícito** | Identificação explícita `Fuso: Horário de Brasília (UTC-3)` visível no componente. |
| **11** | **Aplicação Adequada ao Custo** | Híbrida: imediata para atalhos relativos; manual com botão *"Aplicar"* no custom range. |
| **12** | **Estado Aplicado e Restauração Clara** | Botão *"Restaurar Período Padrão"* que atua estritamente sobre a janela temporal. |
| **13** | **Acessibilidade Completa (Teclado e ARIA)** | Suporte W3C APG com `role="dialog"`, `aria-haspopup`, `aria-expanded`, foco gerenciado e `Escape`. |

---

## 4. Especificação Técnica do Componente (`src/components/ui/FiltroPeriodo.tsx`)

### 4.1 Interface e Tipagem TypeScript

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

### 4.2 Semântica W3C WAI-ARIA & Navegação por Teclado
* **Botão Trigger:**
  * `role="button"`
  * `aria-haspopup="dialog"`
  * `aria-expanded="true|false"`
  * `aria-label="Filtro de período: [texto do período ativo], Escopo: [escopo]"`
* **Painel Popover:**
  * `role="dialog"`
  * `aria-modal="true"`
  * `aria-label="Selecionar período temporal"`
* **Gerenciamento de Foco:**
  * Ao abrir o painel, o foco é transferido para o primeiro elemento interativo (atalho ativo ou input de data).
  * A tecla `Escape` fecha o popover e restaura imediatamente o foco para o botão trigger.
  * Tab trapping opcional para manter o foco seguro dentro do diálogo enquanto aberto.
* **Mensagens de Erro:**
  * Alertas de validação de data com `role="alert"` e `aria-live="assertive"`.

---

## 5. Aplicação no Sistema ÁGUIAS ONE v2

### A) Painel da Turma & Semáforo (`/painel/turma`)
* **Barra de Contexto Temporal:** Posicionada acima dos KPIs da turma.
* **Escopo Global:** Controla o cálculo de faturamento acumulado, evolução das entregas e diagnósticos temporais da turma.
* **Exceção Declarada:** O card do *Semáforo da Turma (Alunos em Risco)* e a lista de alunos exibem badge informando que refletem a situação operacional em tempo real da turma atual.

---

## 6. Estratégia de Testes Automatizados

O componente e seu padrão serão testados em `tests/filtro-periodo.test.ts`:
1. **Cálculo de Atalhos:** Validar cálculo de datas para `hoje`, `ultimos_7d`, `ultimos_30d`, `mes_atual`.
2. **Validação de Intervalo Customizado:** Garantir erro caso `dataInicio > dataFim`.
3. **Independência da Granularidade:** Verificar que a alteração de granularidade mantém o período intacto e vice-versa.
4. **Preservação de Outros Filtros:** Garantir que restaurar o período padrão não limpe filtros de status.
5. **Acessibilidade e Atributos ARIA:** Verificar `aria-expanded`, `role="dialog"`, labels e fuso horário.
