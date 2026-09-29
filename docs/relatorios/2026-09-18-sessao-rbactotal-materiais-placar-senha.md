# Relatório de trabalho — 18/09/2026

## Resumo
Sessão ponta a ponta no Águias ONE v2: 4 features entregues e publicadas na **release v2.1.0**, 1 ciclo completo de QA HOUS3 (plano com 9 CTs, 2 falhas encontradas, 3 correções aplicadas), 1 feature de senha commitada localmente e troubleshooting do acesso CLI ao Supabase. Suíte final: **64 arquivos / 351 testes verdes**, `tsc` e `build` limpos.

## Entregas (release v2.1.0 — tag no ar)

### 1. RBAC total da equipe
- `PAPEIS_GESTAO` e `canManageUsers` ampliados para `admin, concierge, mentor, anjo` (`sessao-api.ts`, `roles.ts`).
- Criação de equipe liberada (antes só `admin`); `resgate` incluído no allowlist da API.
- Efeito colateral consciente: turmas, bloqueios, faturamento e auditoria seguem o mesmo gate.

### 2. Materiais de Apoio & Templates (sem mock)
- Removidos os 3 itens fixos com `downloadUrl: "#"` da seção do aluno.
- Fonte real: bucket privado `materiais` (migração `20260918090000`) + `GET/DELETE /api/materiais` + página `/admin/materiais` (publicar/remover, no menu Gestão & Cadastros).
- Links externos suportados via arquivos `.url` + `POST /api/materiais`.
- Leitura pelo `/api/arquivos` (signed URL); Storage direto só da equipe.

### 3. Visão do aluno (`/painel/aluno/[id]/visao`)
- Replica as 5 seções do dashboard com dados do mentorado (helper puro `montarContextoVisaoAluno`, com teste anti-vazamento entre alunos).
- Evoluiu de somente-leitura para edição assistida: ações rápidas (cadastro, auditoria, metas, materiais) + editor inline de canais. Atalhos seguem inertes de propósito (declarar como aluno corromperia autoria — decisão registrada).

### 4. Placar com comprovantes + ZIP round-trip
- Tabela `diagnostico_comprovantes` (migração `20260918100000`, RLS FORCE) + `GET/POST/DELETE /api/diagnostico/comprovantes` (congelado só pela coordenação).
- `GET /api/diagnostico/export` gera ZIP (`placar.json` + comprovantes, limite 100 MB) via `jszip` (nova dependência).
- `POST /api/diagnostico/import` aceita o ZIP de volta (validação por assinatura, limite 50 arquivos) mantendo o JSON legado.
- Seção de comprovantes + botão "Exportar placar (.zip)" na página `/diagnostico`.

## Ciclo QA HOUS3 (RBAC)
- Plano registrado: `docs/qa/plano-rbac-total.md` (5 RFs, 9 CTs `CT-HT-RBAC-001…009`) + guia interativo `docs/qa/guia-execucao-rbac-total.html` (checklist com progresso salvo).
- Execução parcial (2 de 9): **FALHA-001** (sem opção `resgate` no `ModalAluno`) e **FALHA-002** (exclusão retornava 400 por FKs de autoria + erro silenciado com restore fantasma).
- Correções no commit `7baaf4c`: option `resgate`; migração `ON DELETE SET NULL` + 409 explícito para auditoria `NOT NULL`; erro do `DELETE` passa a notificar (teste de regressão `tests/exclusao-usuario.test.ts`).
- Ajustes pós-push: asserção de FKs com schema explícito (`f33d349`); `diagnostico_historico`/`evento_sistema` revertidos para `NO ACTION` por conflito com trigger append-only + pré-check 409 estendido (`94698ab`).
- Evidência: exclusão da aluno1 agora retorna **409 "possui registros de auditoria"** — comportamento correto (conta com histórico não se exclui; CT-008 usa conta sem rastro).

## Feature de senha (commitada local, `a32f9c6` — sem push)
- Migração `20260918130000`: `precisa_trocar_senha` (default `false`, contas existentes intactas); criação e reset marcam `true`.
- `/trocar-senha` + `POST /api/usuarios/senha`; login, middleware e `/` travam até a troca (todos os papéis).
- `POST /api/admin/usuarios/reset-senha` (4 papéis) gera temporária `AG1234AB` para repasse no WhatsApp + botão **"Resetar senha"** no cabeçalho da ficha (a um clique de toda gestão de turma).
- 7 testes novos (`tests/senha.test.ts`).

## Infra / troubleshooting
- Pushes: `a520c6b` (96 arquivos), release `v2.1.0` (`776623c` + tag + GitHub release), `7baaf4c`, `98cdad1`, `f33d349`, `94698ab`, `9846f45` — `main` sincronizada com `origin/main`.
- `supabase db pull` com 403: conta `adm` mas token sem privilégio no endpoint — orientado validar `projects list`, regenerar token e usar `db push --db-url` direto. **5 migrações aguardam aplicação no remoto.**

## Pendências
1. `supabase db push` (5 migrações) — bloqueado pelo 403 acima.
2. Push do `a32f9c6` (senha) — aguardando ordem.
3. Re-run CT-008 em **produção** (foi em local) + CT-002 de `resgate` após o deploy das correções.
4. Re-review do QA (`@qa *review rbac-total`) para aprovar o plano.
