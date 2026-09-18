# Relatório de trabalho — 17 de setembro de 2026

Este relatório descreve o que esta sessão fez no ÁGUIAS ONE v2: a porta
pública do sistema, a retirada do WhatsApp das telas abertas e o
componente de revisão de resultado de IA (Câmara UX). Cada seção informa
o problema, a solução e como ela foi verificada.

Escopo: sessão com Uma (ux-design-expert), em modo YOLO depois da
primeira escolha. Não inclui o trabalho paralelo em auditoria PDF,
alerta precoce, badges ou transcrição (épicos v3 A–D).

## Sumário

1. [Resumo executivo](#resumo-executivo)
2. [Contexto e restrições](#contexto-e-restrições)
3. [Porta de entrada do sistema](#porta-de-entrada-do-sistema)
4. [Conteúdo da porta (só mentorado)](#conteúdo-da-porta-só-mentorado)
5. [WhatsApp fora das telas públicas](#whatsapp-fora-das-telas-públicas)
6. [Revisão de resultado de IA](#revisão-de-resultado-de-ia)
7. [Arquivos](#arquivos)
8. [Verificações](#verificações)
9. [Pendências](#pendências)

## Resumo executivo

| Área | Antes | Depois |
|---|---|---|
| Rota `/` | Redirect silencioso para `/login` | Lobby público do mentorado |
| Conteúdo da porta | Inexistente | Hero, passos de acesso, mapa da jornada |
| Público da porta | — | Só mentorado; sem painel da equipe |
| WhatsApp público | `wa.me` na porta e no login | Removido; recuperação por e-mail |
| Resultado de IA | Sem padrão de revisão | Componente `RevisaoPropostaIA` (ainda sem fluxo ligado) |

## Contexto e restrições

O pedido inicial foi uma landpage do sistema, **não** uma página de
venda do produto. A porta confirma o lugar, deixa entrar quem já tem
matrícula e não oferece preço, vaga, depoimento nem cadastro aberto.

Decisões travadas nesta sessão:

- Uma porta só. Mentorado e equipe (quando logados) usam `/login`; o
  papel vem depois da sessão.
- A tela pública fala com o mentorado. Não descreve turma, auditoria
  nem cadastros.
- Número e link de WhatsApp do instituto não ficam na internet aberta.

## Porta de entrada do sistema

`src/app/page.tsx` mandava visitante sem sessão para `/login`. Quem
abria o domínio via um formulário, sem contexto.

O que mudou:

- Sem sessão, `/` renderiza `PortaEntrada`.
- Com sessão, o destino continua o mesmo do middleware: `/dashboard`
  (mentorado), `/painel/turma` (equipe) ou `/resgate`.
- `/` entra em `ROTAS_SEM_SHELL` no `AppShell`. A porta não mostra
  sidebar nem breadcrumbs.

A rota `/login` permanece. O logo do login aponta para `/`, que agora
é o lobby, não um loop de redirect.

## Conteúdo da porta (só mentorado)

A primeira versão era um lobby curto (título, um botão, duas colunas
Mentorado/Equipe). O pedido seguinte pediu mais elementos e **nada
para a equipe**.

A porta pública agora tem:

1. Cabeçalho com marca e **Entrar**.
2. Título: “Esta é a porta do ÁGUIAS ONE.”
3. Texto de orientação (jornada, check-in, faturamento).
4. **Entrar no sistema** e **Receber link no e-mail cadastrado**.
5. **Como entrar:** e-mail da matrícula → senha ou link → visão geral.
6. **Encontro às quartas.**
7. **O que você encontra:** visão geral, placar de entrada, check-in
   modular, faturamento, canais e materiais.
8. **Sem senha?** aponta para o login, sem canal público de WhatsApp.
9. Rodapé: acesso restrito a quem já está na mentoria.

O mapa descreve o que o mentorado vê depois do login. Não vende o
curso e não explica o painel da equipe.

## WhatsApp fora das telas públicas

A porta e o login expunham
`https://wa.me/5511987654321` e o texto “Fale com o Concierge no
WhatsApp”. Qualquer visitante via o número.

O que mudou:

- Porta: sem `wa.me`, sem botão de WhatsApp. Recuperação = link no
  e-mail cadastrado.
- Login: o rodapé não aponta para WhatsApp. **Esqueceu a senha?**
  dispara o mesmo link mágico por e-mail já existente na tela.
- A palavra “WhatsApp” no item **Canais** continua: é o canal do
  escritório do perito na jornada, não o telefone do instituto.

WhatsApp de resgate, ficha do aluno e e-mails internos da equipe
permanecem nas áreas autenticadas. Esta sessão não alterou esses
fluxos.

## Revisão de resultado de IA

A diretriz da Câmara UX (“Como permitir que pessoas revisem e editem
resultados gerados por IA”) não se aplica à porta: lá não há resultado
de IA. A regra pede para não criar etapa de revisão onde não existe
proposta.

O padrão foi transformado em código reutilizável:

- Máquina de estados em `src/lib/ux/proposta-ia.ts`: proposta,
  editando, aceita, descartada.
- Componente `RevisaoPropostaIA`: **Aceitar proposta**, **Editar**,
  **Gerar outra** (opcional), **Descartar sugestão**, **Desfazer
  aceite** e **Trazer sugestão de volta**.
- O texto aparece como proposta, não como conteúdo final. Aceitar não
  envia, não publica e não grava sozinho.
- Campo de edição com label visível (Câmara UX / campos de
  formulário). Status anunciado com `role="status"`.

O componente **não está ligado** a nenhum fluxo real. O sistema ainda
não gera rascunho por IA (a transcrição da quarta no épico C é MVP
manual). O primeiro uso previsto é rascunho de e-mail, parecer ou
transcrição, antes de qualquer envio.

## Arquivos

Criados:

- `src/components/PortaEntrada.tsx`
- `src/lib/ux/proposta-ia.ts`
- `src/components/ui/RevisaoPropostaIA.tsx`
- `tests/porta-entrada.test.ts`
- `tests/revisao-proposta-ia.test.ts`

Alterados:

- `src/app/page.tsx` — lobby sem sessão; redirect só com sessão
- `src/components/AppShell.tsx` — `/` fora do shell autenticado
- `src/app/globals.css` — estilos da porta e da proposta de IA
- `src/app/login/page.tsx` — sem WhatsApp público; senha via e-mail
- `tests/login.test.ts` — garante ausência de `wa.me`

## Verificações

| Verificação | Resultado |
|---|---|
| Typecheck (`npx tsc --noEmit`) | Sem erros |
| `tests/porta-entrada.test.ts` | Passou |
| `tests/login.test.ts` | Passou |
| `tests/revisao-proposta-ia.test.ts` | Passou |
| Navegador em `/` (desktop 1440 e mobile 390) | Porta renderiza; sem sidebar |
| Navegador em `/login` | Formulário intacto; **Entrar** da porta abre o login |
| `/dashboard` sem sessão | Continua 307 para login |

A suíte completa do repositório não foi reexecutada no fechamento
desta sessão. Os testes novos e os de login passaram isolados.

Esta sessão **não gerou commit**. As mudanças estão no working tree.

## Pendências

- Ligar `RevisaoPropostaIA` a um fluxo real quando houver geração de
  texto por IA.
- E-mails transacionais da equipe ainda podem trazer `wa.me` do
  Concierge; isso é envio autenticado, não a porta pública.
- Número de WhatsApp do Concierge no login antigo era de exemplo
  (`5511987654321`); não foi substituído por um canal interno, só
  removido das telas abertas.
