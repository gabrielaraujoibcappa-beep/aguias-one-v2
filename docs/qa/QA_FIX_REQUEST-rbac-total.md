# QA Fix Request: rbac-total

**Generated:** 2026-09-18
**QA Report Source:** docs/qa/plano-rbac-total.md (## Falhas registradas: FALHA-001, FALHA-002)
**Reviewer:** Quinn (Test Architect)

---

## Instructions for @dev

Fix ONLY the issues listed below. Do not add features or refactor unrelated code.

**Process:**

1. Read each issue carefully
2. Fix the specific problem described
3. Verify using the verification steps provided
4. Mark the issue as fixed in this document
5. Run all tests before marking complete

---

## Summary

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 1 | Must fix before merge |
| MAJOR | 2 | Should fix before merge |
| MINOR | 0 | Optional improvements |

---

## Issues to Fix

### 1. [MAJOR] Papel `resgate` ausente no select de criação (FALHA-001)

**Issue ID:** FIX-RBAC-001

**Location:** `src/components/admin/ModalAluno.tsx:454-458`

**Problem:**

```tsx
<option value="mentorado">Mentorado (Perito)</option>
<option value="concierge">Concierge da Turma</option>
<option value="anjo">Anjo & Auditoria</option>
<option value="mentor">Mentor / Coordenação</option>
<option value="admin">Administrador Geral</option>
```

O `select` não oferece `resgate`, embora `POST /api/admin/usuarios` aceite `resgate` desde a v2.1.0. Conta resgate só sai via API direta.

**Expected:**

```tsx
<option value="mentorado">Mentorado (Perito)</option>
<option value="concierge">Concierge da Turma</option>
<option value="anjo">Anjo & Auditoria</option>
<option value="mentor">Mentor / Coordenação</option>
<option value="admin">Administrador Geral</option>
<option value="resgate">Resgate de Alunos</option>
```

**Verification:**

- [ ] Abrir Gestão de Alunos como `admin` → "Novo cadastro" exibe a opção de resgate
- [ ] Criar conta `resgate` pela UI retorna sucesso com papel gravado = `resgate`
- [ ] `npm test` verde

**Status:** [x] Fixed (commit `7baaf4c`)

---

### 2. [CRITICAL] FKs de autoria sem regra de delete travam exclusão de usuário (FALHA-002)

**Issue ID:** FIX-RBAC-002

**Location:** `supabase/migrations/` (nova migração) + `src/app/api/alunos/[id]/route.ts` (DELETE)

**Problem:**

`DELETE /api/alunos/[id]` retorna **400** para qualquer usuário com rastro de auditoria, porque estas FKs para `usuarios(id)` não têm regra de delete (padrão `NO ACTION`):

```sql
modulo_liberacoes.liberado_por          -- anulável
checkins_modulo.avaliado_por            -- anulável
faturamentos.auditado_por               -- anulável
diagnostico_historico.autor_id          -- anulável
evento_sistema.ator_id                  -- anulável
anjo_nota.autor_id                      -- NOT NULL
acesso_faturamento_log.leitor_id        -- NOT NULL
```

Evidência: executor `anjo`, conta-teste some e volta; Network mostra `DELETE → 400`. O desenho previa a exclusão ("DELETE em cascata da matrícula continua possível") — as FKs de autor foram esquecidas.

**Expected:**

Nova migração:

```sql
-- 1. Colunas anuláveis: preserva auditoria sem travar o delete
ALTER TABLE public.modulo_liberacoes
  DROP CONSTRAINT IF EXISTS modulo_liberacoes_liberado_por_fkey,
  ADD CONSTRAINT modulo_liberacoes_liberado_por_fkey
  FOREIGN KEY (liberado_por) REFERENCES public.usuarios(id) ON DELETE SET NULL;
-- (repetir para checkins_modulo.avaliado_por, faturamentos.auditado_por,
--  diagnostico_historico.autor_id, evento_sistema.ator_id)
```

Para as trilhas sem `SET NULL` (`anjo_nota.autor_id`, `acesso_faturamento_log.leitor_id`, `contato_resgate.autor_id` por serem `NOT NULL`; `diagnostico_historico.autor_id` e `evento_sistema.ator_id` por serem append-only com trigger anti-`UPDATE` — anular autor seria adulteração): pré-checagem no `DELETE` retornando **409 explícito** ("possui registros de auditoria") em vez de 400 genérico — com asserções na migração no padrão do repo. Ver `20260918120000_historico_evento_sem_set_null.sql`.

**Verification:**

- [ ] Migração aplica com `supabase db push` (ou `db reset` local) sem erro nas asserções
- [ ] Criar usuário-teste, gerar evento (ex.: enviar placar), excluir → `DELETE` retorna sucesso e a conta some após o resync
- [ ] Auditoria preservada: eventos/notas do usuário excluído seguem consultáveis (autor `NULL` onde anulável)
- [ ] Conta com `anjo_nota`/`acesso_faturamento_log` retorna 409 com mensagem clara
- [ ] `npm test` verde (incluir teste de regressão do delete com rastro)

**Status:** [x] Fixed (commit `7baaf4c`; migração `20260918110000_exclusao_usuario_autoria.sql` — aplicar com `supabase db push`)

---

### 3. [MAJOR] Falha do DELETE é silenciada e a conta "volta" sem aviso (FALHA-002 associada)

**Issue ID:** FIX-RBAC-003

**Location:** `src/lib/store/sistema-store.ts` (`enviarEDepoisSincronizar`, usado por `excluirAluno`)

**Problem:**

```ts
fetch(url, { keepalive: true, ...init, headers: { ... } })
  .catch(() => {})          // erro engolido aqui
  .finally(() => sincronizarAgora());  // resync restaura a conta sem aviso
```

Qualquer falha no `DELETE` (400/500/rede) resulta em conta restaurada em silêncio — o executor acredita que excluiu.

**Expected:**

Usar o `enviarComResultado` (já existe no mesmo arquivo) no caminho de exclusão e notificar via `notificar(..., { tom: "erro" })` quando `sucesso === false`, mantendo o registro local para nova tentativa — nunca restaurar em silêncio.

**Verification:**

- [ ] Simular `DELETE → 400` (ex.: conta com rastro antes da migração do item 2): toast de erro visível, conta mantida na lista com indicação
- [ ] `DELETE → sucesso`: comportamento atual preservado (some após a janela Desfazer)
- [ ] `npm test` verde

**Status:** [x] Fixed (commit `7baaf4c`)

---

## Fix Results (dev, 18/09/2026, commit `7baaf4c`)

- `npm run typecheck` verde; `npm test` verde (63 arquivos / 343 testes, 4 novos em `tests/exclusao-usuario.test.ts`: 409 com nota, 409 com log, sucesso, 404)
- Verificações automatizáveis concluídas; verificações manuais (UI resgate, toast de erro, migração aplicada) ficam para o re-review em produção
- Migração pendente de aplicação no remoto: `20260918110000_exclusao_usuario_autoria.sql`

---

## Constraints

**CRITICAL: @dev must follow these constraints:**

- [ ] Fix ONLY the issues listed above
- [ ] Do NOT add new features
- [ ] Do NOT refactor unrelated code
- [ ] Run all tests before marking complete: `npm test`
- [ ] No lint script in this repo (skipped by pre-push gate); run type check: `npm run typecheck`
- [ ] New migration must include assertions in the repo pattern and RLS FORCE untouched

---

## After Fixing

1. Mark each issue as fixed in this document
2. Re-run CT-HT-RBAC-008 in **produção** (a reprodução foi em local) + CT-HT-RBAC-002 para o papel `resgate`
3. Request QA re-review: `@qa *review rbac-total`

---

_Generated by Quinn (Test Architect) - AIOX QA System_
