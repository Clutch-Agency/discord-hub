# Infraestrutura de IA do Clutch Hub

Este diretório concentra contexto operacional reutilizável por agentes. Ele não
substitui `PROJECT_DIRECTION.md`, `DECISIONS.md`, `AI_RULES.md` ou `AGENTS.md`.
Em caso de conflito, prevalece a hierarquia definida em `AI_RULES.md`.

## Estrutura

- `skills/`: instruções especializadas e permanentes para tipos de tarefa.
- `prompts/`: roteiros curtos para iniciar trabalhos recorrentes.
- `reviews/`: checklists de revisão antes da entrega.
- `design/`: fundamentos visuais e decisões sobre ferramentas de design.

## O que deve ser versionado

Todo o conteúdo deste diretório é fonte de contexto e deve ser versionado. O
arquivo `.mcp.json` na raiz também deve ser versionado: ele contém somente a
configuração reproduzível do servidor MCP escolhido, sem credenciais.

O adaptador em `.agents/skills/clutch-frontend/` permite descoberta automática
da skill pelo Codex sem duplicar as instruções canônicas. A configuração
`.codex/config.toml` integra o MCP ao Codex em repositórios confiáveis.

## O que não deve ser versionado

- tokens, chaves, cookies ou credenciais de ferramentas;
- caches e downloads produzidos por ferramentas;
- grafos e índices derivados do código;
- saídas de revisão específicas de uma sessão, salvo quando virarem
  documentação permanente;
- configurações globais de Codex ou Claude Code.

Arquivos derivados devem ser regeneráveis e adicionados ao `.gitignore` quando
uma ferramenta adotada passar a produzi-los.

## Manutenção

- Atualize uma skill somente quando a convenção permanente mudar.
- Registre decisões relevantes em `DECISIONS.md`.
- Revise versões fixadas de ferramentas deliberadamente; não use `latest` em
  configuração compartilhada.
- Não copie regras entre arquivos. Prefira referências para uma única fonte.
- Quando uma ferramenta externa for removida, remova também sua configuração,
  documentação e artefatos ignorados.
