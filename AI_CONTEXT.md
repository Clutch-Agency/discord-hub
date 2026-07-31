# AI Context — Discord Hub / Clutch Hub

> Contexto permanente para agentes de IA. Atualizado em 31/07/2026 a partir do estado local do código.  
> Para auditoria aprofundada, consulte `PROJECT_REPORT.md`. Este arquivo prioriza decisões práticas e compreensão rápida.

# 1. Visão Geral

O **Discord Hub**, apresentado na interface como **Clutch Hub**, é uma
ferramenta pessoal/interna de administração e automação de servidores Discord.
Ela centraliza a criação de estruturas reutilizáveis de canais e a configuração
de salas de voz temporárias, combinando painel web, bot Discord e persistência
compartilhada. Não tratar o produto como SaaS público sem mudança explícita de
direção.

- **Problema resolvido:** reduz tarefas manuais e repetitivas de administradores de comunidades Discord.
- **Público-alvo:** operador autorizado e administradores dos servidores
  Discord controlados pela instalação.
- **Estágio atual:** MVP/protótipo avançado em estabilização, com jornadas
  funcionais ponta a ponta e testes unitários iniciais, mas ainda sem
  autorização adequada por operador/guild, observabilidade ou robustez para
  exposição pública.

# 2. Stack

- **Linguagem:** JavaScript, com módulos ESM no Next.js e CommonJS no bot. Não há TypeScript.
- **Frontend:** React 18, Next.js 15 App Router e Tailwind CSS 4.
- **Backend web:** Next.js Server Components, Server Actions e Route Handlers.
- **Backend do bot:** Node.js, discord.js 14 e Express 5.
- **Banco:** PostgreSQL.
- **ORM:** Prisma 6.
- **Autenticação:** Auth.js/NextAuth 5 beta, provider Discord e PrismaAdapter, com sessões em banco.
- **Hospedagem atual documentada:** implantação manual em VPS Linux com PM2,
  Nginx e HTTPS no `README.md`; o repositório não comprova uma implantação
  ativa nem contém configuração PM2 versionada.
- **Hospedagem-alvo:** Docker Compose será a instalação oficial futura conforme
  ADR-008; ainda não está implementado.
- **Serviços externos:** Discord OAuth2, Discord Gateway/REST API e PostgreSQL
  atualmente hospedado no Supabase.
- **Bibliotecas importantes:** dnd-kit para drag-and-drop, Lucide React para ícones, Vitest para testes, concurrently para iniciar painel e bot, dotenv/dotenv-cli para configuração.

# 3. Arquitetura

## Modelo geral

O projeto é um monólito dividido em dois processos:

1. **Aplicação Next.js:** interface, autenticação, leitura e mutação de dados.
2. **Bot Discord:** listeners do Gateway, comandos slash, automação de voz e API Express interna.

Os dois processos compartilham o PostgreSQL via Prisma. O Next.js também chama o bot por HTTP loopback usando `x-bot-secret`.

```text
Navegador
  → Next.js Server Components / Server Actions
    → Prisma → PostgreSQL
    → API Express local → discord.js → Discord

Discord Gateway
  → Bot
    → Prisma → PostgreSQL
    → discord.js → recursos do servidor Discord
```

## Camadas e pastas

- Páginas e layouts fazem leitura e composição da UI.
- Server Actions concentram autenticação, mutação Prisma e chamadas à API do bot.
- `src/lib/` contém utilitários e parte do acesso a dados, mas não há camada formal de services/repositories.
- O bot separa API, comandos de template e automação de voz, embora handlers ainda misturem estado, regras e efeitos externos.

## Componentes

- Server Components são o padrão.
- Componentes com interação usam `"use client"` e estado React local.
- Formulários chamam Server Actions diretamente.
- A reordenação de canais usa estado otimista com dnd-kit.

## Estado

- **Persistente:** PostgreSQL.
- **Sessão:** tabela `Session`.
- **UI:** `useState` em Client Components.
- **Temporário do bot:** Maps/Sets em memória para workflows de template, locks e salas temporárias.
- **Cache:** mínimo; chamadas ao bot usam `no-store` e mutações usam `revalidatePath`.

# 4. Estrutura Principal

- `src/app/`: App Router, páginas, layouts, Server Actions e endpoint Auth.js.
- `src/app/dashboard/`: área autenticada e domínios de servidores, templates e Hubs de voz.
- `src/components/`: Sidebar, menu de usuário e componentes reutilizáveis.
- `src/lib/`: Prisma, catálogo/estado de ferramentas e normalização de nomes Discord.
- `bot/`: processo Discord, API interna, comando de templates e engine de salas temporárias.
- `prisma/`: schema, migrations PostgreSQL e lock do provider.
- `public/`: logos e assets estáticos.
- `.ai/`: skills, prompts, checklists e fundamentos compartilhados por agentes.
- `.mcp.json`: configuração opcional e sem credenciais do MCP shadcn para
  Claude Code.
- `.codex/config.toml`: configuração equivalente do MCP para Codex em
  repositórios confiáveis.
- `.agents/skills/`: adaptador de descoberta da skill canônica de frontend pelo
  Codex.
- `README.md`: guia operacional de VPS; possui divergências conhecidas em relação ao código.
- `PROJECT_REPORT.md`: auditoria técnica detalhada do estado atual.

# 5. Convenções do Projeto

## Nomenclatura

- Componentes React: PascalCase (`VoiceHubEditor`, `ServerSelector`).
- Funções, actions e utilitários: camelCase (`createVoiceHub`, `getGuildRoles`).
- Rotas: kebab-case e segmentos dinâmicos `[id]`.
- Modelos Prisma: PascalCase singular.
- Chaves de ferramentas e tipos Discord: strings como `templates`, `voice-channels`, `TEXT`, `VOICE`.

## Organização

- Componentes específicos ficam próximos da rota; compartilhados ficam em `src/components/`.
- Não há diretório de hooks. Hooks são usados dentro dos componentes.
- Não há camada de serviços formal; actions chamam Prisma e HTTP diretamente.
- A única API web pública explícita é `/api/auth/*`. O restante do frontend usa Server Actions.
- A API Express interna usa rotas REST sob `/guilds`.
- Web e bot possuem scripts separados para desenvolvimento e produção; os scripts `dev` e `start` continuam disponíveis como conveniência para executar os dois processos.

## Rotas

- `/`: login.
- `/dashboard`: visão geral e feature toggles.
- `/dashboard/servers`: guilds conectadas ao bot.
- `/dashboard/templates` e `/dashboard/templates/[id]`: CRUD de templates/canais.
- `/dashboard/voice-channels`, `/new` e `/[id]`: CRUD/configuração de Hubs.
- `/api/auth/[...nextauth]`: autenticação Auth.js.

## Validação

Não existe padrão centralizado nem biblioteca de schema validation. Actions fazem verificações manuais básicas (`trim`, presença, `parseInt`), geralmente insuficientes para enums, faixas, comprimentos e autorização por guild.

## Erros

- Falhas esperadas frequentemente retornam vazio, redirecionam ou lançam `Error`.
- Integração com o bot usa `try/catch` e `console.log`.
- A API Express responde JSON com status 400/401/404/500.
- Não há error boundaries personalizados, logging estruturado, códigos de erro de domínio ou observabilidade.

# 6. Banco de Dados

## Entidades principais

- **User, Account, Session, VerificationToken:** identidade e sessão do Auth.js.
- **Template:** estrutura pertencente a um usuário.
- **Channel:** canal ordenado pertencente a um Template.
- **UserTool:** feature toggle por usuário, com PK composta `(userId, toolKey)`.
- **VoiceHub:** configuração de um canal de entrada para salas temporárias.
- **TemporaryVoiceChannel:** modelo planejado para persistir salas temporárias.

## Relacionamentos importantes

- User possui Accounts, Sessions, Templates, UserTools e VoiceHubs.
- Template possui Channels.
- VoiceHub possui TemporaryVoiceChannels.
- FKs usam exclusão em cascata.

## Tabelas críticas

- `Account` conecta o ID do usuário Discord à conta web e permite ao comando slash localizar seus templates.
- `UserTool` controla quais ferramentas ficam disponíveis.
- `VoiceHub` é consultada a cada entrada relevante em canal de voz.
- `TemporaryVoiceChannel` existe no schema, mas **não é usada pelo runtime atual**.

## Fluxo

O painel grava configurações no PostgreSQL. O bot consulta diretamente Templates, UserTools e VoiceHubs. Recursos reais — canais, categorias e cargos — vivem no Discord; operações que envolvem Discord e banco não são transacionais entre os dois sistemas.

## Acoplamento ao Supabase

O runtime usa o Supabase somente como hospedagem PostgreSQL pela
`DATABASE_URL`. Não há SDK Supabase, Auth Supabase, Storage, Realtime, Edge
Functions, buckets, APIs, RLS ou policies no código e nas migrations
versionadas. Assim, do ponto de vista da aplicação, outro PostgreSQL compatível
exige trocar a conexão e migrar os dados; operacionalmente ainda é necessário
validar TLS, pooling, limites, backup/restore e executar migrations no destino.

# 7. Autenticação

- Login exclusivo por Discord OAuth.
- Primeiro login cria implicitamente User e Account via PrismaAdapter.
- Sessão usa estratégia `database`; callback adiciona `user.id` à sessão.
- Logout chama `signOut()` por Server Action.
- Não há senha, recuperação de senha ou registro separado.
- Não há `middleware.js`. Layouts, páginas e actions chamam `auth()` e redirecionam usuários anônimos.
- Ferramentas são autorizadas por `UserTool`, mas essa checagem não é uniforme em todas as actions.
- Não existem roles SaaS.
- A autorização sobre guilds Discord é atualmente insuficiente: estar autenticado não comprova ser administrador da guild.

# 8. Funcionalidades

## Login e dashboard

Login com Discord e redirecionamento automático ao dashboard. O dashboard mostra ferramentas e permite ativar/desativar templates e canais temporários por usuário.

## Servidores conectados

Lista as guilds presentes no cache do bot, exibe ícone e quantidade de membros, fornece link de convite e permite remover o bot. Atualmente a lista representa todas as guilds do bot, não apenas as administradas pelo usuário autenticado.

## Templates de servidor

Permite criar, renomear e excluir templates. Cada template possui canais com nome, tipo, privacidade e ordem.

## Editor e reordenação de canais

Permite adicionar, editar, excluir e arrastar canais. Tipos expostos: texto, voz, fórum e anúncio; nomes textuais são normalizados.

## Aplicação de template

O comando `/aplicar-template` associa o autor à conta web, exige ferramenta ativa e guia a escolha do template/categoria. Pode criar categoria/cargos e aplicar permissões em canais públicos e privados.

## Hubs de voz

O painel cria um canal Hub real no Discord e persiste sua configuração. O editor controla nome das salas, limite, bitrate, retenção, sincronização de permissões e cargos especiais.

## Salas temporárias

Ao entrar no Hub, um membro não ignorado recebe uma nova sala de voz e é movido para ela. Quando vazia, a sala é apagada imediatamente, após um atraso ou mantida indefinidamente.

## Gerenciamento de permissões

Salas podem herdar overwrites da categoria/canal Hub ou usar modos customizados allow-except/deny-except. Owner e moderadores recebem permissões adicionais.

# 9. Fluxo da Aplicação

```text
Usuário acessa /
  → login Discord
  → Auth.js persiste conta e sessão
  → dashboard carrega UserTools
  → usuário navega por servidores/templates/Hubs
  → Server Components consultam Prisma/API do bot
  → Server Actions persistem ou chamam Discord
  → revalidatePath/redirect atualiza a interface
  → bot reage a comandos e eventos de voz
  → logout encerra a sessão
```

O fluxo de template ocorre no cliente Discord; o fluxo de configuração ocorre no painel; ambos compartilham a mesma conta via `Account.providerAccountId`.

# 10. Regras de Negócio

- O comando slash deve usar a mesma conta Discord vinculada ao painel.
- Templates e Hubs pertencem a um usuário.
- Uma ferramenta precisa estar ativada para sua UI e, no caso de templates, para o comando slash.
- A ordem de Channel define a sequência de criação no Discord.
- Canais privados negam visibilidade geral e permitem cargos escolhidos.
- Bots e membros com cargos ignorados não geram salas.
- Owner e cargos moderadores recebem permissões elevadas.
- O Hub pode herdar permissões ou aplicar regras customizadas.
- Bitrate e limite de usuários são normalizados no bot.
- Salas vazias seguem a política de retenção configurada.
- Um canal Discord só pode identificar um VoiceHub devido ao unique de `channelId`.

# 11. Componentes Críticos

- `src/auth.js`: configuração Auth.js/Discord/Prisma.
- `src/lib/prisma.js`: singleton Prisma usado por parte da aplicação.
- `src/lib/user-tools.js`: catálogo efetivo e persistência de feature toggles.
- `src/app/dashboard/layout.js`: guarda principal da área autenticada.
- `src/app/dashboard/servers/actions.js`: proxy Next → API do bot.
- `src/app/dashboard/templates/[id]/actions.js`: regras CRUD/reordenação de canais.
- `src/app/dashboard/templates/[id]/ChannelList.js`: editor drag-and-drop.
- `src/app/dashboard/voice-channels/new/actions.js`: orquestra criação Discord + banco.
- `src/app/dashboard/voice-channels/[id]/actions.js`: consulta roles e atualiza/exclui Hubs.
- `src/app/dashboard/voice-channels/[id]/VoiceHubEditor.js`: formulário mais complexo do painel.
- `bot/index.js`: bootstrap do bot.
- `bot/api.js`: superfície HTTP interna com efeitos no Discord.
- `bot/interactionHandler.js`: roteamento do workflow de templates.
- `bot/templateCommands.js`: aplicação material do template.
- `bot/voice-hubs.js`: criação e limpeza de salas temporárias.
- `bot/voice-hub-utils.js`: normalização pura de bitrate e limite de usuários, compartilhada com os testes.
- `prisma/schema.prisma`: contrato central de persistência.

# 12. Dependências Importantes

- `next`, `react`, `react-dom`: aplicação web e renderização.
- `next-auth`, `@auth/prisma-adapter`: OAuth e sessão persistida.
- `prisma`, `@prisma/client`: schema, migrations e acesso PostgreSQL.
- `discord.js`: integração completa com Discord.
- `express`: API interna do bot.
- `@dnd-kit/*`: reordenação dos canais.
- `tailwindcss`, `@tailwindcss/postcss`: sistema visual.
- `lucide-react`: ícones.
- `concurrently`, `dotenv`, `dotenv-cli`: execução conjunta e variáveis de ambiente.
- `vitest`: testes unitários/smoke em ambiente Node.
- `@eslint/eslintrc`: compatibilidade da configuração flat do ESLint 9 com o preset legado do Next.js 15.

Não há dependências de validação, filas, cache distribuído ou logging estruturado.

# 13. Pontos de Atenção

## Riscos críticos

- **Autorização horizontal de guilds:** qualquer autenticado pode potencialmente consultar cargos, criar Hub ou remover o bot de uma guild sem comprovar administração.
- **IDOR na reordenação:** `updateChannelOrder` pode receber IDs de canais fora do template validado.
- **Estado volátil:** salas temporárias e workflows existem apenas em RAM; restart pode deixar canais órfãos.
- **Perda de roles do Hub:** a query da página de edição não seleciona os arrays de cargos; salvar pode zerar configurações.

## Limitações

- A cobertura automatizada ainda é mínima: quatro testes smoke de módulos puros.
- `npm run lint` executa, mas ainda reporta avisos de `@next/next/no-img-element`.
- Não há transação distribuída/compensação entre Discord e banco.
- Várias instâncias de `PrismaClient` são criadas fora do singleton.
- `ownershipLockMinutes` é configurável, mas não é aplicado.
- Menus de template não paginam acima de 25 itens; jobs não expiram.
- Ausência de validação de schema, rate limiting, timeouts e observabilidade.
- Escala horizontal não é segura.

## Legado/código morto

- `src/lib/tools.js` está desatualizado e sem uso.
- `src/components/SliderWithTicks.js` não possui consumidor.
- `src/app/dashboard/voice-channels/[id]/fetch-hub.js` não é usado.
- SVGs padrão do Next em `public/` não são usados.
- `TALK_LOG.md` é histórico volumoso, não fonte arquitetural principal.

## Decisões importantes

- O bot e o painel compartilham banco.
- A API do bot deve permanecer restrita a loopback e segredo compartilhado.
- O sistema usa Server Actions, não uma API REST pública para CRUD.
- `UserTool` funciona como feature toggle, não como autorização completa.
- A versão local instalada é Next 15.5.22; `AGENTS.md` exige consultar `node_modules/next/dist/docs/` antes de escrever código, mas esse diretório está ausente nesta instalação. Registre essa limitação ao alterar APIs Next.
- Graphify foi avaliado e não adotado: é recente, o ganho no repositório atual é
  limitado e o ambiente não possui runtime Python/`uv`.
- O MCP shadcn é o único apoio visual externo selecionado, sempre opcional. A
  skill local e o código existente permanecem como fontes de direção visual.

# 14. Próximos Passos

Prioridade natural:

1. corrigir autorização por guild e IDOR;
2. incluir corretamente roles no editor;
3. persistir/reconciliar TemporaryVoiceChannel;
4. centralizar Prisma e adicionar validação;
5. corrigir lint e alinhar versões Next/ESLint;
6. criar testes unitários, integração e E2E;
7. implementar compensações para efeitos Discord + banco;
8. aplicar ou remover `ownershipLockMinutes`;
9. adicionar TTL aos workflows, paginação e observabilidade;
10. somente depois evoluir para organizações, RBAC, billing, quotas e escala distribuída.

Esses passos são inferidos da dívida atual; não existe roadmap formal versionado.

# 15. Como Trabalhar Neste Projeto

- Leia, na ordem definida por `AI_RULES.md`, `PROJECT_DIRECTION.md`,
  `DECISIONS.md`, `AI_RULES.md`, `AGENTS.md`, `AI_CONTEXT.md` e o contexto
  específico da tarefa.
- Em tarefas de frontend, use `.ai/skills/clutch-frontend/SKILL.md` e
  `.ai/reviews/frontend-review.md`.
- Consulte a documentação local da versão do Next exigida por `AGENTS.md`; se continuar ausente, não presuma APIs e registre a limitação.
- Preserve App Router, Server Components e Server Actions como padrão existente.
- Use Client Components somente quando houver interação/estado no navegador.
- Reutilize `src/lib/prisma.js`; não crie novos `PrismaClient` no processo Next.
- Mantenha componentes específicos próximos da rota e compartilhe apenas o que tiver uso real.
- Não introduza uma nova camada/padrão amplo sem justificar e alinhar a migração.
- Toda action deve validar sessão, ownership do recurso, guild administrável, tipos, comprimentos e faixas.
- Nunca confie em IDs, hidden inputs ou arrays enviados pelo cliente.
- Em operações Discord + banco, planeje idempotência e compensação.
- Preserve a API Express em loopback; não exponha `BOT_API_SECRET` ao navegador.
- Ao alterar VoiceHub, considere banco, UI, API e engine de eventos em conjunto.
- Ao alterar templates, considere editor web e workflow slash.
- Trate Maps/Sets do bot como estado efêmero e evite depender deles para durabilidade.
- Adicione testes para regras antes de grandes refatorações.
- Não altere migrations aplicadas; crie migrations incrementais.
- Não inclua valores de `.env` em código, documentação, logs ou respostas.
- Preserve alterações locais do usuário e evite mexer em arquivos fora do escopo.
- Sugira grandes refatorações antes de executá-las; correções críticas e localizadas devem minimizar mudanças.

# 16. Resumo Final

```text
Projeto: Ferramenta pessoal/interna de gestão e automação de servidores Discord.
Arquitetura: Next.js App Router + bot discord.js/Express + PostgreSQL compartilhado.
Escalabilidade: Baixa no estado atual; estado crítico em memória e processo único.
Complexidade: Média; código pequeno, mas integrações assíncronas e efeitos distribuídos.
Nível de organização: Médio; organização por feature clara, sem camada formal de domínio/serviços.
Principais riscos: ACL de guilds, IDOR, estado volátil, inconsistência Discord/banco e ausência de testes.
Principais pontos fortes: domínio claro, UI consistente, integração Discord rica e fluxos úteis já funcionais.
```
