# Template de Funcionalidades — HOUS3
*Da necessidade da persona a uma entrega que o time consegue construir*

---

## 1. Onde a funcionalidade entra na metodologia HOUS3

Na HOUS3, uma funcionalidade não nasce de uma ideia de tela. Ela nasce de um problema observado em um processo e vivido por uma persona.

Por isso, este material deve ser usado depois que você já tiver:
- Mapeado o processo atual;
- Identificado as etapas, decisões e gargalos desse processo;
- Definido as personas envolvidas;
- Entendido qual dor ou objetivo precisa ser atendido.

A funcionalidade transforma esses aprendizados em uma unidade de produto que pode ser priorizada, detalhada e entregue.

### A cadeia completa da metodologia:
```
Processo → Persona → Funcionalidade → Requisito funcional → Task → Entrega
```

Cada parte responde a uma pergunta diferente:
- **Processo:** onde o problema acontece?
- **Persona:** quem vive esse problema?
- **Funcionalidade:** o que o produto precisa permitir e por quê?
- **Requisito funcional:** quais comportamentos precisam existir para isso funcionar?
- **Task:** qual trabalho o time precisa executar?
- **Entrega:** como verificamos que o resultado foi alcançado?

Quando esses níveis são misturados, surgem funcionalidades sem problema real, requisitos vagos e tasks sem rastreabilidade.

---

## 2. O que é uma funcionalidade para a HOUS3

Uma funcionalidade é uma capacidade que o produto oferece para uma ou mais personas resolverem um problema ou alcançarem um resultado.

Ela **não é** necessariamente uma tela, um botão ou um componente.
Uma mesma funcionalidade pode envolver mais de uma tela. Da mesma forma, uma única tela pode apoiar várias funcionalidades.

### Exemplo inadequado:
> *"Tela de dashboard com cards e filtros."*  
> *(Descreve uma possível interface, mas não informa quem precisa dela, qual problema será resolvido ou qual resultado deve ser produzido).*

### Exemplo adequado:
> *"Como PM, quero visualizar as funcionalidades em risco na release, para agir antes que elas comprometam o prazo da entrega."*  
> *(Sabemos quem possui a necessidade, qual capacidade precisa existir e qual problema/resultado orienta a construção).*

---

## 3. Como a funcionalidade é registrada no Track

No Track, a funcionalidade é formada pelos seguintes elementos:
1. **Nome em formato de user story;**
2. **Descrição;**
3. **Referências;**
4. **Personas relacionadas;**
5. **Business Points;**
6. **Necessidade de design;**
7. **Requisitos funcionais;**
8. **Destino: backlog ou release.**

---

## 4. Nome da funcionalidade: a user story principal

```
Como [persona], quero [entrega ou capacidade], para resolver [problema ou alcançar resultado].
```

- **Como [persona]:** Identifica quem possui a necessidade. Use uma persona já definida no projeto.
- **Quero [entrega ou capacidade]:** Descreve o que a persona precisa conseguir fazer (a capacidade, não a tecnologia).
- **Para resolver [problema ou alcançar resultado]:** Conecta-se a uma dor, gargalo ou objetivo real.

### Reprova se:
- O nome for apenas uma tela ou componente;
- A persona estiver ausente ou genérica sem necessidade;
- O resultado for uma repetição da entrega;
- A frase já determinar uma solução técnica;
- Não for possível relacioná-la ao processo e à persona definidos anteriormente.

---

## 5. Descrição: contexto suficiente para orientar o time

Responde a quatro perguntas:
1. **Onde essa necessidade aparece?** (Etapa do processo).
2. **O que acontece hoje?** (Comportamento atual, gargalo e impacto).
3. **O que deve mudar?** (Resultado esperado para a persona e para o negócio).
4. **Quais são os limites?** (O que inclui e o que não inclui).

### Estrutura da descrição:
- **Contexto:** [Em qual etapa do processo essa necessidade aparece?]
- **Problema atual:** [O que acontece hoje e qual impacto isso causa?]
- **Resultado esperado:** [O que deve mudar para a persona e negócio?]
- **Escopo:**
  - *Inclui:* [itens dentro do escopo]
  - *Não inclui:* [itens fora do escopo]
- **Pendências conhecidas:** [decisões ainda necessárias formuladas como perguntas objetivas]

---

## 6. Referências: preservar a origem da decisão

Documentos e insumos conectados à funcionalidade:
- Fluxograma do processo;
- Documento de personas;
- Ata ou gravação de reunião;
- PRD ou protótipo;
- Links externos ou arquivos anexados.

---

## 7. Personas relacionadas

- **Principal:** persona da user story.
- **Secundárias:** personas que também utilizam, alimentam, aprovam ou são impactadas.

---

## 8. Business Points: medir valor, não esforço

- **1 BP — Baixo valor:** melhoria localizada, impacto restrito ou benefício incremental.
- **3 BP — Valor médio:** resolve uma dor relevante ou melhora significativamente uma etapa.
- **5 BP — Alto valor:** capacidade crítica, impacto amplo, redução de risco vital ou ligação estratégica.

*Esforço e complexidade técnica são avaliados separadamente durante o planejamento da entrega.*

---

## 9. Necessidade de design

Avalia se há novo fluxo de interação, mudança de jornada, múltiplos estados ou organização de informação complexa.
- **Requer design:** [Sim / Não]
- **Responsável:** [Nome quando aplicável]

---

## 10. Requisitos funcionais (RFs)

Estrutura recomendada:
```
RF-XXX — [Ator ou sistema] deve [comportamento] quando [condição], produzindo [resultado esperado].
```

- Descreve comportamento observável e testável.
- RF descreve o comportamento; task descreve o trabalho técnico para produzi-lo.

---

## 11. Destino: Backlog ou Release

- **Backlog:** necessidade identificada com decisões em aberto ou sem compromisso de versão.
- **Release:** escopo compreendido, requisitos definidos e intenção real de entrega na versão.

---

## 12. Template em Branco

```markdown
# [Nome da funcionalidade em formato de user story]

Como [persona], quero [entrega ou capacidade], para resolver [problema ou alcançar resultado].

## Descrição

### Contexto
[Em qual etapa do processo essa necessidade aparece?]

### Problema atual
[O que acontece hoje e qual impacto isso causa?]

### Resultado esperado
[O que deve mudar para a persona e para o negócio?]

### Escopo

Inclui:
- [item]
- [item]

Não inclui:
- [item]
- [item]

### Pendências conhecidas
- [pergunta que precisa receber uma decisão]

## Referências
- [fluxograma, persona, PRD, protótipo, call, link ou arquivo]

## Personas relacionadas
- Principal: [persona da user story]
- Secundárias: [se houver]

## Business Points
- [1, 3 ou 5 BP]
- Justificativa: [por que esse é o valor relativo da funcionalidade?]

## Design
- Requer design? [Sim/Não]
- Responsável: [quando aplicável]

## Requisitos funcionais
- RF-001 — [comportamento verificável]
- RF-002 — [regra ou validação]
- RF-003 — [permissão, estado, ausência ou falha relevante]

## Destino
- [Backlog ou nome da release]
```

---

## 13. Exemplo Preenchido (Referência)

```markdown
# Como PM, quero visualizar as funcionalidades em risco na release, para agir antes que elas comprometam o prazo da entrega

Como PM, quero visualizar as funcionalidades em risco na release, para agir antes que elas comprometam o prazo da entrega.

## Descrição

### Contexto
Durante o acompanhamento da release, o PM precisa identificar quais funcionalidades estão bloqueadas, atrasadas ou sem avanço suficiente. Hoje essa análise depende de abrir cada item e reunir informações dispersas.

### Problema atual
A falta de uma visão consolidada faz com que riscos sejam percebidos tarde. Isso aumenta a chance de atraso e torna a comunicação com a equipe reativa.

### Resultado esperado
Permitir que o PM reconheça rapidamente as funcionalidades que precisam de atenção, entenda o motivo do risco e priorize ações antes que o prazo da release seja comprometido.

### Escopo
Inclui:
- Identificar funcionalidades bloqueadas ou em risco;
- Apresentar o motivo associado à situação;
- Permitir acesso ao detalhe da funcionalidade;
- Filtrar a visualização por situação.

Não inclui:
- Prever automaticamente a data final da release;
- Enviar notificações externas;
- Replanejar tasks automaticamente.

### Pendências conhecidas
- Qual período sem movimentação faz uma funcionalidade ser classificada como em risco?

## Referências
- Fluxograma do acompanhamento de releases;
- Persona PM;
- Registro da reunião de planejamento do produto.

## Personas relacionadas
- Principal: PM
- Secundárias: Liderança de tecnologia e responsáveis pelas tasks

## Business Points
- 5 BP
- Justificativa: Reduz risco de atraso da release e melhora a capacidade de reação do time.

## Design
- Requer design: Sim
- Entrega esperada: Definição da hierarquia das situações, filtros e estados da listagem.

## Requisitos funcionais
- RF-001 — O sistema deve identificar visualmente funcionalidades bloqueadas ou em situação de risco.
- RF-002 — O sistema deve apresentar o motivo pelo qual a funcionalidade recebeu aquela classificação.
- RF-003 — O PM deve conseguir filtrar as funcionalidades por situação.
- RF-004 — O PM deve conseguir acessar o detalhe da funcionalidade a partir da visualização da release.
- RF-005 — Quando nenhuma funcionalidade estiver em risco, o sistema deve informar que a release não possui itens que exigem atenção naquele momento.
- RF-006 — Quando parte dos dados da release estiver indisponível, o sistema deve indicar que a classificação pode estar incompleta.

## Destino
Backlog até a definição do período de inatividade que caracteriza risco.
```

---

## 14. Checklist antes de cadastrar no Track

- [ ] A funcionalidade nasce de um problema identificado no processo.
- [ ] Existe uma persona relacionada à necessidade.
- [ ] O nome segue "Como [persona], quero [entrega], para resolver [problema]".
- [ ] A entrega descreve uma capacidade, e não apenas uma tela ou componente.
- [ ] A descrição explica contexto, problema, resultado e limites.
- [ ] As fontes relevantes estão vinculadas como referências.
- [ ] As personas relacionadas foram selecionadas conscientemente.
- [ ] O Business Point representa valor, e não esforço.
- [ ] A necessidade de design foi avaliada.
- [ ] Existe pelo menos um requisito funcional verificável.
- [ ] Erros e cenários de contorno relevantes estão cobertos por RFs.
- [ ] Dúvidas não foram transformadas em regras por suposição.
- [ ] Pendências bloqueantes mantêm a funcionalidade no backlog.
- [ ] A funcionalidade está pronta para ser quebrada em tasks rastreáveis.
