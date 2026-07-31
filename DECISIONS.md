# DECISIONS.md

> Registro das decisões arquiteturais do Clutch Hub.
>
> Este documento explica **por que** determinadas decisões foram tomadas.
>
> Não altere decisões já aceitas. Caso uma decisão mude, crie uma nova ADR e marque a anterior como substituída.
>
> Status possíveis:
>
> - Proposta
> - Aceita
> - Substituída
> - Descartada

---

# ADR-001 — O Clutch Hub é uma ferramenta pessoal

**Status:** Aceita

**Data:** 31/07/2026

## Contexto

O Clutch Hub nasceu para aumentar minha produtividade como Producer e Project Manager de jogos.

O projeto não está sendo desenvolvido como um produto comercial neste momento.

## Decisão

O projeto será tratado inicialmente como uma ferramenta pessoal.

Toda decisão técnica deve priorizar:

- simplicidade;
- produtividade;
- estabilidade;
- segurança;
- facilidade de instalação.

Billing, planos, organizações e recursos empresariais ficam fora do escopo atual.

## Consequências

### Positivas

- menor complexidade
- desenvolvimento mais rápido
- foco naquilo que realmente utilizo

### Negativas

Uma futura comercialização poderá exigir adaptações.

---

# ADR-002 — Priorizar simplicidade

**Status:** Aceita

## Contexto

O projeto foi iniciado rapidamente utilizando IA.

Adicionar arquitetura complexa cedo demais aumentaria a dívida técnica.

## Decisão

Sempre escolher a solução mais simples que seja:

- segura;
- compreensível;
- fácil de manter.

Não adicionar tecnologias apenas porque são populares.

## Não utilizar sem necessidade real

- Microserviços
- Kubernetes
- Redis
- Event Bus
- Filas
- Múltiplos bancos
- APIs separadas

## Consequências

O projeto evolui de forma incremental, evitando overengineering.

---

# ADR-003 — Next.js é a aplicação principal

**Status:** Aceita

## Contexto

O Next.js já resolve:

- interface
- autenticação
- rotas
- renderização
- backend web

## Decisão

O Next.js continuará sendo o framework principal.

Não existe necessidade atual de separar frontend e backend.

## Consequências

Menos infraestrutura.

Menos código.

Mais velocidade de desenvolvimento.

---

# ADR-004 — Server Actions ao invés de API REST

**Status:** Aceita

## Contexto

O painel não possui consumidores externos.

## Decisão

Server Actions serão utilizadas para todas as operações internas.

Toda Action deve validar:

- autenticação
- autorização
- ownership
- IDs
- guild
- enums
- limites

Nenhuma Action deve confiar em dados enviados pelo cliente.

---

# ADR-005 — Bot Discord separado

**Status:** Aceita

## Contexto

O bot precisa permanecer conectado continuamente ao Discord Gateway.

O painel web responde apenas requisições HTTP.

## Decisão

O bot continuará sendo um processo independente.

Arquitetura:

- Next.js
- Bot Discord
- PostgreSQL compartilhado

## Consequências

Melhor separação de responsabilidades.

Melhor compatibilidade com Docker.

---

# ADR-006 — PostgreSQL compartilhado

**Status:** Aceita

## Contexto

O painel grava dados.

O bot precisa consultá-los.

## Decisão

Os dois processos compartilharão o mesmo PostgreSQL utilizando Prisma.

Não haverá sincronização por APIs internas enquanto isso não for realmente necessário.

---

# ADR-007 — A prioridade atual é estabilização

**Status:** Aceita

## Contexto

O MVP já está funcional.

A auditoria identificou problemas importantes.

## Decisão

Antes de desenvolver novas ferramentas devemos:

1. corrigir segurança;
2. corrigir autorização;
3. corrigir bugs;
4. adicionar testes;
5. corrigir lint;
6. melhorar documentação;
7. Dockerizar a aplicação.

Somente depois novas funcionalidades serão implementadas.

---

# ADR-008 — Docker Compose será a instalação oficial

**Status:** Aceita

## Contexto

O objetivo é instalar facilmente em:

- Linux
- VPS
- Dockge
- Umbrel
- computador pessoal

## Decisão

Docker Compose será o método oficial de instalação.

A stack deverá conter:

- PostgreSQL
- Web
- Bot
- Migrations

O usuário não deverá instalar manualmente:

- Node.js
- PostgreSQL
- Prisma
- PM2

---

# ADR-009 — A API do bot é privada

**Status:** Aceita

## Contexto

A API Express existe apenas para comunicação entre painel e bot.

## Decisão

Ela nunca deverá ser exposta publicamente.

Dentro do Docker:

- Web → Bot

A comunicação ocorrerá apenas pela rede interna do Compose utilizando um segredo compartilhado.

---

# ADR-010 — Segurança acima de novas funcionalidades

**Status:** Aceita

## Contexto

A auditoria encontrou vulnerabilidades importantes.

## Decisão

Nenhuma nova funcionalidade deve ser priorizada antes da correção de:

- autorização por guild
- IDOR
- validação das Server Actions
- persistência das salas temporárias
- testes básicos

---

# ADR-011 — Documentação faz parte do código

**Status:** Aceita

Toda mudança importante deverá atualizar:

- AI_CONTEXT.md
- DECISIONS.md
- PROJECT_DIRECTION.md
- AGENTS.md
- README.md (quando necessário)

Documentação desatualizada é considerada um bug.

---

# ADR-012 — Cada ferramenta será desenvolvida individualmente

**Status:** Aceita

Após a estabilização, novas ferramentas deverão seguir este fluxo:

1. definir o problema;
2. definir o escopo;
3. aprovar a arquitetura;
4. implementar;
5. testar;
6. documentar.

Nenhuma ferramenta grande deverá ser implementada de uma única vez.

---

# ADR-013 — Vitest será o runner de testes inicial

**Status:** Aceita

**Data:** 31/07/2026

## Contexto

O repositório combina módulos ESM na aplicação Next.js e CommonJS no bot. A
baseline não possuía runner, script de testes ou testes automatizados.

Foram consideradas duas alternativas:

- `node:test`, com menor número de dependências;
- Vitest, com suporte integrado a ESM, CommonJS, mocks e configuração de aliases.

## Decisão

Vitest será o runner inicial, configurado com ambiente Node e sem DOM virtual.

Nesta fase, os testes cobrem somente módulos puros e não acessam Discord, rede
ou banco de dados.

## Consequências

### Positivas

- um único runner atende ao código web e ao bot;
- permite evoluir para mocks de Prisma, Next.js e Discord;
- execução rápida e configuração pequena.

### Negativas

- adiciona Vitest e suas dependências de desenvolvimento;
- não substitui futuros testes de integração e E2E.

## Critério de revisão

Reavaliar se o runner criar incompatibilidade com a versão de Node usada nas
imagens oficiais ou se os testes puderem ser atendidos de forma materialmente
mais simples pelo runner nativo.

---

# ADR-014 — Restringir operadores por allowlist

**Status:** Aceita

**Data:** 31/07/2026

## Contexto

O Clutch Hub é uma ferramenta pessoal, mas o login OAuth atual aceita qualquer
conta Discord.

## Decisão

- utilizar `ALLOWED_DISCORD_USER_IDS`;
- interpretar a variável como uma lista de IDs Discord;
- considerar lista ausente ou vazia um erro de configuração;
- impedir que usuários fora da lista utilizem a aplicação.

## Consequências

Reduz a superfície pública com uma solução compatível com o uso pessoal. A
allowlist não substitui autorização por guild.

## Implementação atual

A Fase 1B aplica `requireOperator()` no layout dinâmico do dashboard e repete a
verificação nas Server Actions administrativas. Configuração inválida, sessão
ausente ou usuário fora da lista não liberam conteúdo nem mutações.

## Critério de revisão

Reavaliar apenas se o projeto deixar de ser uma ferramenta pessoal.

---

# ADR-015 — Autorizar operações por guild no bot

**Status:** Aceita

**Data:** 31/07/2026

## Contexto

As Server Actions atuais conhecem a sessão, mas a API privada do bot não
verifica se o ator administra a guild recebida.

## Decisão

- o Next.js identifica o Discord ID do ator pela sessão e conta persistida;
- o Next.js envia esse ID somente pela comunicação privada autenticada;
- o bot verifica se o membro é owner ou possui `Administrator` ou `ManageGuild`;
- toda operação sensível repete essa verificação;
- nenhum `guildId` recebido do cliente é considerado confiável.

## Consequências

A autorização usa o estado atual do Discord e não depende de confiar em hidden
inputs. O bot e o painel passam a compartilhar um contrato explícito de ator.

## Implementação atual

A Fase 1B concretiza esta decisão na listagem/remoção de guilds e no CRUD de
VoiceHub. Todos os endpoints mutáveis envolvidos exigem segredo e ator, repetem
a autorização no bot e derivam guild/canal do banco quando o recurso já existe.

## Critério de revisão

Reavaliar se a integração passar a usar instalação OAuth com um modelo de
permissões diferente.

---

# ADR-016 — Persistir o ciclo de vida das salas temporárias

**Status:** Proposta

**Data:** 31/07/2026

## Contexto

O modelo `TemporaryVoiceChannel` já existe, mas a implementação atual guarda
salas e timers apenas em memória.

## Decisão proposta

`TemporaryVoiceChannel` será a fonte persistente das salas criadas. `Map` e
`Set` permanecerão apenas como cache e locks efêmeros. No startup, o bot deverá
reconciliar banco e Discord e reconstruir o estado necessário.

## Consequências

Reinícios deixam de perder o controle das salas. A implementação exigirá
tratamento de registros/canais ausentes e testes de recuperação.

## Critério de revisão

Reavaliar somente se o recurso de salas temporárias for removido.

---

# ADR-017 — Registro explícito dos comandos Discord

**Status:** Aceita

**Data:** 31/07/2026

## Contexto

O comando slash era registrado por um script manual com nome de variável de
ambiente divergente. Foram consideradas:

- execução manual explícita;
- registro em todo startup do bot;
- serviço one-shot futuro no Docker Compose.

## Decisão

Manter o registro explícito por `npm run deploy:commands` durante a
estabilização. Não registrar comandos em todo startup do bot.

Ao implementar o Compose, avaliar um serviço one-shot que reutilize o mesmo
script sem tornar o startup normal dependente da API de registro.

## Consequências

Evita chamadas e alterações globais a cada restart. A instalação precisa
executar uma etapa explícita até que o empacotamento decida pelo serviço
one-shot.

## Critério de revisão

Revisar na fase de Docker Compose.

---

# ADR-018 — Não adotar Graphify nesta fase

**Status:** Aceita

**Data:** 31/07/2026

## Contexto

Graphify oferece análise local por AST, grafo navegável, skill e servidor MCP
para agentes. A avaliação encontrou uma ferramenta aberta e promissora, mas
ainda recente. O repositório atual é pequeno e navegável com ferramentas locais
já disponíveis. O ambiente também não possui um runtime Python funcional nem
`uv`, que seriam novas dependências operacionais.

## Decisão

Não instalar Graphify, Python ou `uv` nesta fase. Não versionar skills ou
configurações da ferramenta e não gerar o diretório `graphify-out/`.

O caminho de artefatos gerados fica preventivamente ignorado. Uma futura adoção
deverá usar o pacote oficial `graphifyy`, ambiente isolado, versão fixada e
instalação por projeto para os agentes efetivamente usados.

## Consequências

### Positivas

- nenhuma dependência operacional experimental é introduzida;
- o onboarding continua baseado em Node.js e nas ferramentas do repositório;
- não há índice derivado para atualizar, revisar ou proteger.

### Negativas

- agentes não recebem navegação por grafo ou ferramentas MCP do Graphify;
- a decisão precisará ser reavaliada se o código crescer significativamente.

## Critério de revisão

Reavaliar quando a navegação convencional deixar de ser suficiente, o
repositório ganhar complexidade substancial ou a ferramenta alcançar histórico
de maturidade que justifique uma nova dependência operacional.

---

# ADR-019 — shadcn MCP como apoio visual opcional

**Status:** Aceita

**Data:** 31/07/2026

## Contexto

Foram comparados 21st.dev MCP, Builder MCP e alternativas baseadas em registry.
O projeto precisa de apoio para pesquisa de componentes sem terceirizar sua
direção visual, criar dependência de um serviço pago ou adotar um design system
novo.

## Decisão

Selecionar somente o MCP oficial do shadcn como ferramenta principal opcional
de pesquisa e inspeção de componentes. A configuração versionada usa uma versão
fixada. A skill local do Clutch Hub, o código existente e a revisão visual
continuam sendo as autoridades.

Não adotar 21st.dev nesta fase devido à dependência de serviço remoto,
autenticação, limites e créditos. Não adotar Builder porque o projeto não
possui um workspace ou design system Builder e a integração adicionaria conta,
workflow externo e maior acoplamento.

Nenhum componente ou pacote de produção é instalado por esta decisão.

## Consequências

### Positivas

- consulta reproduzível a um registry público e inspecionável;
- suporte a Codex e Claude Code sem credenciais no caso padrão;
- nenhuma ferramenta externa é obrigatória para desenvolver o projeto.

### Negativas

- execução do MCP depende de rede e `npx`;
- itens do registry podem introduzir dependências e aparência genérica se forem
  usados sem revisão;
- a configuração precisa ser atualizada deliberadamente para novas versões.

## Critério de revisão

Reavaliar se o projeto adotar um design system próprio com registry, se a
ferramenta deixar de ser mantida ou se o uso introduzir mais custo que
benefício.

---

# ADR-020 — Contexto operacional de agentes em `.ai/`

**Status:** Aceita

**Data:** 31/07/2026

## Contexto

Regras gerais estavam distribuídas entre documentos de direção, handoff e
instruções. Tarefas de frontend não possuíam um processo visual, de
acessibilidade e de revisão reutilizável.

## Decisão

Usar `.ai/` como diretório versionado de infraestrutura compartilhada por
agentes:

- `skills/` para instruções especializadas;
- `prompts/` para roteiros recorrentes;
- `reviews/` para checklists;
- `design/` para fundamentos e decisões de ferramentas.

Regras globais permanecem em `AI_RULES.md`; instruções executáveis de trabalho,
em `AGENTS.md`; decisões arquiteturais, neste arquivo. Não duplicar essas
fontes dentro de `.ai/`.

## Consequências

### Positivas

- Codex, Claude Code e outros agentes podem compartilhar o mesmo método;
- critérios visuais e de revisão passam a ser explícitos;
- prompts e skills evoluem sem poluir a documentação de produto.

### Negativas

- agentes precisam ler os arquivos indicados por `AGENTS.md`;
- conteúdo desatualizado pode induzir erros se não for mantido junto das
  decisões.

## Critério de revisão

Reavaliar a estrutura quando uma plataforma adotada exigir convenção diferente
ou quando houver duplicação comprovada entre diretórios.

---

# ADR-021 — `ownershipLockMinutes` preservado, mas não editável

**Status:** Aceita

**Data:** 31/07/2026

## Contexto

O schema e o editor expunham um tempo de bloqueio de propriedade, mas a engine
de salas temporárias nunca leu esse campo nem implementou transferência,
disputa ou bloqueio de owner. Persistir alterações feitas no controle criava a
impressão de uma proteção inexistente.

## Decisão

Remover `ownershipLockMinutes` da projeção e do formulário editável, rejeitar o
campo se for injetado no contrato de atualização e deixar de defini-lo na
criação da aplicação. A coluna e os dados existentes permanecem intactos no
schema e nas migrations.

Uma implementação futura deverá primeiro definir a regra completa de
propriedade, concorrência e recuperação; somente depois o controle poderá
voltar à interface.

## Consequências

### Positivas

- a interface deixa de prometer um comportamento inexistente;
- saves comuns não alteram mais esse valor;
- nenhum dado histórico ou migration é perdido.

### Negativas

- a coluna continua como dívida de schema até uma decisão funcional futura;
- não há bloqueio ou transferência de propriedade nesta fase.

## Critério de revisão

Reavaliar quando houver especificação e implementação testável de ownership de
salas temporárias.

---

# ADR-022 — Listas de cargos de VoiceHub são mutuamente exclusivas

**Status:** Aceita

**Data:** 31/07/2026

## Contexto

Um mesmo cargo em `permissionRoles`, `ignoredRoles` e `moderatorRoles` produz
semânticas conflitantes: pode simultaneamente negar acesso, impedir criação de
sala e conceder moderação. O comportamento final dependeria da ordem dos
overwrites e seria difícil de explicar.

## Decisão

Cada lista aceita no máximo 25 snowflakes válidos, sem duplicatas internas. Um
mesmo cargo não pode aparecer em mais de uma das três listas. O update valida a
combinação com valores já persistidos e, quando há cargos submetidos, confirma
que eles ainda pertencem à guild antes de qualquer rename ou escrita.

## Consequências

### Positivas

- permissões passam a ter intenção inequívoca;
- cargos removidos ou de outra guild não chegam ao Discord;
- o total máximo permanece compatível com os overwrites usados pelo produto.

### Negativas

- configurações legadas com sobreposição precisam ser corrigidas antes de um
  novo save;
- selecionar o mesmo cargo para duas responsabilidades deixa de ser permitido.

## Critério de revisão

Reavaliar somente se o produto definir precedência explícita e compreensível
entre as responsabilidades de cargos.

---

# ADR-023 — Integração PostgreSQL exige banco de teste explícito

**Status:** Aceita

**Data:** 31/07/2026

## Contexto

Os testes existentes não exercitavam transactions ou constraints reais. O
ambiente atual não possui PostgreSQL local descartável nem
`TEST_DATABASE_URL`; usar `DATABASE_URL` poderia atingir dados reais.

## Decisão

Testes de integração usam exclusivamente `TEST_DATABASE_URL`. O runner recusa
URL igual a `DATABASE_URL`, protocolos não PostgreSQL e database cujo nome não
contenha `test`. Antes da suíte, aplica apenas as migrations existentes com
`prisma migrate deploy`; cada cenário cria identificadores próprios e remove
seus registros ao final.

Não instalar Docker, não criar banco local da aplicação e não usar Supabase
nesta fase. Ausência da variável produz estado explícito de não execução.

## Consequências

### Positivas

- reduz drasticamente o risco de testes destrutivos no banco real;
- transactions e constraints podem ser exercitadas de forma reproduzível;
- nenhuma dependência ou migration nova é necessária.

### Negativas

- a integração fica indisponível até que um PostgreSQL descartável seja
  fornecido;
- migrations são aplicadas a cada execução explícita do runner.

## Critério de revisão

Reavaliar quando a fase de empacotamento introduzir infraestrutura descartável
oficial em CI ou Docker.

---

# ADR-024 — Docker Compose com PostgreSQL local é o caminho oficial de instalação

**Status:** Aceita

**Data:** 31/07/2026

## Contexto

O projeto dependia de Node.js, Prisma, PostgreSQL externo e execução conjunta
via `concurrently`. A configuração histórica com Supabase/PM2 não era
reproduzível, mantinha web e bot no mesmo host por causa de `127.0.0.1` e
exigia etapas manuais de migration e registro do slash command.

## Decisão

O produto será instalado oficialmente com `docker compose up -d`. O stack tem
três serviços permanentes: `web`, `bot` e `postgres`. Dois jobs efêmeros usam a
mesma imagem do bot: `migrate` executa `prisma migrate deploy` e
`discord-commands` registra comandos globais. Dependências condicionais e
healthchecks impedem que bot/web iniciem antes de seus pré-requisitos.

PostgreSQL 17.10 Alpine é o banco padrão, com volume nomeado no caminho oficial
da imagem para versões 17 e anteriores. Node.js 22.23.1 Debian slim é usado em
imagens multi-stage; o web usa o output standalone do Next.js. Somente a porta
do web é publicada. PostgreSQL e API do bot permanecem na rede Compose.

`scripts/container-entrypoint.mjs` monta `DATABASE_URL` com encoding seguro a
partir das variáveis PostgreSQL e encaminha sinais. Supabase não é dependência
do produto; continua apenas tecnicamente compatível como PostgreSQL externo em
execuções customizadas fora do caminho Compose.

## Consequências

### Positivas

- host precisa apenas de Docker Engine/Desktop com Compose V2;
- migrations, Prisma Client e slash command deixam de exigir passos manuais;
- banco persiste entre recriações e não é exposto ao host;
- web e bot têm ciclos, healthchecks e shutdown independentes;
- imagens oficiais fixadas tornam builds mais previsíveis em amd64/arm64.

### Negativas

- o primeiro build exige internet e espaço para duas imagens da aplicação;
- registro global de comandos depende da API Discord e pode bloquear o bot se
  as credenciais ou a rede estiverem inválidas;
- downgrade de código após migrations não é automaticamente reversível;
- a validação end-to-end do stack exige um host com Docker disponível.

## Critério de revisão

Reavaliar tags fixadas em ciclos de atualização de segurança; separar jobs em
imagens próprias apenas se o custo atual ficar relevante; rever registro global
se o produto adotar comandos por guild ou múltiplas aplicações Discord.

---

# Modelo para novas decisões

```md
# ADR-XXX — Título

Status: Proposta

## Contexto

...

## Decisão

...

## Consequências

### Positivas

...

### Negativas

...

## Critério de revisão

...
```
