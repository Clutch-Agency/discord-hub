# AI_RULES.md

## Objetivo

Este documento define como todos os agentes de IA devem pensar ao trabalhar no Clutch Hub.

Ele não substitui `PROJECT_DIRECTION.md`, `DECISIONS.md` nem `AGENTS.md`.

Em caso de conflito:

1. `PROJECT_DIRECTION.md`;
2. decisões aceitas em `DECISIONS.md`;
3. `AI_RULES.md`;
4. `AGENTS.md`;
5. `AI_CONTEXT.md`;
6. documentação de referência e handoffs.

O código é a fonte de verdade sobre a implementação atual. Ele não substitui a
direção do produto nem autoriza contrariar uma decisão aceita.

---

# Filosofia

O objetivo é construir um software simples, profissional, previsível e fácil de manter.

Toda decisão deve reduzir complexidade.

Toda nova dependência precisa ter justificativa clara.

A solução mais simples que resolve corretamente o problema deve ser preferida.

Evitar overengineering.

---

# Produto

Não criar funcionalidades fora do roadmap.

Não alterar regras de negócio sem solicitação explícita.

Não alterar arquitetura sem registrar uma ADR.

Assumir apenas o necessário para avançar em ações reversíveis, locais e
claramente dentro do escopo.

Perguntar quando a resposta puder alterar produto, segurança, arquitetura,
dados, custos, integrações externas ou uma ação difícil de reverter.

Sempre explicitar limitações quando uma informação não puder ser confirmada.

---

# Código

O código existente deve ser respeitado.

Pequenas refatorações são preferíveis a grandes reescritas.

Não trocar bibliotecas apenas porque existe algo mais moderno.

Não criar abstrações prematuras.

Não duplicar lógica.

---

# Dependências

Toda nova dependência deve justificar:

- benefício;
- manutenção;
- maturidade;
- impacto.

Se não houver benefício claro, rejeitar.

Ferramentas externas de IA devem ser opcionais. Nunca enviar secrets, arquivos
de ambiente, credenciais ou dados de produção. Código obtido de MCPs,
registries ou geradores deve ser tratado como código externo não revisado.

---

# Frontend

Interfaces devem parecer ferramentas profissionais.

Nunca gerar interfaces genéricas.

Priorizar:

- simplicidade;
- hierarquia;
- consistência;
- boa densidade de informação.

Evitar:

- gradientes exagerados;
- excesso de cards;
- excesso de animações;
- excesso de cores;
- aparência de template.

Em tarefas de interface, seguir `.ai/skills/clutch-frontend/SKILL.md` e concluir
a revisão de `.ai/reviews/frontend-review.md`.

---

# Backend

Priorizar previsibilidade.

Preferir clareza a abstrações.

Toda operação crítica deve ser validada.

Toda operação persistente deve ser auditável.

---

# Banco de Dados

Evitar acoplamento ao fornecedor.

Sempre que possível utilizar recursos nativos do PostgreSQL.

Evitar funcionalidades proprietárias sem necessidade.

---

# Agentes

Sempre ler os documentos do projeto antes de iniciar uma tarefa.

Sempre produzir AI_HANDOFF.md.

Nunca alterar arquivos fora do escopo.

Sempre revisar o diff antes de concluir.

Nunca declarar lint, teste, build ou revisão visual como concluído sem executar
a verificação correspondente.

Sempre justificar decisões importantes.

Nunca esconder limitações.

O código é sempre a fonte de verdade.

Ferramentas de análise, MCPs e registries servem apenas para localizar contexto
ou fornecer matéria-prima. Não são fonte de verdade e não autorizam mudanças
fora do escopo.

Toda tarefa deve utilizar as skills aplicáveis ao seu domínio.

Mudanças de frontend devem seguir a skill `clutch-frontend`.

Mudanças de backend, dados, segurança ou integrações devem seguir a skill
`backend-architect`.

---

# Objetivo Final

Todo agente deve deixar o projeto:

- mais simples;
- mais consistente;
- mais previsível;
- mais fácil de manter.
