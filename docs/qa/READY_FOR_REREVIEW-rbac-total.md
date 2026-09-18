# Ready for QA Re-Review

**Item:** rbac-total (plano docs/qa/plano-rbac-total.md)
**Fixed By:** @dev
**Timestamp:** 2026-09-18
**Commit:** `7baaf4c`

## Issues Fixed

- [x] FIX-RBAC-001 (MAJOR): opção `resgate` no select de criação
- [x] FIX-RBAC-002 (CRITICAL): migração `SET NULL` + 409 para auditoria NOT NULL
- [x] FIX-RBAC-003 (MAJOR): erro do DELETE notifica, sem restore silencioso

## Verification Results

- ✅ `npm run typecheck` verde
- ✅ `npm test` verde (63 arquivos / 343 testes)
- ✅ Teste de regressão do delete com rastro (`tests/exclusao-usuario.test.ts`)
- ⏳ Aplicar migração no remoto (`supabase db push`) antes do re-teste em produção
- ⏳ Re-run CT-HT-RBAC-008 em produção + CT-HT-RBAC-002 para o papel `resgate`

---

**Next Step:** @qa re-review
