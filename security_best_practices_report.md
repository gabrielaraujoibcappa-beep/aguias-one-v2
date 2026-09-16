# Relatório de Segurança — ÁGUIAS ONE v2

Data da análise: 16/09/2026
Escopo: todo o código em `src/`, `supabase/migrations/`, `next.config.mjs`, `package.json` e `.gitignore`.
Stack identificada: Next.js 14.2.35 (App Router, Route Handlers), React 18.3.1, TypeScript 5, Supabase (Auth, Postgres com RLS, Storage).
Referências aplicadas: especificações de segurança para Next.js, React e JavaScript de frontend.

## Resumo executivo

O sistema **não deve ser publicado com dados reais no estado atual**.

A API do backend usa a chave de administrador do Supabase (service role), que ignora todas as políticas de segurança do banco, e **14 das 15 rotas não verificam quem está chamando**. Qualquer pessoa que conheça o endereço do sistema consegue, sem login:

- ler CPF, e-mail, WhatsApp e faturamento de todos os alunos;
- criar uma conta com papel de administrador;
- promover qualquer conta a administrador;
- apagar alunos de forma definitiva, incluindo login e histórico;
- aprovar auditorias, bloquear e desbloquear acessos e sobrescrever arquivos enviados.

O login e o controle de papéis existem apenas na interface: os cookies são criados pelo próprio navegador, contas de demonstração entram com qualquer senha, e o seletor de perfil da barra lateral permite virar Admin com um clique.

O que está bem feito: segredos fora do git, políticas RLS coerentes no banco, nenhum uso de `dangerouslySetInnerHTML` ou `eval`, e versão do Next com a correção do bypass de middleware (CVE-2025-29927). O problema central é que a API contorna essas proteções.

| Severidade | Quantidade |
|---|---|
| Crítica | 4 |
| Alta | 5 |
| Média | 3 |
| Baixa | 4 |

---

## Críticas

### C-01 — API inteira sem autenticação, rodando com a chave de administrador

**Impacto:** qualquer pessoa na internet lê, altera e apaga todos os dados do sistema sem precisar de login.

- **Regra:** NEXT-AUTH-001, REACT-AUTHZ-001
- **Local:** todas as rotas abaixo importam `supabaseAdmin` e nenhuma valida sessão ou papel.

| Rota | Métodos | Arquivo |
|---|---|---|
| `/api/admin/usuarios` | POST | `src/app/api/admin/usuarios/route.ts:4` |
| `/api/alunos` | GET, POST | `src/app/api/alunos/route.ts:4`, `:62` |
| `/api/alunos/[id]` | PATCH, DELETE | `src/app/api/alunos/[id]/route.ts:8`, `:63` |
| `/api/bloqueios` | GET, POST | `src/app/api/bloqueios/route.ts:4`, `:45` |
| `/api/canais` | GET, POST | `src/app/api/canais/route.ts:5`, `:46` |
| `/api/checkins` | GET, POST | `src/app/api/checkins/route.ts:4`, `:89` |
| `/api/checkins/[id]/auditar` | PATCH | `src/app/api/checkins/[id]/auditar/route.ts:8` |
| `/api/faturamentos` | GET, POST | `src/app/api/faturamentos/route.ts:4`, `:68` |
| `/api/faturamentos/[id]/auditar` | PATCH | `src/app/api/faturamentos/[id]/auditar/route.ts:8` |
| `/api/modulos` | GET | `src/app/api/modulos/route.ts:4` |
| `/api/modulos/liberar` | POST | `src/app/api/modulos/liberar/route.ts:4` |
| `/api/semaforo` | GET | `src/app/api/semaforo/route.ts:4` |
| `/api/turmas` | GET, POST | `src/app/api/turmas/route.ts:4`, `:34` |
| `/api/upload` | POST | `src/app/api/upload/route.ts:4` |

- **Evidência:** a chave usada ignora RLS (`src/lib/supabase/admin.ts:4-9`):

```ts
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || ...
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, ...)
```

- O middleware não cobre `/api` (`src/middleware.ts:41-43`), e mesmo nas páginas ele não exige autenticação (ver A-02).
- A ação mais destrutiva é o DELETE, que apaga o usuário do Supabase Auth e, em cascata, matrícula, check-ins, faturamentos, canais e bloqueios (`src/app/api/alunos/[id]/route.ts:63-91`).

**Correção:**
1. Criar um helper de servidor, por exemplo `exigirSessao(req, papeisPermitidos)`, que:
   - lê o access token do Supabase (cabeçalho `Authorization: Bearer` ou cookie HttpOnly definido pelo servidor);
   - valida com `supabaseAdmin.auth.getUser(token)`;
   - busca o papel na tabela `usuarios` pelo `auth_id` (nunca em `user_metadata`, ver A-03);
   - devolve 401 sem sessão e 403 sem papel permitido, falhando fechado.
2. Chamar o helper no início de cada rota, com a matriz de permissões:
   - criar, editar e excluir usuário: `admin`;
   - auditar, bloquear e desbloquear: `admin`, `concierge`, `anjo`;
   - liberar módulo e criar turma: `admin`, `concierge`;
   - rotas do mentorado: somente sobre a própria matrícula (ver A-05).
3. Onde possível, trocar `supabaseAdmin` por um cliente criado com o token do usuário, para que as políticas RLS já existentes voltem a valer como segunda camada.
4. Adicionar `import "server-only"` em `src/lib/supabase/admin.ts` para impedir que a chave seja empacotada no navegador por engano.

**Mitigação imediata se já estiver publicado:** retirar o deploy do ar ou bloquear `/api/*` no provedor até o helper estar aplicado.

---

### C-02 — Qualquer pessoa cria uma conta de administrador

**Impacto:** um atacante cria para si uma conta `admin` com e-mail já confirmado e passa a controlar o sistema.

- **Regra:** NEXT-AUTH-001, NEXT-INPUT-001
- **Local:** `src/app/api/admin/usuarios/route.ts:15`, `:54-63`, `:93`; encaminhamento aberto em `src/app/api/alunos/route.ts:62-72`.
- **Evidência:** o papel vem do corpo da requisição, sem restrição, e é gravado no Auth e no banco:

```ts
papel = "mentorado",          // linha 15, valor controlado pelo chamador
email_confirm: true,          // linha 57
user_metadata: { nome, papel, whatsapp },  // linhas 58-62
papel,                        // linha 93, insert em usuarios
```

**Correção:** exigir papel `admin` (C-01), validar `papel` contra uma lista permitida no servidor, e não aceitar criação de outro `admin` sem uma confirmação explícita. Validar o corpo com esquema (zod ou equivalente).

---

### C-03 — Escalação de privilégio pela edição de cadastro

**Impacto:** qualquer pessoa altera o papel de qualquer conta, inclusive a própria, para `admin`, o que também libera o acesso às políticas RLS de equipe.

- **Regra:** NEXT-AUTH-001, NEXT-INPUT-001 (atribuição em massa)
- **Local:** `src/app/api/alunos/[id]/route.ts:12`, `:23`, `:24`
- **Evidência:**

```ts
const { nome, email, whatsapp, cpf, areaPericial, papel, status, turmaId } = body;
if (papel) updates.papel = papel;
if (status) updates.status = status;
```

- A função de RLS `eh_equipe` decide acesso de equipe exatamente por essa coluna (`supabase/migrations/20260915200000_schema_v2.sql:134-139`).

**Correção:** exigir `admin`; permitir alteração de `papel` e `status` apenas por admin e com lista permitida; montar o update a partir de uma lista explícita de campos editáveis por papel.

---

### C-04 — Vazamento de dados pessoais e financeiros e falsificação de identidade

**Impacto:** qualquer pessoa obtém CPF, contatos e faturamento de todos os alunos, o que caracteriza incidente sob a LGPD.

- **Regra:** NEXT-AUTH-001, NEXT-CACHE-001
- **Local e evidência:**
  - `GET /api/alunos` devolve todos os usuários com `cpf`, `email`, `whatsapp` e `auth_id` (`src/app/api/alunos/route.ts:12-19`, `:35-47`).
  - `GET /api/faturamentos` devolve o valor bruto mensal de todos os alunos com nome e e-mail (`src/app/api/faturamentos/route.ts:10-21`, `:33-47`).
  - `GET /api/checkins` sem filtro devolve todos os check-ins e evidências (`src/app/api/checkins/route.ts:55-83`).
  - `GET /api/bloqueios` devolve o histórico de bloqueios com motivos (`src/app/api/bloqueios/route.ts:9-39`).
  - `GET /api/auth/me?email=` aceita um e-mail qualquer na URL, responde `autenticado: true` e devolve o perfil completo com CPF (`src/app/api/auth/me/route.ts:42-48`, `:62-63`, `:83-97`):

```ts
const searchEmail = req.nextUrl.searchParams.get("email");
if (searchEmail) { email = searchEmail; }
...
return NextResponse.json({ autenticado: true, usuario: { ..., cpf: usuario.cpf, ... } });
```

**Correção:** aplicar C-01 em todas as leituras; remover o fallback por `?email=` de `/api/auth/me`; mentorado só lê a própria matrícula; devolver CPF apenas para admin; adicionar `Cache-Control: no-store` nas respostas com dados pessoais.

---

## Altas

### A-01 — Login aceita qualquer senha e cria sessão falsa

- **Regra:** NEXT-AUTH-001, NEXT-SESS-001
- **Local:** `src/app/login/page.tsx:58`, `:65-67`, `:76-80`, `:87`, `:93-95`
- **Evidência:**
  - Senha com menos de 6 caracteres pula a autenticação inteira (`:58`) e o fluxo segue logado.
  - Para e-mails da lista de contas de demonstração, erro de senha é ignorado (`:65`, `:77`), inclusive para as contas de Concierge, Anjo e Mentor.
  - Sem token real, o navegador grava um token inventado (`:95`):

```ts
document.cookie = `sb-access-token=session-active-${papelFinal}; path=/; ...`;
```

- **Impacto:** o login não autentica ninguém. Hoje isso afeta a interface; depois de C-01 corrigido, continuaria abrindo a área de equipe para quem souber um e-mail de demonstração.
- **Correção:** exigir sempre `signInWithPassword` com sucesso; remover o atalho das contas demo ou restringi-lo a `NODE_ENV === "development"` com uma variável explícita; nunca gravar token fabricado.

### A-02 — Papéis e bloqueio decididos por cookies que o próprio navegador escreve

- **Regra:** NEXT-AUTH-002, NEXT-SESS-001, REACT-AUTHZ-001
- **Local:**
  - Middleware confia em `user-role` e `acesso-bloqueado` e não exige sessão (`src/middleware.ts:19-36`).
  - Os cookies são gravados por JavaScript, sem `HttpOnly` e sem `Secure` (`src/app/login/page.tsx:91-95`; `sincronizarCookieBloqueio` e `salvarEstado` em `src/lib/store/sistema-store.ts`).
  - O papel ativo fica no `localStorage` e o seletor de perfil troca para Admin sem verificação (`src/components/Sidebar.tsx:137-152`).
- **Impacto:** um aluno bloqueado apaga o cookie `acesso-bloqueado` e volta a navegar; qualquer visitante se torna Admin na interface.
- **Correção:** a sessão deve ser um cookie `HttpOnly`, `SameSite=Lax` e `Secure` apenas em produção (com variável como `SESSION_COOKIE_SECURE` para testes em HTTP), definido pelo servidor. O middleware valida essa sessão e consulta papel e bloqueio no servidor. O seletor de perfil deve existir só em modo de demonstração local.

### A-03 — Papel lido de `user_metadata`, que o próprio usuário pode alterar

- **Regra:** NEXT-AUTH-001
- **Local:** `src/app/login/page.tsx:71-72`; gravação em `src/app/api/admin/usuarios/route.ts:58-62`.
- **Evidência:** `authUserRole = authData.user.user_metadata.papel`.
- **Impacto:** no Supabase, `user_metadata` é editável pelo próprio usuário logado via `supabase.auth.updateUser({ data: { papel: "admin" } })`. Qualquer aluno se promove.
- **Correção:** ler o papel da tabela `usuarios` no servidor (ou de `app_metadata`, que só a service role altera). Não usar `user_metadata` para decisões de acesso.

### A-04 — Upload sem autenticação, com bucket, pasta e tipo escolhidos pelo cliente

- **Regra:** NEXT-FILES-001, NEXT-AUTH-001
- **Local:** `src/app/api/upload/route.ts:8-9`, `:26`, `:32`, `:38-43`, `:61-66`
- **Evidência:**

```ts
const bucket = (formData.get("bucket") as string) || "evidencias";
const subfolder = (formData.get("subfolder") as string) || "uploads";
const extensao = file.name.split(".").pop() || "bin";
...upload(storagePath, buffer, { contentType: file.type, upsert: true });
```

- **Impacto:** um atacante grava em qualquer bucket, sobrescreve arquivos existentes (`upsert: true`), hospeda HTML ou SVG ativos em bucket público, e obtém URLs assinadas de 7 dias.
- **Correção:** exigir sessão; fixar o bucket no servidor por tipo de upload; montar o caminho a partir do id da matrícula da sessão e de um UUID gerado no servidor; `upsert: false`; lista permitida de extensões e tipos (`.zip`, `.pdf`, `.png`, `.jpg`) com checagem do conteúdo; servir como anexo; URLs assinadas curtas.

### A-05 — Identidade e posse vindas do corpo da requisição

- **Regra:** NEXT-INPUT-001, NEXT-AUTH-001
- **Local e evidência:**
  - Declarar faturamento para qualquer `matriculaId`, com `valorBruto` sem validação de tipo (`src/app/api/faturamentos/route.ts:71-93`).
  - Enviar check-in por qualquer matrícula, apagando evidências anteriores dela (`src/app/api/checkins/route.ts:92`, `:113-153`).
  - Alterar canais de qualquer matrícula (`src/app/api/canais/route.ts:49-68`).
  - O auditor é identificado por um e-mail enviado no corpo, então dá para registrar auditoria em nome de outra pessoa (`src/app/api/checkins/[id]/auditar/route.ts:12`, `:21-29`; `src/app/api/faturamentos/[id]/auditar/route.ts:12`, `:21-28`).
  - O responsável por bloqueio e desbloqueio também vem do corpo (`src/app/api/bloqueios/route.ts:53`, `:80`, `:107`).
- **Correção:** derivar usuário, matrícula e auditor da sessão (C-01); para mentorado, conferir que a matrícula pertence a ele; validar tipos e limites com esquema; nunca aceitar "quem sou eu" do corpo.

---

## Médias

### M-01 — Links enviados por usuários renderizados sem restringir o esquema

- **Regra:** REACT-URL-001, JS-URL-002
- **Local:**
  - Servidor grava URLs sem validação: `src/app/api/checkins/route.ts:146`, `src/app/api/canais/route.ts:65`.
  - A única checagem de `http/https` é no cliente: `src/lib/api/checkin.ts:34`.
  - Renderização em `href`: `src/components/equipe/VisualizadorEntrega.tsx:78`, `src/components/equipe/FichaAluno.tsx:199` e `:320`, `src/components/canais/GridCanais.tsx:86`.
- **Impacto:** uma evidência ou canal com `javascript:...` executa código na sessão da equipe que clicar no link. O React 18 apenas avisa no console e não bloqueia esse esquema.
- **Correção:** validar no servidor com `new URL()` e aceitar só `https:` (e `http:` se necessário); criar um utilitário `urlSegura()` usado em todo `href` com dado de usuário.

### M-02 — Sem limite de tentativas em login e criação de contas

- **Regra:** NEXT-DOS-001
- **Local:** `src/app/login/page.tsx:60`; `src/app/api/admin/usuarios/route.ts:4`; `src/app/api/upload/route.ts:4`.
- **Impacto:** tentativa de senhas por força bruta (o Supabase tem limites próprios, mas o atalho de A-01 os torna irrelevantes), criação de contas em massa e uso do Storage como depósito.
- **Correção:** depois de C-01, adicionar limitação por IP e por usuário nas rotas de criação e upload, na aplicação ou na borda do provedor.

### M-03 — Next.js 14 fora da janela de suporte

- **Regra:** NEXT-SUPPLY-001
- **Local:** `package.json:14` (`"next": "^14.2.0"`, instalado 14.2.35).
- **Evidência:** a política de suporte do Next.js encerrou a manutenção da linha 14. A versão instalada inclui a correção do bypass de middleware CVE-2025-29927 (corrigido em 14.2.25) e não é afetada pela falha de RSC CVE-2025-66478, que atinge 15.x e 16.x.
- **Impacto:** novas falhas publicadas deixam de receber correção na linha 14.
- **Correção:** planejar a migração para a versão suportada mais recente. **Verificar** a data de fim de suporte na página oficial antes de priorizar.

---

## Baixas

### B-01 — Sem cabeçalhos de segurança

- **Regra:** NEXT-HEADERS-001, NEXT-CSP-001
- **Local:** `next.config.mjs:2-4` e `src/middleware.ts` não definem cabeçalhos.
- **Correção:** definir `Content-Security-Policy` com foco em `script-src`, `X-Content-Type-Options: nosniff`, `frame-ancestors 'none'` (ou `X-Frame-Options: DENY`) e `Referrer-Policy`. Verificar se o provedor de hospedagem já os adiciona.

### B-02 — Mensagens internas do banco devolvidas ao cliente

- **Regra:** NEXT-ERROR-001
- **Local:** padrão repetido em todas as rotas, por exemplo `src/app/api/alunos/route.ts:28` e `:58`, `src/app/api/upload/route.ts:47`.
- **Correção:** devolver mensagens genéricas e registrar o detalhe só no servidor.

### B-03 — Cliente administrador cai silenciosamente para a chave anônima

- **Regra:** NEXT-SECRETS-002
- **Local:** `src/lib/supabase/admin.ts:3-7`.
- **Evidência:** sem `SUPABASE_SERVICE_ROLE_KEY`, usa a chave anônima ou um valor fictício, e o URL do projeto está fixo no código.
- **Correção:** falhar na inicialização se a variável estiver ausente em produção; remover o URL fixo; adicionar `import "server-only"`.

### B-04 — Função de RLS `SECURITY DEFINER` sem `search_path` fixo

- **Local:** `supabase/migrations/20260915200000_schema_v2.sql:134-140`.
- **Impacto:** boa prática do Postgres para funções `SECURITY DEFINER`; reduz risco de sequestro de nomes de objeto.
- **Correção:** adicionar `SET search_path = public` na definição de `eh_equipe`.

### Observação para a correção — CSRF

Hoje a API não usa cookie de autenticação, então não há risco de CSRF. Se a correção de A-02 adotar sessão em cookie, todas as rotas `POST`, `PATCH` e `DELETE` passam a precisar de verificação estrita de `Origin` (ou token CSRF), além de `SameSite=Lax` (NEXT-CSRF-001).

---

## Pontos positivos

- `.env.local` está no `.gitignore` e nunca foi commitado; a chave de serviço não usa prefixo `NEXT_PUBLIC_`.
- `supabaseAdmin` só é importado por rotas de servidor.
- RLS está habilitado em todas as tabelas, com políticas coerentes de "aluno vê o seu, equipe vê todos" (`schema_v2.sql:123-186`).
- Nenhum uso de `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function` ou `postMessage`.
- Links externos com `target="_blank"` usam `rel="noopener noreferrer"` ou `rel="noreferrer"`.
- Nenhum redirecionamento baseado em parâmetro de URL.

## Ordem sugerida de correção

1. **C-01 com C-04:** helper de sessão e papel aplicado a todas as rotas, e remoção do `?email=` em `/api/auth/me`.
2. **C-02 e C-03:** travar criação e edição de papel.
3. **A-03, A-01 e A-02:** papel a partir do banco, login real e sessão em cookie HttpOnly validada no middleware, com checagem de Origin.
4. **A-05 e A-04:** posse derivada da sessão, validação com esquema e upload endurecido.
5. **M-01 a M-03 e as baixas.**

Cada item deve ir em um commit próprio, com os testes existentes rodando a cada passo. A correção de C-01 vai quebrar as chamadas atuais do store, que não enviam token; por isso o store precisa passar a enviar o access token da sessão no mesmo passo.
