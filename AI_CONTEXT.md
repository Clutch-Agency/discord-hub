# AI Context — Discord Hub / Clutch Hub

> Contexto permanente para agentes de IA. Atualizado em 31/07/2026 após a
> Fase 1B. Para a auditoria histórica detalhada, consulte `PROJECT_REPORT.md`;
> confirme sempre no código porque o relatório antecede as Fases 1A e 1B.

# 1. Visão Geral

O Clutch Hub é uma ferramenta pessoal/interna para administrar e automatizar
servidores Discord usados em projetos de jogos. O painel reduz trabalho manual
na criação de estruturas de canais e na configuração de salas de voz
temporárias. O público atual é um conjunto explícito de operadores autorizados,
atuando apenas nas guilds que administram no Discord.

O MVP está funcional e em estabilização. As Fases 1A e 1B concluíram a fundação
e a aplicação inicial de autenticação/autorização: dashboard, guilds, templates,
toggles e CRUD de VoiceHub agora exigem operador; efeitos Discord também exigem
autorização atual da guild no processo web e novamente no bot.

# 2. Stack

- **Linguagem:** JavaScript; ESM no Next.js e CommonJS no bot.
- **Frontend:** React 18, Next.js 15 App Router e Tailwind CSS 4.
- **Backend web:** Server Components e Server Actions do Next.js.
- **Bot/API privada:** Node.js, discord.js 14 e Express 5.
- **Banco/ORM:** PostgreSQL e Prisma 6.
- **Autenticação:** Auth.js/NextAuth 5 beta, Discord OAuth, PrismaAdapter e
  sessões persistidas em banco.
- **Hospedagem atual documentada:** README padrão do Next, ainda inadequado ao
  projeto; o repositório não comprova uma implantação ativa.
- **Hospedagem-alvo:** Docker Compose self-hosted, ainda não implementado.
- **Serviços externos:** Discord OAuth2, Gateway/REST Discord e PostgreSQL
  atualmente configurável por `DATABASE_URL`.
- **Bibliotecas relevantes:** dnd-kit, Lucide React, Vitest, concurrently,
  dotenv e dotenv-cli.

# 3. Arquitetura

O projeto mantém dois processos e um banco compartilhado:

```text
Navegador
  → Next.js Server Components / Server Actions
    → serviços específicos em src/lib
      → Prisma → PostgreSQL
      → cliente HTTP privado → bot Express → discord.js → Discord

Discord Gateway
  → bot
    → Prisma → PostgreSQL
    → discord.js → recursos Discord
```

O dashboard é um segmento dinâmico e protegido por `requireOperator()` no
layout. Server Actions sensíveis repetem a autorização. Recursos ligados a uma
guild seguem defesa em profundidade: ator derivado da sessão, ownership no
banco, guild derivada do registro quando possível, verificação web pelo bot e
nova verificação no endpoint mutável.

Não há uma camada genérica de domínio. Serviços pequenos e testáveis existem
apenas nos fluxos que precisam coordenar autorização, Prisma e Discord:

- operações de guild;
- operações de VoiceHub;
- reorder de canais;
- toggles de ferramentas;
- cliente da API privada.

Server Components continuam responsáveis por leitura/composição; Server
Actions coordenam mutações; Client Components mantêm somente estado de UI.

# 4. Estrutura Principal

- `src/app/`: App Router, páginas, layouts, Auth route e Server Actions.
- `src/app/dashboard/`: área administrativa protegida, organizada por feature.
- `src/components/`: navegação e componentes compartilhados.
- `src/lib/auth/`: identidade autenticada, allowlist, autorização de operador e
  erros públicos previsíveis.
- `src/lib/discord/`: IDs Discord, autorização de guild, operações de guild e
  cliente HTTP privado com timeout.
- `src/lib/voice-hubs/`: regras testáveis e integração concreta do CRUD seguro.
- `src/lib/templates/`: validação atômica da reordenação completa.
- `bot/`: processo Discord, API Express privada, comandos e engine de voz.
- `prisma/`: schema e três migrations PostgreSQL existentes.
- `.ai/`: skills, prompts, checklists e fundamentos para agentes.
- `.agents/skills/`: adaptadores de descoberta para as skills canônicas.

# 5. Convenções do Projeto

- Componentes React em PascalCase; funções/actions em camelCase.
- Rotas em kebab-case e segmentos dinâmicos `[id]`.
- Modelos Prisma em PascalCase singular.
- Server Components são o padrão; usar `"use client"` só com interação/estado.
- Server Actions devem ser tratadas como endpoints públicos: autenticar,
  validar, autorizar e limitar consultas por owner/guild dentro da própria ação.
- O ator nunca vem do navegador. `requireAuthenticatedActor()` deriva
  `userId` e `discordUserId` de sessão + `Account` persistida.
- Snowflakes usam `normalizeDiscordId()`; a allowlist tem parser único.
- Erros de segurança usam `AuthorizationError` e códigos estáveis; respostas
  públicas passam por `toAuthorizationFailure()` quando retornadas como dados.
- Prisma do processo web deve usar `src/lib/prisma.js`.
- Chamadas web→bot devem usar `src/lib/discord/bot-api-client.js`; não fazer
  `fetch` direto nem implementar retry automático em mutações.
- O catálogo oficial de ferramentas é `USER_TOOLS` em `src/lib/user-tools.js`.

# 6. Banco de Dados

Entidades principais:

- `User`, `Account`, `Session`, `VerificationToken`: Auth.js.
- `Template` → `Channel`: estruturas reutilizáveis por usuário.
- `UserTool`: toggle por chave e usuário.
- `VoiceHub` → `TemporaryVoiceChannel`: configuração de Hub e modelo planejado
  para persistência de salas temporárias.

Templates e Hubs pertencem a `User`. `VoiceHub` guarda `guildId` e `channelId`
Discord; o canal é único. O painel persiste configurações e o bot as consulta.
Recursos reais continuam no Discord, portanto banco e Discord não formam uma
transação distribuída. `TemporaryVoiceChannel` existe no schema, mas ainda não
é usado pelo runtime.

Nenhum schema ou migration foi alterado nas Fases 1A/1B.

# 7. Autenticação

- Login exclusivo por Discord OAuth; não há senha, cadastro separado ou
  recuperação de senha.
- `requireAuthenticatedActor()` resolve o CUID interno e o ID Discord sem
  aceitar identidade do cliente.
- `requireOperator()` exige `ALLOWED_DISCORD_USER_IDS`; configuração ausente,
  vazia ou inválida nega acesso.
- O layout do dashboard exige operador e impede renderização administrativa
  antes da autorização; o segmento é `force-dynamic` por depender de sessão.
- `requireGuildAuthorization()` consulta o bot com o ator autenticado.
- O bot exige owner, `Administrator` ou `ManageGuild` usando o estado atual do
  Discord.
- Endpoints mutáveis exigem `x-bot-secret` e `x-actor-discord-id` e repetem a
  autorização.
- Não há roles SaaS; “operador” é a allowlist e não substitui a permissão da
  guild.

# 8. Funcionalidades

## Login e dashboard

Discord OAuth cria conta/sessão via PrismaAdapter. O dashboard mostra as
ferramentas do operador. Usuários fora da allowlist não recebem conteúdo
administrativo.

## Ferramentas

Templates e canais temporários podem ser ativados por usuário. Somente chaves
presentes em `USER_TOOLS` e booleanos reais são persistidos.

## Servidores conectados

Um único request privado pede ao bot a lista. O bot devolve somente guilds em
que o ator é owner, Administrator ou ManageGuild; falha de autorização em uma
fonte externa resulta em falha segura. Remover o bot repete a autorização no
web e no endpoint antes de `guild.leave()`.

## Templates

CRUD de templates/canais permanece por Server Actions, com operador e ownership.
A aplicação ocorre pelo comando `/aplicar-template`. O reorder exige o conjunto
exato dos canais do template, rejeita duplicatas/omissões/extras e grava ordem
normalizada em transação.

## VoiceHubs

Criação, leitura, atualização, cargos e exclusão exigem operador, ownership e
guild autorizada. Em update/delete, guild e canal vêm do registro atual, não do
formulário. O bot repete a autorização antes de criar, renomear ou excluir o
canal Discord.

O editor recebe `permissionRoles`, `ignoredRoles` e `moderatorRoles`. Marcadores
de presença distinguem limpeza intencional (`[]`) de campo ausente, que não
sobrescreve o valor persistido.

## Salas temporárias

Ao entrar no Hub, o bot cria e move o membro para uma sala, aplica regras de
permissão e remove a sala vazia conforme retenção. O estado operacional ainda é
mantido em `Map`/`Set` e não sobrevive a restart.

# 9. Fluxo da Aplicação

```text
Usuário → Discord OAuth → sessão persistida
  → requireOperator no dashboard
  → leitura limitada ao userId e guilds autorizadas
  → Server Action repete operador/ownership/guild
  → cliente privado (timeout, segredo, ator)
  → bot repete guild authorization
  → Discord e/ou Prisma
  → revalidatePath/redirect → interface atualizada
```

# 10. Regras de Negócio

- Somente IDs Discord na allowlist operam o painel.
- Operador só atua em guild onde é owner, Administrator ou ManageGuild.
- Conhecer um ID não concede acesso; ownership e guild são confirmados no
  servidor.
- Guild/canal de VoiceHub são derivados do banco em update/delete.
- Uma ferramenta precisa existir no catálogo e estar habilitada para sua UI.
- Reorder representa a lista completa e exata de canais do template.
- Canais privados e salas temporárias seguem cargos/permissões configurados.
- Bots e membros com cargos ignorados não geram salas.
- Bitrate e limite de usuários são normalizados no bot.
- Sala vazia segue a política de retenção configurada.

# 11. Componentes Críticos

- `src/auth.js`: Auth.js, Discord e PrismaAdapter.
- `src/app/dashboard/layout.js`: guarda global de operador.
- `src/lib/auth/*`: identidade, allowlist, autorização e erros seguros.
- `src/lib/discord/bot-api-client.js`: único cliente privado, headers, validação
  de respostas e timeout/abort sem retries.
- `src/lib/discord/guild-authorization.js`: autorização web por guild.
- `src/lib/discord/guild-operations.js`: listagem e remoção testáveis.
- `src/lib/voice-hubs/voice-hub-operations.js`: regras puras/orquestração segura.
- `src/lib/voice-hubs/voice-hub-service.js`: dependências Prisma/Discord reais.
- `src/lib/templates/channel-order.js`: prevenção do IDOR no reorder.
- `src/lib/user-tools.js`: catálogo e validação de toggles.
- `bot/guild-authorization.js`: fonte da permissão Discord atual.
- `bot/api.js`: API privada e defesa em profundidade dos efeitos Discord.
- `bot/voice-hubs.js`: ciclo de vida ainda efêmero das salas.
- `prisma/schema.prisma`: contrato de persistência.

# 12. Dependências Importantes

- `next`, `react`, `react-dom`: aplicação web.
- `next-auth`, `@auth/prisma-adapter`: OAuth e sessão persistida.
- `prisma`, `@prisma/client`: PostgreSQL e migrations.
- `discord.js`: Gateway e efeitos Discord.
- `express`: API privada do bot.
- `@dnd-kit/*`: drag-and-drop do reorder.
- `tailwindcss`, `lucide-react`: interface.
- `vitest`: testes de unidade e integração HTTP local.

Não há biblioteca de validação, cache, fila ou logging estruturado. A Fase 1B
não adicionou, removeu ou atualizou dependências.

# 13. Pontos de Atenção

- `TemporaryVoiceChannel` ainda não é usado; restart pode deixar salas órfãs.
- Não há compensação completa entre Discord e banco: criação Discord seguida de
  falha Prisma pode deixar canal órfão; exclusões podem divergir parcialmente.
- Validação ampla de todos os campos de templates/Hubs permanece para a Fase 2.
- O comando slash e os eventos do bot não usam a allowlist do painel; seguem o
  vínculo Discord/UserTool e regras próprias do contexto Discord.
- `ownershipLockMinutes` continua sem implementação no engine.
- Jobs do workflow de template não expiram e menus têm limite de 25 itens.
- Testes não usam OAuth, PostgreSQL ou Discord reais; não há E2E completo.
- Ainda há múltiplos `PrismaClient` no processo do bot e em código legado.
- Ausência de rate limiting e observabilidade estruturada permanece fora do
  escopo desta fase.
- O cliente privado tem timeout de 5 s por padrão, configurável por
  `BOT_API_TIMEOUT_MS` entre 100 e 30000 ms, sem retry mutável.
- A documentação local `node_modules/next/dist/docs/` está ausente nesta
  instalação; a versão instalada é Next 15.5.22 e fontes oficiais da versão 15
  foram consultadas.
- `README.md` continua sendo o template padrão do Next e não documenta a
  instalação real.

# 14. Próximos Passos

1. Fase 2: validação de domínio mais ampla e retornos previsíveis das actions.
2. Persistir e reconciliar `TemporaryVoiceChannel` após restart.
3. Planejar consistência/compensação entre Discord e PostgreSQL.
4. Centralizar clientes Prisma restantes e melhorar observabilidade.
5. Cobrir Auth.js/PostgreSQL/Discord com testes de integração e E2E.
6. Corrigir warnings de `<img>` e dívidas funcionais do workflow de templates.
7. Implementar Docker Compose, migrations controladas, backup e atualização.
8. Somente depois iniciar novas ferramentas.

# 15. Como Trabalhar Neste Projeto

- Respeite a hierarquia de `AI_RULES.md` e leia a skill aplicável.
- Preserve Next.js + bot separado + PostgreSQL compartilhado.
- Trate Server Actions como endpoints públicos; layout/feature toggle não são
  autorização suficiente.
- Reutilize `requireOperator()` e `requireGuildAuthorization()`.
- Nunca aceite ator, owner, guild ou canal do navegador quando puder derivá-los
  de sessão/banco.
- Faça consultas por `resourceId + userId`; autorize a guild persistida antes
  de efeitos.
- Use o cliente privado central; mantenha timeout e não adicione retry a
  mutações sem idempotência.
- Reutilize `USER_TOOLS`; não crie chaves arbitrárias.
- Preserve arrays ausentes em updates parciais e diferencie ausência de `[]`.
- Não altere schema sem migration incremental e autorização explícita.
- Não exponha segredos, URLs internas, stacks ou mensagens de fornecedor.
- Adicione testes de sucesso, negação, IDOR e ausência de efeitos antes de
  considerar uma operação segura.
- Consulte a documentação compatível do Next antes de alterar suas APIs; se a
  documentação local continuar ausente, registre a fonte oficial utilizada.

# 16. Resumo Final

```text
Projeto: Ferramenta pessoal de automação e administração de servidores Discord.
Arquitetura: Next.js App Router + bot discord.js/Express + PostgreSQL compartilhado.
Escalabilidade: Baixa a média; adequada ao uso pessoal, limitada por estado em RAM.
Complexidade: Média; efeitos entre web, banco e Discord exigem defesa em profundidade.
Nível de organização: Médio/alto nos fluxos de segurança migrados; legado ainda existe.
Principais riscos: estado efêmero, inconsistência Discord/banco e validação ampla pendente.
Principais pontos fortes: autorização central, guild isolation, testes de negação e arquitetura simples.
```
