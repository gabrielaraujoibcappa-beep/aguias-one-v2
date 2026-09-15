# Sistema de Mentoria ÁGUIAS ONE (v2) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir o sistema completo de mentoria ÁGUIAS ONE (v2) com Dashboard do Mentorado, Check-in Modular liberado pelo Anjo/Flávio com múltiplos links e arquivos, Faturamento direto com upload de comprovantes e arquivos `.zip`, Painel Operacional da Turma (Semáforo e Resgate WhatsApp) e CRUDs administrativos completos.

**Architecture:** Frontend em Next.js (App Router) / React com TypeScript e estilização Vanilla CSS baseada no design system Cohere Enterprise 2026 (`DESIGN.md`). Backend suportado por Supabase (PostgreSQL 15+, Row Level Security estrito por papel e Supabase Storage com buckets para evidências e pacotes `.zip` protegidos).

**Tech Stack:** Next.js 14+ / React 18+, TypeScript, Vanilla CSS (Design Tokens de `DESIGN.md`), Supabase (PostgreSQL, Auth, RLS, Storage), Vitest / React Testing Library para testes unitários e de integração.

**Spec:** [2026-09-15-sistema-mentoria-v2-design.md](file:///c:/Users/ibcap/Ibcappainstituto%20Dropbox/02%20-%20UniBCAPPA%20-%20POS/04%20-%20MENTORIA/01%20-%20%C3%81GUIAS%20ONE/06-sistema/v2/docs/superpowers/specs/2026-09-15-sistema-mentoria-v2-design.md)

## Global Constraints
- Sem livro caixa, sem partição de 4 potes, sem régua de degraus 3k–20k (conforme alinhamento e cortes de escopo aprovados).
- O mentorado só tem acesso a preencher módulos que tiverem sido ativamente liberados pelo Anjo ou Flávio.
- Check-ins aceitam múltiplos links (URLs) e múltiplos uploads de arquivos/prints (PNG, JPG, PDF).
- Faturamento mensal aceita valor bruto em R$ e múltiplos comprovantes ou pacote único `.zip`.
- Design corporativo sóbrio e editorial (estilo Cohere: canvas `#ffffff`, `#17171c`, verde `#003c33`, navy `#071829`, botões pill `32px`, sem gradientes genéricos).

---

### Task 1: Scaffolding do Projeto V2 e Design System (Tokens de DESIGN.md)

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.mjs`
- Create: `src/app/layout.tsx`
- Create: `src/app/globals.css`
- Create: `src/styles/tokens.css`
- Test: `tests/design-tokens.test.ts`

**Interfaces:**
- Produces: Variáveis CSS globais (`--cor-primary`, `--cor-deep-green`, `--cor-canvas`, `--radius-pill`, `--font-display`, etc.) e layout base responsivo com tipografia Cohere/Inter.

- [ ] **Step 1: Escrever teste automatizado para validar carregamento dos tokens CSS**
```typescript
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Design Tokens", () => {
  it("deve conter as cores oficiais do DESIGN.md", () => {
    const css = fs.readFileSync(path.resolve(__dirname, "../src/styles/tokens.css"), "utf-8");
    expect(css).toContain("--cor-primary: #17171c");
    expect(css).toContain("--cor-deep-green: #003c33");
    expect(css).toContain("--cor-canvas: #ffffff");
    expect(css).toContain("--radius-pill: 32px");
  });
});
```

- [ ] **Step 2: Executar teste e verificar que falha**
Run: `npx vitest run tests/design-tokens.test.ts`
Expected: FAIL (arquivo não existe)

- [ ] **Step 3: Implementar package.json, tokens.css e globals.css**
Criar `src/styles/tokens.css` com a paleta oficial extraída de `DESIGN.md` e `src/app/globals.css` com resets tipográficos.

- [ ] **Step 4: Executar teste e verificar que passa**
Run: `npx vitest run tests/design-tokens.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add package.json tsconfig.json src/styles/tokens.css src/app/globals.css tests/design-tokens.test.ts
git commit -m "feat: setup inicial do projeto v2 e tokens do design system cohere"
```

---

### Task 2: Schema de Banco de Dados, Migrations e Políticas de RLS

**Files:**
- Create: `supabase/migrations/20260915200000_schema_v2.sql`
- Test: `tests/db-schema.test.ts`

**Interfaces:**
- Produces: Tabelas `usuarios`, `turmas`, `matriculas`, `modulos`, `modulo_liberacoes`, `checkins_modulo`, `checkin_evidencias`, `faturamentos`, `canais_mentorados`, buckets de storage e políticas de RLS.

- [ ] **Step 1: Escrever teste de integridade do SQL de migration**
```typescript
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("Database Migration v2", () => {
  it("deve definir as tabelas e enum de papéis corretos", () => {
    const sql = fs.readFileSync(path.resolve(__dirname, "../supabase/migrations/20260915200000_schema_v2.sql"), "utf-8");
    expect(sql).toContain("CREATE TABLE usuarios");
    expect(sql).toContain("CREATE TABLE turmas");
    expect(sql).toContain("CREATE TABLE modulo_liberacoes");
    expect(sql).toContain("CREATE TABLE faturamentos");
    expect(sql).toContain("storage_zip_path");
  });
});
```

- [ ] **Step 2: Executar teste e verificar que falha**
Run: `npx vitest run tests/db-schema.test.ts`
Expected: FAIL

- [ ] **Step 3: Escrever o script SQL da migration v2**
Implementar tabelas relacionais com chaves estrangeiras, campos obrigatórios, timestamps, triggers de `updated_at` e Row Level Security (RLS) protegendo dados privados de faturamento.

- [ ] **Step 4: Executar teste e verificar que passa**
Run: `npx vitest run tests/db-schema.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add supabase/migrations/20260915200000_schema_v2.sql tests/db-schema.test.ts
git commit -m "feat: migration do banco de dados v2 com rls e suporte a zip e liberacoes"
```

---

### Task 3: Autenticação, Controle de Sessão e Middleware RBAC

**Files:**
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/auth/roles.ts`
- Create: `src/middleware.ts`
- Test: `tests/auth-roles.test.ts`

**Interfaces:**
- Consumes: Tipos de usuários do banco.
- Produces: Funções de verificação de permissões (`isStaff(role)`, `canAudit(role)`, `canManageCohorts(role)`) e proteção de rotas `/aluno/*` e `/equipe/*`.

- [ ] **Step 1: Escrever teste unitário para verificação de permissões RBAC**
```typescript
import { describe, it, expect } from "vitest";
import { isStaff, canAudit, canManageCohorts } from "../src/lib/auth/roles";

describe("RBAC Permissions", () => {
  it("deve identificar papeis de equipe corretamente", () => {
    expect(isStaff("anjo")).toBe(true);
    expect(isStaff("concierge")).toBe(true);
    expect(isStaff("admin")).toBe(true);
    expect(isStaff("mentor")).toBe(true);
    expect(isStaff("mentorado")).toBe(false);
  });

  it("apenas equipe autorizada pode auditar", () => {
    expect(canAudit("anjo")).toBe(true);
    expect(canAudit("concierge")).toBe(true);
    expect(canAudit("mentorado")).toBe(false);
  });
});
```

- [ ] **Step 2: Executar teste e verificar falha**
Run: `npx vitest run tests/auth-roles.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementar `src/lib/auth/roles.ts` e `src/middleware.ts`**

- [ ] **Step 4: Executar teste e verificar que passa**
Run: `npx vitest run tests/auth-roles.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/lib/auth/roles.ts src/middleware.ts tests/auth-roles.test.ts
git commit -m "feat: controle de papeis rbac e middleware de protecao de rotas"
```

---

### Task 4: CRUD Administrativo de Alunos e Turmas

**Files:**
- Create: `src/app/(equipe)/admin/alunos/page.tsx`
- Create: `src/components/admin/TabelaAlunos.tsx`
- Create: `src/components/admin/ModalAluno.tsx`
- Create: `src/app/(equipe)/admin/turmas/page.tsx`
- Create: `src/components/admin/TabelaTurmas.tsx`
- Create: `src/components/admin/ModalTurma.tsx`
- Create: `src/lib/api/alunos.ts`
- Create: `src/lib/api/turmas.ts`
- Test: `tests/crud-alunos.test.ts`

**Interfaces:**
- Produces: Telas e endpoints para criar, listar, editar, buscar e alterar status de peritos e turmas.

- [ ] **Step 1: Escrever teste para validações do cadastro de alunos**
```typescript
import { describe, it, expect } from "vitest";
import { validarDadosAluno } from "../src/lib/api/alunos";

describe("Validacao Aluno", () => {
  it("deve rejeitar aluno sem whatsapp ou com email invalido", () => {
    const res = validarDadosAluno({ nome: "Carlos", email: "invalido", whatsapp: "" });
    expect(res.valido).toBe(false);
    expect(res.erros).toContain("email");
    expect(res.erros).toContain("whatsapp");
  });
});
```

- [ ] **Step 2: Executar teste e verificar que falha**
Run: `npx vitest run tests/crud-alunos.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementar validação e componentes de CRUD de Alunos e Turmas**

- [ ] **Step 4: Executar teste e verificar que passa**
Run: `npx vitest run tests/crud-alunos.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/\(equipe\)/admin/ src/components/admin/ src/lib/api/ tests/crud-alunos.test.ts
git commit -m "feat: cruds administrativos de alunos e turmas com validacao e filtros"
```

---

### Task 5: Gestão e Liberação Ativa de Módulos (Anjo / Flávio)

**Files:**
- Create: `src/app/(equipe)/painel/modulos/page.tsx`
- Create: `src/components/equipe/ListaLiberacaoModulos.tsx`
- Create: `src/lib/api/modulos-liberacao.ts`
- Test: `tests/liberacao-modulos.test.ts`

**Interfaces:**
- Produces: Capacidade do Anjo ou Flávio de alternar status de módulos para "Liberado" ou "Bloqueado" para a turma/aluno.

- [ ] **Step 1: Escrever teste de regra de negócio da liberação de módulo**
```typescript
import { describe, it, expect } from "vitest";
import { filtrarModulosVisiveis } from "../src/lib/api/modulos-liberacao";

describe("Visibilidade de Modulos", () => {
  it("aluno so visualiza modulos com status liberado ou aprovado", () => {
    const modulos = [
      { id: "1", titulo: "Pastas Drive", status: "liberado" },
      { id: "2", titulo: "Agenda", status: "bloqueado" },
      { id: "3", titulo: "Prospeccao", status: "aprovado" }
    ];
    const visiveis = filtrarModulosVisiveis(modulos);
    expect(visiveis.map(m => m.id)).toEqual(["1", "3"]);
  });
});
```

- [ ] **Step 2: Executar teste e verificar que falha**
Run: `npx vitest run tests/liberacao-modulos.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementar API e tela de liberação de módulos**

- [ ] **Step 4: Executar teste e verificar que passa**
Run: `npx vitest run tests/liberacao-modulos.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/\(equipe\)/painel/modulos/ src/components/equipe/ListaLiberacaoModulos.tsx src/lib/api/modulos-liberacao.ts tests/liberacao-modulos.test.ts
git commit -m "feat: painel de liberacao ativa de modulos pelo anjo e concierge"
```

---

### Task 6: Dashboard Inicial do Mentorado (Home Central)

**Files:**
- Create: `src/app/(aluno)/dashboard/page.tsx`
- Create: `src/components/aluno/CardPerfilAluno.tsx`
- Create: `src/components/aluno/AtalhosPrincipais.tsx`
- Create: `src/components/aluno/SecaoMateriais.tsx`
- Test: `tests/aluno-dashboard.test.ts`

**Interfaces:**
- Produces: Home do aluno com banner do módulo atual, materiais de apoio e 3 atalhos: Check-in, Canais e Faturamento.

- [ ] **Step 1: Escrever teste para renderização dos 3 atalhos essenciais**
```typescript
import { describe, it, expect } from "vitest";
import { obterAtalhosDashboard } from "../src/components/aluno/AtalhosPrincipais";

describe("Atalhos do Dashboard", () => {
  it("deve conter exatamente os 3 atalhos oficiais", () => {
    const atalhos = obterAtalhosDashboard({ moduloLiberadoId: "1" });
    expect(atalhos.map(a => a.chave)).toEqual(["checkin", "canais", "faturamento"]);
  });
});
```

- [ ] **Step 2: Executar teste e verificar que falha**
Run: `npx vitest run tests/aluno-dashboard.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementar componentes do Dashboard do Aluno no padrão Cohere**

- [ ] **Step 4: Executar teste e verificar que passa**
Run: `npx vitest run tests/aluno-dashboard.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/\(aluno\)/dashboard/ src/components/aluno/ tests/aluno-dashboard.test.ts
git commit -m "feat: dashboard central do mentorado com atalhos de checkin canais e faturamento"
```

---

### Task 7: Formulário de Check-in Modular com Links e Múltiplos Arquivos

**Files:**
- Create: `src/app/(aluno)/checkin/[moduloId]/page.tsx`
- Create: `src/components/checkin/FormularioCheckinModular.tsx`
- Create: `src/components/checkin/InputMultiploArquivos.tsx`
- Create: `src/components/checkin/InputLinkEvidencia.tsx`
- Create: `src/lib/api/checkin.ts`
- Test: `tests/checkin-modular.test.ts`

**Interfaces:**
- Produces: Tela de preenchimento do módulo liberado, com validação de URLs, uploads de prints/PDFs múltiplos e salvamento de rascunho.

- [ ] **Step 1: Escrever teste de validação do envio de check-in**
```typescript
import { describe, it, expect } from "vitest";
import { validarSubmissaoCheckin } from "../src/lib/api/checkin";

describe("Submissao de Check-in Modular", () => {
  it("rejeita envio se link obrigatorio estiver em branco", () => {
    const res = validarSubmissaoCheckin({
      moduloId: "1",
      links: [{ rotulo: "Site no ar", url: "" }],
      arquivos: [{ rotulo: "Print pastas", path: "evidencias/print1.png" }]
    });
    expect(res.valido).toBe(false);
    expect(res.motivo).toContain("Site no ar");
  });
});
```

- [ ] **Step 2: Executar teste e verificar que falha**
Run: `npx vitest run tests/checkin-modular.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementar formulário de check-in com dropzone múltiplo e links**

- [ ] **Step 4: Executar teste e verificar que passa**
Run: `npx vitest run tests/checkin-modular.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/\(aluno\)/checkin/ src/components/checkin/ src/lib/api/checkin.ts tests/checkin-modular.test.ts
git commit -m "feat: formulario de checkin modular com links e uploads multiplos"
```

---

### Task 8: Esteira de Auditoria e Aprovação de Entregas (Anjo / Flávio)

**Files:**
- Create: `src/app/(equipe)/painel/auditoria/page.tsx`
- Create: `src/components/equipe/FilaAuditoria.tsx`
- Create: `src/components/equipe/VisualizadorEntrega.tsx`
- Create: `src/lib/api/auditoria.ts`
- Test: `tests/auditoria-entregas.test.ts`

**Interfaces:**
- Produces: Visualização dos links e prints enviados pelo aluno e botões de `Aprovar` ou `Solicitar Ajuste` (com comentário obrigatório).

- [ ] **Step 1: Escrever teste de transição de estado da auditoria**
```typescript
import { describe, it, expect } from "vitest";
import { processarParecerAuditoria } from "../src/lib/api/auditoria";

describe("Auditoria de Entregas", () => {
  it("exige motivo ao reprovar/solicitar ajuste", () => {
    expect(() => processarParecerAuditoria({ checkinId: "chk-1", decisao: "ajuste", motivo: "" }))
      .toThrow("Motivo do ajuste é obrigatório");
  });
});
```

- [ ] **Step 2: Executar teste e verificar que falha**
Run: `npx vitest run tests/auditoria-entregas.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementar componentes da fila de auditoria e modal de parecer**

- [ ] **Step 4: Executar teste e verificar que passa**
Run: `npx vitest run tests/auditoria-entregas.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/\(equipe\)/painel/auditoria/ src/components/equipe/FilaAuditoria.tsx src/lib/api/auditoria.ts tests/auditoria-entregas.test.ts
git commit -m "feat: esteira de auditoria de entregas pelo anjo e concierge"
```

---

### Task 9: Módulo de Faturamento e Comprovantes (Upload de ZIP e Arquivos)

**Files:**
- Create: `src/app/(aluno)/faturamento/page.tsx`
- Create: `src/components/faturamento/FormularioFaturamento.tsx`
- Create: `src/components/faturamento/TabelaHistoricoFaturamento.tsx`
- Create: `src/lib/api/faturamento.ts`
- Test: `tests/faturamento-zip.test.ts`

**Interfaces:**
- Produces: Formulário com seletor de mês, input monetário R$, upload de arquivos/ZIP e tabela de histórico com download de comprovantes.

- [ ] **Step 1: Escrever teste de validação de arquivos permitidos no faturamento**
```typescript
import { describe, it, expect } from "vitest";
import { validarComprovanteFaturamento } from "../src/lib/api/faturamento";

describe("Faturamento Comprovantes", () => {
  it("aceita arquivos zip, pdf, png e jpg", () => {
    expect(validarComprovanteFaturamento("extratos_setembro.zip").valido).toBe(true);
    expect(validarComprovanteFaturamento("nota_fiscal.pdf").valido).toBe(true);
    expect(validarComprovanteFaturamento("planilha.exe").valido).toBe(false);
  });
});
```

- [ ] **Step 2: Executar teste e verificar que falha**
Run: `npx vitest run tests/faturamento-zip.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementar tela e API de faturamento com suporte a `.zip`**

- [ ] **Step 4: Executar teste e verificar que passa**
Run: `npx vitest run tests/faturamento-zip.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/\(aluno\)/faturamento/ src/components/faturamento/ src/lib/api/faturamento.ts tests/faturamento-zip.test.ts
git commit -m "feat: modulo de faturamento com input r$ e suporte a upload de pacotes zip"
```

---

### Task 10: Painel de Canais de Atração do Escritório

**Files:**
- Create: `src/app/(aluno)/canais/page.tsx`
- Create: `src/components/canais/GridCanais.tsx`
- Create: `src/lib/api/canais.ts`
- Test: `tests/canais.test.ts`

**Interfaces:**
- Produces: Interface com os 7 canais oficiais do PPC em ordem estrita com campos para link e status (Ativo / Pendente).

- [ ] **Step 1: Escrever teste da ordem canônica dos 7 canais**
```typescript
import { describe, it, expect } from "vitest";
import { CANAIS_OFICIAIS } from "../src/lib/api/canais";

describe("Ordem dos Canais", () => {
  it("deve seguir estritamente a ordem pedagogica do PPC", () => {
    expect(CANAIS_OFICIAIS).toEqual([
      "WhatsApp Business",
      "Google Meu Negócio",
      "Instagram",
      "Site Próprio",
      "Newsletter",
      "YouTube",
      "Google Ads"
    ]);
  });
});
```

- [ ] **Step 2: Executar teste e verificar que falha**
Run: `npx vitest run tests/canais.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementar componentes do painel de canais**

- [ ] **Step 4: Executar teste e verificar que passa**
Run: `npx vitest run tests/canais.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/\(aluno\)/canais/ src/components/canais/ src/lib/api/canais.ts tests/canais.test.ts
git commit -m "feat: painel de canais de atracao na ordem rigida do ppc"
```

---

### Task 11: Painel Operacional da Turma (Semáforo, Travas e Resgate WhatsApp)

**Files:**
- Create: `src/app/(equipe)/painel/turma/page.tsx`
- Create: `src/components/equipe/TabelaSemaforoTurma.tsx`
- Create: `src/components/equipe/BotaoResgateWhatsApp.tsx`
- Create: `src/lib/api/turma-semaforo.ts`
- Test: `tests/semaforo-resgate.test.ts`

**Interfaces:**
- Produces: Visão geral da turma para Flávio e Edilson com semáforos automáticos, exibição de travas em 1 linha e link para resgate via WhatsApp.

- [ ] **Step 1: Escrever teste de detecção de aluno que precisa de resgate**
```typescript
import { describe, it, expect } from "vitest";
import { verificarNecessidadeResgate } from "../src/lib/api/turma-semaforo";

describe("Regra de Resgate", () => {
  it("dispara alerta de resgate se aluno estiver 2 semanas seguidas no vermelho", () => {
    const historico = ["vermelho", "vermelho"];
    expect(verificarNecessidadeResgate(historico).precisaResgate).toBe(true);
  });
});
```

- [ ] **Step 2: Executar teste e verificar que falha**
Run: `npx vitest run tests/semaforo-resgate.test.ts`
Expected: FAIL

- [ ] **Step 3: Implementar painel operacional da turma e gerador de mensagem de resgate**

- [ ] **Step 4: Executar teste e verificar que passa**
Run: `npx vitest run tests/semaforo-resgate.test.ts`
Expected: PASS

- [ ] **Step 5: Commit**
```bash
git add src/app/\(equipe\)/painel/turma/ src/components/equipe/ src/lib/api/turma-semaforo.ts tests/semaforo-resgate.test.ts
git commit -m "feat: painel operacional da turma com semaforo e botao de resgate whatsapp"
```
