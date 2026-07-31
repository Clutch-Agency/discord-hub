# Ferramentas de apoio ao frontend

Avaliação realizada em 31/07/2026. Ferramentas externas são opcionais e nunca
substituem a leitura do código, a skill local ou a revisão visual.

## Decisão

O **MCP oficial do shadcn** é a única solução principal selecionada para
pesquisa e inspeção de componentes. A configuração de projeto está em
`.mcp.json`, usa versão fixada e não exige conta para consultar o registry
público.

Motivos:

- código dos itens pode ser inspecionado antes da instalação;
- registry público disponível sem credenciais;
- integração oficial com Codex e Claude Code;
- licença MIT e ecossistema React/Tailwind compatível;
- nenhuma dependência de produção é adicionada apenas para consultar o MCP.

Limites:

- o projeto não adota shadcn/ui como design system;
- instalar itens pode alterar código e dependências e exige aprovação/revisão
  normal;
- componentes padrão podem produzir aparência genérica;
- execução via `npx` requer rede e deve respeitar a versão fixada;
- registries privados podem exigir tokens, que nunca devem ser versionados.

## Comparação

| Solução | Vantagens | Custos e riscos | Decisão atual |
| --- | --- | --- | --- |
| 21st.dev MCP (sucessor do Magic MCP) | Busca, leitura e instalação de catálogo; suporte a Codex e Claude | Serviço remoto, autenticação, limites no plano gratuito e créditos para geração; maior risco de UI de catálogo | Não adotar |
| Builder MCP | Integra Figma, branches, protótipos e documentação de design system | Exige conta Builder; fluxo orientado à plataforma e a um design system externo inexistente no projeto; recursos MCP associados a planos | Não adotar |
| shadcn MCP | Registry aberto, inspeção do código, sem conta no registry padrão, integração oficial | Pode adicionar código/dependências e induzir aparência padrão | **Principal, opcional** |
| Graphify | Grafo local de código, MCP e skills para agentes | Ferramenta recente, runtime Python ausente e benefício limitado no repositório atual | Não instalar nesta fase |

## Referências oficiais

- shadcn MCP: <https://ui.shadcn.com/docs/mcp>
- 21st MCP: <https://docs.21st.dev/mcp>
- transição do Magic MCP: <https://github.com/21st-dev/magic-mcp>
- Builder MCP: <https://www.builder.io/c/docs/builder-mcp/>
- planos Builder: <https://www.builder.io/pricing>
- Graphify: <https://graphify.com/what-is-graphify>
- Graphify MCP: <https://graphify.com/docs/mcp-tools>
- pacote Graphify: <https://pypi.org/project/graphifyy/>

## Uso seguro

1. Pesquise e visualize antes de instalar.
2. Trate todo código retornado como código externo não revisado.
3. Verifique licença, dependências, acessibilidade e compatibilidade.
4. Não envie secrets, `.env`, tokens ou dados de produção.
5. Não permita alterações fora do escopo da tarefa.
6. Execute lint, testes, build e revisão visual após qualquer adoção.

## Configuração

Claude Code lê o `.mcp.json` versionado na raiz.

O Codex lê `.codex/config.toml` quando o repositório é confiável. A configuração
equivalente versionada é:

```toml
[mcp_servers.shadcn]
command = "npx"
args = ["-y", "shadcn@4.16.0", "mcp"]
```

Depois, reiniciar o cliente. A ausência do MCP nunca deve bloquear uma tarefa.

## Política do Graphify

Graphify não foi instalado e nenhum grafo foi gerado. A decisão deve ser
reavaliada somente quando o repositório crescer a ponto de a navegação normal
deixar de ser suficiente ou quando a ferramenta demonstrar maturidade
operacional adequada.

Se for adotado no futuro:

- instalar o pacote oficial `graphifyy` em ambiente isolado;
- fixar e documentar a versão;
- usar instalação por projeto para Codex e Claude;
- versionar apenas skills/configurações estáveis;
- ignorar `graphify-out/` e qualquer índice derivado;
- nunca enviar o grafo a serviços externos sem aprovação explícita.
