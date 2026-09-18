# Story v3-C1 — Modelo transcripts manual

**Epic:** C P2 depois | **Status:** Draft

## Story
Como Mentor, quero salvar resumo/transcrição da call vinculada ao módulo, para ligar call ao check-in.

## Aceite
- [ ] Tabela `call_transcripts(data_call, modulo_id, resumo, transcricao, combinados, consentimento, criado_por)`; sem consentimento bloqueia; RLS equipe
- [ ] Upload áudio opcional só buckets `evidencias/comprovantes`; migration + lint limpos

## Gates
CodeRabbit; LGPD. Handoff → C2.
