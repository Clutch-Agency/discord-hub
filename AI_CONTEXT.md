# AI_CONTEXT — Clutch Hub

Atualizado em 31/07/2026 após a Fase 3A.

# 1. Visão Geral

Clutch Hub é um SaaS pessoal/self-hosted para administrar e automatizar
servidores Discord. Centraliza templates de canais, servidores vinculados e
salas de voz temporárias em um painel web, mantendo os efeitos Discord em um
bot separado. O público inferido é um operador individual ou pequeno grupo
explicitamente autorizado.

O núcleo funcional, autenticação/autorização e validações de domínio estão
implementados. A instalação oficial agora é plug & play com Docker Compose,
PostgreSQL local persistente, migrations e registro de comandos automáticos.
Consistência/compensação Discord ↔ banco e reconciliação pós-restart permanecem
para fases posteriores.

# 2. Stack

- **Linguagem:** JavaScript em ESM no web e CommonJS no bot.
- **Frontend/backend web:** Next.js 15.5.22 App Router, React 18, Server
  Components e Server Actions.
- **Estilo:** Tailwind CSS 4 e `lucide-react`.
- **Drag-and-drop:** `@dnd-kit/*` no editor de templates.
- **Bot/backend privado:** Node.js, `discord.js` 14 e Express 5.
- **Banco/ORM:** PostgreSQL 17 no caminho Docker; Prisma 6.19.3.
- **Autenticação:** Auth.js v5 beta, Discord OAuth e PrismaAdapter; sessões em
  banco.
- **Testes:** Vitest, incluindo testes HTTP locais e integração PostgreSQL
  opcional.
- **Hospedagem:** self-hosted com Docker Compose; imagens Node 22 Debian slim e
  PostgreSQL Alpine. Não há dependência de Vercel ou Supabase.
- **Serviços externos:** Discord OAuth, REST e Gateway. Supabase é apenas uma
  alternativa PostgreSQL customizada fora do Compose.

# 3. Arquitetura

O sistema é um monólito modular distribuído em dois processos da aplicação:

```text
Navegador → web Next.js → PostgreSQL
                  └────→ API privada bot → Discord
                                   └────→ PostgreSQL
```

Server Actions e páginas server-side orquestram casos de uso. Autorização é
defensiva em profundidade: sessão/operador no web, ownership do recurso,
autorização atual na guild, segredo + ator na API privada e nova verificação no
bot. Prisma é compartilhado como persistência, sem endpoint público genérico.

No Compose há três serviços permanentes (`postgres`, `bot`, `web`) e dois jobs
efêmeros (`migrate`, `discord-commands`). A ordem é PostgreSQL healthy →
migrations → registro Discord → bot healthy → web. Somente o web publica porta.
O volume `postgres_data` preserva o banco.

# 4. Estrutura Principal

- `src/app/`: rotas App Router, layouts, páginas e Server Actions.
- `src/components/`: componentes visuais compartilhados.
- `src/lib/auth/`: ator autenticado, allowlist e autorização de operador.
- `src/lib/discord/`: cliente privado do bot, autorização/listagens por guild.
- `src/lib/templates/`: validações e ordenação segura de templates.
- `src/lib/voice-hubs/`: regras, operações e serviço de VoiceHub.
- `src/lib/contracts/`: contratos discriminados de respostas de actions.
- `src/lib/validation/`: primitivas de validação compartilháveis.
- `bot/`: cliente Discord, API Express, comandos e engine de salas temporárias.
- `domain/`: constantes de domínio consumidas por web e bot.
- `prisma/`: schema, migrations e integração PostgreSQL.
- `scripts/`: entrypoint Docker e runner de integração.
- `public/`: imagens/logos estáticos.
- `Dockerfile`, `compose.yaml`, `.dockerignore`: empacotamento oficial.

# 5. Convenções do Projeto

- Arquivos React e componentes: PascalCase; módulos/rotas: kebab-case ou nomes
  descritivos existentes; funções/variáveis: camelCase.
- UI de feature fica sob sua rota em `src/app/dashboard`; componentes realmente
  compartilhados ficam em `src/components`.
- O projeto não possui uma camada formal de hooks; não criar uma sem necessidade.
- Integrações e regras ficam em `src/lib`, não diretamente em componentes.
- Server Actions são tratadas como endpoints públicos e repetem autenticação,
  validação, ownership e autorização.
- Rotas web seguem App Router; a única API pública tradicional é Auth.js. A API
  Express do bot é privada e autenticada por headers.
- Validação runtime usa funções explícitas e constantes de
  `domain/domain-constants.json`, sem coerção permissiva.
- Erros públicos usam `AuthorizationError`, códigos seguros de action result e
  mapeamento conhecido de erros Prisma. Stack/cause/provider não vazam.
- Testes ficam próximos do módulo (`*.test.js`/`*.test.mjs`).

# 6. Banco de Dados

Entidades centrais: `User`, `Account`, `Session`, `VerificationToken` (Auth.js),
`Template`, `Channel`, `UserTool`, `VoiceHub` e `TemporaryVoiceChannel`.

Um usuário possui templates, toggles e VoiceHubs. Template possui canais com
ordem. VoiceHub referencia uma guild/canal Discord e contém configuração de
permissões/retention; canais temporários pertencem ao Hub. Cascades removem
filhos; IDs Discord críticos são únicos e `TemporaryVoiceChannel` possui
índices por Hub/canal.

O schema é PostgreSQL e migrations incrementais existentes são aplicadas por
`migrate deploy` antes dos processos. A Fase 3A não alterou schema nem migration.
O estado operacional de salas ainda vive principalmente em memória; a tabela
de canais temporários ainda não participa do runtime.

# 7. Autenticação

Login usa Discord OAuth via Auth.js. Adapter Prisma persiste conta e sessão; o
callback acrescenta o `user.id`. O dashboard chama `requireOperator()`, que
exige sessão, conta Discord válida e ID na `ALLOWED_DISCORD_USER_IDS`.

Operações por servidor ainda exigem que o ator seja owner, Administrator ou
tenha ManageGuild no estado atual do Discord. Layouts melhoram UX, mas cada
Server Action repete a autorização. Logout usa `signOut` server-side. Não há
roles internas, registro local ou recuperação de senha.

# 8. Funcionalidades

- **Login/logout:** OAuth Discord, sessão persistida e saída via Auth.js.
- **Dashboard:** visão das ferramentas habilitadas para o operador.
- **Ferramentas do usuário:** toggles centralizados para templates e VoiceHub.
- **Servidores:** lista guilds onde bot e operador têm acesso; permite convidar
  ou remover o bot com verificação da guild.
- **Templates:** CRUD de templates e canais, privacidade, tipos suportados e
  reorder completo/seguro.
- **Aplicar template:** slash command conduz seleção de template, categoria e
  cargos; jobs são vinculados a usuário/guild e expiram em 15 minutos.
- **VoiceHubs:** cria/edita/remove canal Hub, roles e políticas de sala.
- **Salas temporárias:** cria, move, renomeia e remove salas conforme presença,
  permissões e retenção; estado não sobrevive integralmente a restart.
- **Instalação operacional:** Compose cria banco, aplica migrations, registra
  comandos, verifica readiness e inicia web/bot em ordem.

# 9. Fluxo da Aplicação

```text
docker compose up
  → PostgreSQL healthy → migrate deploy → registrar slash command
  → bot conecta ao Discord e fica healthy → web fica healthy

Usuário → Discord OAuth → sessão Prisma → requireOperator
  → página/Server Action → validação + ownership + guild authorization
  → Prisma e/ou API privada → bot reautoriza → Discord
  → resposta segura → revalidatePath/redirect → UI
```

# 10. Regras de Negócio

- Somente IDs Discord na allowlist operam o painel.
- Operador atua apenas em guild onde tem permissão administrativa atual.
- Conhecer ID de recurso/guild/canal não concede acesso; relações são derivadas
  da sessão e banco.
- Uma ferramenta precisa existir no catálogo e estar habilitada.
- Limites: 25 templates por operador, 100 canais por template e 25 cargos por
  lista; reorder deve representar o conjunto completo.
- Cargos de permissão, ignorados e moderadores não podem se sobrepor.
- VoiceHub aceita somente limites/enums/placeholders definidos no domínio;
  dois modos de sync não podem estar ativos juntos.
- Interações `/aplicar-template` exigem job válido, mesmo autor e mesma guild.
- Sala vazia segue a política de retenção; bot/membros ignorados não criam sala.

# 11. Componentes Críticos

- `src/auth.js`: Auth.js, Discord provider e PrismaAdapter.
- `src/app/dashboard/layout.js`: guarda global do painel.
- `src/lib/auth/*`: identidade e políticas de operador.
- `src/lib/discord/bot-api-client.js`: URL/timeout/segredo e chamadas privadas.
- `src/lib/discord/guild-authorization.js`: permissão por guild no web.
- `src/lib/voice-hubs/*`: validação e orquestração segura de VoiceHub.
- `src/lib/templates/*`: contratos e ordem de canais.
- `bot/api.js`: fronteira privada e efeitos administrativos no Discord.
- `bot/interactionHandler.js`: workflow do slash command.
- `bot/voice-hubs.js`: ciclo de vida das salas temporárias.
- `prisma/schema.prisma`: contrato persistente.
- `compose.yaml`: topologia, dependências, healthchecks e volume.
- `scripts/container-entrypoint.mjs`: constrói `DATABASE_URL` com encoding e
  encaminha sinais ao processo real.

# 12. Dependências Importantes

- `next`, `react`, `react-dom`: web full-stack.
- `next-auth`, `@auth/prisma-adapter`: OAuth/sessão em PostgreSQL.
- `prisma`, `@prisma/client`: schema, migrations e acesso a dados.
- `discord.js`: Gateway, REST, comandos e efeitos Discord.
- `express`: API privada web → bot.
- `@dnd-kit/*`: reorder visual.
- `tailwindcss`, `lucide-react`: sistema visual.
- `vitest`: testes unitários/HTTP/integração opcional.
- `dotenv`/`dotenv-cli`: desenvolvimento local; containers recebem env do
  Compose e não dependem de arquivos copiados na imagem.

# 13. Pontos de Atenção

- `TemporaryVoiceChannel` ainda não é usado no runtime; restart pode deixar
  salas órfãs.
- Não há transação distribuída/compensação completa Discord ↔ PostgreSQL.
- Jobs de template e estado de salas permanecem em `Map`/`Set`.
- Há múltiplos `PrismaClient` no bot/legado.
- Não há rate limiting, observabilidade estruturada, fila ou cache.
- Seleção paginada de cargos no workflow pode substituir página anterior.
- OAuth/Discord reais e o stack Docker não possuem E2E automatizado.
- Docker não estava instalado no ambiente que implementou a Fase 3A: sintaxe,
  testes, build e Prisma foram validados, mas containers/health/volume/restart
  ainda precisam de smoke test em host Docker.
- Tags de Node/PostgreSQL são fixas e precisam de revisão periódica de segurança.
- Registro de comandos globais falhando bloqueia o bot por desenho.

# 14. Próximos Passos

1. Executar smoke test documentado em Docker real (amd64 e, se disponível,
   arm64), incluindo restart, persistência, backup e restore.
2. Fase 2B: idempotência/compensação Discord ↔ PostgreSQL.
3. Persistir e reconciliar salas temporárias após restart.
4. Rodar integração PostgreSQL descartável em CI.
5. Centralizar Prisma e melhorar logs/observabilidade.
6. Corrigir seleção paginada e warnings de `<img>`.
7. Só depois avaliar novas ferramentas, filas ou múltiplas instâncias.

# 15. Como Trabalhar Neste Projeto

- Leia `AI_RULES.md`, `AGENTS.md`, `PROJECT_DIRECTION.md` e a skill aplicável.
- Preserve web, bot e banco como responsabilidades separadas.
- Não exponha PostgreSQL nem a API do bot; no Compose use `bot`, nunca
  `127.0.0.1`, para web → bot.
- Reutilize autorização, validadores, contratos e catálogos existentes.
- Nunca confie em ator/owner/guild/canal enviado pelo navegador se puder derivar.
- Valide antes de queries/efeitos e teste ausência de efeito em negações.
- Não altere schema sem migration incremental e autorização explícita.
- Não adicione Redis, filas, proxy ou observabilidade sem necessidade aprovada.
- Preserve o fluxo `postgres healthy → migrate → bot healthy → web`.
- Use `prisma migrate deploy` em produção; nunca `db push`.
- Não grave segredos em Dockerfile, Compose, logs ou documentação.
- Grandes refatorações exigem proposta prévia; mudanças de Docker devem manter
  Docker Desktop/Linux e amd64/arm64 quando as imagens oficiais suportarem.

# 16. Resumo Final

```text
Projeto: painel self-hosted de automação e administração Discord
Arquitetura: Next.js + bot discord.js/Express + PostgreSQL, orquestrados por Compose
Escalabilidade: baixa/média; adequada a instância pessoal única
Complexidade: média, concentrada em autorização e efeitos Discord/banco
Nível de organização: médio/alto nos fluxos migrados e na operação Docker
Principais riscos: estado efêmero, consistência parcial e smoke Docker pendente
Principais pontos fortes: defesa em profundidade, validação explícita e instalação reproduzível
```
