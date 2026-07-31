# AI HANDOFF — Fase 3A: Produto Plug & Play

## 1. Status

**Implementação concluída em 31/07/2026, com smoke test Docker pendente por
indisponibilidade da ferramenta no ambiente.**

O projeto agora possui instalação oficial com Docker Compose, PostgreSQL local
persistente, imagens separadas para web/bot, migrations e registro de comandos
automáticos. Testes, lint, build standalone e validação Prisma passaram. O host
de execução não possui o comando `docker`, portanto containers, healthchecks,
volume e restart não foram executados e não são declarados como validados.

## 2. Objetivo entregue

- instalação por `docker compose up -d` após preencher `.env`;
- PostgreSQL oficial local como padrão, sem Supabase obrigatório;
- imagens multi-stage e runtimes não-root;
- Prisma Client gerado no build e migrations aplicadas antes da aplicação;
- registro automático do `/aplicar-template` sem acoplar ao restart do bot;
- comunicação web → bot pela rede Docker, sem loopback entre containers;
- readiness, ordem de dependências, restart e shutdown previsíveis;
- documentação de instalação, atualização, versões, backup e restore.

## 3. Documentos e skill consultados

Foram lidos `PROJECT_DIRECTION.md`, `DECISIONS.md`, `AI_RULES.md`, `AGENTS.md`,
`AI_CONTEXT.md`, `README.md` e `AI_HANDOFF.md`. A skill
`.ai/skills/backend-architect/SKILL.md` foi lida integralmente.

Como `node_modules/next/dist/docs/` está ausente, a configuração standalone foi
confirmada na documentação oficial do Next.js 15. Tags/arquiteturas foram
conferidas nas imagens oficiais Node/PostgreSQL e a compatibilidade PostgreSQL
na documentação Prisma.

## 4. Auditoria de dependências externas

### Obrigatórias

- **PostgreSQL:** persistência de Auth.js e domínio. Tornou-se container oficial
  local no fluxo padrão.
- **Prisma:** client, schema e migrations. Continua obrigatório nos processos
  que acessam dados; CLI é usada pelo job de migration.
- **Discord OAuth:** único login do painel; exige Client ID/Secret e callback.
- **Discord Bot/Gateway/REST:** executa automações, consulta guilds e registra o
  slash command; exige token e conectividade HTTPS/Gateway.
- **Auth.js:** sessão persistida e proteção da identidade.
- **API privada do bot:** necessária porque o web não possui o cliente Gateway;
  autenticada por segredo e ator, disponível somente na rede Compose.

### Opcionais

- `DISCORD_BOT_INVITE_URL`: apenas exibição de convite na tela de servidores.
- `AUTH_URL`: possui padrão localhost; torna-se necessária/explícita em acesso
  externo ou proxy HTTPS.
- nomes de usuário/banco, porta pública e timeout da API possuem padrões.
- `TEST_DATABASE_URL`: somente suíte de integração descartável.

### Alternativas, legado ou removíveis do caminho oficial

- **Supabase:** não aparece no código/runtime atual; existia apenas na operação
  histórica documentada em `TALK_LOG.md`. Não é necessário. Um PostgreSQL
  Supabase continua tecnicamente compatível via `DATABASE_URL` em execução
  customizada fora do Compose.
- **PM2/concurrently:** `concurrently` permanece útil nos scripts locais
  existentes, mas não participa dos containers. PM2 não é dependência.
- **`DATABASE_URL` manual:** continua necessária fora do Docker; no Compose é
  construída automaticamente a partir de `POSTGRES_*`.
- **Redis, filas, proxy, storage e serviços de log:** inexistentes e
  desnecessários para esta fase; não foram adicionados.
- **Uploads:** não há fluxo de upload nem arquivos persistidos pela aplicação.
- **Logs em volume:** não há logging em arquivo; stdout/stderr do Docker é o
  contrato atual, portanto nenhum volume de logs foi criado.

## 5. Arquitetura final do Compose

### Serviços permanentes

1. `postgres`: `postgres:17.10-alpine3.23`, healthcheck `pg_isready`, restart
   `unless-stopped`, volume `postgres_data`.
2. `bot`: imagem `worker`, Node 22, Gateway Discord + Express, API `3001`
   exposta somente na rede interna, healthcheck exige segredo e `botReady`.
3. `web`: imagem Next standalone, única porta publicada, healthcheck HTTP.

### Jobs efêmeros

1. `migrate`: mesma imagem `worker`, roda
   `node_modules/prisma/build/index.js migrate deploy` após PostgreSQL healthy.
2. `discord-commands`: mesma imagem `worker`, registra comandos globais e sai.

Não há imagens adicionais para os jobs porque ambos reutilizam artefatos já
necessários ao bot. Um job de migration separado torna a exclusão mútua e o
resultado observável, em vez de cada réplica/processo tentar migrar.

## 6. Fluxo de startup e readiness

```text
postgres inicia → pg_isready healthy
  ├→ migrate deploy termina 0
  └→ discord-commands chama Discord e termina 0
       → bot inicia, conecta Gateway, /health retorna botReady=true
          → web inicia e / responde com sucesso
```

`depends_on` usa `service_healthy` e `service_completed_successfully`, evitando
`sleep` e corrida por tempo. Falhas de banco, migration ou Discord impedem os
dependentes de aparentarem sucesso.

## 7. Fluxo do Prisma/PostgreSQL

- `npm ci` usa `package-lock.json` em build reproduzível;
- `prisma generate` roda no prebuild web e no estágio de dependências do worker;
- nenhuma geração é necessária no host ou em volume mutável;
- `migrate deploy` usa somente migrations versionadas existentes;
- schema, models e migrations não foram modificados;
- web/bot só iniciam após o job de migration terminar com sucesso.

`scripts/container-entrypoint.mjs` recebe `POSTGRES_HOST`, porta, database,
usuário e senha; valida nomes/porta e usa `URL` para percent-encode da senha.
Produz `DATABASE_URL` com schema `public`, `sslmode=disable` na rede local e
timeout de conexão de 10 s. Se uma `DATABASE_URL` já existir em execução
customizada, ela é preservada.

## 8. Comunicação web/bot

Antes, cliente e servidor usavam `127.0.0.1`, válido somente em processo/host
compartilhado. Agora:

- bot escuta `BOT_API_BIND_HOST` (padrão local `127.0.0.1`; Compose `0.0.0.0`);
- web aceita `BOT_API_URL`, validada como origem HTTP/HTTPS sem credenciais,
  path, query ou fragmento;
- Compose fixa `BOT_API_URL=http://bot:3001`;
- a porta é apenas `expose`, nunca `ports`;
- `BOT_API_SECRET` e ator Discord permanecem obrigatórios nas requisições.

## 9. Shutdown e restart

Web/bot/postgres usam `restart: unless-stopped`. Web e bot têm `init: true` e
grace period de 20 s. O entrypoint encaminha SIGINT/SIGTERM ao processo filho.
O bot agora destrói o client Discord, fecha conexões HTTP (inclusive idle) e
desconecta o Prisma antes de sair. Jobs usam `restart: "no"`.

## 10. Persistência

- volume nomeado: `postgres_data:/var/lib/postgresql/data`;
- caminho segue a regra da imagem oficial para PostgreSQL 17 e anteriores;
- `docker compose down` preserva dados;
- `docker compose down -v` é destrutivo e está advertido no README;
- não existem uploads/cache/logs persistentes que justifiquem outros volumes.

## 11. Variáveis

### Obrigatórias no Docker

- `POSTGRES_PASSWORD`;
- `DISCORD_BOT_TOKEN`;
- `DISCORD_CLIENT_ID`;
- `DISCORD_CLIENT_SECRET`;
- `AUTH_SECRET`;
- `ALLOWED_DISCORD_USER_IDS`;
- `BOT_API_SECRET`.

Compose usa interpolação `${VAR:?mensagem}` e falha antes de iniciar quando uma
dessas variáveis está ausente/vazia.

### Opcionais no Docker

- `POSTGRES_DB=clutch_hub`;
- `POSTGRES_USER=clutch_hub`;
- `WEB_PORT=3000`;
- `AUTH_URL=http://localhost:3000`;
- `DISCORD_BOT_INVITE_URL` vazio;
- `BOT_API_TIMEOUT_MS=5000`.

### Desenvolvimento/teste/internas

- `DATABASE_URL`, `TEST_DATABASE_URL`;
- `BOT_API_URL`, `BOT_API_BIND_HOST`, `BOT_API_PORT`;
- `AUTH_TRUST_HOST=true` é definido internamente pelo Compose.

Nenhum valor secreto foi incluído em arquivos versionados.

## 12. Compatibilidade

Node 22.23.1 bookworm-slim e PostgreSQL 17.10 Alpine oficiais publicam amd64 e
arm64. O Compose usa recursos padrão V2, bridge network, named volume,
healthchecks e dependências condicionais. O desenho é apropriado para Docker
Desktop, Docker Engine em Ubuntu/Debian e painéis que importam Compose como
Umbrel, Dockge, Portainer e EasyPanel. Essas plataformas não foram executadas
neste ambiente.

Não foi especificado `platform`, para permitir seleção nativa da arquitetura.
PostgreSQL e API do bot não publicam portas. O stack precisa de saída à internet
para pull/npm no build e para Discord em runtime.

## 13. Instalação, atualização e versões

Primeira instalação:

```text
git clone → copiar .env.example para .env → preencher → docker compose up -d
```

Atualização:

```text
backup → git pull --ff-only → docker compose up -d --build → compose ps/logs
```

Versão fixa: checkout de tag/commit e rebuild. Downgrade após migrations não é
garantido e deve usar backup compatível.

## 14. Backup e restore

README documenta `pg_dump --format=custom` via `docker compose exec -T postgres`
e `pg_restore --clean --if-exists --no-owner`. O dump fica no host, fora do
volume. Web/bot devem ser parados em restauração planejada. Não foi executado
por falta de Docker/PostgreSQL neste ambiente.

## 15. Arquivos criados na Fase 3A

- `.dockerignore`;
- `Dockerfile`;
- `compose.yaml`;
- `scripts/container-entrypoint.mjs`.

## 16. Arquivos alterados na Fase 3A

- `.env.example`;
- `next.config.mjs`;
- `bot/api.js`;
- `bot/index.js`;
- `bot/deploy-commands.js`;
- `src/lib/discord/bot-api-client.js` e teste;
- `README.md`;
- `AI_CONTEXT.md`;
- `DECISIONS.md` (ADR-024);
- `AI_HANDOFF.md`.

O worktree já continha mudanças não commitadas da Fase 2A. Elas foram
preservadas; esta lista diferencia as alterações de 3A.

## 17. Testes e resultados executados

### Unitários/HTTP

```text
npm test
23 arquivos passed, 1 skipped
163 testes passed, 1 skipped
```

O skipped é a integração PostgreSQL protegida por `TEST_DATABASE_URL`, ausente.
Foi adicionado teste de `BOT_API_URL` interna e rejeição de URL ambígua.

### Lint

```text
npm run lint
0 erros, 7 warnings preexistentes de @next/next/no-img-element
```

### Build

```text
npm run build
Next.js 15.5.22: compilação, 10 rotas e output standalone concluídos
```

Foram confirmados `.next/standalone/server.js` e o Prisma Client rastreado no
output standalone.

### Prisma

```text
npx prisma validate
schema válido
```

### Checks adicionais

- `node --check` passou em bot, API, deploy de comandos e entrypoint;
- `compose.yaml` foi carregado por parser YAML local e sua estrutura de cinco
  serviços, dois targets e volume nomeado foi confirmada;
- construção de URL com senha contendo caracteres especiais foi exercitada
  localmente pelo entrypoint;
- `git diff --check` passou, apenas com avisos de conversão LF/CRLF;
- schema e diretório de migrations permanecem sem alteração desta fase.

## 18. Testes Docker não executados

Os comandos `docker version` e `docker compose version` falharam porque
`docker` não é reconhecido neste host. Consequentemente, não foram executados:

- `docker compose config` oficial;
- build real do Dockerfile;
- pull das imagens base;
- startup e healthchecks dos cinco serviços;
- conexão Prisma dentro da rede;
- registro real no Discord;
- persistência após restart/recreate;
- backup/restore;
- smoke amd64/arm64 e painéis de hospedagem.

Essa é a principal validação pendente antes de considerar o empacotamento
operacionalmente comprovado.

## 19. Como executar o smoke test pendente

Em host Docker com credenciais de aplicação de teste:

1. copiar `.env.example` para `.env` e preencher segredos/IDs;
2. `docker compose config` e confirmar apenas uma porta publicada;
3. `docker compose build --no-cache`;
4. `docker compose up -d` e acompanhar `docker compose ps -a`/logs;
5. confirmar `migrate` e `discord-commands` exited 0;
6. confirmar `postgres`, `bot`, `web` healthy e login OAuth;
7. executar uma leitura/CRUD e `/aplicar-template` em guild de teste;
8. reiniciar web/bot/postgres e confirmar dados preservados;
9. realizar dump, restaurar em stack descartável e validar os dados;
10. repetir em arm64 quando disponível.

## 20. Limitações e riscos restantes

- estado de jobs/salas em RAM e ausência de reconciliação pós-restart;
- ausência de compensação transacional Discord/PostgreSQL;
- registro global pode levar tempo para propagar e falha bloqueia o bot;
- segredos estão em environment do Compose, adequados ao escopo atual, mas não
  usam Docker Secrets;
- imagens são fixadas por versão, não digest; exigem atualização periódica;
- nenhum E2E real de OAuth/Discord/Docker;
- múltiplos PrismaClient e observabilidade limitada permanecem;
- compatibilidade com painéis foi projetada, não empiricamente certificada.

## 21. Próximas fases recomendadas

1. smoke Docker real e correções exclusivamente operacionais encontradas;
2. Fase 2B de idempotência/compensação Discord ↔ PostgreSQL;
3. persistência/reconciliação de `TemporaryVoiceChannel`;
4. integração PostgreSQL e build Compose em CI;
5. centralização Prisma, logs e readiness mais aprofundada;
6. somente depois novas ferramentas ou serviços de infraestrutura.

## 22. Resumo executivo

A Fase 3A remove do fluxo oficial a dependência de infraestrutura externa e de
ferramentas instaladas no host. O stack codifica banco, migrations, registro de
comandos, bot e web com ordem explícita; preserva dados em volume; publica só o
painel; corrige a comunicação loopback incompatível com containers e adiciona
shutdown coordenado. O código local está verde, mas a ausência de Docker impede
afirmar que imagens e runtime completo já foram exercitados. O próximo passo
obrigatório é o smoke test descrito acima, antes de avançar a evolução de
consistência do domínio.
