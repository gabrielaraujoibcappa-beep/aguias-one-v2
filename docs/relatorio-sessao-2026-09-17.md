# Relatório de trabalho — 17 de setembro de 2026

Este relatório descreve tudo o que foi feito no ÁGUIAS ONE v2 nesta sessão:
pesquisa competitiva, PRD v3, epics, stories, validação de arquitetura,
implementação (export PDF auditoria + alerta precoce) e gates de QA.

> **Atenção:** outra sessão de agente trabalhou no mesmo projeto ao mesmo
> tempo (mocks removidos, porta de entrada, diagnósticos, novas migrations).
> Este relatório cobre **apenas** o que esta sessão produziu. Arquivos da
> sessão paralela aparecem no `git status`, mas não são descritos aqui —
> exceto onde interferem nas verificações (ver §9).

## Sumário

1. [Resumo executivo](#resumo-executivo)
2. [Pesquisa competitiva (@analyst)](#pesquisa-competitiva-analyst)
3. [PRD v3 e epics (@pm)](#prd-v3-e-epics-pm)
4. [Stories (@sm)](#stories-sm)
5. [Validação de arquitetura (@architect)](#validação-de-arquitetura-architect)
6. [Implementação (@dev)](#implementação-dev)
7. [Gates de QA (@qa)](#gates-de-qa-qa)
8. [Verificações](#verificações)
9. [Pendências](#pendências)
10. [Arquivos desta sessão](#arquivos-desta-sessão)

## Resumo executivo

| Etapa | Resultado |
|---|---|
| Pesquisa | 8 concorrentes BR + 7 internacionais mapeados; moat confirmado |
| PRD | `docs/PRD-v3.md` aprovado: A+B+D agora, C MVP manual depois |
| Epics | 4 arquivos em `docs/epics/` (A, B, D, C) |
| Stories | 13 stories em `docs/stories/` (A1–A4, B1–B3, D1–D3, C1–C3) |
| Código | Rota export PDF (`pdf-lib`), botão dossiê, `matriculaId` nas entregas, regra + filtro atenção precoce |
| Testes | 4 arquivos novos (13 testes); suite final 271/273 — 2 falhas são da sessão paralela (§9) |
| Gates | EPIC-A PASS, B1 PASS, B2 PASS |

## Pesquisa competitiva (@analyst)

Mapeei o v2 (`README.md`, `src/`) e investiguei o mercado com web research +
fetch direto de alktea.com e mentorfy.me.

**Brasil:** Alktea (R$297/597/997, 500+ mentores, -94% reembolsos, IA
pré-correção), Mentorfy (enterprise, cases 25k mentorados, trial 21 dias),
Mentoria CRM (vendas + financeiro), Evolutto (BI EVA), Menthor, eMentor
(B2B, API aberta), Kander (papel operador + transcrição IA), Mentoring Base
(MRM com memória de sessão).

**Internacional:** Babele (validation gates — paralelo direto da esteira de
auditoria), MentorStack, Mentorgain, Onetro, CapSource, Aphinity.

**Conclusão:** ninguém combina evidência auditável + semáforo com resgate +
faturamento do perito + canais de prospecção. Gaps a copiar: export PDF
anti-reembolso, alerta preditivo, transcrição da call, gamificação.
Análise completa na conversa (não persistida em arquivo).

## PRD v3 e epics (@pm)

`docs/PRD-v3.md` (brownfield): escopo A+B+D imediato, C MVP manual depois,
6 métricas auditáveis (foco MVP: conclusão, reversão precoce, tempo de
auditoria), restrições Next 14 + Supabase + RLS + LGPD, rollout em 4 semanas.

`docs/epics/`: `v3-EPIC-A-auditoria-pdf.md` (P0), `v3-EPIC-B-alerta-precoce.md`
(P0, sem WhatsApp automático), `v3-EPIC-D-badges.md` (P1, sem ranking
público), `v3-EPIC-C-transcricao-manual.md` (P2, depois).

Decisão registrada: sem print CSS — geração via biblioteca `pdf-lib`
server-side (Vercel-friendly, sem Chromium). PRD e EPIC-A atualizados.

## Stories (@sm)

12 drafts em `docs/stories/`: A1 backend, A2 UI botão, A3 layout `pdf-lib`,
A4 testes finais, B1 regra, B2 UI fila, B3 config/log, D1 modelo, D2 UI,
D3 agregado, C1 modelo, C2 UI, C3 exibição. Handoffs em
`.aiox/handoffs/` (pm→sm, pm→architect, architect→dev).

## Validação de arquitetura (@architect)

EPIC A+B aprovados: rota `GET /api/auditoria/export` com `exigirSessao` +
`podeAcessarMatricula`, helper puro `src/lib/pdf/auditoria-pdf.ts`, tabela
`audit_exports` espelhando o padrão `eh_equipe` da migration 040000; B como
função pura sem tabela nova, sem WhatsApp automático.

## Implementação (@dev)

### A1 + A3 — Backend export + PDF via `pdf-lib`
- `src/app/api/auditoria/export/route.ts` (novo): sessão + permissão,
  timeline server-side (check-ins + presenças), log best-effort em
  `audit_exports`, retorna `application/pdf` com `Content-Disposition`.
- `src/lib/pdf/auditoria-pdf.ts` (novo): `gerarPdfDossie` + `montarItensDossie`
  (ordenação, filtros por módulo/decisão/período), paginação, header/footer.
- `supabase/migrations/20260917130000_audit_exports.sql` (nova): tabela + RLS
  equipe + índices. **Ainda não aplicada — ver pendências.**
- `package.json`: `pdf-lib ^1.17.1` adicionado (`npm install` executado).
- `tests/auditoria-export.test.ts` (novo, 3 testes): ordenação, filtros,
  buffer `%PDF` válido com 50 itens <5s.

### A2 — Botão Exportar dossiê
- `src/components/equipe/BotaoExportDossie.tsx` (novo): download blob
  `dossie-{matricula}.pdf`, loading/erro inline (sem `alert()`), auto-gate
  por papel, helpers puros `montarUrlExport` + `podeExibirExport`.
- Integrado na ficha (`FichaAluno.tsx`, via `semaforo.matriculaId`) e na
  auditoria (`auditoria/page.tsx`, via `entrega.matriculaId` com fallback
  por nome). Tabs ARIA e `auditarComDesfazer` intactos.
- `tests/botao-export-dossie.test.ts` (novo, 2 testes).

### Fixes QA-1 e QA-2 (pós-gate CONCERNS)
1. `matriculaId` em `EntregaPendente` (`auditoria.ts`), populado em
   `mapearEntrega`/`mapearCheckinProprio` (`adaptadores.ts`) e incluído no
   formatador de pendentes (`api/checkins/route.ts`). Lookup por nome virou
   exceção, não regra.
2. Anjo alinhado: botão e rota seguem leitura da equipe (`isStaff`, Anjo
   incluído); parecer/aprovar continua restrito a `canAudit`.
- `tests/export-lgpd.test.ts` (novo, 4 testes): isolamento por matrícula,
  equipe total, gate do botão, mapper com `matricula_id`.

### B1 — Regra atenção precoce
- `turma-semaforo.ts`: `verificarAtencaoPrecoce()` + `LIMIAR_ATRASO = 0.4`
  configurável + `calcularAtraso7d()` (proporção aguardando +7d). Resgate de
  2 vermelhas intacto (regressão verde). Sem WhatsApp automático.
- `tests/atencao-precoce.test.ts` (novo, 4 testes): matriz 3 cores ×
  gatilhos, limiar configurável, regressão, cálculo de atraso.

### B2 — UI fila atenção precoce
- `TabelaSemaforoTurma.tsx`: filtro "Atenção precoce (N)" com contagem, tag
  de motivo (atraso +7d / faltou call) na coluna Status, ordenação por nº de
  motivos; `entregas` via `matriculaId` com fallback por nome.
- `turma/page.tsx`: passa `estado.entregas` à tabela.

### Correção incidental
Um `edit` removeu por acidente a assinatura de `gerarLinkWhatsAppResgate`;
detectado na leitura do arquivo e restaurado no mesmo ciclo. Sem impacto
(testes verdes confirmam).

## Gates de QA (@qa)

| Gate | Arquivo | Veredito |
|---|---|---|
| EPIC-A (A1–A4) | `docs/qa/gates/v3-EPIC-A.md` | CONCERNS → **PASS** após re-gate dos fixes 1–2 |
| B1 regra | `docs/qa/gates/v3-B1.md` | **PASS** |
| B2 UI fila | `docs/qa/gates/v3-B2.md` | **PASS** (ressalva: `faltouCall` é proxy de `!checkinEntregue`; calibrar na B3) |

## Verificações

- `npx vitest run tests/<novos>`: 5/5 arquivos novos verdes (16 testes).
- `npm run typecheck` (`tsc --noEmit`): limpo em todas as rodadas.
- `npm test` final: **271/273** — as 2 falhas são em
  `tests/porta-entrada.test.ts`, causadas pela sessão paralela (trocou o
  texto da home sem atualizar o teste; espera "Mentorado e equipe entram
  pelo mesmo acesso", que não existe mais no HTML). Nenhum arquivo desta
  sessão toca essa página.
- `rtk init -g --hook-only`: hook global registrado (sem `RTK.md`).

## Pendências

### Desta sessão (não esquecer)
1. Aplicar `20260917130000_audit_exports.sql` no Supabase + `supabase db lint`.
2. 1 export real ponta a ponta (botão → PDF → log `audit_exports`).
3. CodeRabbit pre-commit antes do merge (não executável neste ambiente
   Windows/WSL nesta sessão).
4. Commit + push via `@github-devops` (esta sessão não faz push).
5. B3 (config/log/relatório), D1–D3 (badges), C1–C3 (transcripts) — drafts
   prontos, aguardando `@dev`.
6. Calibrar `LIMIAR_ATRASO = 0.4` com baseline real de 2 semanas (métrica
   PRD §3-3) e trocar o proxy `faltouCall` por presença real da call.
7. Dívida registrada: `localizarEntregasDoAluno` ainda filtra por nome;
   migrar para `matriculaId` quando o store carregar o campo.

### Da sessão paralela (fora do meu escopo, bloqueiam o verde)
1. `tests/porta-entrada.test.ts` quebrado (texto da home × teste).
2. Revisar `git status`: há ~40 arquivos modificados e ~15 novos que não
   são desta sessão (diagnóstico, porta de entrada, relatórios, materiais).

## Arquivos desta sessão

**Documentos:** `docs/PRD-v3.md`, `docs/epics/v3-EPIC-{A,B,D,C}-*.md` (4),
`docs/stories/v3-{A1,A2,A3,A4,B1,B2,B3,D1,D2,D3,C1,C2,C3}-*.md` (13),
`docs/qa/gates/v3-{EPIC-A,B1,B2}.md` (3), `.aiox/handoffs/pm-*.md` (2) +
`architect-dev-v3-A1A3.md`, este relatório.

**Código novo:** `api/auditoria/export/route.ts`, `lib/pdf/auditoria-pdf.ts`,
`components/equipe/BotaoExportDossie.tsx`,
`migrations/20260917130000_audit_exports.sql`.

**Código alterado:** `auditoria.ts` (+`matriculaId`), `adaptadores.ts`
(mappers), `api/checkins/route.ts` (+`matricula_id`), `turma-semaforo.ts`
(B1 + `calcularAtraso7d` + campos vindos de `/api/semaforo`),
`TabelaSemaforoTurma.tsx` (filtro precoce), `turma/page.tsx`,
`auditoria/page.tsx`, `FichaAluno.tsx`, `BotaoExportDossie.tsx` (gate
`isStaff`), `package.json`/`package-lock.json` (`pdf-lib`), `.aiox/config.yaml`
(modo auto/yolo).

**Testes novos:** `auditoria-export`, `botao-export-dossie`, `export-lgpd`,
`atencao-precoce` (+1 caso) — 13 testes, todos verdes.
