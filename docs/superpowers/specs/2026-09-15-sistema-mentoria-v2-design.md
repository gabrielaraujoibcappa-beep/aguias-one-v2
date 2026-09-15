# Especificação Técnica de Design — Sistema de Mentoria ÁGUIAS ONE (v2)

**Data:** 15 de setembro de 2026  
**Status:** Validado e Aprovado para Planejamento  
**Origem Metodológica:** HOUS3 (Processo → Persona → Funcionalidade → RFs) + PPC ÁGUIAS ONE  
**Design System:** Cohere Enterprise 2026 (`DESIGN.md`)

---

## 1. Visão Geral do Produto

O **Sistema de Mentoria ÁGUIAS ONE (v2)** é uma plataforma voltada para peritos judiciais e assistentes técnicos que operam escritórios individuais (sem funcionários). O sistema organiza a execução prática do mentorado através de:
1. **Dashboard Central do Mentorado:** Ponto de comando limpo com resumo da jornada, materiais de apoio e atalhos rápidos para Check-in, Canais e Faturamento.
2. **Check-in Modular com Liberação Ativa:** O perito só acessa os módulos que forem desbloqueados pelo Anjo (Ana Carolina) ou pelo Concierge (Flávio Lopes), preenchendo links (URLs) e múltiplos arquivos/prints de comprovação prática.
3. **Faturamento Direto com Comprovantes & ZIP:** Declaração simples de faturamento bruto mensal em R$ com upload de arquivos individuais ou pacote compactado `.zip` (sem livros caixas diários ou regras contábeis complexas).
4. **Painel Operacional da Equipe:** 4 visões especializadas para a equipe (Liberação de Módulos, Fila de Auditoria de Entregas, Painel da Turma com Semáforo/Resgate e Auditoria de Faturamento).
5. **Central de Cadastros e Gestão (CRUD Administrativo):** Telas completas de criação, edição, listagem e exclusão de Alunos, Turmas, Usuários da Equipe com controle de papéis (RBAC) e Módulos.

---

## 2. Personas do Ecossistema (Padrão HOUS3)

### Persona 1: Perito Solo *(Mentorado / Aluno)*
* **Nome funcional:** Perito Solo (Mentorado).
* **Analogia:** O piloto e mecânico do próprio escritório.
* **Quem opera na prática:** Profissional graduado autônomo (Contador, Administrador, Economista, Engenheiro) atuando como perito judicial ou assistente técnico.
* **Contexto:** Opera sozinho sem equipe. Foco em organizar infraestrutura, canais e vendas. Ciclo de 12 meses. Precisa de uma rotina direta no celular ou desktop (< 3 minutos para registrar check-in e faturamento).
* **Frustração:** Mistura tempo técnico de laudos com captação; tenta abraçar todas as tarefas de uma vez e se perde se os módulos estiverem abertos simultaneamente sem direcionamento.
* **Soluções atuais:** Anotações em bloco de notas, planilhas avulsas e mensagens no WhatsApp da turma.

### Persona 2: Concierge de Engajamento e Rotina *(Flávio Lopes)*
* **Nome funcional:** Concierge de Engajamento.
* **Analogia:** O controlador de voo e condutor dos encontros semanais.
* **Quem opera na prática:** Flávio Lopes (equipe ÁGUIAS ONE).
* **Contexto:** Conduz o encontro síncrono semanal de quarta-feira (18h15–19h45). Libera os módulos da semana para a turma, analisa quem entregou os itens práticos e faz a conferência ao vivo das entregas.
* **Frustração:** Alunos pulando etapas ou chegando na call de quarta sem ter preenchido o que foi acordado.
* **Soluções atuais:** Planilhas paralelas e checagem manual no braço.

### Persona 3: Anjo de Evidências e Suporte Técnico *(Ana Carolina)*
* **Nome funcional:** Anjo de Evidências.
* **Analogia:** A inspetora de conformidade da esteira prática.
* **Quem opera na prática:** Ana Carolina Gomes Cardoso (equipe ÁGUIAS ONE).
* **Contexto:** Realiza a auditoria contínua dos artefatos submetidos pelos alunos (prints de pastas, links de sites no ar, prints de e-mails com assinatura, arquivos compactados de faturamento). Libera os módulos subsequentes e aprova as entregas.
* **Frustração:** Receber links quebrados ou prints avulsos no WhatsApp sem histórico organizado de aprovação.
* **Soluções atuais:** Pastas compartilhadas do Google Drive e mensagens diretas.

### Persona 4: Mentor Estrategista *(Prof. Edilson Aguiais)*
* **Nome funcional:** Mentor Estrategista / Coordenador.
* **Analogia:** O estrategista sênior do Hot Seat.
* **Quem opera na prática:** Prof. Edilson Aguiais (Mestre, Contador, Advogado, Economista).
* **Contexto:** Conduz o Hot Seat quinzenal. Não participa do grupo de WhatsApp da turma. Acessa a visão executiva e as dúvidas e travas filtradas pela equipe.
* **Frustração:** Mentorados trazendo casos desestruturados sem execução prévia da base.
* **Soluções atuais:** Curadoria manual repassada pela equipe antes das calls.

### Persona 5: Administrador / Gestor de Operações *(Gabriel / Coordenação)*
* **Nome funcional:** Administrador da Plataforma.
* **Analogia:** O administrador do prédio.
* **Quem opera na prática:** Coordenação operacional do IBCAPPA / UniBCAPPA.
* **Contexto:** Responsável por cadastrar novos alunos, criar turmas, atribuir permissões de acesso, gerenciar módulos e garantir a integridade dos dados sem depender de suporte técnico ou comandos manuais de banco de dados.
* **Frustração:** Falta de telas de CRUD completas, dependência de scripts para cadastrar alunos ou editar dados de turmas.
* **Soluções atuais:** Edições manuais em arquivos ou banco de dados.

---

## 3. Especificação das Funcionalidades (Padrão HOUS3)

---

### FN-01: Dashboard Central do Mentorado (Home de Comando)

**Como Perito Solo, quero acessar um painel inicial centralizado com meus dados, materiais e atalhos rápidos, para saber imediatamente qual é a prioridade da semana e acessar check-in, canais e faturamento em 1 clique.**

#### Descrição
* **Contexto:** Ao entrar no sistema, o mentorado precisa de uma interface limpa que mostre o estado da sua jornada, os avisos da semana e os botões de ação imediata.
* **Problema atual:** Telas confusas ou menus densos dispersam a atenção do perito, que opera sozinho e tem tempo escasso.
* **Resultado esperado:** O perito entra na plataforma e vê seu status geral, links para materiais de apoio e 3 atalhos evidentes (Check-in, Canais, Faturamento).
* **Escopo:**
  * *Inclui:* Card de identificação do aluno e turma; Alerta do módulo atualmente liberado; Seção de downloads e materiais de apoio; 3 botões/cards de atalho: Check-in, Canais e Faturamento.
  * *Não inclui:* Feed social, fórum aberto de mensagens ou chat em tempo real na home.
* **Referências:** Template HOUS3 (§4, §5), `DESIGN.md`.
* **Personas relacionadas:** Principal: Perito Solo. Secundária: Concierge (Flávio Lopes).
* **Business Points:** 5 BP (Ponto de entrada obrigatório e guia de navegação de toda a experiência).
* **Design:** Requer design sóbrio no padrão Cohere (cards brancos em canvas neutro, acentos em `#003c33`).

#### Requisitos Funcionais
* **RF-001:** O sistema deve exibir na tela inicial a identificação do perito, turma e status do módulo em andamento.
* **RF-002:** O sistema deve disponibilizar atalho direto e destacado para o **Check-in do módulo liberado**.
* **RF-003:** O sistema deve disponibilizar atalho direto para a área de **Canais do Escritório**.
* **RF-004:** O sistema deve disponibilizar atalho direto para o módulo de **Faturamento e Comprovantes**.
* **RF-005:** O sistema deve disponibilizar uma área de **Materiais**, listando apostilas, templates de kits e arquivos para download disponibilizados pela coordenação.

---

### FN-02: Declaração de Faturamento com Envio de Comprovantes e Arquivo ZIP

**Como Perito Solo, quero declarar meu faturamento bruto mensal e anexar meus comprovantes em arquivos avulsos ou em pacote compactado (.zip), para comprovar os números do meu escritório sem complexidade contábil.**

#### Descrição
* **Contexto:** Mensalmente, o perito precisa declarar o volume bruto recebido pelo escritório pericial e anexar a documentação suporte (recibos, notas, extratos) para a mentoria.
* **Problema atual:** Peritos não mantêm controle ou perdem comprovantes; sistemas contábeis tradicionais com plano de contas ou livros caixas diários são complexos demais e causam abandono do preenchimento.
* **Resultado esperado:** Um formulário mensal direto com campo de valor em R$ e área de upload que aceite arquivos individuais (PDF, PNG, JPG) ou um arquivo `.zip` único compactado.
* **Escopo:**
  * *Inclui:* Seletor do mês de referência; Campo numérico monetário (R$); Upload de arquivos de imagem/PDF; Upload de pacote `.zip`; Tabela com histórico dos lançamentos anteriores e links para download dos arquivos enviados.
  * *Não inclui:* Livro caixa diário, controle de despesas operacionais detalhadas, divisão de potes ou régua de degraus.
* **Referências:** PPC ÁGUIAS ONE (§7 Disciplina 11), Template HOUS3.
* **Personas relacionadas:** Principal: Perito Solo. Secundárias: Anjo (Ana Carolina), Mentor (Prof. Edilson Aguiais).
* **Business Points:** 5 BP (Comprovação financeira central e transparente).
* **Design:** Requer design (formulário monetário limpo + drag and drop para arquivos e `.zip`).

#### Requisitos Funcionais
* **RF-006:** O sistema deve permitir a seleção do mês e ano de referência para a declaração de faturamento.
* **RF-007:** O sistema deve disponibilizar input monetário formatado em Reais (R$) para registro do faturamento bruto recebido.
* **RF-008:** O sistema deve disponibilizar upload de múltiplos arquivos nos formatos PDF, PNG e JPEG.
* **RF-009:** O sistema deve permitir e validar o upload de arquivos compactados no formato `.zip` contendo os comprovantes.
* **RF-010:** O sistema deve armazenar os arquivos em bucket de storage seguro com nomes padronizados e URLs autenticadas.
* **RF-011:** O perito deve conseguir visualizar o histórico de faturamentos declarados por mês, com acesso ao download dos comprovantes/ZIP enviados.

---

### FN-03: Gestão e Liberação de Módulos pela Equipe (Anjo / Flávio)

**Como Anjo ou Concierge, quero gerenciar e liberar ativamente módulos específicos para os mentorados, para garantir que os peritos avancem na ordem pedagógica correta e só acessem o conteúdo liberado pela mentoria.**

#### Descrição
* **Contexto:** Os módulos da mentoria (ex: *Módulo 1 — Árvore de Pastas no Google Drive*, *Módulo 2 — Agenda*, etc.) não devem ficar abertos de forma irrestrita. O Anjo ou o Flávio define quando um módulo é liberado para a turma ou mentorado específico.
* **Problema atual:** Quando todos os módulos ficam abertos, alunos ansiosos pulam fundamentos básicos e tentam executar canais ou anúncios antes da base pronta.
* **Resultado esperado:** A equipe possui um painel administrativo com a lista de alunos/turmas e botões de ação para **Liberar Módulo** e **Bloquear/Suspender Módulo**.
* **Escopo:**
  * *Inclui:* Painel de gestão de turmas e alunos; Controle de status do módulo por aluno (`Bloqueado`, `Liberado`, `Aguardando Avaliação`, `Aprovado`); Ação em lote ou individual de liberação de módulo.
  * *Não inclui:* Criação dinâmica de novas matrizes curriculares no meio da turma (a grade segue os módulos oficiais).
* **Referências:** Template HOUS3, PPC ÁGUIAS ONE (§5.1, §6).
* **Personas relacionadas:** Principal: Anjo (Ana Carolina), Concierge (Flávio Lopes). Secundária: Perito Solo.
* **Business Points:** 5 BP (Controle do fluxo pedagógico e integridade da metodologia).
* **Design:** Requer design (tabela operacional administrativa limpa e objetiva).

#### Requisitos Funcionais
* **RF-012:** O sistema deve listar todos os módulos da mentoria com seu status de liberação para cada aluno/turma.
* **RF-013:** O Anjo ou Concierge deve conseguir alterar o status de um módulo para "Liberado" com um clique.
* **RF-014:** O sistema deve exibir para o perito apenas os módulos que estiverem com status "Liberado" ou "Aprovado", mantendo os demais bloqueados com indicação de bloqueio.
* **RF-015:** O sistema deve registrar o usuário da equipe (Anjo/Flávio) e a data/hora da liberação do módulo (log de auditoria).

---

### FN-04: Preenchimento de Check-in Modular com Links e Múltiplos Arquivos

**Como Perito Solo, quero acessar o módulo liberado e preencher meus links de evidência e múltiplos arquivos/prints de comprovação, para submeter a entrega prática do módulo para avaliação.**

#### Descrição
* **Contexto:** Assim que um módulo é liberado (ex: Módulo de Infraestrutura/Presença Digital), o aluno acessa o roteiro prático e deve fornecer as evidências exigidas: inputs de links (URLs) e uploads de arquivos/prints.
* **Problema atual:** O aluno não sabe exatamente o que precisa entregar ou envia tudo solto em mensagens informais.
* **Resultado esperado:** O aluno acessa a tela do módulo liberado, visualiza a lista dos tópicos práticos e encontra os campos exatos de entrega (ex: campo para URL do site, campo para print das pastas, campo para print do e-mail com assinatura) e campo para dúvidas.
* **Escopo:**
  * *Inclui:* Visualização dos pontos do módulo liberado; Inputs tipados de URL (links externos); Inputs de múltiplos arquivos (prints/PDFs); Campo de texto para relato de travamento ou dúvida para a call de quarta; Botão de submissão da entrega.
  * *Não inclui:* Editor de texto rico complexo dentro do formulário (o foco é prova objetiva: link e arquivo).
* **Referências:** PPC ÁGUIAS ONE (§7 Disciplina 04), Template HOUS3.
* **Personas relacionadas:** Principal: Perito Solo. Secundária: Anjo (Ana Carolina).
* **Business Points:** 5 BP (Núcleo da comprovação prática).
* **Design:** Requer design (cards de itens com inputs diretos de link e dropzone de arquivos, mobile-friendly).

#### Requisitos Funcionais
* **RF-016:** O sistema deve exibir os tópicos práticos e orientações do módulo atualmente liberado.
* **RF-017:** O sistema deve disponibilizar inputs dedicados para links (URL com validação `http://` ou `https://`).
* **RF-018:** O sistema deve disponibilizar inputs para upload de múltiplos arquivos de imagem (PNG, JPG) ou PDF para cada evidência solicitada.
* **RF-019:** O sistema deve disponibilizar campo de texto aberto para registro de dúvidas ou relato de travas direcionadas ao encontro de quarta-feira.
* **RF-020:** O perito deve conseguir salvar rascunho das respostas e arquivos antes do envio definitivo.
* **RF-021:** Ao submeter a entrega, o status do módulo deve ser alterado automaticamente para "Aguardando Avaliação".

---

### FN-05: Auditoria, Conferência e Validação de Entregas pela Equipe

**Como Anjo ou Concierge, quero analisar as evidências submetidas (links e arquivos) e aprovar a entrega ou solicitar ajustes com justificativa, para conferir a implantação prática do escritório.**

#### Descrição
* **Contexto:** No encontro semanal de quarta-feira (com Flávio) ou na rotina de suporte (com o Anjo Ana Carolina), as entregas enviadas pelos alunos precisam ser auditadas: clicar no link para testar o site no ar, abrir os prints das pastas e do e-mail profissional.
* **Problema atual:** Falta de rastreabilidade do porquê um aluno foi aprovado ou reprovado, gerando atrito e atrasos na validação.
* **Resultado esperado:** Uma esteira de conferência rápida onde a equipe visualiza os arquivos e links do aluno lado a lado, com botões para "Aprovar Entrega" ou "Solicitar Ajuste" com comentário explicativo.
* **Escopo:**
  * *Inclui:* Visualização dos links com abertura em nova aba; Pré-visualização ou download dos prints e arquivos enviados; Ação de aprovar (muda status para Aprovado); Ação de solicitar ajuste (devolve o módulo para edição do aluno com feedback gravado).
  * *Não inclui:* Modificação dos arquivos do aluno pela equipe (apenas o aluno edita suas entregas).
* **Referências:** PPC ÁGUIAS ONE (§5.1, §9.1), Template HOUS3.
* **Personas relacionadas:** Principal: Anjo (Ana Carolina), Concierge (Flávio Lopes). Secundária: Perito Solo.
* **Business Points:** 5 BP (Garante a seriedade do selo e certificado da mentoria).
* **Design:** Requer design (painel de conferência com visualizador limpo de anexos).

#### Requisitos Funcionais
* **RF-022:** A equipe deve visualizar a lista de entregas pendentes com nome do mentorado, módulo e data de envio.
* **RF-023:** A equipe deve conseguir abrir os links externos enviados pelo aluno e visualizar/baixar os prints e arquivos anexados.
* **RF-024:** A equipe deve conseguir aprovar a entrega com 1 clique, alterando o status do módulo para "Aprovado".
* **RF-025:** A equipe deve conseguir reprovar a entrega acionando "Solicitar Ajuste", sendo obrigatório registrar o motivo do apontamento.
* **RF-026:** Quando um ajuste for solicitado, o mentorado deve ver o status de alerta no seu painel com o comentário da equipe e ter os campos reabertos para correção.

---

### FN-06: Painel de Canais do Escritório

**Como Perito Solo, quero acompanhar e registrar a ativação dos canais de atração do meu escritório, para ter visibilidade de quais frentes de captação estão no ar e quais faltam implantar.**

#### Descrição
* **Contexto:** A Disciplina 08 e o PPC preveem a ativação dos canais na ordem rígida: WhatsApp Business, Google Meu Negócio, Instagram, Site, Newsletter, YouTube e Ads.
* **Problema atual:** Perito quer rodar anúncios antes de ter WhatsApp Business com catálogo ou perfil estruturado, desperdiçando dinheiro.
* **Resultado esperado:** Painel visual com os cards de cada canal, permitindo ao perito registrar o link do canal, data de ativação e status (Não iniciado / No ar).
* **Escopo:**
  * *Inclui:* Lista dos 7 canais oficiais do método; Campos para salvar link do canal e status; Indicador de canais ativos no dashboard.
  * *Não inclui:* Disparo automático de mensagens ou integração direta com APIs de redes sociais.
* **Referências:** PPC ÁGUIAS ONE (§3.2, §7 Disciplinas 04 e 08).
* **Personas relacionadas:** Principal: Perito Solo. Secundária: Concierge (Flávio Lopes).
* **Business Points:** 3 BP (Organização da presença e captação do perito).
* **Design:** Requer design (grid de cards de canais).

#### Requisitos Funcionais
* **RF-027:** O sistema deve listar os canais de captação oficiais na ordem recomendada pela mentoria.
* **RF-028:** O perito deve conseguir registrar o status de cada canal (Não iniciado / Ativo) e salvar o link de acesso público.

---

### FN-07: CRUD de Alunos / Mentorados

**Como Administrador ou Membro da Equipe, quero criar, listar, editar e gerenciar a situação cadastral dos alunos, para manter a base de peritos organizada, vinculada a turmas ativas e com dados atualizados.**

#### Descrição
* **Contexto:** A equipe precisa matricular novos peritos, corrigir e-mails ou números de WhatsApp e gerenciar o status acadêmico do mentorado ao longo dos 12 meses.
* **Problema atual:** Falta de interface administrativa para cadastro, dependendo de inserções manuais no banco de dados.
* **Resultado esperado:** Tela de listagem com barra de busca rápida, filtros por turma/status e gaveta lateral (drawer/modal) para criar e editar dados do aluno.
* **Escopo:**
  * *Inclui:* Listagem paginada com busca instantânea (nome, e-mail, telefone); Criação de novo aluno com envio de convite; Edição completa de dados cadastrais; Alteração de status (Ativo, Trancado, Inativo, Concluído); Ação de redefinir senha/reenviar acesso; Exclusão lógica com confirmação de segurança.
  * *Não inclui:* Pagamento ou gateway de cobrança dentro da tela de cadastro.
* **Referências:** Template HOUS3, PPC ÁGUIAS ONE (§10.1 a §10.3).
* **Personas relacionadas:** Principal: Administrador (Gabriel). Secundárias: Concierge (Flávio), Anjo (Ana Carolina).
* **Business Points:** 5 BP (Operação básica de sustentação do sistema).
* **Design:** Requer design (tabela de dados densa com busca e modal/drawer lateral).

#### Requisitos Funcionais
* **RF-029:** O sistema deve listar os alunos cadastrados com nome, e-mail, telefone/WhatsApp, turma vinculada e status.
* **RF-030:** O sistema deve permitir a busca instantânea de alunos por nome, e-mail ou WhatsApp.
* **RF-031:** O sistema deve permitir o cadastro de novos alunos com campos obrigatórios: Nome Completo, E-mail, WhatsApp (com DDD), CPF, Área Pericial Principal e Turma.
* **RF-032:** O sistema deve validar a unicidade do e-mail e o formato válido de CPF e WhatsApp.
* **RF-033:** O sistema deve permitir a edição de todos os dados cadastrais do aluno.
* **RF-034:** O sistema deve permitir alterar o status do aluno entre Ativo, Trancado, Inativo e Concluído.
* **RF-035:** O sistema deve exigir confirmação em duas etapas para exclusão ou inativação de alunos.

---

### FN-08: CRUD de Turmas & Matrículas

**Como Administrador, quero cadastrar e gerenciar turmas com suas datas, horários e limites de vagas, para estruturar os ciclos de mentoria e organizar os grupos de alunos.**

#### Descrição
* **Contexto:** O ÁGUIAS ONE funciona em turmas fechadas (ex: `POS.ONE.2026`, Turma 2026.1), com encontros semanais e limites de capacidade.
* **Problema atual:** Turmas criadas sem parametrização de datas de início, dias de encontro ou sem visualização dos matriculados.
* **Resultado esperado:** Tela de gestão de turmas onde o administrador cria uma nova turma, define suas datas, horário de call semanal e vê a lista dos alunos nela matriculados.
* **Escopo:**
  * *Inclui:* Criação de turma (Código, Nome, Data Início, Data Fim, Dia/Horário do Encontro, Limite de Vagas); Edição de dados da turma; Listagem de turmas com contador de alunos; Encerramento de turma.
  * *Não inclui:* Mesclagem de históricos entre turmas distintas.
* **Referências:** PPC ÁGUIAS ONE (§1, §5.1).
* **Personas relacionadas:** Principal: Administrador. Secundária: Concierge (Flávio Lopes).
* **Business Points:** 5 BP (Organização temporal e pedagógica da mentoria).
* **Design:** Requer design (cards de turmas ou tabela estruturada).

#### Requisitos Funcionais
* **RF-036:** O sistema deve permitir criar turmas informando Código, Nome, Data de Início, Horário do Encontro Semanal e Limite Máximo de Vagas.
* **RF-037:** O sistema deve listar todas as turmas ativas e históricas, com indicador de quantidade de alunos matriculados vs. capacidade máxima.
* **RF-038:** O sistema deve permitir editar os parâmetros de uma turma existente.
* **RF-039:** O sistema deve impedir que novos alunos sejam matriculados em turmas que atingiram a capacidade máxima definida.
* **RF-040:** O sistema deve exibir a lista de todos os alunos matriculados ao abrir o detalhe de uma turma.

---

### FN-09: CRUD de Usuários da Equipe e Controle de Perfis de Acesso (RBAC)

**Como Administrador, quero gerenciar os membros da equipe e atribuir papéis de acesso específicos, para garantir a segurança operacional e que cada colaborador acesse apenas as ferramentas da sua alçada.**

#### Descrição
* **Contexto:** A equipe é composta por papéis distintos: Anjo (Ana Carolina), Concierge (Flávio Lopes), Mentor (Prof. Edilson Aguiais) e Administradores (Gabriel/Coordenação). Cada um precisa de permissões estritas.
* **Problema atual:** Riscos de segurança e vazamento de informações quando todos compartilham senhas comuns ou têm permissões irrestritas.
* **Resultado esperado:** Painel de gestão de equipe onde o administrador cadastra colaboradores, atribui papéis (Admin, Concierge, Anjo, Mentor) e define seus acessos.
* **Escopo:**
  * *Inclui:* Listagem de membros da equipe; Cadastro de novo usuário interno com definição de papel; Alteração de papéis; Revogação de acesso (desativação).
  * *Não inclui:* Criação de papéis dinâmicos arbitrários (os papéis são os 5 oficiais do produto: Admin, Concierge, Anjo, Mentor, Mentorado).
* **Referências:** PPC ÁGUIAS ONE (§8.1, §8.2), Template HOUS3.
* **Personas relacionadas:** Principal: Administrador. Secundárias: Concierge, Anjo, Mentor.
* **Business Points:** 5 BP (Segurança e governança dos dados).
* **Design:** Requer design (tabela de usuários internos com chips de papel).

#### Requisitos Funcionais
* **RF-041:** O sistema deve manter 5 papéis de acesso estritos: `admin`, `concierge`, `anjo`, `mentor` e `mentorado`.
* **RF-042:** O Administrador deve conseguir cadastrar novos usuários internos informando Nome, E-mail e Papel de Acesso.
* **RF-043:** O sistema deve restringir o acesso às telas administrativas e operacionais estritamente aos papéis autorizados via RLS/Middleware.
* **RF-044:** O Administrador deve conseguir alterar a função de um membro da equipe ou revogar seu acesso imediatamente.

---

### FN-10: Painel de Controle Operacional da Equipe (Turma, Semáforo e Resgate)

**Como Concierge ou Anjo, quero acessar um painel consolidado com a visão da turma, semáforos, travas em 1 linha e atalhos de resgate, para conduzir o acompanhamento semanal e resgatar alunos em risco de evasão.**

#### Descrição
* **Contexto:** Horas antes do encontro de quarta-feira (18h15), Flávio Lopes precisa monitorar quem entregou o check-in, quem travou e quem sumiu há duas semanas consecutivas.
* **Problema atual:** Catar dados em planilhas soltas e não ter visão clara de quem precisa de acolhimento ou resgate imediato.
* **Resultado esperado:** Painel operacional que exibe os alunos agrupados por semáforo (Verde, Amarelo, Vermelho), com o texto da trava resumido em 1 linha e botão para acionar o aluno no WhatsApp com template de resgate.
* **Escopo:**
  * *Inclui:* Visão em tabela da turma selecionada; Badges de semáforo automáticos; Exibição da frase de travamento; Destaque para alunos em risco (2+ semanas consecutivas no Vermelho); Botão com link direto para WhatsApp (`wa.me`); Fila de dúvidas enviadas para a call ("Botão na Tela").
  * *Não inclui:* Disparo em massa de mensagens automáticas não autorizadas.
* **Referências:** PPC ÁGUIAS ONE (§5.1, §8.2, §11.2).
* **Personas relacionadas:** Principal: Concierge (Flávio Lopes). Secundárias: Anjo (Ana Carolina), Mentor (Prof. Edilson Aguiais).
* **Business Points:** 5 BP (Combate ativo à evasão e suporte de excelência).
* **Design:** Requer design (painel com semáforos contrastantes e ações rápidas).

#### Requisitos Funcionais
* **RF-045:** O sistema deve calcular e exibir o status do semáforo de cada aluno: Verde (check-in e evidências entregues), Amarelo (entregue com trava/dúvida), Vermelho (não entregue no prazo semanal).
* **RF-046:** O sistema deve destacar com alerta prioritário os peritos com 2 ou mais semanas consecutivas em Semáforo Vermelho.
* **RF-047:** O sistema deve disponibilizar atalho de WhatsApp gerando link direto com mensagem contextualizada para contato do Concierge.
* **RF-048:** O sistema deve listar as dúvidas submetidas pelos alunos para curadoria da fila "Botão na Tela" do encontro síncrono.

---

## 4. Matriz de Rastreabilidade Completa

| ID | Funcionalidade | Persona Principal | Persona(s) de Apoio | BP | Destino |
| :--- | :--- | :--- | :--- | :---: | :--- |
| **FN-01** | Dashboard Central do Mentorado | Perito Solo | Flávio Lopes | 5 BP | Release v2.0 |
| **FN-02** | Faturamento & Comprovantes (ZIP/Multi) | Perito Solo | Ana Carolina, Edilson Aguiais | 5 BP | Release v2.0 |
| **FN-03** | Gestão e Liberação de Módulos | Ana Carolina, Flávio Lopes | Perito Solo | 5 BP | Release v2.0 |
| **FN-04** | Check-in Modular (Links & Múltiplos Arquivos) | Perito Solo | Ana Carolina | 5 BP | Release v2.0 |
| **FN-05** | Auditoria e Aprovação de Entregas | Ana Carolina, Flávio Lopes | Perito Solo | 5 BP | Release v2.0 |
| **FN-06** | Painel de Canais do Escritório | Perito Solo | Flávio Lopes | 3 BP | Release v2.0 |
| **FN-07** | CRUD de Alunos / Mentorados | Administrador | Flávio Lopes, Ana Carolina | 5 BP | Release v2.0 |
| **FN-08** | CRUD de Turmas & Matrículas | Administrador | Flávio Lopes | 5 BP | Release v2.0 |
| **FN-09** | CRUD de Equipe e Papéis (RBAC) | Administrador | Equipe Geral | 5 BP | Release v2.0 |
| **FN-10** | Painel de Controle Operacional (Semáforo/Resgate) | Flávio Lopes | Ana Carolina, Edilson Aguiais | 5 BP | Release v2.0 |

---

## 5. Arquitetura Técnica e Modelo de Dados

### 5.1 Stack Tecnológica
* **Frontend:** Next.js (App Router) / React com TypeScript.
* **Design & Estilo:** Vanilla CSS baseado nos tokens do `DESIGN.md` (Cohere Enterprise 2026: tons profundos `#17171c`, `#003c33`, `#071829`, canvas branco, componentes sem excesso de gradientes, raio de botões pill `32px` e cartões `8px–22px`).
* **Backend & Banco:** Supabase (PostgreSQL 15+ com Row Level Security estrito).
* **Storage:** Buckets Supabase Storage:
  * `evidencias`: Prints, PDFs e materiais de comprovação de check-in.
  * `comprovantes_faturamento`: Arquivos e pacotes compactados `.zip` (privado, acesso apenas do aluno e equipe com URLs assinadas).
  * `materiais`: Apostilas e kits para download dos alunos.

### 5.2 Estrutura de Entidades Principais
1. `usuarios`: ID, auth_id, nome, email, telefone, papel (`admin`, `concierge`, `anjo`, `mentor`, `mentorado`), criado_em.
2. `turmas`: ID, codigo, nome, data_inicio, data_fim, horario_encontro, limite_vagas, status (`aberta`, `em_andamento`, `concluida`).
3. `matriculas`: ID, usuario_id, turma_id, status (`ativo`, `trancado`, `inativo`, `concluido`), matriculado_em.
4. `modulos`: ID, numero, titulo, descricao, ordem, disciplina_ref, exige_link, exige_arquivo.
5. `modulo_liberacoes`: ID, turma_id, modulo_id, liberado_por, liberado_em, status (`liberado`, `bloqueado`).
6. `checkins_modulo`: ID, matricula_id, modulo_id, status (`rascunho`, `aguardando_avaliacao`, `ajuste_solicitado`, `aprovado`), data_envio, avaliado_por, parecer_texto, avaliado_em.
7. `checkin_evidencias`: ID, checkin_id, tipo (`link`, `arquivo`), valor_url, storage_path, nome_arquivo.
8. `faturamentos`: ID, matricula_id, mes_referencia (`YYYY-MM-01`), valor_bruto, storage_zip_path, criado_em, atualizado_em.
9. `canais_mentorados`: ID, matricula_id, canal_nome, url_canal, status (`nao_iniciado`, `ativo`), atualizado_em.
