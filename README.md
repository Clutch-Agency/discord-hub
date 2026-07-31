# Clutch Hub

Painel pessoal para administrar e automatizar servidores Discord. O produto
combina um painel Next.js, um bot Discord e PostgreSQL. A instalação oficial é
self-hosted com Docker Compose; o host não precisa de Node.js, npm, Prisma ou
PostgreSQL.

## Pré-requisitos

- Docker Desktop ou Docker Engine com Docker Compose V2;
- uma aplicação no [Discord Developer Portal](https://discord.com/developers/applications);
- portas de saída HTTPS liberadas para Discord/OAuth;
- uma porta TCP livre para o painel (`3000` por padrão).

Na aplicação Discord, habilite **Server Members Intent**, configure o redirect
OAuth como `AUTH_URL/api/auth/callback/discord` e convide o bot com os scopes
`bot` e `applications.commands`. O bot precisa das permissões compatíveis com
as operações desejadas, incluindo visualizar/gerenciar canais e mover membros.

## Instalação

```bash
git clone <URL_DO_REPOSITORIO> discord-hub
cd discord-hub
cp .env.example .env
```

No PowerShell, use `Copy-Item .env.example .env`. Preencha no `.env`:

- `POSTGRES_PASSWORD`: senha forte do banco local;
- `DISCORD_BOT_TOKEN`, `DISCORD_CLIENT_ID`, `DISCORD_CLIENT_SECRET`;
- `AUTH_SECRET`: segredo aleatório para Auth.js;
- `ALLOWED_DISCORD_USER_IDS`: IDs Discord autorizados, separados por vírgula;
- `BOT_API_SECRET`: segredo aleatório diferente de `AUTH_SECRET`.

Segredos podem ser gerados com `openssl rand -base64 32`. Não reutilize os
exemplos e não versione `.env`.

Para acesso fora de `localhost`, defina `AUTH_URL` com a URL pública exata em
HTTPS e cadastre o redirect correspondente no Discord. Em seguida:

```bash
docker compose up -d
docker compose ps
```

O primeiro comando constrói as imagens, inicia PostgreSQL, aplica migrations,
registra o slash command, conecta o bot e só então libera o web. Acesse
`http://localhost:3000` ou a URL configurada.

Os jobs `migrate` e `discord-commands` terminarem com código `0` é esperado.
Os serviços permanentes `postgres`, `bot` e `web` devem ficar `healthy`.

## Arquitetura do stack

| Serviço | Papel | Exposição |
|---|---|---|
| `postgres` | PostgreSQL 17.10 e volume persistente | somente rede interna |
| `migrate` | `prisma migrate deploy`, uma vez por implantação | job interno |
| `discord-commands` | registra comandos globais no Discord | job interno |
| `bot` | Gateway Discord e API privada Express | somente rede interna `3001` |
| `web` | painel Next.js standalone e Auth.js | `${WEB_PORT:-3000}` |

O Compose publica apenas o painel. A URL privada `http://bot:3001` e o segredo
compartilhado autenticam a comunicação web → bot. O banco fica no volume
nomeado `postgres_data`; reiniciar ou recriar containers não apaga dados.

## Variáveis de ambiente

### Obrigatórias no Docker

| Variável | Finalidade |
|---|---|
| `POSTGRES_PASSWORD` | senha do PostgreSQL local |
| `DISCORD_BOT_TOKEN` | autenticação do bot e registro de comandos |
| `DISCORD_CLIENT_ID` | aplicação Discord usada por bot e OAuth |
| `DISCORD_CLIENT_SECRET` | segredo do provider OAuth |
| `AUTH_SECRET` | assinatura/criptografia do Auth.js |
| `ALLOWED_DISCORD_USER_IDS` | allowlist de operadores do painel |
| `BOT_API_SECRET` | autenticação da API privada web → bot |

### Opcionais

| Variável | Padrão | Finalidade |
|---|---:|---|
| `POSTGRES_DB` | `clutch_hub` | nome do banco |
| `POSTGRES_USER` | `clutch_hub` | usuário do banco |
| `WEB_PORT` | `3000` | porta publicada no host |
| `AUTH_URL` | `http://localhost:3000` | URL canônica e callback OAuth |
| `DISCORD_BOT_INVITE_URL` | vazio | link de convite exibido no painel |
| `BOT_API_TIMEOUT_MS` | `5000` | timeout web → bot, entre 100 e 30000 ms |

`DATABASE_URL`, `TEST_DATABASE_URL`, `BOT_API_URL`, `BOT_API_BIND_HOST` e
`BOT_API_PORT` existem para desenvolvimento/teste sem Docker ou configuração
interna. O Compose oficial monta `DATABASE_URL` com encoding seguro e não exige
que o usuário escreva uma connection string.

## Operação

```bash
# logs de todos os serviços
docker compose logs -f

# logs de um serviço
docker compose logs -f web

# parar sem apagar dados
docker compose down

# iniciar novamente
docker compose up -d
```

`docker compose down -v` apaga definitivamente o banco e não deve ser usado sem
backup.

## Atualização e troca de versão

Faça backup antes de atualizar:

```bash
git pull --ff-only
docker compose up -d --build
docker compose ps
```

O novo job `migrate` aplica migrations pendentes antes de reiniciar bot/web.
Para fixar uma versão, use uma tag ou commit (`git checkout <versão>`) e execute
`docker compose up -d --build`. Downgrades após migrations não são garantidos;
restaure um backup compatível quando necessário.

## Backup e restauração

Backup em formato custom do PostgreSQL:

```bash
docker compose exec -T postgres sh -c 'pg_dump -U "$POSTGRES_USER" -d "$POSTGRES_DB" --format=custom' > clutch-hub.dump
```

Restauração substituindo os objetos existentes:

```bash
docker compose exec -T postgres sh -c 'pg_restore --clean --if-exists --no-owner -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < clutch-hub.dump
```

Pare `web` e `bot` durante uma restauração planejada. Guarde o dump fora do
volume Docker e teste periodicamente o procedimento em ambiente descartável.

## Desenvolvimento sem Docker

```bash
npm ci
npm run prisma:generate
npm run dev
```

Nesse modo, configure `DATABASE_URL` para um PostgreSQL existente. Supabase pode
ser usado como PostgreSQL externo, mas é uma alternativa customizada e não uma
dependência nem o caminho oficial. Use `npm run deploy:commands` apenas quando
executar fora do Compose.

Validações disponíveis:

```bash
npm test
npm run lint
npm run build
npx prisma validate
```

`npm run test:integration` requer `TEST_DATABASE_URL` apontando para um banco
descartável cujo nome contenha `test`.

## Compatibilidade e diagnóstico

O stack usa imagens oficiais multi-arquitetura e Compose padrão, adequado a
Docker Desktop, Ubuntu/Debian, Umbrel, Dockge, Portainer e EasyPanel. Interfaces
dessas plataformas devem carregar `compose.yaml` e `.env` sem publicar as
portas internas.

Se a inicialização falhar, use `docker compose ps -a` e
`docker compose logs migrate discord-commands bot web`. Falha em `migrate`
normalmente indica credenciais/volume do banco; falha em `discord-commands` ou
`bot` indica token, Client ID, intents ou conectividade Discord. Comandos
globais do Discord podem levar algum tempo para aparecer após o registro.
