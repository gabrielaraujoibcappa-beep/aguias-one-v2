# Relatório de trabalho — 16 de setembro de 2026

Este relatório descreve tudo o que foi feito no ÁGUIAS ONE v2 nesta sessão:
frontend, funcionalidades, autenticação, e-mail, banco de dados e ambiente.
Cada seção informa o problema encontrado, a solução aplicada e como ela foi
verificada.

> **Atenção:** outra sessão de agente trabalhou no mesmo projeto ao mesmo
> tempo. Quando uma mudança não é desta sessão, o texto indica isso.

## Sumário

1. [Resumo executivo](#resumo-executivo)
2. [Chamadas e relatórios: frontend](#chamadas-e-relatórios-frontend)
3. [Chamadas e relatórios: funcionalidades](#chamadas-e-relatórios-funcionalidades)
4. [Autenticação e autorização](#autenticação-e-autorização)
5. [Sincronização do store](#sincronização-do-store)
6. [Deploy na Vercel](#deploy-na-vercel)
7. [E-mail com Resend](#e-mail-com-resend)
8. [Link mágico e e-mails do Supabase Auth](#link-mágico-e-e-mails-do-supabase-auth)
9. [Banco de dados](#banco-de-dados)
10. [Usuários e papéis](#usuários-e-papéis)
11. [Bug do cadastro saindo como aluno](#bug-do-cadastro-saindo-como-aluno)
12. [Ambiente de desenvolvimento](#ambiente-de-desenvolvimento)
13. [Commits](#commits)
14. [Verificações](#verificações)
15. [Pendências](#pendências)

## Resumo executivo

| Área | Antes | Depois |
|---|---|---|
| Chamadas e relatórios | Telas sem estilo e sem dados | Telas no design system, com dados reais |
| Autenticação | Login sem senha; papel em cookie editável | Supabase Auth; papel lido do banco |
| APIs `/api/*` | 19 rotas abertas, com a service role | Todas exigem sessão e papel |
| E-mail | Envio simulado | Envio real pela Resend |
| Link mágico | Inexistente | Enviado pela Resend como "Aguias One" |
| Banco | Esquema v1 e v2 misturados | Só a v2: 13 tabelas, RLS reforçado |
| Cadastro | Editar alguém da equipe o transformava em aluno | Corrigido, com regra no banco |

## Chamadas e relatórios: frontend

As páginas `/admin/chamadas`, `/admin/relatorios`,
`/admin/relatorios/lista-geral` e `/admin/relatorios/presencas` usavam classes
do Tailwind. O projeto não usa Tailwind, então as telas apareciam sem estilo.

O que foi feito:

- As quatro páginas foram reescritas com os padrões do projeto: `.card`,
  `btn-*`, tokens CSS e o componente `Tabs`.
- Os estilos novos estão em `src/app/globals.css`, com os prefixos `adm-` e
  `rel-`.
- Os ícones `IconPlus`, `IconPrinter` e `IconClock` foram criados. Antes, o
  código reaproveitava outros ícones com nomes trocados.
- Os `<Button>` dentro de `<Link>` (HTML inválido) viraram links com a
  aparência de botão.
- As páginas que usam `useSearchParams` ganharam `<Suspense>`. Sem ele, o
  `next build` falha.
- A impressão esconde a sidebar, os breadcrumbs e o rodapé. O relatório de
  presenças sai em A4 paisagem.
- Os `alert()` viraram mensagens na própria tela. Os estados vazios passaram a
  ser tratados.
- A chamada ganhou o botão **Todos presentes** e uma contagem ao vivo.
- A frequência passou a considerar só os encontros com chamada registrada.

## Chamadas e relatórios: funcionalidades

As páginas consultavam o Supabase direto do navegador. As regras RLS
bloqueavam essas consultas, e o relatório mostrava "Nenhum aluno matriculado"
mesmo com alunos na turma.

As operações foram movidas para rotas no servidor, seguindo o padrão do
projeto:

| Rota | Função |
|---|---|
| `GET /api/chamadas?turmaId=` | Encontros, alunos e presenças da turma |
| `POST /api/chamadas` | Cria um encontro |
| `PUT /api/chamadas/[encontroId]/presencas` | Grava a chamada (upsert) |

A rota de presenças recusa matrículas de outra turma. Um teste de ponta a
ponta criou um encontro, gravou e alterou a chamada, e o registro de teste foi
apagado em seguida.

## Autenticação e autorização

### Problemas encontrados

- O login aceitava contas demo sem senha.
- O papel do usuário ficava num cookie `user-role` que o próprio navegador
  gravava, e o middleware confiava nele.
- As 19 rotas `/api/*` não verificavam quem chamava e usavam a service role,
  que ignora o RLS.
- `/api/auth/me?email=` devolvia o perfil completo de qualquer pessoa,
  incluindo CPF e WhatsApp.

### Solução

A sessão passou a ser validada no Supabase Auth, e o papel passou a ser lido
de `public.usuarios`:

| Arquivo | Papel |
|---|---|
| `src/lib/auth/sessao-core.ts` | Valida o token e busca o perfil (funciona no middleware e nas rotas) |
| `src/lib/auth/sessao-api.ts` | `exigirSessao()` e `podeAcessarMatricula()` |
| `src/lib/auth/sessao-cliente.ts` | Cookie de sessão, contas demo e `encerrarSessao()` |
| `src/components/SessaoSync.tsx` | Renova o cookie junto com o token e sincroniza nome e papel |
| `src/middleware.ts` | Exige sessão válida e manda mentorado para `/dashboard` |

Regras aplicadas às rotas:

| Grupo | Acesso |
|---|---|
| Alunos, chamadas, semáforo, e-mails, auditorias, liberação de módulos | Equipe |
| Criar ou editar contas e bloqueios | Admin e concierge; só admin muda papel |
| Check-ins, faturamentos, canais, módulos | Equipe vê tudo; mentorado vê só as próprias matrículas |
| Turmas, upload, `auth/me` | Qualquer usuário autenticado |

Outras mudanças:

- O autor de uma auditoria ou liberação vem da sessão, não do corpo da
  requisição.
- O upload aceita só os buckets `evidencias` e `comprovantes`.
- O login exige senha. O login demo sem senha só existe com
  `NODE_ENV=development`, e há teste unitário para isso.
- O menu da sidebar ganhou **Sair da conta**.

## Sincronização do store

Cada componente que usava o store disparava uma sincronização completa: eram
cerca de 35 requisições por página. Agora:

- Só uma sincronização roda por vez.
- Nada é buscado antes de `/api/auth/me` confirmar a sessão.
- O mentorado não chama rotas exclusivas da equipe.

Resultado medido no navegador: 9 requisições por página, todas com status 200.

## Deploy na Vercel

O PR #1 foi mergeado e publicado em dois projetos da Vercel
(`aguias-one-v2` e `aguias-one-v2-vz8y`). Nenhum dos dois tinha as variáveis do
Supabase. O login tentava `127.0.0.1:54321`, e todas as APIs respondiam 401.

O que foi feito:

- O usuário configurou as variáveis na Vercel. As `NEXT_PUBLIC_*` ficaram como
  "config"; a `SUPABASE_SERVICE_ROLE_KEY` ficou como "sensitive".
- Um commit novo na `main` forçou um build limpo nos dois projetos. Os dois
  deploys terminaram com sucesso.
- `src/lib/supabase/client.ts` passou a registrar um erro claro em produção
  quando essas variáveis faltam no build.
- Foi criado o arquivo `.env.vercel.local`, ignorado pelo git, com as
  variáveis para importar.

## E-mail com Resend

A rota `/api/emails/enviar` só gravava um log e não mandava nada.

- O arquivo `src/lib/email/resend.ts` envia pela API REST da Resend, sem
  dependência nova.
- A rota envia de verdade e grava no log o id da Resend, quem enviou e o
  status `enviado` ou `falha`. Em caso de erro, responde 502 com o motivo.
- O remetente é `Aguias One <nao-responda@contrateumperito.com.br>`, o único
  domínio verificado na Resend.
- As variáveis são `RESEND_API_KEY` e `EMAIL_REMETENTE`.
- O token pessoal do Supabase estava escrito no código de
  `scripts/sync-supabase-email-templates.js`. O script agora lê
  `SUPABASE_ACCESS_TOKEN` do ambiente.

Verificação: a Resend confirmou `delivered` para o endereço de teste
`delivered@resend.dev`.

## Link mágico e e-mails do Supabase Auth

### Configuração do Supabase Auth (produção)

| Item | Antes | Depois |
|---|---|---|
| SMTP | Padrão do Supabase | `smtp.resend.com`, remetente "Aguias One" |
| Limite de envio | 2 por hora | 30 por hora |
| Templates personalizados | Recusados (plano gratuito sem SMTP próprio) | Convite, redefinição de senha, link mágico e confirmação aplicados |
| URLs de retorno | Só `mentoria-one-sistema.vercel.app` | Também `localhost:3000` e os domínios da Vercel |

### Tela de login

- O botão **Receber link de acesso por e-mail** usa `signInWithOtp` com
  `shouldCreateUser: false`.
- A resposta é sempre a mesma, exista a conta ou não, para não revelar quais
  e-mails estão cadastrados.
- Um link expirado mostra uma mensagem na tela.

Verificação: o e-mail saiu pela Resend com o assunto "🔗 Seu Link de Acesso —
ÁGUIAS ONE" e status `delivered`. No navegador, o clique no link fez login e
levou a `/admin/chamadas`.

## Banco de dados

### Inventário

O banco tinha dois esquemas. A v1, já desativada, deixou 29 tabelas, 11 views,
75 funções, 12 enums, 2 jobs cron, 4 políticas de storage e um trigger em
`auth.users`. A v2 usa 13 tabelas.

### Backup

Antes de apagar qualquer coisa, um backup completo foi gerado pela CLI do
Supabase, sem Docker, em `supabase/backups/v1-legado-2026-09-16/`. A pasta
fica fora do git porque contém dados pessoais.

- `dados/*.json`: as 29 tabelas, com as contagens conferidas.
- `estrutura-restauracao.sql`: enums, tabelas, constraints, índices, funções,
  views, triggers, políticas, grants e jobs cron.

### Migrations

| Migration | Conteúdo |
|---|---|
| `20260916030000_remover_esquema_legado_v1.sql` | Remove a v1 na ordem segura: trigger em `auth.users`, jobs cron, políticas de storage, views, tabelas, funções e enums. Confere no fim que a v2 continua intacta. |
| `20260916040000_endurecer_rls_v2.sql` | Políticas só para `authenticated`; escrita direta só da equipe; `eh_equipe` com `search_path` fixo e sem execução por `anon` |
| `20260916050000_matricula_somente_mentorado.sql` | Remove as matrículas da equipe; trigger exige papel `mentorado` na matrícula; nome e e-mail normalizados |

A remoção da v1 tinha um risco sério. O trigger `trg_vincular_aluno_ao_login`
disparava em todo login. Se as tabelas saíssem antes dele, nenhum login
funcionaria. Uma checagem em `pg_depend` confirmou que nenhum objeto da v2
dependia da v1.

A migration `040000` fechou uma falha: um aluno podia aprovar o próprio
check-in ou lançar faturamento já aprovado usando a chave anon.

### Estado final

| Verificação | Resultado |
|---|---|
| Tabelas em `public` | 13, todas da v2 e todas com RLS |
| Políticas RLS | 18, nenhuma liberada para `public` |
| Enums, jobs cron e funções da v1 | 0 |
| Lint (`supabase db lint`) | Sem erros |
| Advisors | 2 avisos, os dois esperados (ver [Pendências](#pendências)) |

## Usuários e papéis

Depois que o usuário apagou todas as contas, ninguém conseguia entrar: havia um
login e nenhum perfil em `usuarios`.

- Foi criado o perfil **admin** de Gabriel Augusto Alves Araújo, ligado ao
  login `gabrielalves6p@gmail.com`.
- Flávio Lopes (concierge) e Ana Carolina (anjo) foram recriados pelo
  usuário. Os dois tinham ganhado matrícula como alunos por causa do bug
  descrito na próxima seção, e as matrículas foram removidas.

Estado atual:

| Nome | Papel |
|---|---|
| Gabriel Augusto Alves Araújo | admin |
| Flávio Lopes | concierge |
| Ana Carolina | anjo |

A outra sessão criou `apenasMentorados()` e `separarPorPapel()`, que
tiram a equipe das listas de metas, faturamento, semáforo, chamada e
presenças.

## Bug do cadastro saindo como aluno

### Causa

Em `/admin/alunos`, o `ModalAluno` ficava sempre montado e só escondia o
conteúdo. O React lê o valor inicial de `useState` apenas na primeira
montagem, quando não há ninguém em edição, e o papel começava como
`"mentorado"`. Ao editar alguém da equipe, o formulário salvava `mentorado`, e
a pessoa virava aluno.

### Correção

- O modal passou a ser montado só quando abre, com uma `key` por registro.
- As APIs de cadastro e edição só criam ou alteram matrícula de mentorado.
- `PATCH /api/alunos/[id]` bloqueava o concierge em qualquer edição, porque o
  formulário reenvia o papel. Agora só bloqueia quando o papel muda.
- O banco recusa matrícula de quem não é mentorado (migration `050000`).
- Um teste de regressão garante que a edição abre com o papel da pessoa.

## Ambiente de desenvolvimento

| Problema | Causa | Solução |
|---|---|---|
| Arquivos `/_next/static/*` com 404 ou 503 | `next build` rodando com o servidor de desenvolvimento aberto, na mesma pasta `.next` | `distDir` separado em `next.config.mjs`: desenvolvimento usa `.next-dev` |
| Erro 500 "Cannot find the middleware module" | Dois `next dev` ao mesmo tempo (portas 3000 e 3001) | Servidor da porta 3000 encerrado. Rode um servidor por vez. |
| Aviso de hidratação com `__processed_*` e `data-lt-installed` | Extensões do navegador alteram o HTML | `suppressHydrationWarning` em `<html>` e `<body>` |
| Falha "unable to write new index file" num commit | Dropbox sincronizando a pasta `.git` | Nenhum dado perdido. Exclua `.git` da sincronização. |

## Commits

| Commit | Descrição |
|---|---|
| `b547f5d` | Módulo de chamadas e central de relatórios |
| `441933b` | Autenticação real e autorização nas APIs |
| `1a77d35` | Merge do PR #1 (feito pelo usuário) |
| `fd604aa` | Sincronização única do store e aviso de configuração do Supabase |
| `33c89af` | Chamadas com turmas reais (outra sessão) |
| `ffe42eb` | Resend e link mágico, com commit feito pela outra sessão |
| `099a6fb` | Migrations do banco e regra do `.gitignore` para backups |
| `f1c2d29` | Listas por papel, relatórios financeiros e correção do cadastro |

A correção do cadastro estava planejada para um commit próprio. A falha de
índice do git fez os arquivos entrarem no `f1c2d29`.

## Verificações

- Typecheck (`tsc --noEmit`): sem erros.
- Testes (Vitest): 147 passando em 36 arquivos. Novos testes:
  `sessao-core.test.ts`, `resend.test.ts` e a regressão em
  `criacao-usuario.test.ts`.
- Autorização testada com curl: sem sessão, cookie forjado, JWT adulterado,
  mentorado, admin e concierge.
- Sessões reais testadas com links mágicos gerados pela API admin.
- Migrations testadas antes com `BEGIN … ROLLBACK`.

## Pendências

### Segurança

1. Revogue o `SUPABASE_ACCESS_TOKEN` pessoal. Ele foi colado na conversa e
   está no histórico do git (commit `34c3b52`, repositório privado).
2. Gere uma chave da Resend do tipo "Sending access" e revogue a atual, que
   tem acesso total e foi colada na conversa. Atualize a chave nova no
   `.env.local`, na Vercel e no SMTP do Supabase Auth.
3. Troque a senha padrão `Aguia@2026`. Ela aparece em testes e em dados de
   exemplo de e-mail.
4. Adicione `RESEND_API_KEY` (sensitive) e `EMAIL_REMETENTE` nos dois
   projetos da Vercel.
5. Apague `.env.vercel.local` quando terminar a configuração da Vercel.

### Dados

1. Confirme o WhatsApp de Ana Carolina. O número `62 8453-9035` tem dígitos a
   menos.
2. Os botões de demonstração do modo de desenvolvimento apontam para contas
   que já não existem.
3. Revise os logins órfãos no Supabase Auth: contas de teste da v1 sem perfil
   na v2.

### Configuração

1. Confirme o domínio definitivo de produção. O `site_url` do Supabase Auth
   ainda é `mentoria-one-sistema.vercel.app`.
2. Avalie se o projeto `aguias-one-v2-vz8y` na Vercel é necessário. Ele
   duplica o deploy.
3. Para usar um domínio da marca como remetente, verifique esse domínio na
   Resend e atualize `EMAIL_REMETENTE`.
4. Opcional: ative a proteção contra senhas vazadas (Supabase Pro).

### Avisos do advisor que não precisam de ação

- `authenticated` executa `eh_equipe`: é intencional, porque as políticas RLS
  chamam essa função.
- Proteção contra senhas vazadas desativada: depende do plano pago do
  Supabase.
