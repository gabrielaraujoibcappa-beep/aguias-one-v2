# Plano de QA — RBAC total da equipe

## Contexto Track
- Projeto: Águias ONE v2
- Release: v2.1.0 (`776623c`, tag `v2.1.0`)
- Feature: liberação de gestão para `admin, concierge, mentor, anjo`
- Status: Pronta para QA
- Ambiente: produção — `https://mentoria.one.axelpro.com.br`
- Versão testável: tag `v2.1.0`

## Objetivo do plano
Produzir confiança de que os 4 papéis criam e gerenciam cadastros (mentorado + equipe) em qualquer turma, e de que `mentorado`/`resgate` seguem negados — sem expor dados nem deixar resíduos em produção.

## Escopo
Inclui:
- RF-001 — Criar mentorado vinculado a qualquer turma (4 papéis)
- RF-002 — Criar conta da equipe (`admin, concierge, anjo, mentor, resgate`) pelos 4 papéis, sem trava admin-only
- RF-003 — Negação: `mentorado` e `resgate` não criam contas nem acessam gestão
- RF-004 — Editar/remover cadastro de aluno pelos 4 papéis
- RF-005 — Regressão: turmas, bloqueios e auditoria de faturamento seguem restritos aos 4 papéis

Não inclui:
- Fluxos do aluno (check-in, canais, faturamento como mentorado) — fora do escopo desta feature
- Plano do anjo (regra própria: escrita só do anjo)

## Perfis necessários
- `concierge`, `mentor`, `anjo` (execução dos CTs felizes — um de cada)
- `mentorado` (CTs de negação)
- `resgate` (CT de redirecionamento)
- `admin` (apoio e limpeza)

## Dados de teste
- 1 conta mentorado-teste + 1 conta equipe-teste (e-mails controlados `+qa`, removidas ao final via CT-008)
- 2 turmas distintas existentes (para "qualquer turma")
- Restauração: exclusão definitiva dos testes (janela Desfazer observada e expirada antes de encerrar)

## Riscos e dependências
- Produção: criação dispara e-mail real de boas-vindas e cria login Auth — usar inbox controlada; nunca reutilizar e-mail real — impacto: imagem/ruído
- DELETE em cascata é irreversível após a janela Desfazer — executar CT-007 por último — impacto: perda de dados de teste (aceitável)

## Cobertura
- RF-001 → CT-HT-RBAC-001, CT-HT-RBAC-003
- RF-002 → CT-HT-RBAC-002, CT-HT-RBAC-006
- RF-003 → CT-HT-RBAC-004, CT-HT-RBAC-005
- RF-004 → CT-HT-RBAC-007, CT-HT-RBAC-008
- RF-005 → CT-HT-RBAC-009

## Casos de teste
- CT-HT-RBAC-001 — Concierge cria mentorado com turma
- CT-HT-RBAC-002 — Mentor cria conta da equipe (anjo)
- CT-HT-RBAC-003 — Anjo cria mentorado em qualquer turma
- CT-HT-RBAC-004 — Mentorado não cria conta (403, nada criado)
- CT-HT-RBAC-005 — Resgate é redirecionado para /resgate
- CT-HT-RBAC-006 — E-mail duplicado retorna 409 sem login órfão
- CT-HT-RBAC-007 — Anjo edita cadastro e persiste após reload
- CT-HT-RBAC-008 — Excluir as contas-teste (limpeza)
- CT-HT-RBAC-009 — Mentorado é negado em turmas e bloqueios (regressão)

## Critério de aprovação
Todos os 9 CTs passaram, contas-teste removidas, nenhuma evidência com dado sensível, zero falhas abertas.

## Falhas registradas

### FALHA-001 — Sem opção de papel `resgate` na criação (CONFIRMADA NO CÓDIGO)
- CT relacionado: CT-HT-RBAC-002 (RF-002)
- Resumo: o select "Papel no Sistema" do `ModalAluno` (`src/components/admin/ModalAluno.tsx:454-458`) lista só mentorado/concierge/anjo/mentor/admin — sem `resgate`, embora a API (`POST /api/admin/usuarios`) aceite `resgate` desde a v2.1.0.
- Esperado: poder criar conta `resgate` pela interface, como aprovado ("pode editar tudo").
- Observado: opção inexistente; criação de resgate só via API direta.
- Ambiente e versão: produção v2.1.0 (`776623c`)
- Perfil e dados: qualquer dos 4 papéis de gestão
- Impacto: RF-002 parcialmente não atendido na UI; conta resgate (Adelayne) não pode ser criada pelo fluxo normal
- Correção sugerida: adicionar `<option value="resgate">` no select de papel do `ModalAluno`
- Status: ABERTA — devolução ao desenvolvimento

### FALHA-002 — Conta reaparece após exclusão (EM REPRODUÇÃO)
- CT relacionado: CT-HT-RBAC-008 (RF-004)
- Resumo: conta excluída voltou a aparecer na lista.
- Esperado: após expirar o "Desfazer exclusão", a conta some definitivamente.
- Observado: conta de volta na lista (relato da execução, passo 2 de 9).
- Hipóteses no código: (a) botão "Desfazer exclusão" acionado — reverte local e nada é enviado (correto por desenho); (b) falha silenciosa do `DELETE /api/alunos/[id]` — `enviarEDepoisSincronizar` engole o erro (`.catch(()=>{})`) e o resync restaura a conta sem aviso.
- Reprodução confirmada em 18/09/2026 (ambiente LOCAL, não produção — registrar desvio): toast "Cadastro excluído" apareceu; Desfazer NÃO clicado; ~10s aguardados; conta sumiu e VOLTOU. Executor: `anjo`. `DELETE /api/alunos/[id]` → **400 Bad Request**.
- Causa raiz (schema): FKs de autoria/auditoria para `usuarios(id)` sem regra de delete travam o `DELETE` — `modulo_liberacoes.liberado_por`, `checkins_modulo.avaliado_por`, `faturamentos.auditado_por`, `diagnostico_historico.autor_id`, `evento_sistema.ator_id` (anuláveis, sem `SET NULL`) e `anjo_nota.autor_id`, `acesso_faturamento_log.leitor_id` (`NOT NULL`). O desenho previa delete ("DELETE em cascata da matrícula continua possível"), mas as FKs de autor foram esquecidas.
- Defeito associado no cliente: erro do `DELETE` engolido pelo `.catch(()=>{})` + resync restaura sem aviso — falhar deve notificar, nunca restaurar em silêncio.
- Evolução 18/09/2026: `SET NULL` em `diagnostico_historico`/`evento_sistema` conflitou com o trigger append-only ("UPDATE não permitido") — revertido para `NO ACTION` (migração `20260918120000`); pré-check 409 estendido às 5 trilhas. Conta-teste com histórico/eventos agora recebe 409 com mensagem clara (comportamento correto, não falha).
- Status: EM CORREÇÃO — CT-008 bloqueado; aceite do RF-004 suspenso; reexecutar CT-008 em produção após a correção

## Observações gerais
- Proposta revisada e aprovada pelo produto; registrada para execução em 18/09/2026.
- Ordem sugerida: 004, 005, 009 (negações, sem resíduo) → 001, 002, 003, 006 (criações) → 007 (edição) → 008 (limpeza por último).

---

# CT-HT-RBAC-001 — Concierge cria mentorado com turma

## Objetivo
Provar que o concierge conclui a criação de um mentorado com matrícula ativa na turma escolhida.

## Pré-condições
- Ambiente: produção v2.1.0 | Perfil: `concierge` | Turma-alvo identificada (código anotado)

## Passos
1. Acesse Gestão de Alunos / Mentorados (`/admin/alunos`).
2. Acione "Novo mentorado".
3. Preencha nome, e-mail `+qa`, WhatsApp com DDD, senha ≥ 6 caracteres e selecione a turma-alvo.
4. Salve e observe a lista.

## Resultado esperado
- Conta aparece na lista com status ativo e turma = turma-alvo; matrícula existe (visível na ficha do aluno).

## Observações
- RF: RF-001 | Perfil: concierge | Tipo: feliz

## Execução
- Data: __/__/____ | Executor: ____ | Resultado: pendente | Evidências: ____ | Defeito: N/A

# CT-HT-RBAC-002 — Mentor cria conta da equipe (anjo)

## Objetivo
Provar que a trava "apenas administradores" deixou de existir para criação de equipe.

## Pré-condições
- Ambiente: produção v2.1.0 | Perfil: `mentor`

## Passos
1. Acesse Gestão de Alunos / Mentorados.
2. Acione "Novo cadastro" (aba Equipe).
3. Preencha os dados da conta-teste com papel `anjo`.
4. Salve e observe o retorno.

## Resultado esperado
- Conta criada sem mensagem de falta de permissão; papel gravado = `anjo`.

## Observações
- RF: RF-002 | Perfil: mentor | Tipo: feliz

## Execução
- Data: __/__/____ | Executor: ____ | Resultado: pendente | Evidências: ____ | Defeito: N/A

# CT-HT-RBAC-003 — Anjo cria mentorado em qualquer turma

## Objetivo
Provar que o anjo não está restrito às próprias turmas de atuação.

## Pré-condições
- Ambiente: produção v2.1.0 | Perfil: `anjo` | 2 turmas distintas identificadas

## Passos
1. Acesse Gestão de Alunos / Mentorados.
2. Acione "Novo mentorado" selecionando a turma onde o anjo NÃO atua.
3. Salve e abra a ficha do aluno criado.

## Resultado esperado
- Matrícula vinculada à turma escolhida (não à de atuação do anjo).

## Observações
- RF: RF-001 | Perfil: anjo | Tipo: feliz

## Execução
- Data: __/__/____ | Executor: ____ | Resultado: pendente | Evidências: ____ | Defeito: N/A

# CT-HT-RBAC-004 — Mentorado não cria conta (403, nada criado)

## Objetivo
Provar que a negação ocorre sem criar resíduo nem expor dados.

## Pré-condições
- Ambiente: produção v2.1.0 | Sessão `mentorado` (token/cookie próprio, sem credencial da equipe no ambiente)

## Passos
1. Envie `POST /api/admin/usuarios` com corpo de mentorado válido.
2. Anote o status e o corpo da resposta.
3. Busque o e-mail na Gestão de Alunos (com perfil da equipe, em sessão separada).

## Resultado esperado
- Status 403 com mensagem de permissão; e-mail-teste NÃO aparece na lista; nenhum login criado.

## Observações
- RF: RF-003 | Perfil: mentorado | Tipo: negativo/permissão

## Execução
- Data: __/__/____ | Executor: ____ | Resultado: pendente | Evidências: request/response sem token | Defeito: N/A

# CT-HT-RBAC-005 — Resgate é redirecionado para /resgate

## Objetivo
Provar que o perfil resgate não alcança telas de gestão.

## Pré-condições
- Ambiente: produção v2.1.0 | Perfil: `resgate`

## Passos
1. Acesse `/admin/alunos` logado como resgate.
2. Observe o destino final.

## Resultado esperado
- Redirecionamento para `/resgate`; nenhum dado de aluno exibido.

## Observações
- RF: RF-003 | Perfil: resgate | Tipo: permissão

## Execução
- Data: __/__/____ | Executor: ____ | Resultado: pendente | Evidências: ____ | Defeito: N/A

# CT-HT-RBAC-006 — E-mail duplicado retorna 409 sem login órfão

## Objetivo
Provar que a falha de unicidade preserva o estado (rollback total).

## Pré-condições
- Ambiente: produção v2.1.0 | Perfil: `concierge` | E-mail já cadastrado (o da conta-teste do CT-001)

## Passos
1. Tente criar novo mentorado com o mesmo e-mail.
2. Anote status e mensagem.
3. Confirme que existe apenas 1 conta com esse e-mail na Gestão.

## Resultado esperado
- Status 409 ("já existe conta"); nenhuma conta duplicada; nenhum login sem cadastro.

## Observações
- RF: RF-002 | Perfil: concierge | Tipo: negativo

## Execução
- Data: __/__/____ | Executor: ____ | Resultado: pendente | Evidências: ____ | Defeito: N/A

# CT-HT-RBAC-007 — Anjo edita cadastro e persiste após reload

## Objetivo
Provar edição de cadastro por papel não-admin com persistência.

## Pré-condições
- Ambiente: produção v2.1.0 | Perfil: `anjo` | Conta-teste do CT-001 existente

## Passos
1. Na Gestão de Alunos, edite o WhatsApp da conta-teste e salve.
2. Recarregue a página e confira o valor.

## Resultado esperado
- Telefone editado persiste após reload.

## Observações
- RF: RF-004 | Perfil: anjo | Tipo: estado/persistência

## Execução
- Data: __/__/____ | Executor: ____ | Resultado: pendente | Evidências: ____ | Defeito: N/A

# CT-HT-RBAC-008 — Excluir as contas-teste (limpeza)

## Objetivo
Deixar a base limpa, exercendo a exclusão com Desfazer.

## Pré-condições
- Ambiente: produção v2.1.0 | Perfil: `anjo` | Contas-teste do CT-001 e do CT-002 existentes

## Passos
1. Na Gestão de Alunos, acione "Excluir cadastro" na conta-teste do CT-001.
2. Confirme "Excluir aluno" e aguarde expirar o "Desfazer exclusão".
3. Busque a conta na lista.
4. Repita para a conta-teste do CT-002.

## Resultado esperado
- Após a janela, contas-teste ausentes da lista; fila de auditoria sem resíduo órfão vinculado.

## Observações
- RF: RF-004 | Perfil: anjo | Tipo: estado/limpeza

## Execução
- Data: __/__/____ | Executor: ____ | Resultado: pendente | Evidências: ____ | Defeito: N/A

# CT-HT-RBAC-009 — Mentorado é negado em turmas e bloqueios (regressão)

## Objetivo
Provar que o compartilhamento do `PAPEIS_GESTAO` não abriu gestão de turmas/bloqueios ao mentorado.

## Pré-condições
- Ambiente: produção v2.1.0 | Sessão `mentorado` (sem credencial da equipe no ambiente)

## Passos
1. Envie `POST /api/turmas` com corpo mínimo válido.
2. Anote o status.
3. Envie `POST /api/bloqueios` com corpo mínimo válido.
4. Anote o status.

## Resultado esperado
- Ambos retornam 403; nada criado em turmas nem em bloqueios.

## Observações
- RF: RF-005 | Perfil: mentorado | Tipo: permissão/regressão

## Execução
- Data: __/__/____ | Executor: ____ | Resultado: pendente | Evidências: request/response sem token | Defeito: N/A
