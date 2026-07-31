# Project Direction — Clutch Hub

## 1. Propósito

O Clutch Hub existe para melhorar minha produtividade pessoal como Producer e Project Manager de jogos.

A ferramenta automatiza tarefas repetitivas relacionadas à criação e administração de servidores Discord usados durante o desenvolvimento de jogos.

Seu principal objetivo atual é reduzir o tempo gasto preparando a infraestrutura de comunicação de novos projetos.

## 2. Natureza do projeto

O Clutch Hub é atualmente uma ferramenta pessoal e de uso interno.

Ele não está sendo desenvolvido, neste momento, como um produto comercial. Pode se tornar uma ferramenta vendável no futuro, mas essa possibilidade não deve gerar complexidade antecipada no código ou na infraestrutura.

As decisões atuais devem priorizar:

1. produtividade pessoal;
2. simplicidade;
3. estabilidade;
4. segurança;
5. facilidade de instalação;
6. facilidade de manutenção.

Billing, planos comerciais, organizações, marketing, analytics comerciais e estruturas empresariais não devem ser implementados sem uma decisão futura explícita.

## 3. Problema principal

O problema principal resolvido pelo Clutch Hub é a preparação manual de servidores Discord para projetos de jogos.

A funcionalidade de templates permite criar uma estrutura base de canais sem configurar cada canal individualmente.

O benefício central não é apenas criar canais, mas reduzir o tempo necessário para preparar a infraestrutura de comunicação de um projeto.

## 4. Referências

O MEE6 é uma referência de funcionalidades e experiência de uso.

O objetivo atual não é competir diretamente com MEE6 ou outros bots comerciais. Recursos de ferramentas existentes podem ser estudados como inspiração, mas devem ser adaptados às necessidades reais deste projeto.

## 5. Estado atual do MVP

O MVP atual já está funcional.

Ele contém:

- autenticação com Discord;
- painel web;
- gerenciamento de ferramentas;
- templates de canais;
- aplicação de templates pelo bot;
- configuração de Hubs de voz;
- criação de salas temporárias;
- persistência PostgreSQL;
- integração entre painel e bot.

A fase atual não é de expansão rápida de funcionalidades.

A prioridade é tornar as funcionalidades existentes:

- seguras;
- previsíveis;
- estáveis;
- bem testadas;
- fáceis de instalar;
- fáceis de atualizar;
- fáceis de recuperar em caso de falha.

## 6. Escopo atual

Durante a fase de estabilização, novas ferramentas não devem ser adicionadas.

Primeiro devem ser corrigidos:

- problemas críticos de autorização;
- falhas de isolamento entre usuários e servidores;
- persistência de salas temporárias;
- inconsistências entre Discord e banco;
- ausência de validação;
- ausência de testes;
- problemas de instalação e atualização;
- divergências na documentação.

Depois da estabilização, novas ferramentas poderão ser implementadas individualmente, com escopo definido e revisão antes da execução.

## 7. Filosofia de desenvolvimento

O projeto deve priorizar soluções simples.

Sempre que existirem uma solução simples e uma solução sofisticada, deve ser escolhida a solução simples, desde que:

- seja segura;
- seja suficientemente confiável;
- não impeça a manutenção;
- atenda às necessidades atuais.

Não adicionar arquitetura para uma escala que ainda não existe.

Não introduzir:

- microserviços;
- Kubernetes;
- filas;
- Redis;
- múltiplos bancos;
- camadas abstratas excessivas;
- sistemas distribuídos;

sem uma necessidade concreta e documentada.

## 8. Arquitetura atual

A arquitetura atual possui dois processos principais:

1. aplicação Next.js;
2. bot Discord.

Ambos compartilham um banco PostgreSQL.

O painel usa Next.js App Router, Server Components e Server Actions.

O bot funciona separadamente porque precisa manter uma conexão contínua com o Discord Gateway. Essa responsabilidade é diferente do ciclo de requisições HTTP do painel.

Essa separação deve ser preservada.

## 9. Por que Next.js

Next.js atende ao projeto porque permite manter:

- interface;
- autenticação;
- rotas;
- renderização;
- acesso ao banco;
- mutações internas;

em um único framework.

Isso reduz o número de tecnologias e acelera o desenvolvimento de uma ferramenta pessoal.

A escolha não significa que Next.js seja obrigatório para sempre. Ela significa que, no estágio atual, não existe uma justificativa suficiente para substituir o framework.

## 10. Por que Server Actions

Server Actions são usadas para evitar a criação de uma API REST separada para todas as operações internas do painel.

Elas reduzem código repetitivo e mantêm as mutações próximas das funcionalidades que as utilizam.

Toda Server Action deve, entretanto, validar:

- autenticação;
- autorização;
- ownership;
- IDs recebidos;
- tipos;
- limites;
- permissões sobre a guild Discord.

Server Actions não devem ser tratadas como funções confiáveis apenas porque não aparecem diretamente na interface.

## 11. Por que não NestJS

NestJS não foi adotado porque o projeto não precisa atualmente de um backend separado com muitos módulos, APIs públicas ou várias equipes trabalhando simultaneamente.

Adicionar NestJS agora duplicaria responsabilidades e aumentaria:

- quantidade de código;
- infraestrutura;
- manutenção;
- superfície de falhas;
- complexidade da instalação.

Essa decisão poderá ser reavaliada apenas se o backend crescer além das responsabilidades que o Next.js consegue atender de forma clara.

## 12. Instalação e portabilidade

O Clutch Hub deve ser uma aplicação self-hosted e plug-and-play.

O objetivo é permitir que uma pessoa:

1. obtenha os arquivos do projeto;
2. preencha um arquivo de configuração;
3. execute Docker Compose;
4. conclua a configuração do Discord;
5. acesse a aplicação.

A instalação principal deve funcionar em:

- Linux com Docker Compose;
- Dockge;
- Umbrel com gerenciador de stacks;
- computadores pessoais;
- VPS.

A instalação não deve depender de configuração manual de Node.js, PostgreSQL, Prisma ou PM2 no host.

## 13. Princípios do Docker Compose

A stack deve conter, no mínimo:

- aplicação web;
- bot Discord;
- PostgreSQL;
- processo controlado de migrations.

Apenas o painel web deve precisar de uma porta publicada no host.

PostgreSQL e API interna do bot não devem ser expostos publicamente por padrão.

Os dados persistentes devem usar volumes Docker nomeados.

A stack deve possuir:

- healthchecks;
- política de restart;
- ordem segura de inicialização;
- variáveis documentadas;
- imagens versionadas;
- backup documentado;
- atualização documentada;
- configuração compatível com amd64 e arm64 quando possível.

## 14. Critérios de qualidade

Uma alteração só deve ser considerada concluída quando:

- o comportamento foi implementado;
- autorização e validação foram verificadas;
- testes relevantes foram adicionados ou atualizados;
- lint e build passam;
- migrations são seguras;
- documentação afetada foi atualizada;
- instalação Docker continua funcionando;
- nenhuma configuração secreta foi adicionada ao repositório;
- mudanças importantes foram registradas em `DECISIONS.md`.

## 15. Próxima fase

A próxima fase do projeto é “Estabilização e empacotamento”.

Objetivos:

1. corrigir vulnerabilidades críticas;
2. corrigir falhas funcionais conhecidas;
3. adicionar validação;
4. estabelecer testes básicos;
5. corrigir lint e build;
6. containerizar painel, bot e banco;
7. criar uma instalação por `compose.yaml`;
8. documentar instalação, atualização e backup;
9. validar o funcionamento em Dockge/Umbrel;
10. somente depois iniciar uma nova ferramenta.