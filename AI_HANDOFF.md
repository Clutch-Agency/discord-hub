# AI HANDOFF — Fase 1A: Fundação de Autenticação e Autorização

## 1. Status da fase

**Concluída em 31/07/2026.**

A fase criou a fundação central de autenticação, allowlist de operadores,
autorização por guild e erros previsíveis. Somente o carregamento de cargos de
uma guild foi migrado como fluxo piloto. A aplicação completa nas demais
operações permanece para a Fase 1B.

## 2. Objetivo executado

- mapear o modelo anterior de autenticação e autorização;
- definir uma identidade mínima obtida exclusivamente no servidor;
- implementar `ALLOWED_DISCORD_USER_IDS` como fonte única da allowlist;
- compor autenticação e autorização de operador;
- confirmar autorização por guild no estado atual do Discord;
- criar categorias de erro e mensagens públicas seguras;
- validar IDs e configurações em runtime;
- aplicar a fundação em um único fluxo administrativo somente leitura;
- adicionar testes permitidos, negados, inválidos e de indisponibilidade;
- preservar schema, migrations, dependências e demais regras de negócio.

## 3. Documentação e skills lidas

Na ordem exigida:

1. `PROJECT_DIRECTION.md`;
2. `DECISIONS.md`;
3. `AI_RULES.md`;
4. `AGENTS.md`;
5. `AI_CONTEXT.md`;
6. `PROJECT_REPORT.md`;
7. `README.md`;
8. `AI_HANDOFF.md` anterior.

Skill obrigatória lida integralmente:

- `.ai/skills/backend-architect/SKILL.md`.

Também foram consultadas fontes oficiais compatíveis:

- segurança de dados e Server Actions do Next.js 15:
  <https://nextjs.org/docs/15/app/guides/data-security>;
- autenticação no App Router:
  <https://nextjs.org/docs/app/guides/authentication>;
- configuração básica Auth.js e `auth()`:
  <https://authjs.dev/>;
- `GuildMemberManager.fetch` no discord.js 14.27.0:
  <https://discord.js.org/docs/packages/discord.js/14.27.0/GuildMemberManager:Class>;
- flags `Administrator` e `ManageGuild` no discord.js 14.27.0:
  <https://discord.js.org/docs/packages/discord.js/14.27.0/PermissionFlagsBits:Variable>;
- permissões oficiais do Discord:
  <https://docs.discord.com/developers/topics/permissions>.

A documentação local `node_modules/next/dist/docs/` continua ausente. Nenhuma
API Next nova foi introduzida; a documentação oficial da versão 15 foi usada
para confirmar que Server Actions devem ser tratadas como endpoints públicos.

## 4. Diagnóstico do modelo anterior

### Sessão e identidade

- `src/auth.js` usa Auth.js/NextAuth 5 beta com Discord, PrismaAdapter e sessão
  em banco.
- O callback de sessão grava o CUID interno de `User` em `session.user.id`.
- O ID Discord não fica diretamente na sessão.
- A associação confiável está em `Account`, por
  `provider="discord"` + `providerAccountId`.
- Layouts, páginas e actions repetiam `auth()` sem uma função central.

### Guilds e permissões

- `getGuilds` devolvia todas as guilds do cache do bot.
- As operações web enviavam `guildId` recebido do cliente para a API privada.
- A API exigia apenas `BOT_API_SECRET`; não recebia identidade do ator.
- Nenhuma operação da API verificava owner, `Administrator` ou `ManageGuild`.
- `getGuildRoles`, `createVoiceHub` e `removeGuild` eram exemplos diretos de
  acesso horizontal possível.

### Duplicação e confiança no cliente

- `auth()` e tratamento de ausência de sessão estavam espalhados pelas actions.
- `session.user.id` era usado diretamente sem resolver uma identidade Discord
  mínima compartilhada.
- `guildId`, IDs de recurso, `toolKey`, enums, números e arrays ainda possuem
  validação inconsistente.
- `updateChannelOrder` continua com IDOR porque aceita IDs de canais fora do
  template validado.

### Variáveis relevantes

- `AUTH_SECRET`, `DISCORD_CLIENT_ID` e `DISCORD_CLIENT_SECRET`: autenticação;
- `DATABASE_URL`: persistência de conta e sessão;
- `BOT_API_SECRET` e `BOT_API_PORT`: canal privado web → bot;
- `ALLOWED_DISCORD_USER_IDS`: nova configuração central de operadores.

Valores reais não foram lidos, reproduzidos ou enviados a serviços externos.

## 5. Modelo de autenticação implementado

Função central:

```text
requireAuthenticatedActor()
```

Localização:

- `src/lib/auth/authenticated-actor.js`.

Fluxo:

1. chama `auth()` no servidor;
2. exige `session.user.id` não vazio;
3. consulta a conta `provider="discord"` do mesmo usuário interno;
4. valida `Account.providerAccountId` como snowflake Discord;
5. retorna somente:

```js
{
  userId,
  discordUserId,
}
```

A função não recebe `userId` do cliente. Dependências de sessão e conta podem
ser injetadas exclusivamente para testes. Falha de sessão/identidade produz
`UNAUTHENTICATED`; falha da fonte produz `AUTHORIZATION_UNAVAILABLE`.

## 6. Formato e regra da allowlist

Fonte única:

```text
ALLOWED_DISCORD_USER_IDS
```

Módulo:

- `src/lib/auth/operator-allowlist.js`.

Regras:

- IDs Discord em lista textual;
- separadores aceitos: vírgula, ponto e vírgula e whitespace;
- espaços e entradas vazias são removidos;
- duplicatas são eliminadas;
- cada item precisa ser um snowflake decimal de 17 a 20 dígitos, sem zero
  inicial;
- variável ausente, lista vazia ou qualquer item inválido torna toda a
  configuração inválida;
- configuração inválida nunca concede acesso;
- a lista completa nunca é retornada ao cliente ou registrada.

`.env.example` passou a ser versionável e contém apenas o nome da variável, sem
valor real. `.gitignore` continua ignorando todos os demais `.env*`.

## 7. Modelo de autorização de operador

Função central:

```text
requireOperator()
```

Localização:

- `src/lib/auth/operator-authorization.js`.

Ela executa `requireAuthenticatedActor()`, carrega a allowlist somente no
servidor e exige a presença de `actor.discordUserId`. Em sucesso, devolve o ator
mínimo acrescido de `isOperator: true`.

Distinções:

- sem sessão/identidade: `UNAUTHENTICATED`;
- autenticado fora da lista: `ACCESS_DENIED`;
- lista ausente/vazia/malformada: `INVALID_CONFIGURATION`;
- falha da fonte de identidade: `AUTHORIZATION_UNAVAILABLE`.

## 8. Modelo de autorização por guild

### Processo web

Função:

```text
requireGuildAuthorization(actor, guildId)
```

Localização:

- `src/lib/discord/guild-authorization.js`.

Ela valida o `guildId`, exige um ator já obtido no servidor e chama o bot pela
API privada. A resposta precisa confirmar exatamente a mesma guild. O contexto
retornado contém somente `actor` e `guildId`.

### API privada e bot

Novo endpoint:

```text
GET /guilds/:guildId/access
```

Headers internos:

- `x-bot-secret`;
- `x-actor-discord-id`.

O ID do ator vem da sessão + banco no Next.js, não do navegador. O bot valida
novamente os dois snowflakes, encontra a guild no próprio cache, busca o membro
atual com `guild.members.fetch` e exige:

- owner da guild; ou
- permissão `Administrator`; ou
- permissão `ManageGuild`.

Guild ausente, membro ausente e membro sem permissão resultam em negação.
Falha inesperada do Discord resulta em indisponibilidade, nunca em acesso.

Módulo do bot:

- `bot/guild-authorization.js`.

## 9. Estratégia de erros

Módulo:

- `src/lib/auth/authorization-error.js`.

Categorias estáveis:

- `UNAUTHENTICATED`;
- `ACCESS_DENIED`;
- `INVALID_INPUT`;
- `INVALID_CONFIGURATION`;
- `GUILD_ACCESS_DENIED`;
- `AUTHORIZATION_UNAVAILABLE`;
- `UNEXPECTED`.

`AuthorizationError` conserva a categoria internamente.
`toAuthorizationFailure()` devolve somente `error`, `code` e mensagem pública.
Cause, stack, consulta, variável, allowlist e mensagem interna nunca são
serializados. Erros desconhecidos viram `UNEXPECTED`.

Na API do bot:

- entrada inválida → 400;
- segredo inválido → 401;
- guild negada → 403;
- Discord/autorização indisponível → 503.

## 10. Validações de runtime

- snowflakes Discord de ator, guild e IDs da allowlist;
- tipo string e conteúdo não vazio;
- separadores, espaços e duplicatas da allowlist;
- porta interna numérica entre 1 e 65535;
- presença não vazia de `BOT_API_SECRET` no cliente central;
- correspondência exata entre guild solicitada e guild confirmada pelo bot;
- formato mínimo da resposta de autorização e lista de cargos.

Nenhuma biblioteca foi adicionada; as validações são pequenas e explícitas.

## 11. Fluxo piloto escolhido

Fluxo:

```text
getGuildRoles(guildId)
→ requireOperator()
→ requireGuildAuthorization()
→ GET /guilds/:guildId/access
→ fetchGuildRolesWithBot()
→ GET /guilds/:guildId/roles
→ verificação repetida no bot
→ lista de cargos ou falha segura
```

A Server Action está em:

- `src/app/dashboard/voice-channels/[id]/actions.js`.

O orquestrador testável está em:

- `src/lib/discord/guild-roles.js`.

## 12. Justificativa do fluxo piloto

A leitura de cargos foi escolhida porque:

- é administrativa e ligada a uma guild;
- é somente leitura;
- não cria, altera ou exclui recursos;
- já atravessa Server Action, API privada e Discord;
- exercita autenticação, allowlist, guild e repetição da autorização no bot;
- possui baixo risco de regressão comparado a criar/excluir Hub ou remover o
  bot;
- não exige migrar as demais ações e, portanto, não antecipa a Fase 1B.

## 13. Arquivos criados

- `.env.example` — tornou-se versionável, sem valores secretos;
- `bot/api.test.mjs`;
- `bot/guild-authorization.js`;
- `bot/guild-authorization.test.mjs`;
- `src/lib/auth/authenticated-actor.js`;
- `src/lib/auth/authenticated-actor.test.js`;
- `src/lib/auth/authorization-error.js`;
- `src/lib/auth/authorization-error.test.js`;
- `src/lib/auth/operator-allowlist.js`;
- `src/lib/auth/operator-allowlist.test.js`;
- `src/lib/auth/operator-authorization.js`;
- `src/lib/auth/operator-authorization.test.js`;
- `src/lib/discord/bot-api-client.js`;
- `src/lib/discord/discord-identifiers.js`;
- `src/lib/discord/guild-authorization.js`;
- `src/lib/discord/guild-authorization.test.js`;
- `src/lib/discord/guild-roles.js`;
- `src/lib/discord/guild-roles.test.js`.

## 14. Arquivos modificados

- `.gitignore`: libera somente `.env.example` para versionamento;
- `bot/api.js`: factory testável, endpoint de acesso e proteção do piloto;
- `src/app/dashboard/voice-channels/[id]/actions.js`: integração do piloto;
- `AI_CONTEXT.md`: modelo permanente e limitações atuais;
- `DECISIONS.md`: ADR-014 e ADR-015 passaram de Proposta para Aceita;
- `AI_HANDOFF.md`: sobrescrito por este relatório.

`AGENTS.md` e `AI_RULES.md` não foram alterados: já continham instruções
permanentes suficientes e nenhuma contradição objetiva foi encontrada.

## 15. Testes adicionados

Foram adicionados 43 testes, agrupados em:

- parser/comparação da allowlist;
- identidade autenticada;
- autorização de operador;
- mensagens públicas e redaction de erros;
- autorização web por guild;
- orquestração e contrato do fluxo piloto;
- autorização Discord no bot;
- integração HTTP local do endpoint de cargos com Express real.

Casos cobertos:

- permitido e negado;
- sessão ausente/incompleta;
- ID externo sem substituir a sessão;
- configuração ausente, vazia, inválida, duplicada e com separadores;
- guild inválida, negada, ausente e cruzada;
- membro sem permissão;
- owner, Administrator e ManageGuild;
- falha de banco/Discord/fonte de autorização;
- segredo interno incorreto;
- ator ausente no endpoint;
- resposta pública sem detalhes internos.

## 16. Resultado dos testes

Última execução antes deste handoff:

```text
npm test
10 arquivos aprovados
47 testes aprovados
0 falhas
```

Quatro testes já existiam; 43 foram adicionados nesta fase.

O teste HTTP usa uma porta efêmera local, Express real e objetos Discord
controlados. Não acessa Discord, banco ou rede externa.

## 17. Resultado do lint

Última execução antes deste handoff:

```text
npm run lint
0 erros
7 warnings
```

Os sete warnings preexistentes são `@next/next/no-img-element` em componentes
visuais. Não foram corrigidos por estarem fora do escopo.

## 18. Resultado do build

Última execução sobre o diff final:

```text
npm run build
Prisma Client 6.19.3 gerado
Next.js 15.5.22 compilado
10 rotas processadas
build concluído com sucesso
```

O build repetiu somente os sete warnings preexistentes de `<img>`.

## 19. Dependências

Nenhuma dependência foi adicionada, removida ou atualizada.

- `package.json`: sem alteração;
- `package-lock.json`: sem alteração.

Foram usados Vitest, Express e discord.js já instalados.

## 20. Banco e migrations

- `prisma/schema.prisma`: sem alteração;
- `prisma/migrations/`: sem alteração;
- migration criada: nenhuma;
- migration executada: nenhuma;
- `npx prisma validate`: sucesso.

A consulta de identidade usa o modelo `Account` já existente.

## 21. Riscos restantes

- a allowlist ainda não bloqueia globalmente login/dashboard; somente o piloto
  exige operador nesta fase;
- disponibilidade da autorização depende da API privada e do Discord;
- a instalação precisa configurar `ALLOWED_DISCORD_USER_IDS` antes de usar o
  piloto;
- o teste não usa sessão OAuth, banco ou guild Discord reais;
- não há rate limiting, timeout explícito ou observabilidade estruturada;
- outras rotas do bot ainda retornam detalhes de falha e não verificam ator;
- não há middleware global; a política continuará aplicada por operações;
- múltiplos `PrismaClient` ainda existem fora do singleton;
- IDs válidos continuam insuficientes sem ownership/escopo nas operações não
  migradas.

## 22. Operações ainda vulneráveis ou não migradas

### Guild/Discord

- `getGuilds`: lista todas as guilds do bot;
- `removeGuild`: não exige operador nem autorização da guild;
- `createVoiceHub`: confia no `guildId` do formulário;
- `updateVoiceHub`: restringe por owner do registro, mas não reconfirma guild;
- `deleteVoiceHub`: restringe por owner do registro, mas não reconfirma guild;
- endpoints POST/PATCH/DELETE de voz e DELETE da guild no bot ainda não exigem
  `x-actor-discord-id`;
- páginas que usam `getGuilds` ainda podem exibir guilds não administráveis.

### Recursos internos

- `updateChannelOrder`: IDOR crítico entre templates;
- template/channel actions: não usam `requireOperator` e possuem validação
  parcial;
- `toggleTool`: aceita `toolKey` e boolean sem validação suficiente;
- comandos slash: vinculam a conta Discord, mas não aplicam a allowlist central;
- leitura/edição de Hubs ainda possui a falha preexistente dos arrays de cargos
  omitidos pela query da página.

Esses itens não foram corrigidos para respeitar a divisão 1A/1B.

## 23. Plano objetivo para a Fase 1B

1. aplicar `requireOperator` às operações administrativas restantes;
2. filtrar `getGuilds` pela interseção de guilds efetivamente autorizadas;
3. aplicar `requireGuildAuthorization` antes de todo efeito Discord;
4. exigir e verificar ator nos endpoints POST/PATCH/DELETE do bot;
5. limitar consultas VoiceHub por user + guild autorizada + recurso;
6. corrigir o IDOR de `updateChannelOrder` validando o conjunto completo;
7. validar enums, comprimentos, números, arrays e tool keys;
8. testar cada action com sessão ausente, operador negado, guild cruzada,
   recurso alheio, entrada inválida e falha externa;
9. revisar mensagens/logs restantes para remover detalhes internos;
10. executar novamente lint, testes, build, Prisma validate e auditoria de
    segredos.

Não avançar para persistência de canais temporários ou Docker antes de concluir
essa migração de segurança.

## 24. Resumo para o próximo agente

A fonte de identidade é sessão Auth.js + `Account.providerAccountId`. Nunca
aceite `userId` ou Discord ID do cliente. A allowlist existe somente em
`operator-allowlist.js`; não replique parsing. Use `requireOperator`, depois
`requireGuildAuthorization`, e limite a consulta/efeito à guild confirmada. O
bot deve repetir a verificação com o ator transmitido pela API privada. O fluxo
de cargos é o exemplo piloto. Todas as outras operações listadas acima ainda
precisam ser migradas na Fase 1B.
