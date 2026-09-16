# Relatório — Diagnóstico de entrada e acompanhamento (v2)

**Data:** 16 de setembro de 2026
**Fonte:** `06-sistema/SPEC-DIAGNOSTICO-E-ACOMPANHAMENTO.md`
**Situação:** implementado no código, migrations aplicadas no Supabase, sem commit

Este relatório descreve o que foi construído no sistema ÁGUIAS ONE v2 para
atender ao spec de diagnóstico de entrada (placar de entrada) e aos painéis de
acompanhamento do Anjo, do Concierge, do Mentor e do Resgate.

---

## 1. Resumo

| Área | Entregue |
| :--- | :--- |
| Placar de entrada do aluno | Formulário em 8 blocos, rascunho, envio, correção em 7 dias, congelamento |
| Regras de score | Segmento de ICP, fit ONE, tipo do Anjo no dia 1, risco da parcela |
| Concierge | Tabela da turma e ficha do aluno para a quarta |
| Anjo | Mesa, ficha, notas, plano dos 6 meses, lista do mês 6 |
| Mentor | Turma, ficha completa, painel de ICP com frases, auditoria de acessos |
| Resgate (Adelayne) | Papel novo, lista de alunos para resgatar, registro de contatos |
| Segurança | Filtro de campos por papel, log de leitura de faturamento, permissões revistas |
| Operação | Job diário, histórico semanal do semáforo |

**Verificação:** `tsc` sem erros, 41 arquivos e 197 testes verdes no `vitest`,
e `next build` concluído. As telas não foram testadas no navegador.

---

## 2. Banco de dados

Duas migrations novas, já aplicadas no projeto Supabase.

### `20260916060000_diagnostico_acompanhamento.sql`

| Tabela | Uso |
| :--- | :--- |
| `diagnostico` | Um placar por matrícula: `status`, `payload` (respostas), `scores`, `versao` |
| `diagnostico_historico` | Cada envio, correção ou import vira uma versão |
| `anjo_nota` | Notas do Anjo, somente acréscimo |
| `anjo_plano` | Plano dos 6 meses por matrícula |
| `evento_sistema` | Eventos: envio, atraso, congelamento, correção, leituras |
| `acesso_faturamento_log` | Quem leu dinheiro de quem, quando e de onde |

Regras aplicadas:

- RLS forçado em todas as tabelas, sem política de escrita para clientes. Toda
  escrita passa pelas rotas `/api`.
- O aluno lê direto só o próprio placar e o próprio plano.
- Notas, histórico e logs recusam `UPDATE` (gatilho `trg_append_only`).
- Toda matrícula ativa cria o rascunho do placar automaticamente.
- A view `vw_icp_agregado` não expõe nome, matrícula nem frases e só é lida
  pelo servidor.

### `20260916070000_resgate_semaforo_semanal.sql`

- Adiciona o papel `resgate` à tabela `usuarios`. O papel não entra em
  `eh_equipe()`.
- Cria `semaforo_semanal`, com uma foto de cor por matrícula e semana.
- Cria `contato_resgate`, com canal, resultado e motivo do contato, somente
  acréscimo.

---

## 3. Placar de entrada do aluno

### Telas

- **`/onboarding/diagnostico`:** abertura com o texto do spec e depois os 8
  blocos, um por vez, com progresso "N de 8". O rascunho é salvo a cada bloco.
  O bloco 2 é uma grade dos 6 meses anteriores à matrícula, com a fonte do
  número e a opção "Não sei o meu placar".
- **`/diagnostico`:** leitura das respostas. Enquanto houver prazo, mostra
  **Corrigir até [data]**, que exige motivo com pelo menos 10 caracteres.

O aluno não vê segmento, fit, tipo do Anjo nem risco. A média só aparece depois
do envio.

### Ciclo de vida

1. A matrícula ativa cria o placar em `rascunho`.
2. O envio valida, calcula os scores e muda para `enviado`.
3. O aluno corrige até 7 dias depois do envio ou até a primeira quarta da
   turma, o que vier primeiro.
4. Depois do prazo, o placar fica `congelado`. Só o admin corrige, com motivo.
5. Sem envio 48 horas após a matrícula, o aluno entra como atrasado e aparece
   no Resgate.

Sem placar enviado, o semáforo não fica verde. Fica vermelho quando, passada a
semana 1, também não há check-in.

### Validação

- Pelo menos 3 dos 6 meses preenchidos, ou "não sei" marcado.
- Fonte obrigatória em mês com valor acima de zero.
- Campos condicionais só são exigidos quando aparecem.
- Frases com pelo menos 12 caracteres, gravadas exatamente como escritas.
- "Sempre", "nunca" e "pretendo" são recusados na pergunta sobre a última vez
  que organizou o escritório.

---

## 4. Regras de score

Código em `src/lib/diagnostico/regras.ts`, testado em
`tests/diagnostico.test.ts`.

| Score | Regra |
| :--- | :--- |
| `icp_segmento` | D escritório, B contador com bico, C perito solo, A iniciante (primeira que casar) |
| `flag_e_aluno_casa` | Já pagou produto da casa e acompanha há 2 anos ou mais |
| `fit_one` | "não" com equipe em folha ou média de R$ 20 mil ou mais |
| `anjo_tipo_t0` | A nada de pé, B estrutura sem venda, C vendeu sem sobrar, indefinido |
| `risco_parcela` | Alto com média abaixo de R$ 4 mil ou "aperta muito" |

Também são calculados média, maior e menor mês, instabilidade, mix de receita,
meses preenchidos e peças de pé.

---

## 5. Painéis por papel

### Concierge

- **`/concierge/turma`:** semáforo, status do placar, tipo do Anjo, peças de pé
  e trava. Os atrasados aparecem destacados e seguem automaticamente para o
  Resgate.
- **`/concierge/aluno/[id]`:** trava, peças e placar resumido (média, maior e
  menor mês). Sem mix de receita e sem frases.

### Anjo

- **`/anjo`:** cards com segmento, tipo, semáforo, vermelhos em 28 dias, risco,
  status do placar e contagem até o mês 6. Tem busca e filtros.
- **`/anjo/[matricula]`:** placar, meta, peças de pé, semáforo de 52 semanas,
  faturamento declarado mês a mês, notas e plano.
- **`/anjo/[matricula]/plano`:** formulário do plano dos 6 meses. O aluno vê o
  plano ativo no dashboard, sem editar.
- **`/anjo/mes6`:** alunos a 7 dias ou menos do mês 6, com "sessão obrigatória"
  para quem está abaixo da régua ou não declarou faturamento.

### Mentor

- **`/mentor/turma`:** tabela do Concierge mais média dos últimos 3 meses, fit,
  risco e segmento.
- **`/mentor/aluno/[id]`:** ficha do Anjo mais frases, Four Forces e uma seção
  de auditoria da ficha.
- **`/mentor/icp`:** distribuição de segmentos, mix de receita, Four Forces,
  origem do último trabalho e mural de frases. As frases saem sem nome; com
  **Mostrar nomes**, a leitura fica registrada. Exporta CSV.
- **`/mentor/auditoria`:** eventos e leituras de faturamento com filtros e
  exportação CSV.

### Resgate (Adelayne)

- **`/resgate`:** alunos com dois vermelhos seguidos ou placar atrasado, botão
  de WhatsApp com mensagem neutra, registro e histórico de contatos.
- Não recebe valores de faturamento, média, respostas, scores, frases nem notas
  do Anjo. Um teste confere o código das rotas.

---

## 6. O que cada papel vê

| Dado | Aluno | Concierge | Anjo | Mentor e admin | Resgate |
| :--- | :---: | :---: | :---: | :---: | :---: |
| Próprio placar | Sim | — | — | — | — |
| Status do placar | Sim | Sim | Sim | Sim | Sim |
| Média, maior e menor mês | Média | Sim, com log | Sim, com log | Sim, com log | Não |
| Mix de receita e segmento | Não | Não | Sim | Sim | Não |
| Faturamento mês a mês | Próprio | Não | Sim, com log | Sim, com log | Não |
| Frases e Four Forces | Próprias | Não | Não | Sim | Não |
| Notas do Anjo | Não | Não | Sim | Sim | Não |
| Auditoria | Não | Não | Não | Sim | Não |

---

## 7. Mudanças em telas e rotas existentes

| Item | Antes | Agora |
| :--- | :--- | :--- |
| Leitura de faturamento pela equipe | Sem registro | Grava `acesso_faturamento_log` |
| Declarar faturamento | Aluno e qualquer membro da equipe | Aluno ou admin |
| Parecer em check-in e faturamento | Admin, Concierge e Anjo | Admin, Concierge e Mentor |
| Semáforo | Só check-in | Considera o placar e grava a foto semanal |
| Menu lateral | Igual para toda a equipe | Seção **Acompanhamento** por papel; Resgate vê só a própria tela |
| Login | Equipe ia para `/painel/turma` | Resgate vai para `/resgate` |
| Middleware | Protegia `/painel` e `/admin` | Protege também as áreas de Anjo, Concierge, Mentor, Resgate e aluno |

> [!WARNING]
> O Concierge não consegue mais lançar faturamento em nome do aluno, e o Anjo
> não consegue mais dar parecer. As duas mudanças seguem o spec.

---

## 8. API

| Método | Rota | Quem usa |
| :--- | :--- | :--- |
| GET, PUT | `/api/diagnostico` | Aluno |
| POST | `/api/diagnostico/enviar` | Aluno |
| POST | `/api/diagnostico/corrigir` | Aluno e admin |
| POST | `/api/diagnostico/import` | Admin (ponte da Turma 1) |
| GET | `/api/diagnostico/[matricula]` | Concierge, Anjo, Mentor e admin |
| GET | `/api/diagnosticos` | Concierge, Anjo, Mentor e admin |
| GET | `/api/icp/agregado`, `/api/icp/frases` | Mentor e admin |
| POST | `/api/anjo/notas/[matricula]` | Anjo e Mentor |
| GET, PUT | `/api/anjo/plano/[matricula]` | Anjo (edita); Mentor, admin e o próprio aluno (leem) |
| GET | `/api/anjo/mes6` | Anjo, Mentor e admin |
| GET | `/api/mentor/auditoria` | Mentor e admin |
| GET | `/api/semaforo/historico` | Equipe |
| GET | `/api/resgate`, `/api/resgate/contatos` | Resgate, Concierge e admin |
| POST | `/api/resgate/contatos` | Resgate e admin |
| GET | `/api/cron/diario` | Vercel Cron, com `CRON_SECRET` |

Os erros seguem o envelope do spec: `{ erro: { codigo, mensagem, campo } }`.

O job diário roda às 09h UTC (06h de Brasília). Ele congela placares vencidos,
registra os atrasados e gera a lista do mês 6.

---

## 9. Decisões tomadas

| Questão | Decisão | Como mudar |
| :--- | :--- | :--- |
| Persona A: spec §13.1 × §5.3 | Vale o teste: `A_nada` com até 3 trabalhos | `LIMITE_TRABALHOS_A_NADA` |
| §16.1 Anjo lê faturamento | Sim, com log | `ANJO_LE_FATURAMENTO=false` deixa só acima, igual ou abaixo |
| §16.2 Régua do mês 6 | Média dos meses 4 a 6 comparada à média de entrada | `REGUA_MES6=meta_declarada` |
| §16.3 Início do mês 6 | Data da matrícula (180 dias) | `BASE_MES6=primeira_quarta` |
| §16.4 Frases no anúncio | Só uso interno | Autorização do Edilson, fora do sistema |
| Resgate | Papel próprio, fora da equipe | — |
| Adaptação do v1 | Filtro e log nas rotas `/api`, sem Edge Functions | — |

Os parâmetros ficam em `src/lib/diagnostico/parametros.ts`. As decisões marcadas
como "a confirmar" no spec continuam dependendo do Edilson.

---

## 10. Pendências

1. Crie o usuário da Adelayne com papel `resgate`. Hoje não existe nenhum.
2. Matricule os alunos da Turma 1. O banco tem 0 matrículas ativas, e o placar
   só aparece depois da matrícula.
3. Configure `CRON_SECRET` na Vercel. Sem ela, o job diário recusa as chamadas.
4. Teste as telas no navegador com um usuário de cada papel.
5. Revise e faça o commit. Nada foi versionado ainda.

### Limitações conhecidas

- O histórico do semáforo começa agora; os vermelhos em 28 dias ficam
  completos depois de 4 semanas.
- A foto semanal só é gravada quando alguém abre o semáforo ou o job roda.
- A v2 não tem regra de gate, então a coluna "elegíveis ao gate" não existe.
- Presença na quarta não aparece na tabela do Concierge; ela continua em
  **Chamadas**.

---

## 11. Arquivos principais

| Caminho | Conteúdo |
| :--- | :--- |
| `src/lib/diagnostico/` | Campos, regras, parâmetros, helpers de servidor e cliente |
| `src/lib/acompanhamento/` | Plano, mês 6, semáforo semanal, resgate |
| `src/app/api/diagnostico*`, `icp`, `anjo`, `mentor`, `resgate`, `cron` | Rotas novas |
| `src/app/(aluno)/onboarding`, `(aluno)/diagnostico` | Telas do aluno |
| `src/app/(equipe)/anjo`, `concierge`, `mentor` | Painéis da equipe |
| `src/app/(resgate)/resgate` | Tela do Resgate |
| `src/components/diagnostico/` | Componentes das telas |
| `supabase/migrations/20260916060000_*`, `20260916070000_*` | Banco |
| `tests/diagnostico*.test.ts`, `mes6`, `semaforo-semanal`, `resgate`, `auth-roles` | Testes |
| `vercel.json` | Agendamento do job diário |
