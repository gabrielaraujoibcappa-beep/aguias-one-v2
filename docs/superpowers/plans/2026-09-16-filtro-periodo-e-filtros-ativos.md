# Filtro de Período e Resumo de Filtros Ativos — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar o padrão normativo de UX, componentes reutilizáveis acessíveis (`FiltroPeriodo` e `ResumoFiltrosAtivos`) e integrá-los ao Painel da Turma (`/painel/turma`) do Sistema ÁGUIAS ONE v2.

**Architecture:** Módulo utilitário desacoplado de cálculo temporal (`calculo-periodo.ts`), dois componentes de design system (`FiltroPeriodo.tsx` e `ResumoFiltrosAtivos.tsx`) aderentes às diretrizes W3C WAI-ARIA, Baymard e IBM Carbon, e integração na camada de visualização analítica (`PainelTurmaPage`, `PainelKpisTurma` e `TabelaSemaforoTurma`).

**Tech Stack:** React 18, Next.js 14 (App Router), TypeScript, Vanilla CSS Tokens, Vitest (`renderToStaticMarkup`).

**Spec:** `docs/superpowers/specs/2026-09-16-guia-filtro-periodo-design.md`

## Global Constraints

- Rótulo e texto do período ativo sempre visíveis (nunca usar apenas ícone de calendário silencioso).
- Escopo explicitamente declarado (`Escopo: Global (Painel da Turma)`).
- Separação rigorosa entre período e granularidade (`Dia`, `Semana`, `Mês`).
- Fuso horário de referência explícito (`Horário de Brasília / UTC-3`).
- Cards em tempo real devem conter badge declarativa de exceção de janela temporal.
- Chips de filtros ativos no formato `Atributo: Valor` com botão de remoção individual nomeado programaticamente (`aria-label`).
- Ação para limpar todos os filtros sem apagar preferências não intencionais.
- Contagem de resultados sincronizada com região acessível `role="status"` / `aria-live="polite"`.
- Acessibilidade W3C APG: suporte completo a teclado (`Tab`, `Escape`), estados com `aria-expanded` e `role="dialog"`.

---

### Task 1: Módulo Utilitário de Cálculo e Validação Temporal

**Files:**
- Create: `src/lib/periodo/calculo-periodo.ts`
- Test: `tests/calculo-periodo.test.ts`

**Interfaces:**
- Produces:
  - `export type TipoPeriodo = "relativo" | "customizado";`
  - `export type AtalhoPeriodo = "hoje" | "ultimos_7d" | "ultimos_30d" | "mes_atual" | "ciclo_atual";`
  - `export type Granularidade = "dia" | "semana" | "mes";`
  - `export interface PeriodoFiltroState { tipo: TipoPeriodo; atalho?: AtalhoPeriodo; dataInicio: string; dataFim: string; granularidade: Granularidade; fusoHorario: string; ultimaAtualizacao: Date; escopo: string; }`
  - `export function calcularIntervaloAtalho(atalho: AtalhoPeriodo, dataReferencia?: Date): { dataInicio: string; dataFim: string; rotulo: string };`
  - `export function validarIntervaloCustomizado(dataInicio: string, dataFim: string, permitirFuturo?: boolean): { valido: boolean; erro?: string };`
  - `export function formatarPeriodoLegivel(estado: PeriodoFiltroState): string;`
  - `export function criarPeriodoPadrao(escopo?: string): PeriodoFiltroState;`

- [ ] **Step 1: Escrever teste de unidade que falha**

Criar `tests/calculo-periodo.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import {
  calcularIntervaloAtalho,
  validarIntervaloCustomizado,
  formatarPeriodoLegivel,
  criarPeriodoPadrao,
} from "../src/lib/periodo/calculo-periodo";

describe("Módulo de Cálculo e Validação Temporal de Período", () => {
  const refDate = new Date("2026-09-16T12:00:00Z");

  it("deve calcular corretamente os atalhos relativos", () => {
    const hoje = calcularIntervaloAtalho("hoje", refDate);
    expect(hoje.dataInicio).toBe("2026-09-16");
    expect(hoje.dataFim).toBe("2026-09-16");

    const ultimos7d = calcularIntervaloAtalho("ultimos_7d", refDate);
    expect(ultimos7d.dataInicio).toBe("2026-09-09");
    expect(ultimos7d.dataFim).toBe("2026-09-16");

    const ultimos30d = calcularIntervaloAtalho("ultimos_30d", refDate);
    expect(ultimos30d.dataInicio).toBe("2026-08-17");
    expect(ultimos30d.dataFim).toBe("2026-09-16");

    const mesAtual = calcularIntervaloAtalho("mes_atual", refDate);
    expect(mesAtual.dataInicio).toBe("2026-09-01");
    expect(mesAtual.dataFim).toBe("2026-09-16");
  });

  it("deve validar datas inválidas e ordens temporais incorretas", () => {
    // Início posterior ao fim
    const invertido = validarIntervaloCustomizado("2026-09-20", "2026-09-10");
    expect(invertido.valido).toBe(false);
    expect(invertido.erro).toContain("posterior");

    // Início vazio
    const semInicio = validarIntervaloCustomizado("", "2026-09-10");
    expect(semInicio.valido).toBe(false);

    // Datas válidas
    const valido = validarIntervaloCustomizado("2026-08-01", "2026-08-31");
    expect(valido.valido).toBe(true);
    expect(valido.erro).toBeUndefined();
  });

  it("deve formatar período legível por extenso", () => {
    const padrao = criarPeriodoPadrao("Painel da Turma");
    expect(padrao.escopo).toBe("Painel da Turma");
    expect(padrao.granularidade).toBe("semana");

    const legivel = formatarPeriodoLegivel({
      tipo: "relativo",
      atalho: "ultimos_30d",
      dataInicio: "2026-08-17",
      dataFim: "2026-09-16",
      granularidade: "semana",
      fusoHorario: "America/Sao_Paulo (UTC-3)",
      ultimaAtualizacao: refDate,
      escopo: "Global (Turma)",
    });

    expect(legivel).toContain("Últimos 30 dias");
    expect(legivel).toContain("17/08/2026");
    expect(legivel).toContain("16/09/2026");
  });
});
```

- [ ] **Step 2: Executar o teste para verificar que falha**

Run: `npx vitest run tests/calculo-periodo.test.ts`
Expected: FAIL ("Cannot find module '../src/lib/periodo/calculo-periodo'")

- [ ] **Step 3: Implementar `src/lib/periodo/calculo-periodo.ts`**

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

function formatarDataISO(data: Date): string {
  const ano = data.getUTCFullYear();
  const mes = String(data.getUTCMonth() + 1).padStart(2, "0");
  const dia = String(data.getUTCDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarDataBR(isoStr: string): string {
  if (!isoStr) return "";
  const partes = isoStr.split("-");
  if (partes.length !== 3) return isoStr;
  return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

export function calcularIntervaloAtalho(atalho: AtalhoPeriodo, dataReferencia = new Date()): { dataInicio: string; dataFim: string; rotulo: string } {
  const ref = new Date(Date.UTC(dataReferencia.getUTCFullYear(), dataReferencia.getUTCMonth(), dataReferencia.getUTCDate()));
  const dataFim = formatarDataISO(ref);

  switch (atalho) {
    case "hoje":
      return { dataInicio: dataFim, dataFim, rotulo: "Hoje" };
    case "ultimos_7d": {
      const inicio = new Date(ref);
      inicio.setUTCDate(inicio.getUTCDate() - 7);
      return { dataInicio: formatarDataISO(inicio), dataFim, rotulo: "Últimos 7 dias" };
    }
    case "ultimos_30d": {
      const inicio = new Date(ref);
      inicio.setUTCDate(inicio.getUTCDate() - 30);
      return { dataInicio: formatarDataISO(inicio), dataFim, rotulo: "Últimos 30 dias" };
    }
    case "mes_atual": {
      const inicio = new Date(Date.UTC(ref.getUTCFullYear(), ref.getUTCMonth(), 1));
      return { dataInicio: formatarDataISO(inicio), dataFim, rotulo: "Mês atual" };
    }
    case "ciclo_atual": {
      // Ciclo Águias ONE 2026.1 (exemplo: início em 01/08/2026)
      return { dataInicio: "2026-08-01", dataFim, rotulo: "Ciclo ÁGUIAS ONE 2026.1" };
    }
    default:
      return { dataInicio: dataFim, dataFim, rotulo: "Personalizado" };
  }
}

export function validarIntervaloCustomizado(dataInicio: string, dataFim: string, permitirFuturo = false): { valido: boolean; erro?: string } {
  if (!dataInicio || !dataFim) {
    return { valido: false, erro: "Informe a data inicial e a data final." };
  }
  if (dataInicio > dataFim) {
    return { valido: false, erro: "A data inicial não pode ser posterior à data final." };
  }
  if (!permitirFuturo) {
    const hojeStr = formatarDataISO(new Date());
    if (dataInicio > hojeStr || dataFim > hojeStr) {
      return { valido: false, erro: "O intervalo não pode conter datas futuras para métricas consolidadas." };
    }
  }
  return { valido: true };
}

export function formatarPeriodoLegivel(estado: PeriodoFiltroState): string {
  const inicioBR = formatarDataBR(estado.dataInicio);
  const fimBR = formatarDataBR(estado.dataFim);

  if (estado.tipo === "relativo" && estado.atalho) {
    const atalhoInfo = calcularIntervaloAtalho(estado.atalho, estado.ultimaAtualizacao);
    return `${atalhoInfo.rotulo} (${inicioBR} – ${fimBR})`;
  }
  return `Personalizado (${inicioBR} – ${fimBR})`;
}

export function criarPeriodoPadrao(escopo = "Global (Painel da Turma)"): PeriodoFiltroState {
  const agora = new Date();
  const { dataInicio, dataFim } = calcularIntervaloAtalho("ultimos_30d", agora);

  return {
    tipo: "relativo",
    atalho: "ultimos_30d",
    dataInicio,
    dataFim,
    granularidade: "semana",
    fusoHorario: "America/Sao_Paulo (UTC-3)",
    ultimaAtualizacao: agora,
    escopo,
  };
}
```

- [ ] **Step 4: Executar os testes para verificar que passam**

Run: `npx vitest run tests/calculo-periodo.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add src/lib/periodo/calculo-periodo.ts tests/calculo-periodo.test.ts
git commit -m "feat(periodo): add date calculation, shortcuts, and validation utils"
```

---

### Task 2: Componente Reutilizável de Resumo de Filtros Ativos (`ResumoFiltrosAtivos.tsx`)

**Files:**
- Create: `src/components/ui/ResumoFiltrosAtivos.tsx`
- Test: `tests/filtros-ativos.test.ts`

**Interfaces:**
- Consumes: Design tokens e ícones de remoção (`Icons.tsx`).
- Produces:
  - `export interface FiltroAtivoItem { id: string; categoria: string; valorRotulo: string; onRemover?: () => void; removivel?: boolean; }`
  - `export interface ResumoFiltrosAtivosProps { filtros: FiltroAtivoItem[]; totalResultados?: number; totalGeral?: number; entidadeNome?: string; onLimparTudo?: () => void; }`
  - `export function ResumoFiltrosAtivos(props: ResumoFiltrosAtivosProps): JSX.Element | null;`

- [ ] **Step 1: Escrever teste de unidade que falha**

Criar `tests/filtros-ativos.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { ResumoFiltrosAtivos, FiltroAtivoItem } from "../src/components/ui/ResumoFiltrosAtivos";

describe("Componente ResumoFiltrosAtivos (Câmara UX, Baymard, Carbon e PatternFly)", () => {
  const filtrosExemplo: FiltroAtivoItem[] = [
    {
      id: "semaforo",
      categoria: "Semáforo",
      valorRotulo: "Em Risco",
      onRemover: () => {},
      removivel: true,
    },
    {
      id: "periodo",
      categoria: "Período",
      valorRotulo: "Últimos 30 dias",
      onRemover: () => {},
      removivel: true,
    },
  ];

  it("deve renderizar os chips de filtros ativos com categoria e valor explícitos", () => {
    const html = renderToStaticMarkup(
      React.createElement(ResumoFiltrosAtivos, {
        filtros: filtrosExemplo,
        totalResultados: 2,
        totalGeral: 4,
        entidadeNome: "peritos",
        onLimparTudo: () => {},
      })
    );

    // 1. Container de filtros com role de região acessível
    expect(html).toContain('role="region"');
    expect(html).toContain('aria-label="Filtros aplicados"');

    // 2. Chips com categoria e valor
    expect(html).toContain("Semáforo:");
    expect(html).toContain("Em Risco");
    expect(html).toContain("Período:");
    expect(html).toContain("Últimos 30 dias");

    // 3. Botão individual com nome acessível
    expect(html).toContain('aria-label="Remover filtro Semáforo: Em Risco"');
    expect(html).toContain('aria-label="Remover filtro Período: Últimos 30 dias"');

    // 4. Botão de limpar tudo
    expect(html).toContain("Limpar filtros");

    // 5. Contagem com região de status anunciável
    expect(html).toContain('role="status"');
    expect(html).toContain("Exibindo 2 de 4 peritos");
  });

  it("não deve renderizar nada se não houver filtros ativos", () => {
    const html = renderToStaticMarkup(
      React.createElement(ResumoFiltrosAtivos, {
        filtros: [],
        totalResultados: 4,
        totalGeral: 4,
      })
    );

    expect(html).toBe("");
  });
});
```

- [ ] **Step 2: Executar teste para verificar que falha**

Run: `npx vitest run tests/filtros-ativos.test.ts`
Expected: FAIL ("Cannot find module '../src/components/ui/ResumoFiltrosAtivos'")

- [ ] **Step 3: Implementar `src/components/ui/ResumoFiltrosAtivos.tsx`**

```typescript
"use client";

import React from "react";

export interface FiltroAtivoItem {
  id: string;
  categoria: string;
  valorRotulo: string;
  onRemover?: () => void;
  removivel?: boolean;
}

export interface ResumoFiltrosAtivosProps {
  filtros: FiltroAtivoItem[];
  totalResultados?: number;
  totalGeral?: number;
  entidadeNome?: string;
  onLimparTudo?: () => void;
}

export function ResumoFiltrosAtivos({
  filtros,
  totalResultados,
  totalGeral,
  entidadeNome = "itens",
  onLimparTudo,
}: ResumoFiltrosAtivosProps) {
  if (!filtros || filtros.length === 0) {
    return null;
  }

  const temContagem = typeof totalResultados === "number";
  const contagemTexto = temContagem && typeof totalGeral === "number"
    ? `Exibindo ${totalResultados} de ${totalGeral} ${entidadeNome}`
    : temContagem
    ? `${totalResultados} ${entidadeNome} encontrados`
    : "";

  return (
    <div
      role="region"
      aria-label="Filtros aplicados"
      style={{
        display: "flex",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "8px",
        padding: "10px 14px",
        backgroundColor: "var(--cor-soft-stone)",
        borderRadius: "var(--radius-sm)",
        marginBottom: "var(--espaco-md)",
        border: "1px solid var(--cor-border-light)",
      }}
    >
      <span
        style={{
          fontSize: "11px",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.5px",
          color: "var(--cor-slate)",
          fontFamily: "var(--font-family-mono)",
          marginRight: "4px",
        }}
      >
        Filtros Ativos:
      </span>

      {/* Chips Removíveis */}
      {filtros.map((f) => {
        const rotuloAcessivel = `Remover filtro ${f.categoria}: ${f.valorRotulo}`;
        return (
          <span
            key={f.id}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              backgroundColor: "#ffffff",
              border: "1px solid var(--cor-border-light)",
              borderRadius: "var(--radius-pill)",
              padding: "3px 10px 3px 12px",
              fontSize: "12px",
              color: "var(--cor-ink)",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
            }}
          >
            <span style={{ fontWeight: 600, color: "var(--cor-slate)" }}>{f.categoria}:</span>
            <span>{f.valorRotulo}</span>
            {f.removivel !== false && f.onRemover && (
              <button
                type="button"
                onClick={f.onRemover}
                aria-label={rotuloAcessivel}
                style={{
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--cor-muted)",
                  padding: "2px 4px",
                  borderRadius: "50%",
                  fontSize: "14px",
                  lineHeight: 1,
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  transition: "all 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#dc2626";
                  e.currentTarget.style.backgroundColor = "rgba(220, 38, 38, 0.1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "var(--cor-muted)";
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                ×
              </button>
            )}
          </span>
        );
      })}

      {/* Botão Limpar Filtros */}
      {onLimparTudo && (
        <button
          type="button"
          onClick={onLimparTudo}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--cor-deep-green)",
            fontSize: "12px",
            fontWeight: 600,
            cursor: "pointer",
            padding: "4px 8px",
            textDecoration: "underline",
            marginLeft: "auto",
          }}
        >
          Limpar filtros
        </button>
      )}

      {/* Região de Status Acessível para Contagem */}
      {contagemTexto && (
        <div
          role="status"
          aria-live="polite"
          style={{
            fontSize: "12px",
            color: "var(--cor-slate)",
            marginLeft: onLimparTudo ? "8px" : "auto",
            fontWeight: 500,
          }}
        >
          {contagemTexto}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 4: Executar os testes para verificar que passam**

Run: `npx vitest run tests/filtros-ativos.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add src/components/ui/ResumoFiltrosAtivos.tsx tests/filtros-ativos.test.ts
git commit -m "feat(ui): add ResumoFiltrosAtivos component with removable chips and aria status"
```

---

### Task 3: Componente Reutilizável de Filtro de Período (`FiltroPeriodo.tsx`)

**Files:**
- Create: `src/components/ui/FiltroPeriodo.tsx`
- Test: `tests/filtro-periodo.test.ts`

**Interfaces:**
- Consumes: `PeriodoFiltroState`, `calcularIntervaloAtalho`, `validarIntervaloCustomizado`, `formatarPeriodoLegivel` de `src/lib/periodo/calculo-periodo.ts`.
- Produces:
  - `export interface FiltroPeriodoProps { valor: PeriodoFiltroState; onChange: (novo: PeriodoFiltroState) => void; onAtualizarDados?: () => void; carregando?: boolean; escopoNome?: string; }`
  - `export function FiltroPeriodo(props: FiltroPeriodoProps): JSX.Element;`

- [ ] **Step 1: Escrever teste de unidade que falha**

Criar `tests/filtro-periodo.test.ts`:
```typescript
import { describe, it, expect } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { FiltroPeriodo } from "../src/components/ui/FiltroPeriodo";
import { PeriodoFiltroState } from "../src/lib/periodo/calculo-periodo";

describe("Componente FiltroPeriodo (Diretrizes UX, WAI-ARIA e Heurísticas)", () => {
  const estadoExemplo: PeriodoFiltroState = {
    tipo: "relativo",
    atalho: "ultimos_30d",
    dataInicio: "2026-08-17",
    dataFim: "2026-09-16",
    granularidade: "semana",
    fusoHorario: "America/Sao_Paulo (UTC-3)",
    ultimaAtualizacao: new Date("2026-09-16T08:00:00Z"),
    escopo: "Global (Painel da Turma 2026.1)",
  };

  it("deve renderizar o período ativo visível em texto, escopo e fuso horário", () => {
    const html = renderToStaticMarkup(
      React.createElement(FiltroPeriodo, {
        valor: estadoExemplo,
        onChange: () => {},
        onAtualizarDados: () => {},
      })
    );

    // 1. O período ativo NÃO é apenas um ícone silencioso: texto claro e legível
    expect(html).toContain("Últimos 30 dias");
    expect(html).toContain("17/08/2026");
    expect(html).toContain("16/09/2026");

    // 2. Escopo explícito
    expect(html).toContain("Escopo: Global (Painel da Turma 2026.1)");

    // 3. Fuso e última atualização
    expect(html).toContain("America/Sao_Paulo (UTC-3)");
    expect(html).toContain("Atualizado");

    // 4. Granularidade separada
    expect(html).toContain("Granularidade:");
    expect(html).toContain("Semana");

    // 5. Botão trigger com semântica WAI-ARIA
    expect(html).toContain('aria-haspopup="dialog"');
    expect(html).toContain('aria-expanded="false"');
  });
});
```

- [ ] **Step 2: Executar teste para verificar que falha**

Run: `npx vitest run tests/filtro-periodo.test.ts`
Expected: FAIL ("Cannot find module '../src/components/ui/FiltroPeriodo'")

- [ ] **Step 3: Implementar `src/components/ui/FiltroPeriodo.tsx`**

Implementar componente completo com:
- Trigger rico com texto claro, datas reais e badge de escopo.
- Grupo de granularidade ortogonal (`Dia`, `Semana`, `Mês`).
- Transparência de fuso horário e ação de sincronização.
- Popover acessível (`role="dialog"`, `aria-modal="true"`).
- Atalhos rápidos relativos com visualização das datas reais.
- Painel personalizado com validação inline de início/fim e botão *"Aplicar Filtro"*.
- Botão *"Restaurar Período Padrão"*.
- Tratamento de teclado (`Escape` fecha popover e devolve foco ao trigger).

- [ ] **Step 4: Executar os testes para verificar que passam**

Run: `npx vitest run tests/filtro-periodo.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**

Run:
```bash
git add src/components/ui/FiltroPeriodo.tsx tests/filtro-periodo.test.ts
git commit -m "feat(ui): add FiltroPeriodo component adhering to UX period guidelines"
```

---

### Task 4: Integração no Painel da Turma & Semáforo (`/painel/turma`)

**Files:**
- Modify: `src/app/(equipe)/painel/turma/page.tsx`
- Modify: `src/components/equipe/PainelKpisTurma.tsx`
- Modify: `src/components/equipe/TabelaSemaforoTurma.tsx`
- Test: `tests/kpis.test.ts`

**Interfaces:**
- Consumes: `FiltroPeriodo`, `ResumoFiltrosAtivos`, `criarPeriodoPadrao`.
- Produces: Visualização integrada e sincronizada do Painel da Turma.

- [ ] **Step 1: Atualizar `PainelKpisTurma.tsx` para declarar exceção temporal**

Adicionar no cabeçalho do card de Alunos em Risco e Fila de Auditoria o badge explícito:
`Janela: Tempo Real (não afetado pelo período)`.

- [ ] **Step 2: Integrar `FiltroPeriodo` no topo de `PainelTurmaPage`**

Inserir a barra de contexto temporal acima dos KPIs, permitindo alterar o período e granularidade com atualização do estado.

- [ ] **Step 3: Integrar `ResumoFiltrosAtivos` em `TabelaSemaforoTurma.tsx`**

Conectar os filtros de semáforo ("verde", "amarelo", "vermelho", "resgate") ao componente `ResumoFiltrosAtivos` com contagem em tempo real (`Exibindo X de Y peritos`), remoção por chip e botão de limpar filtros.

- [ ] **Step 4: Executar toda a suíte de testes do projeto**

Run: `npm run test`
Expected: 100% dos testes passando (todas as specs de cálculo, acessibilidade, abas, navegação e KPIs).

- [ ] **Step 5: Executar typecheck e lint**

Run: `npm run typecheck`
Expected: Exit code 0 sem erros de tipagem.

- [ ] **Step 6: Commit**

Run:
```bash
git add src/app/(equipe)/painel/turma/page.tsx src/components/equipe/PainelKpisTurma.tsx src/components/equipe/TabelaSemaforoTurma.tsx
git commit -m "feat(painel-turma): integrate FiltroPeriodo, exception badges, and ResumoFiltrosAtivos"
```
