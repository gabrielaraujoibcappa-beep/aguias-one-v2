# Template de Personas — HOUS3

---

## 1\. Por que a HOUS3 define persona dentro do Escopo Técnico

Persona, para a maior parte do mercado, é artefato de marketing: idade, hobbies, foto de banco de imagem, uma frase de efeito. Esse formato não sobrevive ao contato com o desenvolvimento — ninguém escreve uma regra de negócio a partir de "Ana, 34 anos, gosta de viajar".

Na HOUS3 a persona nasce **dentro do escopo técnico**, e não em um documento paralelo, por quatro razões:

**1\. A persona é a origem de cada feature.** Toda funcionalidade do roadmap precisa responder a *alguém* fazendo *alguma coisa* que hoje dói. Quando a persona vive no mesmo documento que features e RFs, a rastreabilidade é direta: dá para perguntar "de qual persona veio esta feature?" e obter resposta. Feature sem persona é escopo inflado esperando para ser cortado.

**2\. Persona é ferramenta de decisão, não de empatia.** O que o time precisa saber para priorizar não é o perfil demográfico do usuário — é o que ele faz hoje, com o que ele sofre e como ele já resolve isso na marra. Esses três dados sustentam corte de escopo, definição de MVP e discussão de prioridade com o cliente.

**3\. Reduz o achismo na conversa com o cliente.** Persona escrita a partir das calls, com a linguagem do próprio cliente, funciona como acordo. Quando o cliente pede uma feature que nenhuma persona precisa, o documento devolve a pergunta — sem que ninguém precise dizer "não" no braço.

**4\. A "solução atual" é o benchmark real do produto.** O concorrente do software que vamos construir quase nunca é outro software: é a planilha, o grupo de WhatsApp, o caderno, o estagiário. Se o que vamos entregar não for melhor do que a gambiarra que já existe, a adoção não acontece. Por isso "soluções atuais" é campo obrigatório.

**Consequência prática:** a persona da HOUS3 tem quatro blocos obrigatórios — **Nome · Contexto · Frustração · Soluções atuais** — e nada além disso é exigido. Os campos de apoio da seção 3 existem para casos mais complexos e podem ser deixados em branco sem prejuízo.

---

## 2\. O modelo — 4 blocos obrigatórios

### 2.1 Nome

**O que é:** o rótulo funcional da persona — o papel que ela exerce no sistema, não a pessoa física. No documento, o Nome é o próprio título do bloco da persona.

**Como preencher:** use o nome que o próprio cliente usa no dia a dia. Se ele fala "sócio operacional", não escreva "gestor". Se existir sigla interna, registre a sigla e a expansão na primeira menção. Quando ajudar, acrescente uma analogia de uma linha que qualquer pessoa entenda ("é o corretor de imóveis da operação").

**Entra aqui:** papel · sigla/expansão · analogia curta · quem de fato opera na prática (o papel formal e quem senta na cadeira nem sempre coincidem).

**Não entra:** nome fictício de pessoa, idade, foto, personalidade.

**Reprova se:** o nome for genérico a ponto de servir para qualquer projeto ("usuário", "cliente", "administrador" sem qualificação).

### 2.2 Contexto

**O que é:** a situação operacional em que essa persona vive — o que ela faz, com que frequência, com quem, sob quais restrições.

**Como preencher:** descreva a rotina real. Volume e frequência importam mais do que adjetivos: "opera de 2 a 10 operações simultâneas" diz mais do que "opera muitas operações". Registre também o que a persona **não** decide e o que depende de terceiros — é aí que aparecem as integrações e os gates de aprovação.

**Entra aqui:** rotina e ciclo de trabalho · volume e frequência · quem ela depende e quem depende dela · restrições regulatórias, contratuais ou de porte · nível de maturidade técnica.

**Não entra:** funcionalidade desejada (isso é feature) e solução proposta (isso é escopo).

**Reprova se:** o contexto for tão genérico que caberia em qualquer cliente do mesmo segmento, ou se não trouxer nenhum número.

### 2.3 Frustração

**O que é:** a dor concreta que essa persona sente hoje, na ausência do produto.

**Como preencher:** uma frustração por linha, cada uma com a consequência prática. O teste é: *dá para medir se isso melhorou?* "Não tem visibilidade" é fraco; "descobre que uma operação travou só quando o assessor liga cobrando, às vezes dias depois" é forte. Sempre que possível, use as palavras da call — frase do cliente entre aspas vale mais do que paráfrase.

**Entra aqui:** o atrito · quando ele acontece no fluxo · o custo (tempo, retrabalho, dinheiro, risco, relação com o cliente final).

**Não entra:** "falta de sistema" como frustração. A ausência do produto não é a dor; a dor é o que acontece por causa dela.

**Reprova se:** a frustração for a negação da feature que já decidimos construir ("não tem dashboard"). Isso é raciocínio ao contrário e blinda o escopo de qualquer questionamento.

### 2.4 Soluções atuais

**O que é:** como a persona resolve hoje o problema, sem nós.

**Como preencher:** liste os workarounds reais, com nome e ferramenta: planilha, WhatsApp, e-mail, ERP legado, caderno, pedido para outra pessoa, contratação de terceiro. Para cada um, registre por que ele ainda não foi abandonado — o que essa gambiarra faz bem. Esse "faz bem" costuma ser requisito escondido, e ignorá-lo é a causa mais comum de produto entregue e não adotado.

**Entra aqui:** ferramenta ou processo usado · o que ele resolve · onde ele quebra · quanto custa (tempo/dinheiro) · o que a persona teria que abandonar para migrar para o nosso produto.

**Não entra:** produto concorrente que ela não usa. Se ela não usa, é análise de mercado, não solução atual.

**Reprova se:** o campo estiver vazio ou escrito como "não existe solução hoje". Sempre existe — se ninguém achou, a call não foi fundo o bastante.

---

## 3\. Campos de apoio (opcionais)

Preencha apenas quando o projeto exigir. Nenhum deles substitui os quatro blocos acima.

- **O que a persona NÃO faz** — use quando houver risco de o time atribuir a ela responsabilidades de terceiros. Registre fronteiras explícitas: o que ela solicita mas não executa, o que passa por aprovação de outro agente.  
- **Papéis acumulados** — use quando a mesma pessoa exerce mais de um papel do ecossistema. Registre quais papéis se acumulam, em que situação, e como o sistema deve distinguir as responsabilidades.  
- **Hierarquia / relação com outras personas** — use em ecossistemas com três ou mais personas. Registre quem origina, quem executa, quem aprova e quem consome, em uma linha de fluxo.  
- **Vínculo com features / RFs** — use sempre que o ET já tiver roadmap. Registre os IDs das features e RFs que nascem dessa persona.  
- **Fontes** — use sempre que possível. Registre call e data, documento, protótipo ou pessoa que originou cada afirmação.  
- **Pendências** — use quando houver lacuna conhecida. Marque com PENDENTE entre colchetes e escreva a pergunta exata a levar para a próxima call.

---

## 4\. Template em branco

Copie o bloco abaixo uma vez para cada persona do projeto. O título do bloco é o campo Nome.

### Persona: \[nome do papel — sigla, se houver\]

**Analogia:** \[uma linha que qualquer pessoa entenda\]

**Quem opera na prática:** \[cargo/perfil de quem senta na cadeira\]

#### Contexto

\[Rotina, volume, frequência, dependências e restrições. Use números.\]

#### Frustração

- \[Dor 1 — o que acontece hoje e qual o custo\]  
- \[Dor 2 — o que acontece hoje e qual o custo\]  
- \[Dor 3 — o que acontece hoje e qual o custo\]

#### Soluções atuais

- **\[Ferramenta ou processo\]** — resolve \[o quê\]; quebra em \[onde\]; custa \[tempo/dinheiro/risco\]  
- **\[Ferramenta ou processo\]** — resolve \[o quê\]; quebra em \[onde\]; custa \[tempo/dinheiro/risco\]

#### Campos de apoio *(opcional — apague os que não usar)*

**O que NÃO faz:** \[fronteiras\]

**Papéis acumulados:** \[se houver\]

**Hierarquia / relação com outras personas:** \[quem origina → quem executa → quem aprova → quem consome\]

**Features/RFs relacionadas:** \[IDs\]

**Fontes:** \[call / documento / data\]

**Pendências:** \[PENDENTE\] \[pergunta em aberto\]  
