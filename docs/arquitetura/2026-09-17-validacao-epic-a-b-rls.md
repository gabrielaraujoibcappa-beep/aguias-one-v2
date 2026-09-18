# Parecer de Arquitetura — Validação de Modelo de Dados & RLS (EPIC A + EPIC B)

**Data:** 17 de setembro de 2026  
**Arquiteto Responsável:** @architect  
**Epics Analisados:**
- [EPIC A — Export PDF Auditoria Anti-Reembolso (v3 P0)](file:///c:/Users/ibcap/Ibcappainstituto%20Dropbox/02%20-%20UniBCAPPA%20-%20POS/04%20-%20MENTORIA/01%20-%20%C3%81GUIAS%20ONE/06-sistema/v2/docs/epics/v3-EPIC-A-auditoria-pdf.md)
- [EPIC B — Alerta Preditivo 1 Amarela (v3 P0)](file:///c:/Users/ibcap/Ibcappainstituto%20Dropbox/02%20-%20UniBCAPPA%20-%20POS/04%20-%20MENTORIA/01%20-%20%C3%81GUIAS%20ONE/06-sistema/v2/docs/epics/v3-EPIC-B-alerta-precoce.md)

---

## 1. Veredito Geral

| Epic | Modelo Proposto | RLS / Segurança | Desempenho | Parecer Final |
| :--- | :---: | :---: | :---: | :---: |
| **EPIC A (Audit Export PDF)** | Aprovado c/ ressalva | Aprovado | Aprovado (<5s) | **APROVADO COM RECOMENDAÇÕES** |
| **EPIC B (Alerta Preditivo)** | Aprovado | Aprovado | Aprovado (cálculo em memória) | **APROVADO** |

---

## 2. Análise Detalhada — EPIC A (Export PDF Auditoria Anti-Reembolso)

### 2.1 Modelo de Dados Proposto: `public.audit_exports`
```sql
CREATE TABLE IF NOT EXISTS public.audit_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  aluno_id UUID NOT NULL REFERENCES public.usuarios(id) ON DELETE CASCADE,
  matricula_id UUID REFERENCES public.matriculas(id) ON DELETE SET NULL,
  filtros_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  total_itens INTEGER NOT NULL DEFAULT 0,
  gerado_por UUID NOT NULL REFERENCES public.usuarios(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

### 2.2 Avaliação de RLS e LGPD
1. **Append-only Rigoroso**:
   - Assim como `evento_sistema` e `anjo_nota`, a tabela `audit_exports` **NUNCA deve aceitar `UPDATE` nem `DELETE`**.
   - Deve ser associada à trigger `trg_append_only`:
     ```sql
     CREATE TRIGGER trg_audit_exports_append_only
       BEFORE UPDATE OR DELETE ON public.audit_exports
       FOR EACH ROW EXECUTE FUNCTION public.fn_recusar_alteracao_append_only();
     ```
2. **Políticas de Acesso (Row Level Security)**:
   - **SELECT**: Apenas membros da equipe (`public.eh_equipe(auth.uid())`). Mentorado **NUNCA** lista a tabela diretamente pelo cliente.
   - **INSERT**: Apenas via service role (rotas `/api/auditoria/export`). Nenhum cliente anon/authenticated insere diretamente.
   - O campo `gerado_por` deve ser estritamente preenchido a partir da sessão resolvida no servidor (`auth.sessao.usuarioId`), jamais aceito a partir do payload JSON da requisição.

### 2.3 Desempenho & SLA (<5s para 50 itens)
- O endpoint `GET /api/auditoria/export` deve utilizar queries compostas com `Promise.all` e índices específicos em `entregas(aluno_id, created_at)` e `faturamentos(matricula_id, mes_referencia)`.
- A geração da timeline é feita server-side em memória e devolvida em JSON formatado; a renderização e quebra de páginas A4 é delegada ao motor CSS de impressão nativo do navegador (`@media print`), garantindo tempo de resposta de API inferior a 600ms.

---

## 3. Análise Detalhada — EPIC B (Alerta Preditivo 1 Amarela)

### 3.1 Modelo de Dados & Persistência
- **Zero impacto no schema principal**: A classificação do alerta precoce é calculada por **função pura** (`avaliarAlertaPrecoce`) no momento da leitura da turma.
- Não requer colunas mutáveis na tabela `matriculas`, evitando problemas de concorrência ou locks de escrita.
- **Log de Ocorrência**: Quando o estado do alerta transicionar para positivo pela primeira vez na semana, registrar evento na tabela existente `public.evento_sistema`:
  - `codigo`: `'alerta.atencao_precoce'`
  - `matricula_id`: ID da matrícula
  - `dados`: `{ motivo: "atraso_critico", pct_atraso: 0.45, semaforo_cor: "amarelo" }`

### 3.2 Avaliação de RLS e Regressão
1. **Regressão de Semáforo / Resgate**:
   - A regra existente estipula que **2 semanas em vermelho** acionam o fluxo do Resgate (Adelayne).
   - O Alerta Preditivo atua exclusivamente sobre o estado **Amarelo** e **NÃO** antecipa o Resgate nem altera a contagem de semanas vermelhas.
   - O isolamento entre equipe (Anjo/Concierge) e Resgate permanece 100% íntegro.
2. **Privacidade e Proteção contra Spam**:
   - A ausência intencional de automação de disparo por WhatsApp previne envio indevido de mensagens aos mentorados. O Anjo decide ativamente se e quando entrará em contato.

---

## 4. Recomendações para os Desenvolvedores (@dev)
1. **Segurança de Parâmetros**:
   - No `GET /api/auditoria/export`, rejeitar IDs não-UUID imediatamente com 400.
   - Validar se o `alunoId` informado pertence à turma de atuação do Anjo/Concierge autenticado (`podeAcessarMatricula`).
2. **CSS Print**:
   - Utilizar classes com escopo limpo (`rel-folha`, `rel-timeline-item`) e garantir `page-break-inside: avoid`.
3. **Tratamento de Strings Numéricas no Frontend**:
   - Garantir extração de dígitos de moeda com `replace(/\D/g, "")` para evitar valores `NaN` no JSON enviado ao backend.

---
**Status da Aprovação:** Autorizado para início do desenvolvimento (@dev) com base nas stories v3-A1..A4 e v3-B1..B3.
