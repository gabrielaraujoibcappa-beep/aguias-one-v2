# Guia Arquitetural de UX & Especificação de Upload de Arquivos (File Uploader)

Este documento estabelece o padrão oficial de experiência do usuário (UX), acessibilidade (W3C WAI-ARIA, WCAG 2.2) e engenharia de interface para o componente **Envio de Arquivos (UploadArquivos)** no **Sistema ÁGUIAS ONE (v2)**.

Ele consolida as práticas recomendadas do **Câmara UX**, **IBM Carbon Design System**, **Shopify Polaris**, **U.S. Web Design System (USWDS)**, **Padrão Digital de Governo (GOV.BR)**, **Baymard Institute** e diretrizes de segurança da **OWASP**.

---

## 1. Fundamentos & Modelo Mental

Enviar um arquivo envolve escolher um item fora da interface, conferir restrições, aguardar processamento e entender se a operação terminou. Quando o componente não informa formatos, limites, progresso ou erros, a pessoa pode selecionar o arquivo errado, repetir a ação ou perder o trabalho.

Uma boa experiência de upload:
1. **Torna os requisitos visíveis antes da seleção** (formatos aceitos, tamanho máximo por arquivo, limite de quantidade e obrigatoriedade);
2. **Oferece um botão nativo acessível por teclado** como caminho principal;
3. **Trata a área de arrastar e soltar (drag and drop) apenas como alternativa e conveniência**, nunca como o único meio de interação;
4. **Mostra o estado de cada arquivo selecionado de forma independente** (nome, tamanho em KB/MB, progresso, sucesso ou erro específico);
5. **Permite remover ou substituir cada arquivo individualmente** sem resetar o formulário ou apagar arquivos válidos;
6. **Explica com clareza o motivo de eventuais falhas** e oferece opção de tentar novamente.

---

## 2. Diretrizes de UX: Práticas Recomendadas vs. Práticas a Evitar

### Práticas Recomendadas (Faça)
* **Explique formatos e limites antes da seleção:** Deixe visível em texto de instrução os tipos aceitos (ex.: `PDF, PNG, JPG, ZIP`) e o tamanho máximo (ex.: `Até 25 MB por arquivo`).
* **Use um botão claro e acessível:** O gatilho primário deve ser um `<button type="button">` associado ao `input type="file"`, navegável por `Tab` e ativável por `Enter` ou `Space`.
* **Mostre os arquivos selecionados com metadados:** Liste cada item com ícone de formato, nome original e tamanho legível formatado (`1.4 MB`, `450 KB`).
* **Indique o estado e progresso de cada arquivo:** Forneça feedback visual de status (`Pronto para envio`, `Enviando (65%)`, `Concluído`, `Falha`).
* **Permita remoção e substituição individual:** Cada item da lista possui botão de exclusão com nome acessível (`aria-label="Remover arquivo comprovante.pdf"`).
* **Explique cada erro detalhadamente:** Apresente mensagens que orientem a recuperação (ex.: *"O arquivo ultrapassa o limite de 25 MB. Envie um arquivo menor ou compactado em ZIP"*).
* **Ofereça nova tentativa (*Retry*):** Permita reprocessar um arquivo com erro sem reiniciar a seleção dos outros.
* **Valide duplamente (cliente e servidor):** Valide no front-end para agilidade e feedback imediato, e valide extensão, MIME real e tamanho no back-end por segurança (OWASP).

### Práticas a Evitar (Evite)
* **Exigir arrastar e soltar:** Forçar o drag-and-drop como única alternativa exclui usuários de teclado, mobile e tecnologias assistivas.
* **Esconder limites e formatos:** Fazer a pessoa descobrir que o formato não é aceito apenas após clicar em enviar.
* **Usar feedback genérico:** Mensagens vagas como *"Erro no envio"* sem explicar se foi tamanho, formato ou conexão.
* **Bloquear a tela inteira sem necessidade:** Travar toda a interface durante uploads assíncronos que poderiam rodar em segundo plano.
* **Apagar arquivos válidos em falhas parciais:** Rejeitar todo o lote de 5 arquivos só porque 1 continha erro de extensão.
* **Aceitar tipos apenas pelo nome da extensão:** Não validar o tipo de conteúdo real no servidor.
* **Depender apenas de cor:** Indicar arquivos válidos (verde) e inválidos (vermelho) sem rótulos textuais e ícones distintos.

---

## 3. Checklist de Avaliação e Conformidade (15 Critérios)

| # | Critério de Avaliação | Implementação no Sistema ÁGUIAS ONE v2 |
| :-: | :--- | :--- |
| **1** | **Formatos aceitos descritos** | Texto visível de instrução antes do clique: `Formatos: PNG, JPG, PDF ou ZIP`. |
| **2** | **Tamanho máximo informado** | Exibição clara: `Tamanho máximo: até 25 MB por arquivo`. |
| **3** | **Quantidade máxima declarada** | Alerta quando aplicável: `Limite de até 5 arquivos simultâneos`. |
| **4** | **Botão acessível de seleção** | `<button type="button">` com foco visível e acionável por teclado (`Enter`/`Space`). |
| **5** | **Arrastar e soltar como alternativa** | Suporte a drag & drop com feedback visual de dragover, sem ser obrigatório. |
| **6** | **Arquivos selecionados identificados** | Lista com nome do arquivo, tamanho formatado e ícone representativo. |
| **7** | **Estado próprio para cada arquivo** | Cada item mantém seu estado: `pronto`, `enviando`, `concluido`, `erro`. |
| **8** | **Progresso compreensível** | Indicador de percentual e barra visual suave de upload. |
| **9** | **Remoção individual** | Botão `×` em cada arquivo com `aria-label="Remover arquivo [nome]"`. |
| **10** | **Erros explicativos** | Mensagens que orientam a correção com `role="alert"`. |
| **11** | **Opção de tentar novamente** | Botão contextual *"Tentar novamente"* em itens que sofreram falha temporária. |
| **12** | **Seleção funcional por teclado** | Tabindex sequencial, foco previsível e ativação nativa. |
| **13** | **Comunicação a tecnologias assistivas** | Região `role="status"` e `aria-live="polite"` anunciando adições e conclusões. |
| **14** | **Validação robusta** | Verificação de extensão, tamanho em bytes e sanitização de nome. |
| **15** | **Responsividade e toque mobile** | Área de toque superior a 44px, layout empilhado fluido e sem overflow horizontal. |

---

## 4. Especificação Técnica do Componente (`src/components/ui/UploadArquivos.tsx`)

### 4.1 Interface e Tipagem TypeScript

```typescript
export type StatusArquivo = "pronto" | "enviando" | "concluido" | "erro";

export interface ArquivoUploadItem {
  id: string;
  file?: File;
  nome: string;
  tamanhoBytes: number;
  tipoMime?: string;
  progresso: number; // 0 a 100
  status: StatusArquivo;
  mensagemErro?: string;
  urlPreview?: string;
}

export interface UploadArquivosProps {
  rotulo: string;
  descricao?: string;
  arquivos: ArquivoUploadItem[];
  onChange: (arquivos: ArquivoUploadItem[]) => void;
  formatosPermitidos?: string[]; // ex: [".pdf", ".png", ".jpg", ".jpeg", ".zip"]
  tamanhoMaximoBytes?: number;  // padrão: 25 * 1024 * 1024 (25 MB)
  maximoArquivos?: number;       // padrão: 5
  obrigatorio?: boolean;
  onTentarNovamente?: (item: ArquivoUploadItem) => void;
}
```

### 4.2 Semântica W3C WAI-ARIA & Acessibilidade
* **Rótulo & Instruções:**
  * `<label id="upload-label">` vinculado por `aria-labelledby`.
  * Parágrafo de requisitos com `id="upload-desc"` vinculado por `aria-describedby`.
* **Botão Trigger:**
  * `<button type="button">` associado ao `input type="file"` invisível através de `ref.click()`.
  * Suporte nativo a `Enter` e `Space`.
* **Lista de Arquivos:**
  * `<ul role="list" aria-label="Arquivos anexados">`.
  * Cada item `<li role="listitem">` com nome, tamanho e status.
* **Remoção Acessível:**
  * `<button aria-label="Remover arquivo [nome]">×</button>`.
* **Anúncio de Status:**
  * `<div role="status" aria-live="polite" class="sr-only">` anunciando alterações na lista para leitores de tela.

---

## 5. Aplicação no Sistema ÁGUIAS ONE v2

1. **Check-in de Entregas do Perito Solo (`/checkin/[moduloId]`):**
   - Substitui a área antiga de prints/documentos por `UploadArquivos` com limite de 25 MB e formatos PDF/PNG/JPG.
2. **Declaração de Faturamento Mensal (`/faturamento`):**
   - Padroniza o upload de comprovantes fiscais avulsos ou arquivo único compactado em `.ZIP`.
