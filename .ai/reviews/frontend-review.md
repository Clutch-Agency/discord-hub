# Checklist de revisão de frontend

## Escopo e coerência

- [ ] A mudança resolve somente o problema solicitado.
- [ ] Padrões e componentes existentes foram reutilizados.
- [ ] Não há conteúdo, métricas ou ações fictícias.
- [ ] O vocabulário é consistente com o domínio Discord e com a interface.

## Estados e fluxo

- [ ] Estado inicial e conteúdo principal estão claros.
- [ ] Loading impede ações duplicadas quando necessário.
- [ ] Empty state explica o próximo passo.
- [ ] Erro informa impacto e recuperação.
- [ ] Sucesso confirma a ação sem interromper a jornada.
- [ ] Ação destrutiva tem consequência e confirmação adequadas.

## Visual

- [ ] Hierarquia tipográfica e espaçamento são consistentes.
- [ ] Cards, bordas, sombras, cores e animações têm função.
- [ ] A densidade é adequada a uma ferramenta administrativa.
- [ ] Não há aparência genérica de template ou kit externo.
- [ ] A tela foi inspecionada renderizada em desktop e mobile quando a mudança
  visual é material.

## Acessibilidade

- [ ] Estrutura semântica e labels acessíveis.
- [ ] Fluxo completo operável por teclado.
- [ ] Foco visível e corretamente gerenciado.
- [ ] Estado não depende somente de cor.
- [ ] Contraste e alvos de interação adequados.
- [ ] Movimento reduzido respeitado quando aplicável.

## Responsividade e robustez

- [ ] Sem overflow acidental.
- [ ] Conteúdo e ações prioritárias permanecem acessíveis em telas pequenas.
- [ ] Textos longos, listas vazias e dados ausentes não quebram o layout.
- [ ] Integrações remotas possuem feedback e tratamento de falha.

## Verificação

- [ ] Diff revisado.
- [ ] Lint executado.
- [ ] Testes executados.
- [ ] Build executado.
- [ ] Limitações e riscos restantes informados.

