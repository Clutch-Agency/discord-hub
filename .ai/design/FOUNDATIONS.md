# Fundamentos de Design

## Princípios

1. **Clareza operacional:** o usuário deve reconhecer estado, risco e próxima
   ação sem interpretar decoração.
2. **Consistência antes de novidade:** padrões repetidos devem se comportar e
   parecer iguais.
3. **Densidade com legibilidade:** o painel administra recursos; espaço deve
   organizar informação, não escondê-la.
4. **Feedback explícito:** ações remotas envolvem Next.js, banco, bot e Discord.
   A interface deve distinguir carregamento, sucesso parcial, erro e estado
   persistido.
5. **Segurança perceptível:** ownership, guild selecionada e consequências de
   ações sensíveis precisam estar claros.
6. **Acessibilidade estrutural:** semântica, teclado, foco, contraste e redução
   de movimento são requisitos, não acabamento posterior.

## Linguagem visual

- Superfícies neutras, hierarquia tipográfica e bordas discretas.
- Cor de destaque reservada para seleção e ação relevante.
- Estados semânticos consistentes para sucesso, atenção, erro e informação.
- Ícones complementam labels; não substituem texto em ações ambíguas.
- Elevação somente para elementos realmente sobrepostos.
- Cantos, controles e espaçamentos seguem a escala já presente na aplicação.

## Referências

Linear, Raycast, Vercel, GitHub e Discord são referências de critérios, não
fontes para cópia. Uma tela é adequada quando combina a eficiência operacional
dessas referências com os padrões já existentes no Clutch Hub.

## Fonte de verdade

O código renderizado e os fluxos reais são a fonte de verdade do estado visual.
Este documento define direção. A skill
`.ai/skills/clutch-frontend/SKILL.md` define o método de trabalho, e
`.ai/reviews/frontend-review.md` define a revisão final.

