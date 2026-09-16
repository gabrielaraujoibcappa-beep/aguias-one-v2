# Sistema de Mentoria ÁGUIAS ONE (v2)

**Spec vigente de diagnóstico + papéis do palco 15/09:** [`../SPEC-DIAGNOSTICO-E-ACOMPANHAMENTO.md`](../SPEC-DIAGNOSTICO-E-ACOMPANHAMENTO.md). Não implementar onboarding, Anjo, Concierge ou painel do Mentor sem ler esse arquivo — ele separa Anjo ≠ Resgate (Adelayne) ≠ Concierge ≠ Mentor e define o formulário de entrada (ICP + placar).

Sistema institucional e operacional de gestão e acompanhamento da **Mentoria ÁGUIAS ONE**, estruturado com base nas **Personas da HOUS3**, no **PPC do ÁGUIAS ONE** e na identidade visual editorial **Cohere Enterprise 2026** (`DESIGN.md`).

---

## 🏛️ Arquitetura e Módulos do Sistema

O sistema é dividido em duas grandes áreas de trabalho:

### 1. Área do Mentorado (Perito Solo)
* **Dashboard Central (`/dashboard`):** Visão geral semáforo do aluno, atalhos prioritários e downloads de materiais (kits HTML, modelos de contrato e templates do Google Drive).
* **Check-in Modular (`/checkin/[moduloId]`):** Submissão prática de evidências com validação de links e upload múltiplo de arquivos/prints. Permite relatar travas e submeter dúvidas para o encontro semanal de quarta-feira.
* **Faturamento & Comprovantes (`/faturamento`):** Declaração de faturamento bruto mensal em R$ com suporte a arquivos avulsos e pacote compactado único `.zip`.
* **Canais de Atração (`/canais`):** Gestão dos 7 canais de prospecção do PPC (WhatsApp, Google Meu Negócio, Instagram, Site, Newsletter, YouTube, Ads).

### 2. Painel da Equipe & Gestão Operacional
* **Liberação de Módulos (`/painel/modulos`):** Controle ativo de liberação de etapas pelo Anjo (Ana Carolina) e Concierge (Flávio Lopes).
* **Esteira de Auditoria de Entregas (`/painel/auditoria`):** 
  * Organização em **Abas Semânticas W3C WAI-ARIA** (`Aguardando Avaliação` e `Histórico Avaliado`).
  * Barra de filtros operacionais: busca por perito/módulo, filtro por módulo, filtro de decisões e priorização rápida de *Dúvidas de Call* e *Relatos de Trava*.
  * Parecer técnico com aprovação direta ou solicitação de ajuste com justificativa obrigatória.
* **Painel da Turma & Semáforo 360 (`/painel/turma`):** Monitoramento semanal com alerta prioritário para peritos no semáforo vermelho por 2 semanas consecutivas e acionamento de **Resgate no WhatsApp**.
* **Central de Cadastros (CRUD Administrativo):**
  * Gestão completa de Alunos/Mentorados (`/admin/alunos`).
  * Gestão e lotação de Turmas (`/admin/turmas`).

---

## 🎨 Sistema de Design & Acessibilidade

* **Estética Cohere Enterprise 2026:** Ausência de clichês visuais de protótipo de IA (zero emojis coloridos na interface, molduras hairline de 1px, tipografia mono tabular para números e dados monetários, e paleta Deep Green `#003c33`).
* **Ícones Vetoriais Monoline SVG:** Conjunto próprio de ícones institucionais em `src/components/ui/Icons.tsx`.
* **Indicadores de Estado:** Componente `<StatusDot />` com variantes verde, amarelo, vermelho, azul e neutro.
* **Abas Acessíveis (`<Tabs />`):** Conformidade estrita com W3C WAI-ARIA, NN/g e Carbon Design System, incluindo navegação por teclado com *roving tabindex* (setas, Home, End) e scroll horizontal responsivo no mobile.

---

## 🚀 Como Executar

### Pré-requisitos
* Node.js 18+ ou 20+
* npm

### Instalação e Execução
```bash
# Instalar dependências
npm install

# Iniciar em modo de desenvolvimento
npm run dev

# Executar suíte de testes automatizados (15 suítes / 41 testes)
npm test

# Verificação estática de tipos TypeScript
npm run typecheck
```

---

## 🧪 Testes Automatizados

O sistema conta com **15 suítes de testes automatizados com Vitest** cobrindo regras de negócio, semáforo de risco, auditoria, liberação de módulos, faturamento em ZIP, acessibilidade de abas e rotas:

```text
 ✓ tests/navigation.test.ts
 ✓ tests/db-schema.test.ts
 ✓ tests/checkin-modular.test.ts
 ✓ tests/crud-alunos.test.ts
 ✓ tests/auditoria-filtros.test.ts
 ✓ tests/liberacao-modulos.test.ts
 ✓ tests/auditoria-entregas.test.ts
 ✓ tests/semaforo-resgate.test.ts
 ✓ tests/design-tokens.test.ts
 ✓ tests/auth-roles.test.ts
 ✓ tests/canais.test.ts
 ✓ tests/faturamento-zip.test.ts
 ✓ tests/kpis.test.ts
 ✓ tests/tabs-accessibility.test.ts
 ✓ tests/aluno-dashboard.test.ts
```
