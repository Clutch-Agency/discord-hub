# Relatório Técnico Completo — Discord Hub / Clutch Hub

> Data da análise: 31/07/2026  
> Escopo: todo o código versionável do projeto (`src/`, `bot/`, `prisma/`, configurações, manifesto de dependências e documentação operacional).  
> Método: inspeção estática integral, inventário de arquivos, busca por marcadores de trabalho incompleto, conferência do schema e das migrations, rastreamento de chamadas Prisma/Discord/API e execução do comando de lint. Nenhum segredo foi lido ou reproduzido neste documento.

## Limitações e contexto da análise

- O relatório descreve o estado local atual, inclusive as modificações preexistentes e não commitadas em `README.md` e `bot/api.js`. Esses arquivos não foram alterados.
- Não foi possível confirmar o comportamento contra um banco PostgreSQL real, uma aplicação Discord real ou uma sessão OAuth real sem executar integrações externas e usar credenciais. Onde a conclusão depende disso, ela é indicada como inferência ou risco.
- Não há suíte de testes no repositório.
- `npm run lint` foi executado, mas falha ao carregar a configuração, antes de inspecionar o código: `eslint.config.mjs` importa `eslint-config-next/core-web-vitals`, enquanto a resolução ESM do pacote instalado pede `eslint-config-next/core-web-vitals.js`.
- O build não foi executado para respeitar a exigência de não alterar nenhum artefato do projeto além deste relatório; `next build` reescreveria `.next/`.
- `AGENTS.md` exige consulta aos guias locais em `node_modules/next/dist/docs/`. Esse diretório não contém documentação nesta instalação. A versão efetivamente instalada foi conferida (`next@15.5.22`) e o comportamento foi analisado diretamente no código.
- A saída padrão do PowerShell exibiu alguns textos UTF-8 como mojibake, mas a leitura explícita em UTF-8 confirmou que os arquivos-fonte estão, em geral, corretamente codificados. Há, entretanto, literais já corrompidos no schema/migrations, detalhados adiante.

# 1. Visão Geral

## Objetivo do SaaS

O Discord Hub, apresentado na interface como **Clutch Hub**, é um SaaS de administração e automação de servidores Discord. O produto combina:

1. um painel web autenticado por Discord;
2. um bot instalado nos servidores;
3. uma API HTTP interna que conecta o painel ao processo do bot;
4. persistência PostgreSQL compartilhada entre painel e bot.

Seu objetivo é centralizar tarefas repetitivas de administração de comunidades Discord, principalmente criação padronizada de canais e geração automática de salas de voz temporárias.

## Problema resolvido

Administradores de comunidades precisam repetir configurações de canais, categorias, cargos e permissões; também precisam criar e remover salas de voz conforme a demanda. O sistema pretende reduzir esse trabalho:

- templates transformam uma estrutura persistida no painel em canais reais no Discord;
- Hubs de voz criam salas temporárias quando um membro entra em um canal de entrada;
- o painel centraliza ativação de ferramentas, servidores conectados e configurações;
- a identidade Discord do usuário web é associada ao comando slash usado dentro do servidor.

## Principais funcionalidades

- Login e logout com OAuth Discord.
- Dashboard com ferramentas ativáveis por usuário.
- Listagem dos servidores em que o bot está conectado.
- Link de convite do bot e remoção do bot de um servidor.
- CRUD de templates de servidor.
- CRUD e reordenação por drag-and-drop de canais de template.
- Tipos de canal: texto, voz, fórum e anúncio; o bot também conhece o tipo stage, embora a UI não o ofereça.
- Aplicação de template via comando `/aplicar-template`.
- Escolha/criação de categoria, categoria pública ou privada e seleção/criação de cargos.
- Configuração de canais privados individualmente durante a aplicação do template.
- CRUD de Hubs de voz temporária.
- Regras de nome, limite de usuários, bitrate, retenção após ficar vazio, sincronização de permissões, cargos ignorados e moderadores.
- Criação, movimentação do membro e exclusão automática de salas de voz temporárias.

## Público-alvo inferido

Administradores, proprietários e moderadores de servidores Discord, especialmente comunidades que repetem estruturas entre servidores ou usam salas de voz dinâmicas. Não há código de cobrança, planos, organizações, multi-tenant empresarial ou onboarding comercial; portanto, “SaaS” descreve a forma pretendida do produto, mas monetização e gestão comercial ainda não existem.

# 2. Stack Tecnológica

## Front-end

| Tecnologia | Versão instalada | Papel |
|---|---:|---|
| React | 18.3.1 | Componentes Server/Client e estado local da interface. |
| React DOM | 18.3.1 | Renderização React no navegador/servidor. |
| Next.js | 15.5.22 | App Router, Server Components, Server Actions, rotas e renderização do painel. O `package.json` permite `^15.1.0`, por isso a versão instalada avançou. |
| Tailwind CSS | 4.3.3 | Classes utilitárias e tema visual definido em `src/app/globals.css`. |
| Lucide React | 1.27.0 | Ícones de interface. É uma versão muito antiga comparada às demais dependências e deve ser revisada. |
| dnd-kit | core 6.3.1, sortable 10.0.0, utilities 3.2.2 | Reordenação visual dos canais de um template. |

## Back-end web

- **Next.js Server Components**: consultam autenticação e banco diretamente.
- **Server Actions**: executam mutações de templates, ferramentas, servidores e Hubs. Constituem a principal API do front-end, embora não sejam endpoints REST convencionais.
- **Route Handler NextAuth**: `src/app/api/auth/[...nextauth]/route.js` expõe GET/POST de autenticação.
- **Node.js**: runtime comum do painel e bot. O README recomenda Node 22, mas `package.json` não possui campo `engines`.

## Bot e API interna

| Tecnologia | Versão | Papel |
|---|---:|---|
| discord.js | 14.27.0 | Gateway Discord, comandos slash, criação de canais/cargos, permissões e eventos de voz. |
| Express | 5.2.1 | API interna do processo do bot, vinculada a `127.0.0.1`. |
| dotenv | 17.4.2 | Carregamento de `.env` no bot e no registrador de comandos. |

## Banco e ORM

- **PostgreSQL**: datasource declarado no Prisma; usa arrays nativos de texto nos cargos de `VoiceHub`.
- **Prisma 6.19.3 / @prisma/client 6.19.3**: schema, migrations, adapter do Auth.js e acesso ao banco.
- **@auth/prisma-adapter 2.11.3**: persiste usuários, contas OAuth e sessões do Auth.js.

## Autenticação

- **next-auth/Auth.js 5 beta 32**: OAuth Discord, sessão persistida no banco e helpers `auth`, `signIn`, `signOut`.
- **Provider Discord**: identificação do usuário e vínculo entre `Account.providerAccountId` e o ID Discord usado pelo bot.

## Ferramentas de desenvolvimento/operação

- ESLint 9.39.5 e `eslint-config-next` 15.1.0.
- PostCSS e `@tailwindcss/postcss`.
- `concurrently`: inicia Next e bot no mesmo comando.
- `dotenv-cli`: injeta `.env` no processo Next nos scripts `dev` e `start`.
- npm/package-lock para resolução reproduzível.
- Prisma CLI para generate/migrate.
- README recomenda PM2, Nginx, Certbot e VPS Linux, mas esses serviços não fazem parte do código.

## Serviços e APIs externas

- API OAuth2 do Discord: login.
- Discord Gateway: eventos de guild, interação e estado de voz.
- Discord REST API, via discord.js: registro de comando global, guilds, canais, cargos e permissões.
- PostgreSQL externo, determinado por `DATABASE_URL`.
- Não há e-mail, pagamentos, armazenamento de arquivos, analytics, filas ou observabilidade externa no código.

# 3. Estrutura do Projeto

```text
discord-hub/
├── bot/                         # Processo Discord e API interna
├── prisma/                      # Modelo e histórico SQL
├── public/                      # Logos e SVGs estáticos
├── src/
│   ├── app/                     # App Router, páginas, layouts, actions e auth route
│   ├── components/              # Componentes compartilhados
│   └── lib/                     # Prisma, catálogo de ferramentas e normalização
├── .env*                        # Configuração local (ignorados pelo Git)
├── package.json                 # Scripts e dependências
├── next.config.mjs              # Configuração Next mínima
├── eslint.config.mjs            # Configuração atualmente inválida
├── postcss.config.mjs           # Tailwind/PostCSS
├── jsconfig.json                # Alias @/* -> src/*
├── README.md                    # Guia operacional de VPS
└── TALK_LOG.md                  # Histórico extenso de conversas/alterações
```

## `bot/`

- `index.js`: cria `Client`, habilita intents `Guilds`, `GuildMembers` e `GuildVoiceStates`, registra listeners, inicia a API e faz login.
- `api.js`: API Express autenticada por segredo compartilhado. Lista guilds/cargos, cria/renomeia/exclui canais de voz e remove o bot de guilds.
- `voice-hubs.js`: engine em memória de canais temporários.
- `interactionHandler.js`: roteador monolítico das interações do comando de template.
- `templateCommands.js`: construção de menus/modais e materialização do template no Discord.
- `utils.js`: embeds, paginação e estratégia de resposta.
- `deploy-commands.js`: registra globalmente `/aplicar-template`.

## `prisma/`

- `schema.prisma`: nove modelos e datasource PostgreSQL.
- `migrations/20260726182334_init/`: Auth.js, templates, canais e ferramentas.
- `migrations/20260726221955_add_voice_hub_feature/`: VoiceHub e remodelagem de UserTool.
- `migrations/20260727002426_add_temporary_voice_channels/`: persistência planejada de salas temporárias.
- `migration_lock.toml`: trava o provider em PostgreSQL.

## `src/app/`

- `layout.js`, `globals.css`, `favicon.ico`: raiz visual/metadados.
- `page.js`: landing/login e redirecionamento de usuário autenticado.
- `api/auth/[...nextauth]/route.js`: endpoints Auth.js.
- `actions/logout-action.js`: logout.
- `dashboard/layout.js`: guarda de autenticação, sidebar e cabeçalho.
- `dashboard/page.js`: visão geral e ativação de ferramentas.
- `dashboard/actions.js`: CRUD básico de templates.
- `dashboard/tools-actions.js`: ativação/desativação.
- `dashboard/servers/`: listagem e remoção de guilds por API interna.
- `dashboard/templates/`: lista de templates.
- `dashboard/templates/[id]/`: editor e drag-and-drop de canais.
- `dashboard/voice-channels/`: lista de Hubs.
- `dashboard/voice-channels/new/`: seleção de guild e criação.
- `dashboard/voice-channels/[id]/`: editor, consultas de cargos e mutações.

## `src/components/`

- `Sidebar.js`: navegação e toggles.
- `UserDropdown.js`: avatar/menu/logout.
- `SliderWithTicks.js`: range genérico; não há import desse componente no restante do projeto, portanto é candidato a código morto.

## `src/lib/`

- `prisma.js`: singleton correto apenas para os módulos que o reutilizam.
- `user-tools.js`: catálogo efetivo e persistência de flags, mas cria outro `PrismaClient`.
- `discord-utils.js`: normaliza nomes de canais textuais.
- `tools.js`: catálogo antigo com apenas templates; não é importado e está morto.

## `public/`

Logos branco, rosa e preto usados pela interface. SVGs padrão do template Next (`next.svg`, `vercel.svg`, `window.svg`, `file.svg`, `globe.svg`) não são referenciados e podem ser removidos.

# 4. Arquitetura

## Estilo arquitetural

É um **monólito distribuído em dois processos**:

- processo A: aplicação Next.js;
- processo B: bot Discord + API Express;
- dependência comum: PostgreSQL;
- comunicação A → B: HTTP loopback com segredo compartilhado;
- comunicação B ↔ Discord: Gateway e REST.

O front-end e back-end web residem no mesmo App Router. Não existe camada formal de controllers/repositories/services; páginas e Server Actions chamam Prisma e `fetch` diretamente. O bot possui separação parcial por domínio, mas `interactionHandler.js` ainda centraliza o roteamento.

## Fluxo de dados

```text
Navegador
  ├─ navegação/renderização ─> Next Server Components ─> Prisma ─> PostgreSQL
  └─ formulários/eventos ────> Next Server Actions
                                  ├─ Prisma ─> PostgreSQL
                                  └─ HTTP + x-bot-secret ─> Express local
                                                              └─ discord.js ─> Discord

Discord Gateway
  ├─ interactionCreate ─> bot ─> Prisma ─> templates/usuários
  └─ voiceStateUpdate ──> bot ─> Prisma ─> VoiceHub
                                  └─ discord.js ─> canal temporário
```

## Autenticação

1. `src/app/page.js` chama `auth()`.
2. Ausência de sessão exibe o formulário; a Server Action inline chama `signIn("discord")`.
3. Auth.js redireciona ao Discord e processa callback em `/api/auth/callback/discord`.
4. PrismaAdapter cria/atualiza `User`, `Account` e `Session`.
5. A estratégia `database` usa token de sessão persistido; o callback injeta `user.id` em `session.user.id`.
6. Layout e páginas protegidas repetem `auth()` e redirecionam para `/`.
7. O bot vincula o usuário do comando à conta web por `Account(provider="discord", providerAccountId=interaction.user.id)`.

Não há middleware global. A proteção é distribuída em layouts, páginas e actions.

## Front-end ↔ back-end

- Leitura: predominantemente Server Components.
- Mutação: formulários vinculados a Server Actions.
- Integração com bot: somente do servidor Next, não do navegador diretamente.
- Única API web explícita: Auth.js. Todo o restante usa o protocolo interno de Server Actions do Next.
- `ServersClient`, `ChannelList`, `ServerSelector`, `VoiceHubEditor`, `Sidebar`, `UserDropdown` e `SliderWithTicks` são Client Components.

## Estado

- Persistente: PostgreSQL.
- Sessão: tabela `Session`.
- Estado de formulário/UI: `useState`.
- Ordenação de canais: estado local otimista em `ChannelList`, seguido de Server Action.
- Fluxo `/aplicar-template`: `Map jobs` em memória, indexado pelo ID da interação.
- Canais temporários: `Map activeTemporaryChannels` e `Set creationLocks`, também em memória.
- Cache: quase inexistente; chamadas ao bot usam `cache: "no-store"` e mutações usam `revalidatePath`.

## Rotas

Rotas públicas:

- `/`: login/landing.
- `/api/auth/*`: Auth.js.

Rotas autenticadas:

- `/dashboard`
- `/dashboard/servers`
- `/dashboard/templates`
- `/dashboard/templates/[id]`
- `/dashboard/voice-channels`
- `/dashboard/voice-channels/new`
- `/dashboard/voice-channels/[id]`

As ferramentas templates e voice-channels exigem, nas páginas, `UserTool.enabled`; a rota de servidores é core. Não existe uma rota 404/error/loading personalizada.

## Padrões identificados

- App Router com Server Components por padrão.
- “Backend for Frontend” via Server Actions.
- Adapter pattern do Auth.js/Prisma.
- Singleton Prisma em `src/lib/prisma.js`, porém aplicado inconsistentemente.
- Command/event-driven no bot.
- State machine implícita para aplicação de templates, armazenada em objetos mutáveis do `Map`.
- Optimistic UI para drag-and-drop.
- Feature toggle por usuário via `UserTool`.

# 5. Banco de Dados

## Modelos

### `User`

- PK: `id` CUID.
- Campos: `name?`, `email?` único, `emailVerified?`, `image?`.
- Relações 1:N: Account, Session, Template, UserTool, VoiceHub.
- Exclusão do usuário propaga em cascata para todas essas entidades e, indiretamente, seus filhos.

### `Account`

- PK: `id` CUID.
- FK: `userId → User.id`, cascade.
- Identidade externa: `type`, `provider`, `providerAccountId`.
- Tokens OAuth opcionais em texto: refresh, access e ID token; expiração, tipo, scope e estado.
- Unique composto: `(provider, providerAccountId)`.
- Consulta crítica: o bot procura `provider=discord` + ID do autor para ligar Discord e usuário SaaS.

### `Session`

- PK: `id` CUID.
- Unique: `sessionToken`.
- FK: `userId → User.id`, cascade.
- `expires` obrigatório.
- Sustenta a estratégia de sessão em banco.

### `VerificationToken`

- Sem PK explícita.
- Campos: `identifier`, `token` único, `expires`.
- Unique composto `(identifier, token)` além do unique simples em `token`.
- É exigido pelo adapter, mas não há provider de e-mail; tende a ficar sem uso no fluxo atual.

### `Template`

- PK: `id` CUID.
- FK: `userId → User.id`, cascade.
- `name`, `createdAt`, `updatedAt`.
- Relação 1:N com Channel, cascade.
- Não há limite ou unicidade de nome por usuário.

### `Channel`

- PK: `id` CUID.
- FK: `templateId → Template.id`, cascade.
- `name`, `type` string livre, `isPrivate`, `order`.
- Não há enum/constraint para tipos, unique de ordem por template ou índices explícitos em `templateId`.

### `UserTool`

- PK composta: `(userId, toolKey)`.
- FK: `userId → User.id`, cascade.
- `enabled`, default `true`.
- A aplicação, no entanto, trata ausência do registro como `false`. Assim, o default do banco só vale em criações sem valor explícito.
- `toolKey` é string livre, sem enum/foreign key para catálogo.

### `VoiceHub`

- PK: `id` CUID.
- FK: `userId → User.id`, cascade.
- Unique: `channelId`, impedindo dois Hubs para o mesmo canal globalmente.
- Identificação: `guildId`, `channelId`, `name`.
- Configuração: `tempChannelName`, `userLimit`, `bitrate`, `keepAliveMinutes`, `ownershipLockMinutes`.
- Sincronização: `syncWithCategory`, `syncWithHubChannel`.
- Permissões: `permissionMode` string, `permissionRoles[]`, `ignoredRoles[]`, `moderatorRoles[]`.
- Relação 1:N com TemporaryVoiceChannel.
- Não há índice em `userId` ou `guildId`.
- O default de `tempChannelName` no schema/migration contém texto corrompido (`ReuniÃ£o...`), o que pode aparecer em novos registros criados sem override.

### `TemporaryVoiceChannel`

- PK: `id` CUID.
- FK: `voiceHubId → VoiceHub.id`, cascade.
- `channelId` único, `ownerId`, `createdAt`, `emptySince?`.
- Índices em `voiceHubId` e `channelId`; o índice comum em `channelId` é redundante porque o unique já cria índice.
- **Não é usado pelo código em execução**. Nem criação, consulta, atualização nem exclusão Prisma ocorre para esse modelo.

## Migrations

1. `init`: cria Auth, templates, channels e UserTool. O SQL original continha campos `Channel.createdAt` e `UserTool.id/createdAt/updatedAt`.
2. `add_voice_hub_feature`: remove esses campos, muda UserTool para PK composta, adiciona VoiceHub e unique de `VerificationToken.token`.
3. `add_temporary_voice_channels`: cria a tabela planejada para persistência de salas temporárias.

O schema atual está coerente estruturalmente com as três migrations, salvo a questão semântica de dados não usados. Não há seed.

## Principais consultas e circulação

- Dashboard/layout: `UserTool.findMany(userId)`.
- Toggle: `UserTool.upsert`.
- Templates: `Template.findMany`, `create`, `deleteMany`, `findUnique` com channels, `updateMany`.
- Channels: `create`, `findUnique(include template)`, `update`, `delete`, múltiplos `update` em transação para ordem.
- VoiceHub: lista por usuário; detalhe por `id + userId`; create/update/delete.
- Bot slash: Account → UserTool → Template → Channels.
- Evento de voz: `VoiceHub.findUnique(channelId)`.

O painel grava configurações no PostgreSQL; o bot lê diretamente esse mesmo banco em eventos e comandos. Alterações do Hub não são “enviadas” ao bot, exceto renomear/excluir o canal Hub; as demais passam a valer na próxima criação porque o evento consulta o banco novamente.

## Problemas de integridade

- `Channel.type`, `VoiceHub.permissionMode` e `UserTool.toolKey` aceitam qualquer string.
- Não há constraints de faixa para bitrate, limite ou minutos.
- Não há `@@index([userId])` em Template/VoiceHub nem `@@index([templateId])` em Channel explicitamente.
- A reordenação atual pode atualizar canais de outro template/usuário, pois só valida o template informado e não restringe cada ID da lista.
- Criar canal Discord e depois registro VoiceHub não é transacional entre sistemas: falha no banco deixa canal órfão.
- Excluir/renomear realiza Discord antes do banco; falhas intermediárias podem deixar estado divergente.

# 6. Autenticação

## Login

Exclusivamente Discord OAuth. O formulário público dispara `signIn("discord")`. Credenciais vêm de `DISCORD_CLIENT_ID` e `DISCORD_CLIENT_SECRET`. Não há login por senha.

## Registro

É implícito no primeiro login OAuth: PrismaAdapter cria User e Account. Não há tela de cadastro, termos versionados, consentimento persistido ou onboarding.

## Logout

`UserDropdown` envia formulário para `logout()`, que chama `signOut()`. Auth.js encerra a sessão; o destino pós-logout não é configurado explicitamente.

## Recuperação de senha

Não existe e não se aplica ao único método OAuth. A tabela VerificationToken vem do adapter, mas não implementa recuperação.

## Refresh token

O schema suporta `Account.refresh_token`, mas não há callback customizado de refresh. A aplicação não chama a API OAuth do Discord em nome do usuário; usa o bot para guilds, então não depende do access token do usuário no fluxo observado.

## Middleware/guards

Não há `middleware.js`. O dashboard é protegido no layout e novamente em várias páginas/actions. A repetição reduz a chance de acesso anônimo, porém dispersa a política.

## Autorização, permissões e roles

- Dados de template e Hub geralmente são filtrados por `session.user.id`.
- Feature flags controlam acesso às páginas, mas Server Actions como `createTemplate`, `getTemplates`, `deleteTemplate`, `toggleTool`, `getGuilds` e `removeGuild` não validam a feature correspondente.
- Não existem roles SaaS (`admin`, `member`, etc.).
- Cargos Discord são apenas IDs guardados em arrays.
- Não existe comprovação de que o usuário web administra a guild alvo. O painel lista **todas** as guilds do bot.
- `removeGuild`, `getGuildRoles` e `createVoiceHub` aceitam guildId sem vínculo ao usuário. Esse é o maior problema de autorização do projeto.

# 7. Fluxo das Funcionalidades

## Login e dashboard

- Tela: `/`.
- Arquivos: `src/app/page.js`, `src/auth.js`, auth route.
- Fluxo: sessão existente redireciona; caso contrário OAuth Discord; adapter persiste; dashboard carrega flags.
- Regra: qualquer conta Discord válida pode entrar; não há allowlist.

## Ativação de ferramentas

- Tela: `/dashboard` e Sidebar.
- Action: `toggleTool(toolKey, enabled)`.
- Banco: upsert de UserTool.
- Regra efetiva: qualquer string pode ser enviada como `toolKey`; a UI usa templates e voice-channels.
- Problema: `getUserToolsState` não marca nenhuma ferramenta com `isCore`, mas o dashboard filtra por `isCore` esperando `servers`. Assim `coreTools` fica vazio e servidores não faz parte do catálogo retornado; links usam fallback, porém métricas contam somente as duas ferramentas. Essa divergência parece resultado de refatoração incompleta.

## Gestão de servidores

- Tela: `/dashboard/servers`.
- Ações: `getGuilds`, `removeGuild`.
- API: GET `/guilds`, DELETE `/guilds/:id`.
- Fluxo: Server Component consulta API; Client Component renderiza, refresca ao foco e oferece convite/remoção.
- Regra observada: “servidores do usuário” na UI são, na verdade, todas as guilds conectadas ao bot.
- Risco: qualquer autenticado pode remover o bot de qualquer guild listada ou cujo ID conheça.

## Templates — lista e CRUD

- Tela: `/dashboard/templates`.
- Actions: `createTemplate`, `getTemplates`, `deleteTemplate`.
- Regras: ferramenta deve estar ativa para acessar a página; nomes vazios são ignorados; listagem e exclusão filtram por usuário; cascade apaga canais.
- Não há confirmação de exclusão, tamanho máximo ou deduplicação.

## Editor de template

- Tela: `/dashboard/templates/[id]`.
- Actions: `getTemplate`, `updateTemplateName`, `addChannel`, `updateChannel`, `deleteChannel`, `updateChannelOrder`.
- Componentes: `ChannelList`.
- Regras:
  - tipos oferecidos: TEXT, VOICE, FORUM, ANNOUNCEMENT;
  - nomes textuais/fórum/anúncio são normalizados para minúsculas ASCII e hífens;
  - voz preserva nome aparado;
  - novo canal recebe `max(order)+1`;
  - canais podem ser privados;
  - ordem é otimista e persistida em transação.
- Falha crítica: `updateChannelOrder` valida que o template pertence ao usuário, mas atualiza todos os IDs enviados sem confirmar que pertencem ao template. Uma requisição manipulada pode reordenar canais de terceiros.
- `updateChannel` aceita `type` e `order` manipulados sem validação de enum/faixa.

## Aplicação de template no Discord

- Entrada: comando slash `/aplicar-template`.
- Arquivos: `deploy-commands.js`, `interactionHandler.js`, `templateCommands.js`, `utils.js`.
- Fluxo:
  1. exige guild;
  2. associa autor do comando a Account Discord;
  3. exige UserTool templates ativo;
  4. mostra templates do usuário;
  5. usuário escolhe categoria existente ou cria nova;
  6. categoria nova pode ser pública/privada;
  7. privada exige cargos existentes ou criação de cargo;
  8. cria canais públicos;
  9. para cada canal privado, solicita cargos e cria overwrite;
  10. mostra contagem e falhas.
- Estado vive no Map `jobs`; reinício perde o fluxo e jobs abandonados nunca expiram.
- Limites Discord: menu aceita no máximo 25 opções; templates não são paginados, então usuários com mais de 25 templates podem causar erro.
- Não há rollback: criação parcial permanece.
- Não é verificado que interações subsequentes pertencem a `job.ownerId`.
- Seleção de cargos paginada substitui `selectedRoleIds` pelos valores da página atual, podendo perder seleções anteriores.
- Categoria existente é tratada como pública (`categoryIsPrivate=false`) e suas permissões não são alteradas.

## Criação de Hub

- Tela: `/dashboard/voice-channels/new`.
- Componentes: `ServerSelector`.
- Action: `createVoiceHub`.
- API: POST `/guilds/:guildId/voice-channels`.
- Fluxo: carrega guilds → seleciona via hidden input → cria canal Discord → cria VoiceHub → redireciona ao editor.
- Defaults da action: nome “Hub de Voz Temporário”, template em inglês `{username}'s Room`, sem limite, 64 kbps, retenção e lock em `-1`.
- Falhas:
  - guildId não é validado nem autorizado;
  - se Prisma falhar após criar o canal, sobra canal órfão;
  - valor default difere do schema e do idioma da UI.

## Lista e exclusão de Hubs

- Tela: `/dashboard/voice-channels`.
- Banco: VoiceHub por usuário.
- Integração: cruza guildId com GET `/guilds`.
- Exclusão: apaga canal no Discord, depois VoiceHub; cascade apagaria TemporaryVoiceChannel.
- Se o bot não alcançar Discord, o banco não é apagado. Se Discord apagar e Prisma falhar, registro fica órfão.

## Editor de Hub

- Tela: `/dashboard/voice-channels/[id]`.
- Componente: `VoiceHubEditor`.
- Actions: `getGuildRoles`, `updateVoiceHub`, `deleteVoiceHub`.
- Configurações:
  - nome do Hub/canal de entrada;
  - padrão `{username}`/`{index}`;
  - limite de usuários;
  - bitrate;
  - retenção vazio;
  - tempo de bloqueio de propriedade;
  - sincronização com categoria/canal Hub;
  - modo deny-except ou allow-except;
  - cargos de permissão, ignorados e moderadores.
- O nome é atualizado no Discord antes do banco.
- Problema funcional: a query da página não seleciona `permissionRoles`, `ignoredRoles` nem `moderatorRoles`; o editor recebe `undefined` e inicializa listas vazias. Salvar sem reescolher pode apagar configurações existentes.
- `getGuildRoles` não prova que o Hub/guild pertence ao usuário.
- Valores numéricos são parseados, mas não validados; o bot normaliza alguns somente ao criar canal.

## Automação de salas temporárias

- Evento: `voiceStateUpdate`.
- Consulta: VoiceHub por `channelId`.
- Regras:
  - ignora bots;
  - ignora membros com cargos configurados;
  - lock por guild+membro evita criação concorrente;
  - cria canal na categoria do Hub;
  - nome substitui `{username}` e `{index}`, limite 100;
  - bitrate é limitado entre 8 kbps e máximo da guild;
  - userLimit entre 0 e 99;
  - permissões vêm da categoria, canal Hub ou regras customizadas;
  - owner ganha ManageChannels/MoveMembers;
  - moderadores ganham permissões ampliadas;
  - membro é movido ao canal;
  - ao esvaziar, apaga imediatamente, após N minutos ou nunca (`-1`).
- Fragilidade: tudo vive em memória. Após restart, canais existentes não são reconhecidos, não são removidos e o índice reinicia.
- `ownershipLockMinutes` não é aplicado; não há transferência/bloqueio real de owner.
- A tabela TemporaryVoiceChannel e `emptySince` não são usadas.

# 8. APIs

## API pública/web

| Endpoint | Método | Parâmetros | Autenticação | Resposta/finalidade |
|---|---|---|---|---|
| `/api/auth/*` | GET/POST | Parâmetros/cookies Auth.js | Conforme etapa OAuth | Login, callback, sessão, CSRF e logout administrados pelo Auth.js. |

Server Actions são endpoints internos gerados pelo Next e não possuem URL REST estável documentável. Recebem FormData/argumentos serializados e cookie de sessão.

## API Express interna

Todas as rotas exigem header `x-bot-secret` igual a `BOT_API_SECRET`. O servidor escuta somente `127.0.0.1`.

| Rota | Método | Entrada | Resposta de sucesso | Finalidade |
|---|---|---|---|---|
| `/health` | GET | nenhuma | `{success, botReady, botUser}` | Saúde do bot. Não é consumida pelo painel. |
| `/guilds` | GET | nenhuma | `[{id,name,icon,memberCount}]` | Guilds no cache do bot. |
| `/guilds/:guildId/roles` | GET | guildId | `[{id,name,color,position}]` | Cargos não gerenciados, exceto everyone. |
| `/guilds/:guildId/voice-channels` | POST | JSON `{name}` | 201 `{success,channelId,channelName}` | Cria canal de voz. |
| `/guilds/:guildId/voice-channels/:channelId` | PATCH | JSON `{name}` | `{success,channelId,channelName}` | Renomeia canal de voz. |
| `/guilds/:guildId/voice-channels/:channelId` | DELETE | IDs | `{success,channelId}` | Exclui canal Hub. |
| `/guilds/:id` | DELETE | guild ID | `{success:true}` | Bot sai da guild. |

Erros usam 400/401/404/500 e payloads `{error, details?}`. Não há schema validation, rate limiting, request IDs, timeout explícito ou versionamento.

# 9. Componentes Reutilizáveis

- **Sidebar**: navegação, estado ativo e toggle de ferramentas; usado no layout do dashboard. Depende de Next navigation, Link, Lucide e Server Action.
- **UserDropdown**: avatar, fechamento por clique externo e logout; usado no cabeçalho.
- **SliderWithTicks**: range controlado com ticks; sem consumidores, candidato a remoção.
- **ChannelList/SortableChannelItem**: editor de canais, drag-and-drop e salvamento otimista; usado somente no detalhe de template.
- **ServerSelector/ServerAvatar**: combobox customizado pesquisável; usado na criação do Hub.
- **VoiceHubEditor**: formulário complexo e componentes internos `RangeField`, `ToggleField`, `RoleBadge`, `RoleSelector`, `SectionTitle`; usado no detalhe do Hub.
- **ServersClient**: apresentação da lista, avatars, convite e refresh; usado na rota de servidores.
- Funções visuais locais (`NoticeState`, `GuildAvatar`, `InviteButton`) poderiam migrar para componentes compartilhados caso o produto cresça.

# 10. Serviços

Não existe diretório/camada “services”. Os serviços lógicos são:

1. **Auth service (`src/auth.js`)**: Discord + PrismaAdapter.
2. **Prisma access (`src/lib/prisma.js`)**: conexão compartilhada, mas vários módulos o ignoram.
3. **Feature tool service (`src/lib/user-tools.js`)**: catálogo e UserTool.
4. **Template actions**: persistência e normalização.
5. **Server/Bot proxy actions**: chamadas HTTP autenticadas à API interna.
6. **VoiceHub actions**: orquestram Discord e banco sem transação distribuída.
7. **Bot internal API**: fachada HTTP sobre discord.js.
8. **Template command service**: workflow interativo e aplicação.
9. **Voice hub engine**: eventos e ciclo de vida temporário.

Dependências estão fortemente acopladas a Prisma/Discord/Next; não há interfaces, injeção de dependência ou mocks, o que dificulta testes.

# 11. Regras de Negócio

- Usuário precisa autenticar com a mesma conta Discord usada no comando slash.
- Templates e Hubs pertencem a um User.
- Ferramenta deve estar ativada para abrir sua UI; templates também são checados pelo bot.
- Canais textuais são normalizados conforme restrições de nome do Discord.
- Ordem define sequência de criação.
- Privacidade de categoria/canal nega ViewChannel a everyone e permite cargos escolhidos.
- Hub é identificado pelo canal de entrada único.
- Bots nunca disparam sala temporária.
- Cargos ignorados impedem criação.
- Owner da sala recebe privilégios de gerenciamento.
- Moderadores recebem gerenciamento/mute/deafen.
- `deny_except`: everyone é negado e cargos escolhidos são permitidos.
- `allow_except`: cargos escolhidos são negados; everyone permanece conforme herança.
- Categoria ou canal Hub podem fornecer overwrites em vez da configuração customizada.
- Salas vazias: excluir agora, depois de N minutos ou nunca.
- Bitrate e limite são normalizados somente no bot.
- Um usuário não pode acessar por UI o recurso de outro quando as queries usam userId; há exceções graves nos IDs Discord e na reordenação.

# 12. Variáveis de Ambiente

| Variável | Necessidade | Uso |
|---|---|---|
| `DATABASE_URL` | obrigatória | Conexão PostgreSQL do Prisma. |
| `DISCORD_CLIENT_ID` | obrigatória | OAuth Discord no Auth.js. Também deveria registrar slash command, mas o script usa outro nome. |
| `DISCORD_CLIENT_SECRET` | obrigatória | Segredo OAuth. |
| `DISCORD_BOT_TOKEN` | obrigatória | Login do bot e REST para registrar comandos. |
| `AUTH_SECRET` | obrigatória | Assinatura/proteção do Auth.js. |
| `BOT_API_SECRET` | obrigatória | Header compartilhado entre Next e Express. Sem ele, a API rejeita todas as chamadas. |
| `BOT_API_PORT` | opcional | Porta interna, default 3001. |
| `DISCORD_BOT_INVITE_URL` | necessária para UX | Link exibido para adicionar bot; vazio desabilita/compromete convite. |
| `AUTH_URL` | produção | URL canônica Auth.js, mencionada no README e presente em ambientes locais. |
| `NEXTAUTH_URL` | compatibilidade/config local | Presente em ambiente local, não referenciada diretamente. Auth.js pode consumi-la conforme versão. |
| `AUTH_TRUST_HOST` | produção atrás de proxy | Recomendado no README, ausente do `.env.example`; consumido pelo Auth.js, não pelo código explícito. |
| `PORT` | opcional | Porta do Next, consumida pelo runtime, não pelo código. |
| `AUTH_DISCORD_ID` | atualmente exigida pelo deploy script | `bot/deploy-commands.js` usa esse nome, mas ele não está no `.env.example`; provável bug. Deve ser unificado com `DISCORD_CLIENT_ID`. |
| `NODE_ENV` | runtime | Controla singleton Prisma em desenvolvimento. |

`.env.example` omite `DISCORD_BOT_INVITE_URL`, `AUTH_URL`, `AUTH_TRUST_HOST`, `PORT` e a variável divergente do registrador.

# 13. Dependências

As dependências principais e seus papéis estão na seção 2. Pontos adicionais:

- O lock instala Next 15.5.22 apesar de `package.json` dizer `^15.1.0`; `eslint-config-next` fica fixo em 15.1.0, criando desalinhamento.
- React instala 18.3.1 apesar de `^18.2.0`.
- Prisma CLI está em `dependencies`, não `devDependencies`, possivelmente para migrations em produção.
- `dotenv` e `dotenv-cli` têm papéis diferentes: bot versus wrapper do Next.
- Não há bibliotecas de validação (Zod), testes, logging estruturado, segurança HTTP, rate limiting ou filas.
- Não há script `prisma generate`, `migrate`, `deploy-commands`, `test` ou `typecheck`.

# 14. Fluxo Completo da Aplicação

1. **Acesso**: Next renderiza `/`; `auth()` lê cookie e Session.
2. **Login**: Server Action inicia OAuth; Discord retorna ao Auth.js; adapter persiste User/Account/Session.
3. **Carregamento**: redireciona a `/dashboard`; layout lê sessão e ferramentas.
4. **Navegação**: Sidebar usa pathname; páginas Server consultam Prisma/API interna.
5. **Ações**:
   - toggles/templates usam Server Actions → Prisma;
   - servidores/Hubs usam Server Actions → Express → Discord e/ou Prisma;
   - aplicação do template acontece no cliente Discord → bot.
6. **Persistência**:
   - identidade/configuração no PostgreSQL;
   - jobs e canais temporários apenas na RAM;
   - recursos reais no Discord.
7. **Resposta**:
   - Server Actions revalidam rotas/redirecionam;
   - bot responde com embeds efêmeros;
   - eventos de voz atuam sem resposta web.
8. **Logout**: menu chama `signOut`; sessão de banco/cookie é encerrada e acesso protegido volta a redirecionar.

# 15. Segurança

## Pontos positivos

- Segredos estão em `.env*`, ignorados pelo Git.
- API Express escuta loopback e exige segredo em todas as rotas, inclusive health.
- Quase todas as mutações de entidades SaaS verificam sessão.
- Templates/Hubs geralmente usam userId para isolamento.
- Foreign keys têm cascade consistente.
- A interface não recebe `BOT_API_SECRET`.
- OAuth elimina armazenamento de senhas.

## Vulnerabilidades/riscos

### Crítico — autorização horizontal de guilds

`getGuilds` retorna todas as guilds do bot. `removeGuild(guildId)`, `getGuildRoles(guildId)` e `createVoiceHub(formData)` exigem apenas login, não que o usuário seja owner/admin da guild. Um usuário malicioso pode manipular uma Server Action e:

- remover o bot de guild alheia;
- criar canal Hub em guild alheia;
- enumerar cargos de guild alheia.

Correção: obter guilds administráveis pelo access token do usuário (`guilds` scope e permissão `MANAGE_GUILD`/owner) e intersectar com guilds do bot, ou manter ACL verificada por desafio/instalação.

### Crítico — IDOR na reordenação

`updateChannelOrder(templateId, channels)` valida apenas o template, depois atualiza qualquer `channel.id` fornecido. Deve buscar todos com `templateId` e garantir igualdade exata do conjunto antes da transação.

### Alto — estado temporário não persistente

Restart deixa canais órfãos e pode quebrar limpeza. A tabela existente deve ser usada e reconciliada no `clientReady`.

### Alto — configurações de cargos apagadas

O detalhe do Hub omite arrays no `select`; salvar pode zerá-los.

### Alto — validação insuficiente

- Server Actions confiam em strings, IDs e números do cliente.
- Sem enum de tipo/mode.
- Sem limites de comprimento.
- Sem validação de faixa antes de persistir.
- Sem autorização Discord por guild.
- Express aceita JSON sem limite customizado (usa default) e propaga `error.message` do Discord ao cliente interno.

### Médio

- Ausência de rate limiting nas Server Actions e API.
- Ausência de timeout/AbortSignal em fetch ao bot; render pode ficar presa.
- Segredo estático compartilhado, sem rotação/autenticação por operação.
- Tokens OAuth são persistidos em texto pelo adapter; proteção depende do banco.
- Jobs não validam autor em cada interação e não expiram.
- Sem confirmação para exclusões destrutivas.
- Sem security headers/CSP explícitos.
- Uso de `<img>` com URLs externas do Discord evita configuração de `next/image`, mas perde otimização e política explícita.
- `console.log` pode expor IDs e detalhes operacionais; não há redaction.

## Sanitização

React escapa texto na UI. A normalização de canais reduz caracteres para alguns tipos. Discord.js aplica sua própria serialização, mas nomes de categoria/cargo/voz não recebem política consistente. Não há HTML arbitrário nem SQL raw, reduzindo XSS/SQL injection, porém validação de domínio continua necessária.

# 16. Performance

## Consultas

- `getUserToolsState` faz findMany e depois `find` linear por ferramenta; irrelevante com duas ferramentas, mas pode virar mapa.
- Layout e dashboard chamam separadamente `auth`/`getUserToolsState`, gerando leituras repetidas na mesma navegação.
- Voice list espera consulta do banco e depois HTTP de guilds sequencialmente; podem ser paralelizados.
- Ausência de índices em FKs/filtros frequentes pode degradar Template/VoiceHub/Channel.
- Reorder atual faz N updates em transação; aceitável para listas pequenas, mas caro em listas grandes.
- Bot consulta VoiceHub no banco em cada entrada de canal de voz, inclusive canais comuns; com alto volume isso é um hot path. Cache por channelId com invalidação ou mapa carregado/reconciliado ajudaria.

## Renderização/componentes

- Server Components reduzem JavaScript do cliente.
- `VoiceHubEditor` tem ~32 KB e muitas responsabilidades; aumenta bundle e rerender.
- Sidebar inteira é client component apenas por pathname/toggle.
- Muitas classes Tailwind repetidas, com custo de manutenção mais que runtime.
- `<img>` não otimiza avatars/logos.
- Refresh ao foco na lista de servidores dispara nova renderização/consulta sempre.

## Cache

- Guilds/roles usam no-store corretamente para atualidade, mas sem cache curto provocam chamadas repetidas.
- Não há cache de saúde, guilds ou roles.
- `revalidatePath` é amplo em alguns fluxos.
- Estado em memória não é cache confiável e impede escala horizontal.

## Gargalos e otimizações

1. Persistir/reconciliar canais temporários.
2. Adicionar índices por userId/templateId/guildId.
3. Paralelizar leituras independentes.
4. Cache curto e timeout para API do bot.
5. Debounce/coalescing de reorder.
6. Dividir VoiceHubEditor e memorizar seletores pesados se necessário.
7. Observabilidade para medir antes de otimizar.

# 17. Dívida Técnica

## Prioridade crítica

1. Corrigir ACL de guilds nas Server Actions.
2. Corrigir IDOR de `updateChannelOrder`.
3. Persistir ciclo de vida de TemporaryVoiceChannel e reconciliar restart.
4. Incluir arrays de cargos na query do editor.

## Prioridade alta

5. Centralizar PrismaClient: hoje existem instâncias em `user-tools`, páginas/actions de Hub, interaction handler, template commands e index do bot. Em serverless/dev pode esgotar conexões.
6. Adicionar validação centralizada e enums.
7. Tornar criação/exclusão Hub compensável/idempotente.
8. Corrigir lint e alinhar versões Next/eslint-config-next.
9. Implementar testes unitários, integração e E2E.
10. Implementar `ownershipLockMinutes` ou removê-lo da UI/schema.

## Prioridade média

11. Unificar catálogo de ferramentas (`tools.js` morto versus `user-tools.js`).
12. Corrigir conceito `isCore`/servers.
13. Corrigir deploy command (`AUTH_DISCORD_ID`, nome de arquivo divergente no README).
14. Expirar jobs e validar owner.
15. Paginar templates e corrigir seleção de roles entre páginas.
16. Extrair API client/config única (`localhost` versus `127.0.0.1`).
17. Logging estruturado, health checks e graceful shutdown.
18. Criar error/loading/not-found boundaries.

## Prioridade baixa

19. Remover assets/componentes mortos.
20. Limpar comentários históricos como “Adicionado”, “Importar”.
21. Padronizar idioma/defaults.
22. Refatorar estilos repetidos.

# 18. Código Legado

- `src/lib/tools.js`: catálogo não importado e desatualizado.
- `src/components/SliderWithTicks.js`: componente sem uso.
- `src/app/dashboard/voice-channels/[id]/fetch-hub.js`: action sem consumidor.
- SVGs padrão em `public/`: sem referência.
- `TALK_LOG.md`: 91 KB de histórico operacional/conversacional; útil como diário, mas inadequado como documentação principal e aumenta ruído.
- `interactionHandler.js`: grande cadeia de condicionais, estado implícito e imports dinâmicos; merece máquina de estados/handlers por customId.
- `VoiceHubEditor.js`: componente grande com subcomponentes, estado e apresentação no mesmo arquivo.
- `templateCommands.js`: mistura renderização de mensagens, estado, acesso a dados e efeitos Discord.
- módulos com `new PrismaClient()`: refatorar para factories/singletons adequados ao processo.
- `README.md`: conteúdo sem estrutura Markdown consistente, menciona `ecosystem.config.js` inexistente e `bot/deploycommands.js` quando o arquivo real é `bot/deploy-commands.js`.

# 19. Funcionalidades Incompletas

Não há marcadores literais `TODO` ou `FIXME` relevantes no código. A ausência de marcadores não significa completude:

- `TemporaryVoiceChannel` foi migrado, mas nunca integrado.
- `ownershipLockMinutes` aparece na UI/banco e não no engine.
- `fetchVoiceHub` não é usado.
- `TOOLS` não é usado.
- `isCore` é esperado, mas não fornecido.
- Comentário em UserDropdown reserva “futuras opções”.
- Registro de slash command depende de variável não documentada e README aponta arquivo inexistente.
- Health endpoint não é usado por monitoramento/painel.
- Sem cadastro explícito, recuperação, RBAC, billing ou onboarding.
- Sem testes.
- Sem tratamento de canais temporários existentes após restart.
- Sem limpeza de VoiceHub quando canal Hub é deletado diretamente no Discord ou bot sai da guild.
- Sem feedback robusto/estado pendente/erro para várias Server Actions.

# 20. Roadmap Sugerido

## Melhorias rápidas

1. Corrigir import ESLint e alinhar versões.
2. Unificar `DISCORD_CLIENT_ID` no deploy script e adicionar script npm.
3. Corrigir README e `.env.example`.
4. Incluir arrays de roles no select do Hub.
5. Remover/arquivar arquivos mortos.
6. Adicionar validações de enum, comprimento e faixa.
7. Adicionar confirmações de exclusão e mensagens de erro.

## Melhorias importantes

1. Implementar autorização real por guild e auditoria.
2. Corrigir reorder com validação do conjunto.
3. Centralizar Prisma e clients HTTP.
4. Integrar TemporaryVoiceChannel e recuperação após restart.
5. Implementar compensações para efeitos Discord + banco.
6. Testes:
   - unitários de normalização/permissões;
   - integração Prisma/actions;
   - integração fake Discord/API;
   - E2E login/dashboard.
7. Refatorar bot para workflow explícito com TTL.
8. Adicionar observabilidade, timeouts, graceful shutdown e health operacional.

## Grandes evoluções

1. Multi-instância: Redis/queue/locks distribuídos ou worker único bem definido.
2. Modelo de organizações/servidores com memberships e roles SaaS.
3. Billing, planos, quotas e limites.
4. Painel de status/auditoria de automações.
5. Sincronização bidirecional e detecção de drift com Discord.
6. Editor avançado de templates com categorias, cargos e preview.
7. Gestão de owner de salas, comandos dentro do canal e transferência.
8. Deploy containerizado e CI/CD com migrations seguras.

# 21. Resumo Executivo

## Avaliação

| Dimensão | Nota | Diagnóstico |
|---|---:|---|
| Maturidade | 4,5/10 | MVP funcional, porém sem testes, observabilidade, billing ou robustez operacional. |
| Arquitetura | 6,0/10 | Separação painel/bot é compreensível; acoplamento direto e estado volátil limitam evolução. |
| Qualidade do código | 5,0/10 | Código legível e organizado por feature, mas validação, consistência e abstrações são frágeis. |
| Manutenibilidade | 5,0/10 | Projeto pequeno facilita entendimento; componentes/handlers grandes e Prisma disperso dificultam mudanças. |
| Escalabilidade | 3,5/10 | Estado em RAM, processo único e falta de índices/filas impedem escala horizontal segura. |
| Segurança | 3,0/10 | OAuth e API loopback são bons fundamentos, mas ACL de guild e IDOR são críticos. |

## Pontos fortes

- Proposta de valor clara e duas features concretas.
- Boa adoção de Server Components e Server Actions para um MVP.
- Modelo de ownership para templates/Hubs.
- Integração Discord relativamente rica.
- UI consistente e organizada.
- Migrations existentes e cascades coerentes.
- API do bot não é exposta publicamente por padrão.

## Pontos fracos/riscos

- Falta de autorização real sobre servidores Discord.
- Reordenação permite atualizar IDs fora do escopo.
- Salas temporárias não sobrevivem a restart apesar de tabela já existir.
- Configurações de cargos podem ser apagadas pelo editor.
- Nenhum teste e lint quebrado.
- Múltiplas conexões Prisma e ausência de validação.
- Operações entre Discord e banco não são atômicas nem compensadas.
- Documentação/configuração divergente do código.

## Nível de maturidade

O sistema está em estágio de **MVP/protótipo avançado**: há jornadas úteis ponta a ponta e um domínio bem definido, mas ainda não possui garantias necessárias para operar como SaaS multiusuário público sem risco. Antes de ampliar funcionalidades, a prioridade deve ser isolamento entre usuários/guilds, persistência operacional, validação e testes.

## Nota geral

**4,8 / 10**

A nota reconhece uma base funcional e visual sólida, mas é reduzida por vulnerabilidades de autorização com impacto externo, estado efêmero incompatível com produção resiliente, funcionalidades declaradas porém não implementadas e falta total de validação automatizada.
