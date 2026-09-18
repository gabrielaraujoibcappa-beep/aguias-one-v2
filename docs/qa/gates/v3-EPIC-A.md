# QA Gate — v3 EPIC-A (A1-A4) + B1

**Verdito:** PASS (re-gate 17/09/2026 16:30 — fixes 1-2 verificados)
**Antes:** CONCERNS. Nota: `ENTREGAS_MOCK`/`ALUNOS_SEMAFORO_MOCK` removidos pela sessão paralela (fora deste gate); `filtrarEntregasAuditoria` intacto, suite verde confirma.

## Re-verificação fixes
1. Matrícula na entrega ✅ — `matriculaId` em `EntregaPendente` + mappers + API pendentes; página usa `entrega.matriculaId` com fallback nome; teste mapper verde.
2. Anjo alinhado ✅ — botão e rota em `isStaff` (leitura equipe); parecer segue `canAudit`; testes atualizados.
- Evidência: 52 suítes / 265 testes verdes, `tsc --noEmit` limpo (16:29).
**Escopo revisado:** A1 route + A3 pdf-lib helper + A2 botão + A4 testes + B1 regra. B2/B3/D/C só draft, fora do gate.

## Traceabilidade (Given-When-Then)
- A1: Given sessão equipe ou mentorado dono, When GET export com matriculaId, Then PDF cronológico + log audit_exports; Given sem permissão, Then 403 sem vazar PII. Coberto por auditoria-export (ordenação/filtros/buffer) + export-lgpd (isolamento).
- A2: Given papel canAudit, When clica, Then download blob; Given anjo/mentorado, Then sem botão. Coberto por botao-export-dossie (querystring + gate).
- A3: Given 50 itens, When gera, Then %PDF válido <5s. Coberto.
- B1: Given amarela + gatilho, When avalia, Then motivos; Given verde/vermelha, Then sem alerta; resgate intacto. Coberto por atencao-precoce (3 testes).
- Evidência: 52 suítes / 264 testes verdes, `tsc --noEmit` limpo (16:20).

## Riscos (prob x impacto)
1. Lookup matrícula por nome na auditoria (médio x médio) — homônimos omitem botão ou cruzam dossiê. Mitigar: incluir `matriculaId` em `EntregaPendente`.
2. Anjo: rota permite (equipe) mas botão esconde (canAudit) (baixo x médio) — alinhar decisão produto.
3. Migration `audit_exports` ainda não aplicada (baixo x médio) — log é best-effort; aplicar + `supabase db lint` antes prod.
4. `pdf-lib` +1 dep (baixo x baixo) — isolada na rota, ok.

## NFRs
- Segurança: exigirSessao + podeAcessarMatricula + RLS equipe; PDF sem CPF/WhatsApp; erro genérico. OK com concerns 1-2.
- Performance: 50 itens <5s testado; limite 200/consulta; sem Chromium. OK.
- Confiabilidade: sem print CSS; fonte padrão; paginação. OK.
- Acessibilidade: botão `aria-live`, erro `role=alert`, sem Tailwind, padrão btn-*. OK.

## Dívidas / follow-ups
- [ ] B2 ainda sem UI fila (regra pronta, sem consumo)
- [ ] Manual: 1 export real + lint migration
- [ ] CodeRabbit pre-commit não executado (ambiente Windows/WSL) — rodar antes merge

## Decisão
CONCERNS — merge liberado após alinhar itens 1-2 ou registrá-los como dívida no PR. @dev aplica fixes via `*apply-qa-fixes`.
