# Handoff Architect → Dev — A1+A3 pdf-lib

**De:** Aria (@architect) — 17/09/2026
**Para:** Dex (@dev)
**Base:** `docs/stories/v3-A1-backend-export.md`, `v3-A3-layout-pdf.md`, validação EPIC A+B

## Liberado
- A1: `GET /api/auditoria/export` com `exigirSessao` + `canAudit` + `podeAcessarMatricula`, timeline server-side, log `audit_exports`, retorna `application/pdf`
- A3: helper puro `src/lib/pdf/auditoria-pdf.ts` com `pdf-lib`, header/timeline/paginação, teste `%PDF`

## Restrições
- Sem print CSS, sem Chromium/Puppeteer; `pdf-lib` só na rota
- `gerado_por` da sessão; sem CPF/WhatsApp no PDF
- 50 itens <5s; `npm test` + typecheck + `db lint` verdes
- Seguir padrão `/api/chamadas` + RLS `eh_equipe`

## Último comando
`analyze-project-structure` A+B aprovados
