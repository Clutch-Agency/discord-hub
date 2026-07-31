---
name: clutch-frontend
description: Planejar, implementar e revisar interfaces do Clutch Hub preservando seu sistema visual profissional, denso e orientado a administração.
---

# Skill de Frontend do Clutch Hub

Use esta skill em toda tarefa que crie ou altere telas, componentes, estilos,
interações, responsividade ou acessibilidade. Antes de editar código, leia
`AI_RULES.md`, `.ai/design/FOUNDATIONS.md` e a rota/componente afetado.

## Intenção visual

O Clutch Hub deve parecer uma ferramenta de administração confiável, direta e
calma. A interface deve favorecer leitura rápida, comparação de estados e
execução segura de ações. O produto não deve parecer uma landing page, um
template genérico de dashboard ou uma demonstração de efeitos visuais.

Referências de qualidade, sem copiar identidade:

- Linear: hierarquia, densidade e velocidade percebida;
- Raycast: clareza de comandos e acabamento de estados;
- Vercel: tipografia, contraste e contenção visual;
- GitHub: previsibilidade de tabelas, formulários e ações destrutivas;
- Discord: vocabulário e modelos mentais do domínio.

## Processo obrigatório

1. Identifique a jornada, o estado principal e os estados alternativos.
2. Reutilize padrões e componentes existentes antes de criar novos.
3. Defina hierarquia, conteúdo e comportamento responsivo antes de decorar.
4. Implemente a menor mudança coerente com o restante do produto.
5. Revise com `.ai/reviews/frontend-review.md`.
6. Valide lint, testes e build conforme `AGENTS.md`.
7. Quando houver mudança visual material, inspecione a tela renderizada nos
   tamanhos desktop e mobile; não conclua apenas pela leitura do JSX/CSS.

## Regras visuais

### Tipografia

- Use a família tipográfica global existente; não adicione fontes por tela.
- Títulos devem comunicar seção e prioridade, não funcionar como decoração.
- Corpo e labels precisam permanecer legíveis em zoom e telas pequenas.
- Use peso, tamanho e contraste com parcimônia; não use caixa alta em textos
  longos.
- Números, IDs e valores técnicos devem ser fáceis de comparar.

### Espaçamento e composição

- Use a escala de espaçamento existente no Tailwind; evite valores arbitrários.
- Mantenha ritmo consistente entre título, descrição, controles e conteúdo.
- Prefira agrupamento por proximidade a caixas em torno de tudo.
- Preserve densidade adequada a uma ferramenta administrativa.
- Alinhe controles relacionados e mantenha áreas clicáveis confortáveis.

### Bordas, superfícies e sombras

- Bordas sutis devem separar regiões quando espaço e fundo não bastarem.
- Cards só são apropriados para unidades realmente independentes.
- Sombras devem indicar elevação ou sobreposição, nunca ornamentação.
- Evite múltiplas camadas de borda, brilho, glassmorphism e gradientes
  decorativos.

### Cor

- Use cor para estado, prioridade e ação.
- Preserve contraste suficiente entre texto, fundo, borda e controles.
- Ações destrutivas devem ser inequívocas, mas não dominar a tela inteira.
- Não invente uma nova paleta local nem use muitas cores sem significado.

### Movimento

- Anime apenas mudança de estado, entrada/saída ou reordenação que beneficie a
  compreensão.
- Prefira transições curtas e discretas.
- Respeite `prefers-reduced-motion`.
- Não adicione animação contínua, parallax, bounce ou efeitos decorativos.

## UX e estados

- Toda ação assíncrona deve ter feedback de progresso e impedir duplicação
  acidental quando necessário.
- Estados vazios devem explicar o que falta e oferecer o próximo passo
  relevante. Não use ilustração como substituto de instrução.
- Estados de erro devem informar o que ocorreu, o que foi preservado e como
  tentar novamente.
- Confirme ações irreversíveis e diferencie cancelar de confirmar.
- Preserve dados digitados quando uma falha recuperável ocorrer.
- Não esconda funções essenciais apenas em hover.
- Textos devem usar o vocabulário do domínio Discord já adotado pelo produto.

## Acessibilidade

- Use HTML semântico e controles nativos sempre que possível.
- Todos os controles precisam de nome acessível, foco visível e operação por
  teclado.
- Não use somente cor para transmitir estado.
- Modais, menus e popovers devem gerenciar foco e fechamento por teclado.
- Ícones decorativos devem ser ignorados por tecnologias assistivas; ícones
  acionáveis precisam de rótulo.
- Mensagens dinâmicas importantes devem ser anunciáveis quando aplicável.

## Responsividade

- Projete primeiro a prioridade do conteúdo, não apenas a redução de largura.
- Evite overflow horizontal acidental.
- Tabelas e grupos densos devem ter estratégia explícita para telas pequenas.
- A navegação e as ações primárias devem continuar acessíveis em mobile.
- Teste no mínimo um viewport desktop e um mobile representativo.

## Componentes e dependências

- Reutilize componentes existentes e extraia um compartilhado somente quando
  houver uso real ou uma regra complexa comum.
- Mantenha componentes específicos próximos da rota.
- Não introduza biblioteca visual, pacote ou registry sem justificar benefício,
  maturidade, manutenção e impacto.
- O MCP shadcn pode ser usado para pesquisar e inspecionar primitives. Nunca
  instale um item sem revisar código, dependências, acessibilidade, licença e
  aderência a estes fundamentos.
- Componentes externos são matéria-prima; adapte-os ao sistema existente e
  evite a aparência padrão de qualquer kit.

## Proibições

- Não redesenhar telas fora do escopo.
- Não substituir padrões existentes apenas por preferência estética.
- Não gerar dashboards formados por cards repetitivos.
- Não usar texto fictício, métricas inventadas ou ações sem comportamento.
- Não sacrificar clareza, acessibilidade ou desempenho por impacto visual.
- Não afirmar que a UI está correta sem revisão visual quando a mudança for
  material.

