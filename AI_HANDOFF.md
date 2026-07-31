# AI HANDOFF — Fase 1B: Aplicação da Segurança nas Operações Existentes

## 1. Status

**Concluída em 31/07/2026.**

A fundação da Fase 1A foi aplicada à área administrativa, guilds, templates,
toggles e CRUD de VoiceHub. IDOR, perda silenciosa de cargos, endpoints mutáveis
sem ator e ausência de timeout foram corrigidos dentro do escopo definido.

## 2. Objetivo executado

- bloquear o dashboard para usuários fora da allowlist;
- filtrar guilds pelo estado atual de owner/Administrator/ManageGuild;
- proteger remoção do bot e efeitos de VoiceHub no web e no bot;
- derivar guild/canal de recursos persistidos;
- corrigir o IDOR de reorder com conjunto exato e transação;
- preservar os três arrays de cargos do Hub;
- limitar `toolKey` ao catálogo oficial e exigir boolean real;
- centralizar timeout/abort das chamadas privadas;
- remover detalhes internos das respostas HTTP alteradas;
- comprovar caminhos permitidos, negados e ausência de efeitos após negação.

## 3. Documentos e skills lidos

Na ordem exigida:

1. `PROJECT_DIRECTION.md`;
2. `DECISIONS.md`;
3. `AI_RULES.md`;
4. `AGENTS.md`;
5. `AI_CONTEXT.md`;
6. `PROJECT_REPORT.md` integralmente, em faixas porque a primeira saída foi
   truncada;
7. `README.md`;
8. `AI_HANDOFF.md` anterior.

Skill obrigatória lida integralmente:

- `.ai/skills/backend-architect/SKILL.md`.

Todos os módulos 1A e testes relacionados foram relidos. A documentação local
`node_modules/next/dist/docs/` está ausente. Foram consultadas as fontes oficiais
do Next.js 15 sobre segurança de dados/Server Actions, autenticação e erros de
renderização dinâmica. A versão instalada foi confirmada como Next 15.5.22.

## 4. Diagnóstico anterior

- layout exigia apenas uma sessão Discord;
- `getGuilds` retornava todo o cache do bot;
- remoção de guild e endpoints mutáveis exigiam somente `x-bot-secret`;
- create/update/delete de VoiceHub confiavam em IDs do fluxo web e não
  reconfirmavam a guild;
- o detalhe do Hub não selecionava arrays de cargos;
- `updateChannelOrder` atualizava qualquer ID submetido;
- `toggleTool` aceitava chave arbitrária e tipos não validados;
- cada action fazia `fetch` direto ao bot, sem timeout;
- endpoints retornavam `error.message` do Discord.

## 5. Proteção global implementada

`src/app/dashboard/layout.js` agora chama `requireOperator()` antes de obter e
renderizar conteúdo administrativo. O segmento foi marcado `force-dynamic`,
pois depende sempre de cookie/sessão e não pode ser prerenderizado.

As Server Actions administrativas de templates, toggles, guilds e VoiceHub
repetem a autorização; o layout não é usado como única barreira.

## 6. Comportamento para usuário negado

- sem sessão: redirecionamento para `/`;
- fora da allowlist: `notFound()` antes de renderizar o dashboard;
- allowlist ausente/vazia/inválida: mesmo estado seguro, sem conteúdo;
- falha da identidade: mesmo estado seguro;
- ações diretas: `AuthorizationError` previsível antes de consultas ou efeitos.

Allowlist, valores configurados e detalhes internos não são serializados.

## 7. Filtragem de guilds

Fluxo atual:

```text
getGuilds
→ requireOperator
→ GET privado /guilds com x-actor-discord-id
→ listAuthorizedGuilds no processo do bot
→ authorizeGuildActor para cada guild do cache
→ somente owner/Administrator/ManageGuild
```

Existe um único request HTTP web→bot. Guild negada é omitida. Qualquer falha
inesperada da fonte Discord faz a lista inteira falhar de forma segura; não há
retorno parcial ambíguo nem cache novo.

## 8. Proteção de remoção do bot

`removeGuild` exige operador, valida snowflake, chama
`requireGuildAuthorization()` e envia o contexto autorizado ao cliente privado.
`DELETE /guilds/:guildId` exige segredo + ator e repete `authorizeGuildActor()`
antes de `guild.leave()`. Guild ausente, ator ausente, ID inválido, permissão
revogada ou Discord indisponível não executam `leave()`.

A limpeza de configurações da guild continua fora do escopo e deve ser tratada
na fase de consistência/reconciliação.

## 9. Proteção de criação de Hub

`createVoiceHubForOperator()` executa operador → guild válida → autorização web
→ POST privado autorizado → persistência com `actor.userId` e guild confirmada.
O endpoint repete a autorização antes de criar o canal. Nenhum ator é aceito do
formulário.

Falha Prisma posterior à criação Discord ainda pode deixar canal órfão; a
compensação completa foi explicitamente adiada pelo escopo.

## 10. Proteção de edição de Hub

Leitura e edição usam `getAuthorizedVoiceHub()`:

1. exige operador;
2. valida o ID interno;
3. busca `id + actor.userId`;
4. deriva `guildId` do registro;
5. autoriza a guild;
6. passa somente a projeção necessária ao editor.

`getGuildRoles` agora recebe o ID do Hub, repete esse fluxo e não aceita mais
uma `guildId` arbitrária do navegador.

## 11. Proteção de exclusão de Hub

Delete busca o Hub por owner, deriva guild/canal do banco, autoriza a guild,
chama o endpoint protegido e só depois executa `deleteMany(id + userId)`. Canal
já ausente é tratado como estado removível; guild/ator negados não permitem
apagar o registro.

## 12. Endpoints mutáveis protegidos

Rotas auditadas:

- `POST /guilds/:guildId/voice-channels`;
- `PATCH /guilds/:guildId/voice-channels/:channelId`;
- `DELETE /guilds/:guildId/voice-channels/:channelId`;
- `DELETE /guilds/:guildId`.

Todas exigem segredo e ator, validam IDs, repetem owner/Administrator/ManageGuild
e só então executam o efeito. PATCH/DELETE buscam o canal pela coleção da guild
autorizada e exigem `ChannelType.GuildVoice`, impedindo canal externo ou tipo
incompatível.

## 13. Correção do IDOR

`reorderTemplateChannels()`:

- exige operador e template de `actor.userId`;
- valida IDs e duplicatas;
- carrega no servidor o conjunto esperado;
- exige igualdade exata, sem omissões ou extras;
- ignora qualquer `order` enviado e usa a posição do array;
- atualiza cada canal com `id + templateId`;
- usa transação interativa e falha se uma atualização não afetar exatamente um
  registro.

Recurso alheio/inexistente não é consultado separadamente nem enumerado.

## 14. Correção dos arrays de cargos

A projeção `VOICE_HUB_SELECT` inclui:

- `permissionRoles`;
- `ignoredRoles`;
- `moderatorRoles`.

Cada `RoleSelector` envia um marcador `<field>Present`. Com marcador e nenhum
ID, `[]` é uma limpeza intencional; sem marcador, o campo é omitido do update e
o valor atual é preservado. Abrir/salvar sem mudança mantém os valores.

## 15. Validação de `toolKey`

`USER_TOOLS` é o catálogo único. `validateToolToggle()` aceita somente
`templates` e `voice-channels` e exige `typeof enabled === "boolean"`.
`toggleToolForOperator()` deriva o usuário de `requireOperator()` antes do
upsert. Chaves desconhecidas não criam `UserTool` arbitrário.

## 16. Timeout do cliente interno

`src/lib/discord/bot-api-client.js` centraliza configuração, headers, request,
abort e conversão de falhas. O default é 5000 ms. `BOT_API_TIMEOUT_MS` é
opcional e aceita inteiro entre 100 e 30000 ms. `AbortController` encerra a
chamada e o timer é limpo em `finally`.

Não há retry automático, sobretudo nas operações mutáveis.

## 17. Estratégia de erros públicos

- 400: entrada/autorização inválida;
- 401: segredo incorreto;
- 403: acesso à guild negado;
- 404: canal compatível não encontrado;
- 503: autorização/Discord indisponível ou efeito externo falhou.

Endpoints alterados não retornam stack, objeto Discord, URL interna nem
`error.message`. Logs usam mensagens fixas e não incluem segredo, token ou
payload privado. O web converte falhas retornadas em códigos/mensagens públicas
de `AuthorizationError` quando necessário.

## 18. Arquivos criados

- `src/lib/discord/guild-operations.js`;
- `src/lib/discord/guild-operations.test.js`;
- `src/lib/discord/bot-api-client.test.js`;
- `src/lib/templates/channel-order.js`;
- `src/lib/templates/channel-order.test.js`;
- `src/lib/voice-hubs/voice-hub-operations.js`;
- `src/lib/voice-hubs/voice-hub-operations.test.js`;
- `src/lib/voice-hubs/voice-hub-service.js`;
- `src/lib/voice-hubs/voice-hub-service.test.js`;
- `src/lib/user-tools.test.js`.

## 19. Arquivos modificados

- `.env.example`;
- `bot/api.js`, `bot/api.test.mjs`;
- `bot/guild-authorization.js`, `bot/guild-authorization.test.mjs`;
- `src/app/dashboard/layout.js`;
- `src/app/dashboard/actions.js`;
- `src/app/dashboard/servers/actions.js`;
- `src/app/dashboard/tools-actions.js`;
- `src/app/dashboard/templates/[id]/actions.js`;
- páginas/actions/editor/fetch do domínio `voice-channels`;
- `src/lib/discord/bot-api-client.js`;
- `src/lib/user-tools.js`;
- `AI_CONTEXT.md`, `DECISIONS.md` e este `AI_HANDOFF.md`.

`AGENTS.md`, `AI_RULES.md`, `README.md` e `PROJECT_REPORT.md` não foram
alterados. Não surgiu contradição operacional que justificasse mudar as regras.

## 20. Testes adicionados

Cobertura nova/expandida:

- listagem filtrada e fail-safe de guilds;
- remoção autorizada, ausente, inválida e negada;
- POST/PATCH/DELETE de voz e tipo incompatível;
- ausência de efeitos após negação;
- create/read/update/delete/roles de VoiceHub por owner/guild;
- IDs manipulados e recurso alheio;
- preservação/limpeza/ausência de arrays;
- projeção dos arrays para o editor;
- reorder válido, externo, duplicado, omitido, extra e inexistente;
- tool keys e tipos;
- configuração de timeout, caminho normal, abort e ausência de retry;
- redaction de falhas externas.

## 21. Resultado dos testes

Última execução sobre o código final:

```text
npm test
16 arquivos aprovados
104 testes aprovados
0 falhas e 0 erros não tratados
```

Os testes usam objetos controlados e Express real em porta efêmera local. Não
acessam Discord, OAuth ou PostgreSQL reais.

## 22. Resultado do lint

```text
npm run lint
0 erros
7 warnings
```

Os sete warnings preexistentes são `@next/next/no-img-element` e permanecem fora
do escopo visual da fase.

## 23. Resultado do build

```text
npm run build
Prisma Client 6.19.3 gerado
Next.js 15.5.22 compilado
10 rotas processadas
build concluído com sucesso
```

O primeiro build intermediário identificou que o dashboard autenticado precisava
ser explicitamente dinâmico; após `dynamic = "force-dynamic"`, duas execuções
subsequentes passaram. O build final manteve apenas os sete warnings antigos.

## 24. Resultado do Prisma

```text
npx prisma validate
schema válido
```

O `prebuild` também executou `prisma generate` com sucesso.

## 25. Dependências

Nenhuma dependência foi adicionada, removida ou atualizada.

- `package.json`: sem alteração;
- `package-lock.json`: sem alteração.

Timeout usa `AbortController` nativo do Node atual.

## 26. Confirmação de ausência de migrations

- `prisma/schema.prisma`: sem alteração;
- `prisma/migrations/`: sem alteração;
- migration criada: nenhuma;
- migration executada: nenhuma.

## 27. Mudanças funcionais perceptíveis

- conta autenticada fora da allowlist deixa de abrir o dashboard;
- lista de servidores pode ficar menor porque mostra apenas guilds administradas;
- ações perdem acesso imediatamente se permissões Discord forem revogadas;
- Hubs de guild não autorizada deixam de aparecer/abrir;
- salvar o editor não apaga mais cargos ausentes acidentalmente;
- requests privados podem falhar após 5 s por padrão, em vez de ficar pendurados;
- erros do bot ficam genéricos e seguros para o consumidor.

Não houve redesign nem nova funcionalidade de produto.

## 28. Riscos restantes

- criação Discord seguida de falha Prisma ainda pode deixar canal órfão;
- exclusão Discord seguida de falha Prisma ainda pode deixar divergência;
- salas temporárias e timers continuam em memória;
- não há teste com OAuth, banco ou Discord reais;
- não há rate limiting ou observabilidade estruturada;
- `ownershipLockMinutes` continua sem efeito;
- workflows de template continuam sem TTL/paginação completa;
- validação integral de todos os campos ainda não foi feita;
- README/instalação continuam desatualizados.

## 29. Operações ainda não migradas

- comando slash e eventos Discord não usam a allowlist do painel; mantêm o
  modelo próprio `Account + UserTool + permissões do contexto Discord`;
- engine de salas não persiste `TemporaryVoiceChannel`;
- fluxos Discord+banco não possuem reconciliação/compensação completa;
- validação ampla de nomes, enums e limites dos templates permanece parcial;
- código legado fora dos fluxos migrados ainda cria `PrismaClient` diretamente.

As operações administrativas web de templates, toggles, guilds e VoiceHub
agora exigem operador. Logout permanece naturalmente disponível a qualquer
sessão.

## 30. Recomendações para a Fase 2

1. ampliar validação de domínio e contratos de retorno das Server Actions;
2. definir limites/enum de templates e configuração completa de Hub;
3. padronizar tratamento de conflitos Prisma/Discord sem expor detalhes;
4. adicionar testes de integração com banco descartável;
5. planejar compensação simples e idempotência antes de retries;
6. depois integrar `TemporaryVoiceChannel` e reconciliação de startup;
7. manter Docker/empacotamento para a fase prevista, sem antecipar infraestrutura.

## 31. Arquivos prioritários para revisão

- `src/lib/voice-hubs/voice-hub-operations.js`;
- `src/lib/voice-hubs/voice-hub-service.js`;
- `src/lib/discord/bot-api-client.js`;
- `src/lib/discord/guild-operations.js`;
- `src/lib/templates/channel-order.js`;
- `bot/guild-authorization.js`;
- `bot/api.js`;
- `src/app/dashboard/layout.js`;
- `src/app/dashboard/voice-channels/[id]/actions.js`;
- `src/app/dashboard/templates/[id]/actions.js`.

## 32. Resumo executivo

A Fase 1B fecha as vulnerabilidades críticas identificadas para a superfície
administrativa atual: allowlist é global e repetida em actions, guilds são
isoladas pela permissão Discord atual, efeitos mutáveis têm defesa em
profundidade, VoiceHub deriva escopo do banco, reorder não atravessa templates e
arrays não são apagados por ausência. O cliente privado agora falha em tempo
finito e não repete mutações. A suíte passou de 47 para 104 testes sem novas
dependências, schema ou migrations. O próximo risco estrutural prioritário é
consistência/persistência entre Discord e PostgreSQL, precedido pela validação
de domínio planejada para a Fase 2.
