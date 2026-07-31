# AGENTS.md — Instruções para agentes de IA

## Contexto obrigatório

Antes de alterar o projeto, leia:

1. `PROJECT_DIRECTION.md`;
2. `DECISIONS.md`;
3. `AI_RULES.md`;
4. `AI_CONTEXT.md`;
5. `PROJECT_REPORT.md`;
6. `AI_HANDOFF.md`;
7. documentação específica da funcionalidade alterada.

O `PROJECT_DIRECTION.md` define o propósito e as prioridades do projeto.

O `AI_CONTEXT.md` descreve o estado técnico atual.

O `PROJECT_REPORT.md` contém uma auditoria e pode representar um ponto específico no tempo. Confirme no código se uma conclusão ainda é válida.

O `AI_HANDOFF.md` descreve a entrega mais recente e também pode representar
somente um ponto no tempo. A hierarquia completa está em `AI_RULES.md`.

## Objetivo atual

O projeto está na fase de estabilização e empacotamento.

As prioridades são:

1. segurança;
2. correção;
3. estabilidade;
4. testes;
5. instalação plug-and-play;
6. manutenção;
7. novas funcionalidades somente depois.

Não implementar novas ferramentas sem uma solicitação explícita.

## Regra de escopo

Antes de modificar código:

- identifique os arquivos envolvidos;
- descreva o problema;
- explique a solução pretendida;
- identifique riscos;
- mantenha a alteração limitada ao escopo solicitado.

Não executar grandes refatorações silenciosamente.

Não reorganizar pastas, substituir frameworks ou introduzir novos padrões sem justificar previamente.

## Segurança

Toda operação deve considerar dados manipulados pelo cliente como não confiáveis.

Toda Server Action deve validar:

- sessão;
- identidade do usuário;
- ownership do recurso;
- acesso à guild;
- permissões administrativas na guild;
- formato dos IDs;
- enumerações;
- comprimentos;
- faixas numéricas;
- arrays recebidos.

Nunca considerar um hidden input, ID de rota ou argumento de Server Action como confiável.

Nunca permitir que um usuário acesse, altere ou remova recursos de outro usuário ou de uma guild que ele não administra.

Nunca registrar:

- tokens;
- secrets;
- cookies;
- connection strings;
- credenciais OAuth;
- conteúdo integral de variáveis de ambiente.

## Arquitetura

Preservar a arquitetura atual:

- Next.js para painel e backend web;
- App Router;
- Server Components por padrão;
- Server Actions para mutações internas;
- bot Discord em processo separado;
- PostgreSQL compartilhado;
- Prisma como ORM.

Não introduzir NestJS, microserviços, Redis, filas ou Kubernetes sem necessidade concreta e aprovação explícita.

Usar Client Components apenas quando houver interação ou estado no navegador.

Antes de alterar APIs, convenções ou estrutura do Next.js, leia a documentação
relevante da versão instalada em `node_modules/next/dist/docs/`. Esta versão
pode divergir do conhecimento prévio do agente.

## Frontend e design

Em qualquer tarefa que altere interface, componente, estilo, interação,
responsividade ou acessibilidade:

- ler `.ai/skills/clutch-frontend/SKILL.md`;
- seguir `.ai/design/FOUNDATIONS.md`;
- concluir `.ai/reviews/frontend-review.md`;
- realizar revisão visual renderizada em desktop e mobile quando houver
  mudança visual material.

O MCP shadcn configurado no projeto é opcional e serve para pesquisa e inspeção.
Não instalar componentes ou dependências sem revisar código, licença,
acessibilidade, impacto e aderência à arquitetura atual.

Graphify não faz parte da infraestrutura adotada. Se for reavaliado, registrar
uma nova decisão antes de instalar runtime, skill, MCP ou artefatos derivados.

## Prisma e banco

- Reutilizar o cliente Prisma apropriado de cada processo.
- Não criar novas instâncias dispersas de `PrismaClient`.
- Não editar migrations aplicadas.
- Criar migrations incrementais.
- Adicionar índices quando uma consulta frequente justificar.
- Não usar SQL raw sem necessidade e justificativa.
- Planejar idempotência e compensação em operações que alterem Discord e banco.

## Integração Discord

O painel não deve executar operações Discord sem verificar que o usuário administra a guild correspondente.

Operações Discord devem considerar:

- ausência da guild;
- ausência do canal;
- permissões insuficientes do bot;
- recurso removido manualmente;
- timeout;
- retry seguro;
- execução parcial;
- compensação;
- idempotência.

Estado necessário após restart não deve existir exclusivamente em `Map` ou `Set`.

## Docker e self-hosting

A instalação padrão deve ocorrer por Docker Compose.

Não exigir no host:

- Node.js;
- npm;
- Prisma CLI;
- PostgreSQL;
- PM2.

A stack deve utilizar:

- imagens reproduzíveis;
- tags de versão;
- volumes nomeados;
- healthchecks;
- restart policy;
- rede interna;
- migrations controladas;
- configuração por `.env`;
- uma única porta pública por padrão.

Não publicar a porta do PostgreSQL.

Não publicar a API interna do bot.

Dentro de containers separados, não usar `127.0.0.1` para comunicação entre web e bot. Usar o nome do serviço Docker, mantendo a porta apenas na rede interna.

A API do bot deve continuar exigindo um segredo compartilhado, mesmo dentro da rede Docker.

## Compatibilidade

Priorizar Linux amd64.

Sempre que as dependências permitirem, manter compatibilidade com Linux arm64 para instalações em servidores domésticos.

Evitar dependências nativas desnecessárias que dificultem imagens multi-arquitetura.

## Testes mínimos

Para toda correção importante:

- adicionar teste da regra corrigida;
- testar caminho permitido;
- testar caminho negado;
- testar entrada inválida;
- testar ausência do recurso externo quando aplicável.

Antes de concluir uma tarefa, executar:

- lint;
- testes;
- build;
- validação do Compose;
- migrations em banco descartável, quando a tarefa envolver banco.

## Documentação

Atualizar documentação quando houver alteração em:

- arquitetura;
- variáveis de ambiente;
- instalação;
- migrations;
- comandos;
- fluxo de autenticação;
- integração Discord;
- regras de negócio;
- backup;
- atualização.

Registrar decisões arquiteturais relevantes em `DECISIONS.md`.

Atualizar `AI_CONTEXT.md` somente quando a mudança alterar significativamente o contexto permanente do projeto.

Atualizar `AI_HANDOFF.md` ao concluir uma fase ou tarefa de implementação,
registrando verificações realmente executadas, limitações e próximo passo.

## Comportamento esperado do agente

Ao receber uma tarefa:

1. analisar o código relevante;
2. apresentar diagnóstico;
3. propor uma abordagem limitada;
4. implementar;
5. executar verificações;
6. informar exatamente o que mudou;
7. informar o que não foi possível verificar;
8. listar riscos restantes.

Não declarar que algo funciona sem ter executado a verificação correspondente.

Não esconder erros de lint, build, testes ou migrations.

## Backend

Para qualquer tarefa que envolva backend, Server Actions, Route Handlers,
Prisma, PostgreSQL, autenticação, autorização, Discord Bot, persistência,
integrações ou segurança, utilizar obrigatoriamente a skill:

`.ai/skills/backend-architect/SKILL.md`

A skill pode ser descoberta automaticamente pelo Codex por meio de:

`.agents/skills/backend-architect/SKILL.md`