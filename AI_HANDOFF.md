# AI HANDOFF — Fase IA-01: Infraestrutura dos Agentes

## 1. Status

**Concluída em 31/07/2026.**

A infraestrutura permanente de contexto, frontend, revisão e MCP foi criada. A
fase não alterou código funcional, interface, schema, migrations, Docker,
dependências npm ou regras de negócio.

## 2. Objetivo executado

- avaliar Graphify com base em documentação oficial;
- comparar 21st.dev Magic/21st MCP, Builder MCP e alternativas maduras;
- escolher no máximo uma solução principal de apoio visual;
- criar uma skill permanente de frontend;
- organizar contexto reutilizável em `.ai/`;
- integrar a solução escolhida ao Codex e preparar Claude Code;
- revisar `AI_RULES.md` e corrigir inconsistências;
- auditar o acoplamento real ao Supabase;
- registrar decisões e atualizar o contexto permanente;
- validar o estado técnico sem implementar funcionalidades.

## 3. Documentação lida

- `README.md`
- `PROJECT_DIRECTION.md`
- `AGENTS.md`
- `AI_RULES.md`
- `AI_CONTEXT.md`
- `PROJECT_REPORT.md`
- `DECISIONS.md`
- `AI_HANDOFF.md` anterior
- prompt completo anexado da Fase IA-01

O código, schema, migrations, dependências e arquivos de ambiente foram
inspecionados. Valores secretos não foram exibidos nem documentados.

## 4. Decisões resumidas

| Tema | Decisão |
| --- | --- |
| Graphify | Não adotar nesta fase |
| Solução visual principal | MCP oficial do shadcn, opcional |
| 21st.dev | Não adotar |
| Builder MCP | Não adotar |
| Contexto de agentes | Estrutura canônica em `.ai/` |
| Skill de frontend | Canônica em `.ai/`, descoberta no Codex por adaptador |
| Codex MCP | `.codex/config.toml` versionado |
| Claude Code MCP | `.mcp.json` versionado |
| Supabase | Apenas hospedagem PostgreSQL via `DATABASE_URL` |
| Próxima fase | Fase 1 — segurança e autorização |

As decisões completas foram registradas nas ADR-018, ADR-019 e ADR-020 de
`DECISIONS.md`.

## 5. Avaliação do Graphify

### O que foi verificado

Graphify oferece CLI local, parsing por AST/tree-sitter, grafo de código, skill
para agentes e servidor MCP. O pacote oficial no PyPI é `graphifyy`; o comando é
`graphify`. Instalações por projeto podem criar skills para Codex e Claude.

Referências:

- <https://graphify.com/what-is-graphify>
- <https://graphify.com/docs/mcp-tools>
- <https://github.com/Graphify-Labs/graphify>
- <https://pypi.org/project/graphifyy/>

### Estado local encontrado

- `graphify`: ausente;
- `uv`: ausente;
- `python`: somente o alias da Microsoft Store, sem runtime funcional
  comprovado;
- repositório pequeno e navegável com busca textual e leitura direta.

### Decisão e motivo

Não instalar. A ferramenta é recente, o ganho atual não compensa uma nova
dependência operacional em Python e o prompt proíbe infraestrutura experimental
sem benefício claro.

### Artefatos

- nenhum runtime ou CLI instalado;
- nenhuma skill Graphify criada;
- nenhum MCP Graphify configurado;
- nenhum grafo gerado;
- `graphify-out/` adicionado ao `.gitignore` preventivamente.

### Reavaliação futura

Se adotado, usar ambiente isolado, pacote oficial, versão fixada, instalação por
projeto e skills compatíveis com os agentes utilizados. Versionar somente
configuração/skills estáveis; ignorar grafos derivados.

## 6. Comparação das ferramentas de design

### 21st.dev MCP

O antigo Magic MCP foi sucedido pelo 21st MCP. Oferece busca, leitura e
instalação de componentes, mas depende de serviço remoto, autenticação, limites
no plano gratuito e créditos em fluxos de geração.

- <https://docs.21st.dev/mcp>
- <https://github.com/21st-dev/magic-mcp>

**Resultado:** não adotado nesta fase.

### Builder MCP

Integra branches, protótipos, Figma e documentação de design system no
ecossistema Builder. Exige conta e pressupõe um workspace/design system externo
que o projeto não possui; parte relevante da oferta é associada a planos e
créditos.

- <https://www.builder.io/c/docs/builder-mcp/>
- <https://www.builder.io/pricing>

**Resultado:** não adotado nesta fase.

### shadcn MCP

Permite pesquisar, visualizar e instalar itens de registries. O registry
público padrão não exige conta, o código pode ser inspecionado antes da adoção,
há suporte oficial a Codex e Claude Code e a licença do pacote é MIT.

- <https://ui.shadcn.com/docs/mcp>

**Resultado:** única solução principal escolhida, mas opcional.

O projeto **não adotou shadcn/ui como design system**. Nenhum componente,
registry ou pacote de aplicação foi instalado. O MCP serve apenas para pesquisa
e inspeção; qualquer item futuro exige revisão normal de código, licença,
acessibilidade, dependências e aderência visual.

## 7. Configuração MCP

Versão validada e fixada: `shadcn@4.16.0`.

- Codex: `.codex/config.toml`;
- Claude Code: `.mcp.json`.

O Codex confirmou o servidor `shadcn` como habilitado por `codex mcp list`. O
comando `npx -y shadcn@4.16.0 mcp --help` também foi executado com sucesso.

O MCP não é `required`; sua indisponibilidade não bloqueia desenvolvimento,
testes ou build. Nenhuma credencial é versionada.

## 8. Estrutura `.ai/`

```text
.ai/
├── README.md
├── design/
│   ├── FOUNDATIONS.md
│   └── TOOLING.md
├── prompts/
│   └── frontend-task.md
├── reviews/
│   └── frontend-review.md
└── skills/
    └── clutch-frontend/
        └── SKILL.md
```

- `README.md`: escopo, versionamento, exclusões e manutenção;
- `FOUNDATIONS.md`: princípios e linguagem visual;
- `TOOLING.md`: comparação, decisão, configuração e uso seguro;
- `frontend-task.md`: roteiro de início de tarefa;
- `frontend-review.md`: checklist de UX, visual, acessibilidade e qualidade;
- `SKILL.md`: workflow canônico e permanente de frontend.

## 9. Skill de frontend

A skill define:

- filosofia de ferramenta profissional, direta e densa;
- referências de critérios: Linear, Raycast, Vercel, GitHub e Discord;
- processo obrigatório antes, durante e depois da implementação;
- tipografia, espaçamento, cor, bordas, sombras e movimento;
- loading, empty, erro, sucesso e ações destrutivas;
- acessibilidade, teclado, foco, semântica e contraste;
- responsividade e revisão em desktop/mobile;
- regras para componentes e dependências externas;
- proibições contra templates genéricos e efeitos decorativos.

A fonte canônica permanece em `.ai/skills/clutch-frontend/SKILL.md`.
`.agents/skills/clutch-frontend/SKILL.md` é somente um adaptador curto para a
descoberta automática pelo Codex.

## 10. Revisão do `AI_RULES.md`

Inconsistências encontradas e corrigidas:

1. **Hierarquia incompleta:** agora inclui contexto e documentação de
   referência, distinguindo direção desejada de implementação atual.
2. **“Nunca assumir” versus autonomia:** agora permite suposições locais,
   reversíveis e dentro do escopo, exigindo pergunta para decisões de produto,
   segurança, arquitetura, dados, custos ou irreversibilidade.
3. **Ausência de regra para ferramentas externas:** agora proíbe envio de
   secrets/dados e trata código gerado como externo não revisado.
4. **Frontend sem processo operacional:** agora referencia a skill e o checklist
   permanentes.
5. **Verificações não comprovadas:** agora proíbe afirmar lint/test/build/revisão
   visual sem execução.
6. **Graphify nominalmente privilegiado:** regra generalizada para qualquer
   ferramenta de análise, MCP ou registry.

## 11. Atualização do `AGENTS.md`

- ordem de leitura alinhada à hierarquia;
- `AI_RULES.md` e `AI_HANDOFF.md` incluídos no contexto obrigatório;
- reforçada a consulta à documentação local da versão instalada do Next.js;
- criada seção de frontend/design com skill, fundamentos e checklist;
- documentado o uso opcional do MCP shadcn;
- registrada a não adoção do Graphify;
- definido quando atualizar o handoff.

Limitação: `node_modules/next/dist/docs/` permanece ausente na instalação local
atual. Uma futura tarefa que altere APIs Next deve obter documentação compatível
antes de escrever código e registrar a fonte usada.

## 12. Auditoria do Supabase

### O que existe

- provider Prisma `postgresql`;
- conexão exclusivamente por `DATABASE_URL`;
- endpoint atual classificado como PostgreSQL hospedado no Supabase, sem expor
  hostname ou credenciais;
- schema e migrations em SQL PostgreSQL comum;
- arrays PostgreSQL em `VoiceHub`.

### O que não existe no código/versionamento

- `@supabase/*` ou outro SDK Supabase;
- Supabase Auth;
- Storage;
- Realtime;
- Edge Functions;
- buckets;
- chamadas às APIs Supabase;
- RLS;
- `CREATE POLICY`;
- referência a `auth.users`;
- extensões ou tipos proprietários do Supabase.

Referências históricas ao Supabase existem apenas em `TALK_LOG.md` e em
instruções operacionais antigas.

### Resposta objetiva

**Do ponto de vista do código da aplicação, sim:** remover o Supabase como
provedor exige essencialmente apontar `DATABASE_URL` para outro PostgreSQL
compatível.

**Do ponto de vista operacional, não é somente trocar a string:** é necessário
migrar/validar os dados, aplicar migrations, conferir versão PostgreSQL, TLS,
pooling, timeouts, limites de conexão, backup/restore, timezone e
disponibilidade. Arrays PostgreSQL precisam continuar suportados.

Não houve migração, alteração de schema ou conexão ao banco nesta fase.

## 13. Arquivos criados

- `.agents/skills/clutch-frontend/SKILL.md`
- `.ai/README.md`
- `.ai/design/FOUNDATIONS.md`
- `.ai/design/TOOLING.md`
- `.ai/prompts/frontend-task.md`
- `.ai/reviews/frontend-review.md`
- `.ai/skills/clutch-frontend/SKILL.md`
- `.codex/config.toml`
- `.mcp.json`

## 14. Arquivos modificados nesta fase

- `.gitignore`
- `AGENTS.md`
- `AI_CONTEXT.md`
- `AI_RULES.md`
- `DECISIONS.md`
- `AI_HANDOFF.md` — sobrescrito por este handoff.

`PROJECT_DIRECTION.md`, `PROJECT_REPORT.md`, `README.md`, código-fonte,
`package.json`, `package-lock.json`, schema e migrations não foram alterados
por esta fase.

## 15. Estado pré-existente da árvore

A árvore já estava suja ao iniciar a Fase IA-01, contendo a entrega da Fase 0 e
outras alterações locais:

- mudanças em `AGENTS.md`, `README.md`, bot, ESLint, `package.json` e lockfile;
- novos testes, Vitest, utilitário de voz e documentos;
- `CLAUDE.md` marcado como removido.

Essas alterações foram preservadas. A remoção de `CLAUDE.md` não foi revertida
e nenhum arquivo funcional preexistente foi editado nesta fase.

## 16. Dependências e serviços

- dependências npm adicionadas: nenhuma;
- dependências npm removidas: nenhuma;
- dependências de produção alteradas: nenhuma;
- runtime Python/Graphify instalado: não;
- conta, token ou serviço pago exigido: não;
- migration executada: não;
- Docker alterado: não.

O shadcn MCP é baixado sob demanda por `npx` na versão fixada e não integra o
grafo de dependências da aplicação.

## 17. Verificações executadas

### Configuração

- parse de `.mcp.json`: sucesso;
- `codex mcp list`: servidor `shadcn` habilitado;
- `npx -y shadcn@4.16.0 mcp --help`: sucesso;
- `git diff --check` nos arquivos da fase: sucesso.

### Lint

`npm run lint`: **sucesso, 0 erros e 7 warnings**.

Todos os warnings são `@next/next/no-img-element` preexistentes:

- `ServersClient.js`;
- `VoiceHubEditor.js`;
- `ServerSelector.js`;
- página de Hubs;
- página inicial;
- `Sidebar.js`;
- `UserDropdown.js`.

Não foram corrigidos porque isso alteraria código/UI fora do escopo.

### Testes

`npm test`: **sucesso**.

- 2 arquivos;
- 4 testes;
- 4 aprovados.

### Build

`npm run build`: **sucesso**.

- Prisma Client 6.19.3 gerado;
- Next.js 15.5.22 compilado;
- 10 rotas processadas;
- mesmos 7 warnings de `<img>`;
- `.env.local` e `.env` carregados sem exibição de valores.

## 18. Limitações e riscos restantes

- mudanças visuais futuras ainda dependem de revisão renderizada humana/agente;
- o MCP executa pacote externo sob demanda e precisa continuar com versão
  deliberadamente fixada;
- registries podem retornar código inseguro, incompatível ou genérico;
- Claude Code só carregará `.mcp.json` em ambiente que aceite configuração de
  projeto;
- a skill canônica não substitui testes E2E ou auditoria de acessibilidade;
- documentação de Next versionada no pacote permanece indisponível localmente;
- os riscos críticos da aplicação identificados na Fase 0 continuam abertos.

## 19. Próxima fase

A próxima fase continua sendo a **Fase 1 — Segurança**, antes de Docker:

1. allowlist de operadores conforme ADR-014;
2. autorização por guild conforme ADR-015;
3. correção de IDOR e validação consistente nas Server Actions;
4. testes de caminhos permitido, negado e entrada inválida;
5. somente depois avançar para persistência/reconciliação e empacotamento.

Não iniciar Docker Compose antes de fechar os riscos prioritários de segurança.

## 20. Resumo para o próximo agente

Leia a hierarquia em `AI_RULES.md`. Para frontend, a skill
`clutch-frontend` deve aparecer automaticamente no Codex; sua fonte canônica
está em `.ai/`. O MCP shadcn é opcional e não autoriza instalação automática.
Graphify foi deliberadamente rejeitado nesta fase. Supabase não é uma
dependência de plataforma do runtime além da conexão PostgreSQL. Preserve a
árvore suja e comece a próxima implementação pelas ADR-014 e ADR-015.

