# AI HANDOFF — Fase 3B.1: Correções da Homologação Docker

## 1. Status

**Implementação concluída em 31/07/2026. Novo smoke Docker pendente no host de
homologação.**

Os três problemas encontrados no smoke real da Fase 3A foram corrigidos no
código: OpenSSL está presente nos stages relevantes, respostas privadas usam
`MessageFlags.Ephemeral` e a criação de VoiceHub sem guild retorna feedback
inline previsível sem chegar à error boundary.

## 2. Objetivo executado

- eliminar a causa do warning de detecção OpenSSL do Prisma;
- remover toda opção funcional `ephemeral` depreciada;
- bloquear criação de Hub sem servidor no frontend;
- preservar validação obrigatória e ausência de efeitos no backend;
- manter categorias de autenticação, autorização e indisponibilidade distintas;
- preservar Compose, schema, migrations e dependências.

## 3. Documentos e skills lidos

Na ordem solicitada: `PROJECT_DIRECTION.md`, `DECISIONS.md`, `AI_RULES.md`,
`AGENTS.md`, `AI_CONTEXT.md`, `README.md` e `AI_HANDOFF.md` anterior.

Skills lidas integralmente:

- `.ai/skills/backend-architect/SKILL.md`;
- `.ai/skills/clutch-frontend/SKILL.md`;
- `.ai/design/FOUNDATIONS.md`;
- `.ai/reviews/frontend-review.md`.

`node_modules/next/dist/docs/` continua ausente. Foram consultadas as fontes
oficiais compatíveis do Next.js 15 para expected errors em Server Actions e do
discord.js 14.27.0 para `MessageFlags.Ephemeral`. As typings/fontes da versão
instalada também foram inspecionadas.

## 4. Diagnóstico dos logs reais

A homologação externa comprovou PostgreSQL, migrations, registro Discord, bot,
web, rede privada, porta única, persistência em restart/down/recreate, volume e
backup. Encontrou:

1. Prisma não detectava libssl nas imagens `migrate`, `bot` e `web`;
2. discord.js avisava que `ephemeral` em opções de resposta está depreciado;
3. `guildId` vazio gerava `AuthorizationError(INVALID_INPUT)` não consumido pela
   UI, produzindo a página de erro do Next.js.

O terceiro problema não estava na regra de domínio: a rejeição server-side era
correta. O defeito era o contrato da action/consumo do formulário. Além disso,
`required` em `input type="hidden"` não oferecia validação nativa útil.

## 5. Correção de OpenSSL

O `Dockerfile` ganhou o stage compartilhado `prisma-base`, derivado de
`node:22.23.1-bookworm-slim`. Ele instala somente `openssl` com
`--no-install-recommends` e remove `/var/lib/apt/lists` no mesmo layer.

`dependencies`, `web` e `worker` herdam dessa base. Assim, Prisma CLI e Prisma
Client encontram OpenSSL tanto em build/generate quanto em migrations, bot e
web, sem repetir o bloco de instalação ou mudar para Alpine.

## 6. Stages Docker alterados

- `prisma-base`: novo ancestral com OpenSSL;
- `dependencies`: agora herda `prisma-base`; portanto `builder` e
  `production-dependencies` também possuem OpenSSL durante `prisma generate`;
- `web`: herda `prisma-base`, mantém standalone e `USER node`;
- `worker`: herda `prisma-base`, atende bot/migrate/discord-commands e mantém
  `USER node`.

Cache multi-stage, Debian Bookworm Slim, amd64/arm64, targets e comandos foram
preservados. `compose.yaml` não mudou.

## 7. Correção de `ephemeral`

Todas as respostas privadas compatíveis passaram de:

```text
ephemeral: true
```

para:

```text
flags: MessageFlags.Ephemeral
```

`MessageFlags` é importado diretamente de `discord.js`. Conteúdo, embeds,
componentes e fluxo das mensagens não mudaram. Updates de componentes continuam
usando `interaction.update(payload)`, preservando a visibilidade da mensagem
original sem tentar alterar flags via edit/update.

## 8. Ocorrências encontradas

Foram encontradas 10 ocorrências funcionais:

- 2 em `bot/utils.js` (`reply` e `followUp`);
- 5 em `bot/interactionHandler.js` (erros e etapas de modal/workflow);
- 3 em `bot/templateCommands.js` (menu vazio, inválido e inicial).

Havia ainda uma expectativa depreciada em
`bot/interactionHandler.test.mjs`.

## 9. Ocorrências corrigidas

As 10 ocorrências funcionais e a expectativa de teste foram convertidas. A
busca final em arquivos não documentais por `ephemeral\s*:` retornou zero.

`bot/utils.test.mjs` confirma:

- reply privado com flag;
- follow-up privado com flag;
- ausência da propriedade `ephemeral`;
- update de componente sem alteração da visibilidade.

## 10. Fluxo anterior do Hub sem guild

```text
formulário com hidden guildId="" e required ineficaz
  → createVoiceHub(FormData)
  → createAuthorizedVoiceHub("")
  → requireOperator
  → INVALID_INPUT field=guildId lançado
  → action não trata
  → error boundary/página de erro do Next.js
```

Prisma e Discord já não eram chamados após a validação, mas a experiência do
usuário era incorreta.

## 11. Fluxo corrigido

```text
usuário envia sem guild
  → cliente bloqueia → foco no seletor → mensagem inline acessível

POST manipulado com guild ausente/vazia/inválida
  → requireOperator → validação guildId
  → AuthorizationError seguro
  → actionFailure({ code, message, field })
  → formulário associa field=guildId ao seletor
  → nenhum bot/Prisma/redirect/revalidate
```

Com guild válida, a sequência original permanece: operador → guild atual →
criação Discord → persistência Prisma → revalidate → redirect ao editor.

## 12. Tratamento frontend

Foi criado `CreateVoiceHubForm.js`, específico da rota, sem componente genérico
ou redesign. Ele:

- controla `selectedGuildId`;
- bloqueia submissão vazia e move foco ao seletor;
- mostra `Selecione um servidor para continuar.` junto ao campo;
- usa `role="alert"`, `aria-live`, `aria-describedby`, `aria-expanded`,
  `aria-controls` e mantém botões operáveis por teclado;
- destaca o seletor com borda/estado sem depender apenas de cor;
- limpa o erro quando uma guild é escolhida;
- desabilita duplicação durante envio e mostra `Criando Hub...`;
- exibe outras categorias de falha em mensagem geral distinta;
- preserva o layout, responsividade e vocabulário existentes.

`ServerSelector` tornou-se controlado e usa `forwardRef` somente para devolver
foco após a validação esperada.

## 13. Tratamento backend

`createVoiceHubForOperator` continua autenticando antes de validar a guild.
Ausência ou string vazia recebe mensagem específica e `field: "guildId"`;
snowflake inválido mantém `O servidor selecionado é inválido.`.

`createVoiceHub` captura falhas da operação e retorna `actionFailure(error)`.
Revalidate/redirect ficam fora do bloco e só executam após sucesso. Portanto:

- autenticação não vira erro de campo;
- guild negada continua `GUILD_ACCESS_DENIED`;
- bot indisponível continua `EXTERNAL_UNAVAILABLE`;
- falha inesperada continua mensagem segura;
- entrada inválida não alcança autorização de guild, Discord ou Prisma.

## 14. Contrato utilizado

Foi reutilizado exclusivamente o contrato existente:

```text
{ ok: false, code, message, field? }
```

Sucesso navega para o editor como antes. Não foi criado segundo formato. A
configuração de alias `@` foi acrescentada ao Vitest para testar diretamente a
Server Action usando os mesmos imports da aplicação.

## 15. Arquivos criados

- `bot/utils.test.mjs`;
- `src/app/dashboard/voice-channels/new/CreateVoiceHubForm.js`;
- `src/app/dashboard/voice-channels/new/actions.test.js`.

## 16. Arquivos modificados

- `Dockerfile`;
- `bot/utils.js`;
- `bot/templateCommands.js`;
- `bot/interactionHandler.js` e teste;
- `src/app/dashboard/voice-channels/new/page.js`;
- `src/app/dashboard/voice-channels/new/ServerSelector.js`;
- `src/app/dashboard/voice-channels/new/actions.js`;
- `src/lib/voice-hubs/voice-hub-operations.js` e teste;
- `vitest.config.mjs`;
- `AI_CONTEXT.md`;
- `AI_HANDOFF.md`.

`README.md`, `DECISIONS.md` e `compose.yaml` não precisaram mudar.

## 17. Testes adicionados

- flags efêmeras em reply/follow-up e preservação do update;
- guild ausente, string vazia e snowflake inválido;
- `field: "guildId"` e mensagens específicas;
- ausência de autorização de guild, bot e Prisma após input inválido;
- bot indisponível sem persistência;
- action sem exceção não tratada para input esperado;
- distinção entre guild negada, bot indisponível e não autenticado;
- sucesso com revalidate e redirect.

## 18. Resultado dos testes

```text
npm test
25 arquivos aprovados, 1 skipped
175 testes aprovados, 1 skipped
0 falhas
```

O único skipped continua sendo integração PostgreSQL sem `TEST_DATABASE_URL`.

## 19. Resultado do lint

```text
npm run lint
0 erros
7 warnings preexistentes de @next/next/no-img-element
```

Nenhum warning novo permaneceu.

## 20. Resultado do build

```text
npm run build
Next.js 15.5.22 compilado
10 rotas processadas
output standalone concluído
```

A rota `/dashboard/voice-channels/new` compilou com o novo formulário cliente.

## 21. Resultado Prisma

```text
npx prisma validate
schema válido
```

O prebuild gerou Prisma Client 6.19.3. A mensagem de nova major disponível foi
informativa e nenhuma atualização foi realizada.

## 22. Resultado Docker

O ambiente atual ainda não possui o comando `docker`; `docker version` e
`docker compose version` falharam como comando inexistente. Não foi possível
reconstruir as imagens nem observar os logs de 3B.1 localmente.

Por inspeção, `builder`, `production-dependencies`, `web` e `worker` herdam
`prisma-base`, que instala OpenSSL. A confirmação empírica da ausência do warning
deve ocorrer no host usado na homologação 3A.

## 23. Ausência de schema/migration

- `prisma/schema.prisma`: sem alteração;
- `prisma/migrations/`: sem alteração;
- migration criada: nenhuma;
- migration executada neste ambiente: nenhuma.

## 24. Dependências

Nenhuma dependência npm foi adicionada, removida ou atualizada.
`package.json` e `package-lock.json` permanecem inalterados nesta correção.
OpenSSL é pacote de sistema da imagem Debian, instalado sem recomendações.

## 25. Riscos restantes

- o warning OpenSSL precisa ser confirmado em containers reconstruídos sem
  cache antigo;
- OAuth/Discord real e a mensagem inline não foram exercitados visualmente
  neste host sem runtime autenticado;
- o tratamento cliente usa execução imperativa da Server Action porque o
  projeto está em React 18.3.1, que não exporta `useActionState`;
- estado de jobs/salas, consistência Discord/PostgreSQL e reconciliação
  permanecem deliberadamente fora do escopo;
- os sete warnings históricos de `<img>` permanecem.

## 26. Comandos para novo smoke test

No host de homologação, com o `.env` existente:

```bash
docker compose config
docker compose build --no-cache
docker compose up -d
docker compose ps -a
docker compose logs migrate
docker compose logs discord-commands
docker compose logs bot
docker compose logs web
```

Confirmar ausência de `Prisma failed to detect`, `openssl-1.1.x` e
`Supplying "ephemeral"`. Depois, abrir `/dashboard/voice-channels/new`, enviar
sem guild, verificar mensagem/foco/permanência na página e repetir com guild
válida. Confirmar somente web com porta publicada.

## 27. Arquivos prioritários para revisão

- `Dockerfile`;
- `bot/utils.js`;
- `bot/interactionHandler.js`;
- `bot/templateCommands.js`;
- `src/app/dashboard/voice-channels/new/CreateVoiceHubForm.js`;
- `src/app/dashboard/voice-channels/new/ServerSelector.js`;
- `src/app/dashboard/voice-channels/new/actions.js`;
- `src/lib/voice-hubs/voice-hub-operations.js`.

## 28. Resumo executivo

A Fase 3B.1 corrige apenas os três achados reais da homologação. OpenSSL agora
faz parte de uma base Docker única herdada por todos os ambientes Prisma, sem
perder non-root ou multi-stage. As respostas privadas do bot usam a API oficial
de flags, com zero opção depreciada funcional. A criação de VoiceHub trata
guild ausente em duas camadas: feedback inline acessível no navegador e retorno
discriminado no servidor, mantendo autenticação e negações intactas e impedindo
efeitos. Código local, testes, lint, build e Prisma estão verdes; falta somente
reconstruir e repetir o smoke no host Docker real.
