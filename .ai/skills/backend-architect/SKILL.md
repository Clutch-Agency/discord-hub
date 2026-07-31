---
name: backend-architect
description: Define como agentes devem projetar, implementar, revisar e testar alterações de backend no Clutch Hub.
---

# Backend Architect — Clutch Hub

## 1. Objetivo

Esta skill define como agentes de IA devem pensar e trabalhar ao alterar o backend do Clutch Hub.

Ela orienta decisões relacionadas a:

- arquitetura;
- autorização;
- autenticação;
- validação;
- Server Actions;
- Route Handlers;
- serviços;
- Prisma;
- PostgreSQL;
- integrações com Discord;
- persistência;
- tratamento de erros;
- observabilidade;
- segurança;
- testes;
- desempenho;
- manutenção.

Esta skill não substitui:

- `PROJECT_DIRECTION.md`;
- `DECISIONS.md`;
- `AI_RULES.md`;
- `AGENTS.md`;
- `AI_CONTEXT.md`.

Em caso de conflito, respeitar a hierarquia documental definida em `AI_RULES.md`.

O código-fonte e o schema atual representam o estado real da implementação.

---

# 2. Princípio central

O backend deve ser:

- seguro;
- previsível;
- explícito;
- simples de entender;
- simples de testar;
- simples de operar;
- resistente a uso incorreto;
- independente de detalhes desnecessários de fornecedores.

A solução correta mais simples deve ser preferida.

Não criar arquitetura para problemas que ainda não existem.

Não aumentar abstração sem reduzir complexidade real.

Não esconder decisões importantes atrás de helpers genéricos.

---

# 3. Ordem de prioridades

Ao tomar decisões de backend, seguir esta ordem:

1. Segurança
2. Correção
3. Integridade dos dados
4. Clareza
5. Observabilidade
6. Testabilidade
7. Manutenibilidade
8. Desempenho
9. Conveniência de implementação

Desempenho nunca deve ser usado como justificativa para enfraquecer autorização, validação ou integridade.

Conveniência nunca deve ser usada como justificativa para ignorar limites de segurança.

---

# 4. Processo obrigatório antes de implementar

Antes de modificar backend:

1. Ler os documentos obrigatórios do projeto.
2. Identificar o fluxo funcional afetado.
3. Localizar os pontos de entrada.
4. Localizar a persistência relacionada.
5. Identificar os atores envolvidos.
6. Identificar as regras de autorização.
7. Identificar dados controlados pelo cliente.
8. Identificar efeitos externos.
9. Identificar caminhos de falha.
10. Identificar testes existentes.

Responder internamente:

- Quem pode executar esta operação?
- Sobre qual recurso?
- Em qual guild?
- Quais dados vêm do cliente?
- Quais dados devem ser consultados no servidor?
- O que pode ser modificado?
- Que efeito externo pode ocorrer?
- A operação pode ser repetida?
- Existe risco de IDOR?
- Existe risco de escalada de privilégio?
- Existe risco de inconsistência parcial?
- Existe risco de vazamento de dados?

Não começar pela implementação visual ou pelo caminho de sucesso.

Começar pelas fronteiras de confiança.

---

# 5. Fronteiras de confiança

Todo dado vindo de fora do processo atual deve ser considerado não confiável.

Isso inclui:

- formulário;
- parâmetros de URL;
- cookies;
- headers;
- payloads JSON;
- IDs enviados pelo frontend;
- dados de webhook;
- eventos do Discord;
- variáveis de ambiente;
- respostas de serviços externos;
- conteúdo armazenado anteriormente;
- valores recuperados de cache;
- valores enviados por outros processos.

Validação de tipo não equivale a autorização.

Um identificador válido ainda pode apontar para um recurso que o usuário não tem permissão para acessar.

Nunca confiar em:

- `guildId` vindo do frontend;
- `userId` vindo do frontend;
- cargo informado pelo cliente;
- flags de administrador enviadas pelo cliente;
- propriedade de recurso afirmada pelo cliente;
- estado visual como prova de permissão;
- ausência de um botão como mecanismo de segurança.

Toda autorização deve ser verificada novamente no servidor.

---

# 6. Autenticação e autorização

## 6.1 Autenticação

Autenticação responde:

> Quem está realizando a operação?

A identidade deve ser obtida de uma fonte confiável no servidor.

Nunca aceitar o identificador do usuário como prova de identidade quando ele vier da requisição.

Uma operação autenticada deve falhar de forma explícita quando:

- não existe sessão;
- a sessão expirou;
- a sessão está inválida;
- a identidade não pode ser confirmada.

---

## 6.2 Autorização

Autorização responde:

> Esta identidade pode executar esta ação sobre este recurso?

Toda operação protegida deve validar:

- identidade;
- função ou papel;
- guild;
- associação entre usuário e guild;
- propriedade do recurso;
- escopo da operação;
- estado atual do recurso.

Não centralizar autorização apenas na interface.

Não autorizar apenas porque o usuário conhece o ID do recurso.

Não usar consulta direta pelo ID quando a consulta puder ser restringida pelo escopo autorizado.

Preferir:

```text
buscar recurso por:
- resourceId
- guildId autorizado
- ownerId ou relação autorizada
```

em vez de:

```text
buscar recurso apenas por resourceId
e verificar depois de forma inconsistente
```

---

## 6.3 Allowlist de operadores

Operações administrativas devem exigir uma regra explícita de operador autorizado.

A allowlist:

- deve ser validada no servidor;
- não deve depender apenas da interface;
- não deve ficar duplicada em diversos arquivos;
- não deve aceitar valores vazios silenciosamente;
- deve falhar de forma segura;
- deve ser testada nos caminhos permitido e negado.

A ausência ou configuração inválida da allowlist não deve liberar acesso.

---

## 6.4 Autorização por guild

Todo recurso associado a uma guild deve ser acessado dentro do escopo dessa guild.

Antes de ler ou modificar um recurso:

1. autenticar o usuário;
2. validar a guild solicitada;
3. confirmar que o usuário pode operar nessa guild;
4. confirmar que o recurso pertence à mesma guild;
5. executar a operação.

Nunca permitir que:

- um operador de uma guild leia dados de outra;
- um operador de uma guild modifique dados de outra;
- um ID válido atravesse o limite entre guilds;
- um recurso sem guild seja assumido como global sem decisão arquitetural.

---

## 6.5 Prevenção de IDOR

Toda operação que recebe um identificador deve ser analisada para IDOR.

Exemplos:

- editar hub;
- excluir hub;
- alterar canal;
- modificar configuração;
- visualizar dados privados;
- executar uma ação em nome de uma guild;
- recuperar registros pelo ID.

Uma proteção correta exige verificar a relação entre:

- usuário;
- guild;
- recurso;
- permissão;
- operação.

A existência do recurso não implica autorização.

---

# 7. Onde a lógica deve ficar

## 7.1 Server Components

Usar Server Components para:

- leitura de dados destinada à renderização;
- composição inicial de páginas;
- carregamento de contexto no servidor;
- redução de JavaScript no cliente.

Não colocar mutações em Server Components.

Não usar Server Components como substituto de uma camada de serviço quando a lógica é reutilizada.

---

## 7.2 Server Actions

Usar Server Actions quando:

- a operação nasce de uma interface do próprio produto;
- a ação é uma mutação do servidor;
- não há necessidade de uma API pública;
- o fluxo se beneficia da integração com formulários ou revalidação;
- autenticação e autorização podem ser aplicadas no servidor.

Toda Server Action deve:

1. autenticar;
2. validar a entrada;
3. autorizar;
4. executar a regra de negócio;
5. persistir;
6. tratar efeitos externos;
7. retornar um resultado previsível;
8. registrar falhas relevantes.

Não colocar regras complexas diretamente na Action.

A Action deve coordenar, não concentrar toda a lógica.

---

## 7.3 Route Handlers

Usar Route Handlers para:

- endpoints consumidos por integrações;
- webhooks;
- APIs externas;
- comunicação entre processos;
- downloads;
- respostas que precisam de controle HTTP explícito;
- operações não ligadas diretamente a uma interface interna.

Não criar uma API HTTP interna apenas para o frontend chamar o próprio backend quando uma Server Action ou Server Component resolver corretamente.

Não duplicar a mesma regra em Server Action e Route Handler.

Ambos devem chamar uma função de domínio ou serviço compartilhado.

---

## 7.4 Serviços

Criar serviços quando existe:

- regra reutilizada;
- fluxo com múltiplas etapas;
- integração externa;
- coordenação entre banco e Discord;
- lógica difícil de testar dentro do ponto de entrada;
- necessidade clara de separar regra de transporte.

Um serviço deve ter responsabilidade clara.

Evitar arquivos genéricos como:

- `helpers.ts`;
- `utils.ts`;
- `common.ts`;
- `service.ts` sem domínio definido.

Preferir nomes que expressem intenção:

- `authorizeGuildOperation`;
- `createVoiceHub`;
- `reconcileTemporaryChannels`;
- `deleteGuildConfiguration`;
- `updateHubSettings`.

---

## 7.5 Camada de domínio

Não criar uma camada de domínio abstrata apenas para imitar arquiteturas complexas.

Introduzir objetos, entidades ou casos de uso formais somente quando reduzirem complexidade real.

O Clutch Hub deve favorecer funções pequenas, explícitas e testáveis.

---

# 8. Estrutura de uma operação de backend

Uma operação típica deve seguir:

```text
entrada
↓
autenticação
↓
validação
↓
autorização
↓
leitura do estado atual
↓
regra de negócio
↓
persistência
↓
efeitos externos
↓
revalidação ou resposta
↓
observabilidade
```

A ordem pode variar quando necessário, mas a decisão deve ser consciente.

Nunca executar efeito externo sensível antes de confirmar autorização.

Nunca persistir parcialmente sem analisar como recuperar ou reconciliar.

---

# 9. Validação

## 9.1 Princípios

Validar toda entrada externa.

A validação deve cobrir:

- tipo;
- formato;
- limites;
- obrigatoriedade;
- enum;
- comprimento;
- valores vazios;
- IDs;
- coerência entre campos;
- estado permitido;
- relações entre recursos.

Não confiar apenas em TypeScript.

TypeScript não valida dados em runtime.

---

## 9.2 Schemas

Preferir schemas reutilizáveis quando a mesma entrada aparece em mais de um ponto.

Os schemas devem ficar próximos do domínio ao qual pertencem.

Evitar um único arquivo global com todos os schemas da aplicação.

Os erros de validação devem ser:

- previsíveis;
- seguros;
- úteis para a interface;
- sem exposição de detalhes internos.

---

## 9.3 Normalização

Quando apropriado, normalizar antes de persistir:

- remover espaços desnecessários;
- tratar strings vazias;
- padronizar identificadores;
- padronizar caixas quando o domínio permitir;
- limitar listas;
- remover duplicatas;
- validar URLs;
- validar nomes de canais conforme regras aplicáveis.

Normalização não deve alterar silenciosamente dados significativos.

---

# 10. Regras de negócio

Regras de negócio devem ser explícitas.

Evitar que regras importantes existam apenas como consequência de:

- estrutura de componente;
- condição em JSX;
- filtro de consulta;
- nome de variável;
- comportamento implícito do banco;
- comportamento acidental do Discord.

Quando uma regra for importante, ela deve aparecer em:

- código legível;
- teste;
- documentação apropriada;
- ADR, quando for uma decisão arquitetural.

Não misturar regra de negócio com formatação de resposta.

---

# 11. Prisma

## 11.1 Uso geral

Usar Prisma como camada principal de acesso ao banco enquanto essa continuar sendo a decisão do projeto.

Preferir consultas explícitas.

Selecionar somente dados necessários quando isso melhorar segurança ou clareza.

Evitar carregar grafos grandes por conveniência.

---

## 11.2 Consultas autorizadas

Sempre que possível, incorporar o escopo de autorização à consulta.

Preferir consultas que expressem:

- ID do recurso;
- guild autorizada;
- proprietário;
- relação permitida.

Isso reduz a chance de esquecer uma verificação posterior.

---

## 11.3 Transações

Usar transações quando múltiplas operações de banco precisam ser atômicas.

Exemplos:

- criar recurso e configurações relacionadas;
- atualizar várias tabelas que representam uma única operação;
- excluir um agregado;
- mover dados entre estados dependentes.

Não usar transações longas enquanto aguarda chamadas externas.

Chamadas ao Discord ou outro serviço não devem permanecer dentro de uma transação de banco aberta.

---

## 11.4 Upsert

Usar `upsert` apenas quando a semântica de criar ou atualizar o mesmo recurso for realmente desejada.

Não usar `upsert` para esconder ausência inesperada de dados.

---

## 11.5 Exclusão

Antes de excluir:

- confirmar autorização;
- analisar relacionamentos;
- analisar cascatas;
- analisar registros órfãos;
- analisar efeitos externos;
- analisar necessidade de auditoria;
- analisar possibilidade de recuperação.

Não introduzir exclusão lógica sem necessidade clara.

Não usar exclusão física automaticamente quando o domínio exigir histórico.

---

## 11.6 Erros Prisma

Não expor mensagens internas do Prisma ao usuário.

Mapear erros conhecidos para respostas previsíveis.

Falhas inesperadas devem ser registradas com contexto seguro.

Nunca registrar:

- `DATABASE_URL`;
- credenciais;
- tokens;
- cookies;
- segredos;
- conteúdo privado desnecessário.

---

# 12. PostgreSQL

## 12.1 Portabilidade

Preferir recursos nativos e amplamente suportados pelo PostgreSQL.

Evitar acoplamento ao provedor.

Não introduzir recurso proprietário do Supabase ou de outro serviço sem decisão explícita.

---

## 12.2 Integridade

Usar o banco para proteger invariantes quando apropriado:

- chaves estrangeiras;
- unicidade;
- campos obrigatórios;
- índices;
- constraints;
- defaults;
- relações.

A validação da aplicação não substitui integridade no banco.

A integridade do banco não substitui mensagens de erro adequadas na aplicação.

---

## 12.3 Índices

Adicionar índices quando houver evidência de necessidade por:

- padrão de consulta;
- volume esperado;
- chave estrangeira relevante;
- ordenação ou filtro frequente;
- análise de plano de execução.

Não adicionar índices indiscriminadamente.

Todo índice tem custo de armazenamento e escrita.

---

## 12.4 SQL manual

Usar SQL manual quando:

- Prisma não expressa bem a operação;
- existe necessidade comprovada de desempenho;
- é necessário usar uma funcionalidade PostgreSQL adequada;
- o SQL é mais claro que uma abstração complexa.

SQL manual deve ser:

- parametrizado;
- revisado;
- testado;
- documentado;
- protegido contra injeção.

---

# 13. Migrations

Toda alteração de schema deve possuir migration.

Não editar migrations já aplicadas sem uma razão excepcional e explicitamente documentada.

Antes de criar migration:

- entender o estado atual;
- analisar dados existentes;
- analisar nulabilidade;
- analisar defaults;
- analisar compatibilidade;
- analisar rollback operacional;
- analisar implantação.

Mudanças destrutivas exigem cuidado especial.

Exemplos:

- remoção de coluna;
- alteração de tipo;
- inclusão de `NOT NULL`;
- mudança de chave;
- mudança de unicidade;
- cascata de exclusão.

Quando necessário, usar implantação em etapas:

1. adicionar estrutura compatível;
2. migrar dados;
3. atualizar aplicação;
4. validar;
5. remover estrutura antiga.

Nunca executar migration fora do escopo autorizado.

---

# 14. Integração com Discord

## 14.1 Princípios

O Discord é um sistema externo.

Sua disponibilidade, estado e resposta não são controlados pelo Clutch Hub.

Toda integração deve considerar:

- latência;
- rate limit;
- indisponibilidade;
- recurso removido manualmente;
- permissão revogada;
- guild removida;
- canal removido;
- papel removido;
- evento duplicado;
- evento fora de ordem;
- reinício do bot;
- estado local desatualizado.

---

## 14.2 IDs Discord

IDs do Discord devem ser tratados como identificadores externos.

Validar formato quando apropriado.

Não assumir que um ID ainda existe.

Não assumir que o bot ainda possui acesso ao recurso.

---

## 14.3 Efeitos externos

Uma operação com banco e Discord pode falhar parcialmente.

Sempre definir:

- qual sistema é a fonte de verdade;
- o que acontece se o Discord falhar depois do banco;
- o que acontece se o banco falhar depois do Discord;
- como reconciliar;
- se a operação pode ser repetida;
- se existe compensação segura.

---

## 14.4 Idempotência

Eventos e operações externas devem ser idempotentes quando houver risco de repetição.

Executar a mesma ação duas vezes não deve:

- criar dois recursos equivalentes;
- duplicar registros;
- gerar estado inconsistente;
- remover recurso incorreto;
- aplicar a mesma transição repetidamente.

---

## 14.5 Rate limits

Não criar loops agressivos de chamadas à API.

Evitar consultas repetidas quando o estado já está disponível no evento ou cache confiável.

Tratar rate limits de maneira previsível.

Não esconder falhas de rate limit.

---

# 15. Persistência e reconciliação

Estado importante não deve existir apenas em memória quando precisa sobreviver a:

- reinício;
- deploy;
- falha;
- múltiplas instâncias;
- atualização do bot.

Para recursos temporários, definir:

- registro persistido;
- estado esperado;
- estado real;
- regra de expiração;
- regra de limpeza;
- regra de reconciliação;
- comportamento após reinício.

A reconciliação deve ser segura para repetição.

Um processo de reconciliação deve:

1. consultar estado esperado;
2. consultar ou receber estado real;
3. comparar;
4. corrigir diferenças seguras;
5. registrar anomalias;
6. não destruir recursos ambíguos sem confirmação suficiente.

---

# 16. Tratamento de erros

## 16.1 Categorias

Distinguir pelo menos:

- erro de autenticação;
- erro de autorização;
- erro de validação;
- recurso não encontrado;
- conflito de estado;
- erro externo;
- erro de persistência;
- erro inesperado.

---

## 16.2 Respostas

Retornos internos devem possuir formato previsível.

Não retornar mensagens arbitrárias diferentes em cada função.

Uma operação deve permitir que a interface diferencie:

- sucesso;
- entrada inválida;
- acesso negado;
- conflito;
- indisponibilidade;
- falha inesperada.

---

## 16.3 Segurança de mensagens

Mensagens ao usuário não devem expor:

- stack trace;
- SQL;
- detalhes de schema;
- tokens;
- nomes de variáveis secretas;
- estrutura interna;
- credenciais;
- detalhes desnecessários de autorização.

Logs internos podem conter mais contexto, mas ainda devem proteger dados sensíveis.

---

## 16.4 Falhar de forma segura

Na dúvida, negar a operação.

Configuração ausente de segurança não deve liberar acesso.

Erro ao verificar permissão não deve ser interpretado como permissão concedida.

---

# 17. Logging e observabilidade

Logs devem ajudar a responder:

- o que aconteceu;
- quando aconteceu;
- qual operação falhou;
- qual recurso foi afetado;
- qual guild estava envolvida;
- qual etapa falhou;
- se a falha veio do banco ou do Discord.

Não registrar mais dados do que o necessário.

Preferir logs estruturados.

Incluir identificadores de correlação quando um fluxo atravessa múltiplas etapas.

Distinguir:

- debug;
- informação operacional;
- aviso;
- erro.

Não usar `console.log` indiscriminadamente como estratégia permanente.

---

# 18. Auditoria

Operações críticas podem exigir trilha de auditoria.

Exemplos:

- alteração de configuração;
- exclusão de recurso;
- mudança administrativa;
- mudança de autorização;
- operação executada por operador;
- ação destrutiva;
- reconciliação automática relevante.

Uma trilha de auditoria deve registrar apenas o necessário:

- ator;
- ação;
- recurso;
- guild;
- data;
- resultado;
- metadados seguros.

Não confundir auditoria com logs de depuração.

---

# 19. Segurança

## 19.1 Princípios

Aplicar defesa em profundidade.

Uma proteção não deve depender de apenas uma camada.

Exemplos de camadas:

- autenticação;
- autorização;
- validação;
- escopo de consulta;
- constraints;
- configuração segura;
- rate limiting;
- auditoria;
- testes.

---

## 19.2 Segredos

Nunca:

- versionar segredos;
- imprimir segredos;
- incluir segredos em `AI_HANDOFF.md`;
- enviar segredos para MCPs;
- enviar dados privados para ferramentas externas;
- colocar tokens em logs;
- retornar variáveis de ambiente ao cliente.

---

## 19.3 Variáveis de ambiente

Validar variáveis necessárias no início do processo ou no primeiro uso controlado.

Falhar com mensagem operacional clara quando uma variável obrigatória estiver ausente.

Não criar fallback inseguro.

---

## 19.4 Injeção

Toda consulta manual deve ser parametrizada.

Não concatenar dados externos em:

- SQL;
- comandos;
- caminhos;
- URLs sensíveis;
- filtros interpretados;
- conteúdo executável.

---

## 19.5 CSRF e origem

Operações mutáveis expostas por HTTP devem respeitar os mecanismos de proteção do framework e a arquitetura escolhida.

Não desabilitar proteções de origem sem análise.

---

## 19.6 SSRF

Ao aceitar URLs:

- validar protocolo;
- restringir destinos quando necessário;
- impedir acesso a redes internas;
- impedir esquemas não esperados;
- definir timeout;
- limitar tamanho de resposta.

---

## 19.7 Uploads

Caso uploads sejam adicionados futuramente:

- validar tipo real;
- validar tamanho;
- gerar nomes seguros;
- evitar execução;
- limitar acesso;
- não confiar apenas na extensão;
- analisar armazenamento e expiração.

---

# 20. Concorrência

Operações podem acontecer simultaneamente.

Analisar:

- criação duplicada;
- atualização perdida;
- exclusão durante uso;
- evento concorrente;
- dois operadores alterando o mesmo recurso;
- múltiplas instâncias do bot;
- retry de integração externa.

Usar:

- constraints;
- transações;
- atualizações condicionais;
- idempotência;
- locks quando realmente necessários;
- reconciliação.

Não resolver concorrência apenas com checagem anterior:

```text
verificar se não existe
↓
criar
```

Esse padrão pode falhar sob concorrência sem constraint ou operação atômica.

---

# 21. Cache

Não introduzir cache sem necessidade comprovada.

Antes de criar cache, definir:

- o que está sendo armazenado;
- por quanto tempo;
- quem invalida;
- qual é a fonte de verdade;
- o impacto de dado obsoleto;
- se o dado possui escopo por usuário ou guild;
- se existe risco de vazamento entre tenants.

Nunca armazenar resultado autorizado de uma guild e reutilizar em outra sem chave de escopo correta.

Não usar cache para esconder consulta mal modelada antes de investigar.

---

# 22. Desempenho

Otimizar com evidência.

Priorizar:

- consultas corretas;
- seleção de campos necessária;
- ausência de N+1;
- índices relevantes;
- redução de chamadas externas;
- limites;
- paginação;
- operações em lote seguras.

Não sacrificar legibilidade por micro-otimizações.

Não carregar listas ilimitadas.

Toda listagem potencialmente crescente deve considerar:

- paginação;
- limite;
- ordenação estável;
- filtros;
- tamanho máximo.

---

# 23. Jobs e tarefas assíncronas

Criar jobs quando uma operação:

- não precisa concluir durante a requisição;
- pode demorar;
- precisa de retry;
- processa vários registros;
- depende de serviço instável;
- executa manutenção;
- realiza reconciliação.

Não introduzir fila ou worker apenas por preferência arquitetural.

Antes de adicionar infraestrutura, comprovar necessidade.

Todo job deve considerar:

- idempotência;
- retry;
- timeout;
- limite;
- observabilidade;
- concorrência;
- falha permanente;
- reprocessamento.

---

# 24. Testes

## 24.1 O que testar

Toda mudança de backend relevante deve testar:

- caminho permitido;
- caminho negado;
- entrada inválida;
- recurso inexistente;
- recurso de outra guild;
- estado conflitante;
- falha externa relevante;
- comportamento idempotente, quando aplicável.

---

## 24.2 Autorização

Testes de autorização não podem verificar apenas o caminho de sucesso.

Para cada operação protegida, considerar:

- usuário sem sessão;
- usuário fora da allowlist;
- usuário sem acesso à guild;
- recurso de outra guild;
- recurso próprio;
- operador permitido;
- configuração ausente.

---

## 24.3 Unidade

Usar testes unitários para:

- validação;
- regras de negócio;
- decisões;
- transformação de dados;
- autorização pura;
- reconciliação;
- tratamento de estados.

---

## 24.4 Integração

Usar testes de integração para:

- Prisma;
- transações;
- constraints;
- Server Actions;
- Route Handlers;
- persistência;
- fluxos entre camadas.

---

## 24.5 E2E

Usar testes E2E para fluxos críticos do usuário.

Não substituir testes de backend por testes visuais frágeis.

---

## 24.6 Mocks

Mocks devem representar contratos reais.

Não criar mocks tão permissivos que escondam falhas.

Integrações com Discord devem testar:

- sucesso;
- recurso ausente;
- permissão negada;
- rate limit;
- falha transitória;
- resposta inesperada.

---

# 25. Revisão de código

Antes de concluir uma alteração de backend, revisar:

## Segurança

- autenticação está presente?
- autorização está presente?
- autorização está no servidor?
- a guild foi validada?
- existe risco de IDOR?
- dados externos foram validados?
- segredos foram protegidos?
- o padrão falha de forma segura?

## Dados

- a consulta está corretamente limitada?
- existe risco de vazamento entre guilds?
- a operação precisa de transação?
- constraints são necessárias?
- existe risco de duplicação?
- existe risco de estado parcial?
- migrations são seguras?

## Arquitetura

- a lógica está na camada correta?
- a função possui responsabilidade clara?
- existe duplicação?
- uma abstração foi criada cedo demais?
- uma dependência nova é realmente necessária?
- a solução segue decisões existentes?

## Integrações

- a falha do Discord foi considerada?
- a operação é idempotente?
- há risco de rate limit?
- o estado pode ser reconciliado?
- o processo sobrevive a reinício?

## Erros

- erros esperados são tratados?
- mensagens são seguras?
- falhas inesperadas são registradas?
- a interface recebe um resultado previsível?

## Testes

- caminho permitido foi testado?
- caminho negado foi testado?
- entrada inválida foi testada?
- IDOR foi testado?
- falha externa foi testada quando relevante?
- os testes foram realmente executados?

---

# 26. Dependências

Não adicionar dependência sem justificar:

- problema resolvido;
- alternativas consideradas;
- maturidade;
- manutenção;
- licença;
- custo;
- impacto no bundle ou runtime;
- impacto operacional;
- risco de lock-in;
- impacto de segurança.

Preferir recursos da plataforma e dependências já existentes quando forem adequados.

Não instalar biblioteca para resolver poucas linhas claras de código.

Não reimplementar criptografia, autenticação ou parsing de segurança quando existir solução confiável e adequada.

---

# 27. Refatorações

Refatorações devem ser limitadas ao necessário para a tarefa.

Não aproveitar uma correção para reescrever módulos inteiros.

Separar refatorações grandes de mudanças funcionais quando possível.

Preservar comportamento existente, exceto quando a tarefa exigir mudança.

Toda refatoração deve melhorar pelo menos um destes pontos:

- clareza;
- segurança;
- testabilidade;
- redução de duplicação;
- separação de responsabilidade;
- confiabilidade.

---

# 28. Compatibilidade

Antes de usar uma API do framework ou biblioteca:

- confirmar a versão instalada;
- consultar documentação compatível;
- não assumir comportamento da versão mais recente;
- não copiar exemplos incompatíveis;
- registrar limitações relevantes.

Não atualizar Next.js, Prisma, Discord.js ou outra dependência estrutural dentro de uma tarefa não relacionada.

---

# 29. Documentação

Atualizar documentação quando a alteração modificar:

- arquitetura;
- regra de negócio;
- fluxo operacional;
- modelo de dados;
- autorização;
- requisito de ambiente;
- integração;
- decisão permanente.

Usar ADR quando houver uma decisão arquitetural relevante.

Não registrar no ADR detalhes temporários de implementação.

Atualizar `AI_CONTEXT.md` quando o estado atual do projeto mudar.

Sobrescrever `AI_HANDOFF.md` conforme as regras do projeto ao concluir a fase.

---

# 30. O que nunca fazer

Nunca:

- confiar em IDs enviados pelo cliente;
- autorizar apenas pela interface;
- permitir acesso apenas porque o recurso existe;
- retornar registros de outra guild;
- esconder erro crítico;
- engolir exceções silenciosamente;
- expor erro interno ao usuário;
- registrar segredos;
- executar migration fora do escopo;
- alterar schema sem migration;
- misturar chamadas externas longas em transações;
- introduzir dependência sem justificativa;
- criar abstração sem necessidade;
- declarar testes aprovados sem executá-los;
- declarar autorização segura sem testar negações;
- usar Graphify, MCP ou registry como fonte de verdade;
- instalar código externo sem revisão;
- modificar regras de negócio silenciosamente;
- transformar configuração ausente em permissão concedida;
- assumir que o estado em memória sobreviverá a reinício.

---

# 31. Processo obrigatório após implementar

Após qualquer alteração de backend:

1. Revisar o diff.
2. Verificar arquivos fora do escopo.
3. Executar lint.
4. Executar testes.
5. Executar build quando aplicável.
6. Validar Prisma quando aplicável.
7. Revisar caminhos de autorização.
8. Revisar risco de IDOR.
9. Revisar logs e mensagens de erro.
10. Confirmar ausência de segredos.
11. Atualizar documentação necessária.
12. Atualizar `AI_HANDOFF.md`.

Não afirmar que uma verificação foi concluída sem executá-la.

Quando uma verificação não puder ser executada, registrar claramente:

- qual;
- por que;
- impacto;
- risco restante.

---

# 32. Checklist mínimo para toda operação mutável

Antes de considerar uma operação pronta, confirmar:

- [ ] A identidade é obtida no servidor.
- [ ] A entrada possui validação de runtime.
- [ ] A guild é validada.
- [ ] O recurso pertence ao escopo autorizado.
- [ ] IDOR foi analisado.
- [ ] O estado atual foi verificado.
- [ ] A regra de negócio está explícita.
- [ ] Erros esperados possuem retorno previsível.
- [ ] Falhas inesperadas são registradas com segurança.
- [ ] Não há vazamento de dados.
- [ ] Concorrência foi considerada.
- [ ] Efeitos externos foram considerados.
- [ ] A operação é idempotente quando necessário.
- [ ] Testes de sucesso e negação existem.
- [ ] O diff foi revisado.
- [ ] As verificações técnicas foram executadas.

---

# 33. Critério de conclusão

Uma alteração de backend está concluída somente quando:

- resolve o problema solicitado;
- respeita o escopo;
- aplica autenticação e autorização corretas;
- protege o isolamento entre guilds;
- valida entrada externa;
- mantém integridade dos dados;
- trata falhas previsíveis;
- possui testes adequados;
- passa nas verificações técnicas;
- não adiciona complexidade desnecessária;
- está documentada quando necessário.

O objetivo não é apenas fazer funcionar.

O objetivo é fazer funcionar de maneira segura, previsível e sustentável.