# Guia de Instalação e Publicação do Discord Hub em VPS

## Visão geral

Este documento explica como instalar, configurar, publicar e atualizar o **Discord Hub** em uma VPS Linux.

A plataforma utiliza:

- Next.js
- Bot Discord com Discord.js
- Prisma
- Banco de dados configurado via `DATABASE_URL`
- PM2
- Nginx
- SSL com Certbot

Estrutura esperada do projeto:

discord-hub/
├── bot/
│   ├── api.js
│   ├── deploycommands.js
│   ├── index.js
│   └── voice-hubs.js
├── prisma/
│   └── schema.prisma
├── src/
├── package.json
├── package-lock.json
├── .env
└── next.config.js


---

# 1. Requisitos da VPS

A VPS precisa ter:

- Ubuntu ou Debian
- Acesso SSH como `root` ou usuário com `sudo`
- Domínio apontado para o IP da VPS
- Banco de dados acessível pela VPS
- Portas `80` e `443` liberadas
- Repositório do projeto no GitHub

Entre na VPS:

ssh root@IP_DA_SUA_VPS

Atualize o sistema:

apt update && apt upgrade -y

Instale os pacotes básicos:

apt install -y git curl nginx openssl

---

# 2. Instalar Node.js

Instale uma versão LTS do Node.js:

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

Valide a instalação:

node -v
npm -v

Resultado esperado:


v22.x.x
10.x.x

---

# 3. Instalar PM2

O PM2 mantém a aplicação online mesmo quando a sessão SSH é fechada ou a VPS é reiniciada.

npm install -g pm2

Confira a versão instalada:

pm2 -v

---

# 4. Clonar o projeto do GitHub

Entre na pasta principal:

cd /root

Clone o repositório:

git clone https://github.com/SEU_USUARIO/discord-hub.git

Entre na pasta do projeto:

cd /root/discord-hub

Confira os arquivos:

ls

Resultado esperado:

bot
prisma
src
package.json
package-lock.json

---

# 5. Instalar dependências

Dentro da pasta do projeto:

cd /root/discord-hub
npm install




Se o `package-lock.json` estiver sincronizado com o GitHub, utilize:

npm ci




---

# 6. Criar o arquivo `.env`

## Caminho do arquivo


/root/discord-hub/.env




Crie ou edite o arquivo:

nano /root/discord-hub/.env




Cole o conteúdo abaixo e substitua todos os valores pelos dados reais:


env
Copiar

DATABASE_URL="SUA_URL_DO_BANCO_DE_DADOS"

AUTH_SECRET="UM_SEGREDO_FORTE_E_ALEATORIO"
AUTH_URL="https://discord-hub.seudominio.com.br"
AUTH_TRUST_HOST=true

DISCORD_CLIENT_ID="SEU_DISCORD_CLIENT_ID"
DISCORD_CLIENT_SECRET="SEU_DISCORD_CLIENT_SECRET"
DISCORD_BOT_TOKEN="SEU_TOKEN_DO_BOT"
DISCORD_BOT_INVITE_URL="SUA_URL_DE_CONVITE_DO_BOT"

BOT_API_SECRET="UM_SEGREDO_INTERNO_FORTE"
BOT_API_PORT=2829

PORT=2828




Salve no Nano:


Ctrl + O
Enter
Ctrl + X




## Gerar segredos seguros

Execute:

openssl rand -base64 32




Use um resultado para `AUTH_SECRET` e outro diferente para `BOT_API_SECRET`.

> Nunca envie o arquivo `.env` ao GitHub. Ele contém tokens, senhas e segredos privados.

---

# 7. Configurar o Discord Developer Portal

Acesse o Discord Developer Portal e abra a aplicação vinculada ao bot.

## Configurar URL de redirecionamento

Na área **OAuth2**, adicione:


https://discord-hub.seudominio.com.br/api/auth/callback/discord




Essa URL deve usar exatamente o mesmo domínio configurado em:


env
Copiar

AUTH_URL="https://discord-hub.seudominio.com.br"




## Permissões do bot

O link de convite do bot precisa incluir os escopos:


bot
applications.commands




Permissões recomendadas:

- Ver Canais
- Enviar Mensagens
- Gerenciar Canais
- Gerenciar Cargos
- Criar Convites
- Conectar
- Falar
- Mover Membros
- Usar Comandos de Aplicação

## Intents do bot

Na área **Bot**, habilite os intents necessários:

- Server Members Intent
- Presence Intent, se utilizado
- Message Content Intent, se utilizado

O recurso de canais temporários exige que o bot tenha a intent:


GuildVoiceStates




---

# 8. Aplicar Prisma em produção

> Não use `prisma migrate dev` na VPS.

Na produção, execute:

cd /root/discord-hub
npx prisma migrate deploy




Depois gere o Prisma Client:

npx prisma generate




Resultado esperado:


Generated Prisma Client




---

# 9. Gerar o build da aplicação

Execute:

cd /root/discord-hub
npm run build




Resultado esperado:


Compiled successfully
Generating static pages
Finalizing page optimization




Caso apareça erro relacionado ao Prisma:

cd /root/discord-hub
npx prisma generate
npm run build




---

# 10. Registrar comandos do Discord

Sempre que houver criação ou alteração de Slash Commands:

cd /root/discord-hub
node bot/deploycommands.js




Resultado esperado:


Comandos registrados com sucesso




---

# 11. Iniciar a plataforma com PM2

Inicie o projeto:

cd /root/discord-hub
pm2 start npm --name discord-hub -- start




Confira o status:

pm2 status




Resultado esperado:


discord-hub    online




Veja os logs:

pm2 logs discord-hub --lines 100




Resultado esperado:


API interna do bot rodando em http://127.0.0.1:2829
Bot conectado como NOME_DO_BOT




Para sair dos logs sem parar a aplicação:


Ctrl + C




---

# 12. Configurar reinicialização automática

Execute:

pm2 startup




O PM2 mostrará um comando específico. Copie e execute o comando exibido.

Depois salve os processos atuais:

pm2 save




Resultado esperado:


Successfully saved




---

# 13. Configurar Nginx

Crie o arquivo:

nano /etc/nginx/sites-available/discord-hub




Cole o conteúdo abaixo e substitua o domínio:


nginx
Copiar

server {
    listen 80;
    server_name discord-hub.seudominio.com.br;

    location / {
        return 301 https://$host$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name discord-hub.seudominio.com.br;

    ssl_certificate /etc/letsencrypt/live/discord-hub.seudominio.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/discord-hub.seudominio.com.br/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:2828;
        proxy_http_version 1.1;

        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Port $server_port;

        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}




Ative a configuração:

ln -s /etc/nginx/sites-available/discord-hub /etc/nginx/sites-enabled/discord-hub




Valide o Nginx:

nginx -t




Resultado esperado:


syntax is ok
test is successful




Recarregue o serviço:

systemctl reload nginx




---

# 14. Configurar certificado SSL

Instale o Certbot:

apt install -y certbot python3-certbot-nginx




Gere o certificado:

certbot --nginx -d discord-hub.seudominio.com.br




Teste a renovação:

certbot renew --dry-run




---

# 15. Validar a API interna do bot

A API interna do bot deve operar apenas localmente na VPS.

A porta usada neste projeto é:


2829




Teste a listagem de servidores conectados:

cd /root/discord-hub
./node_modules/.bin/dotenv -e .env -- sh -c 'curl -i -sS "http://127.0.0.1:2829/guilds" -H "x-bot-secret: $BOT_API_SECRET"'




Resultado esperado:


HTTP/1.1 200 OK




Exemplo de resposta:


json
Copiar

[
  {
    "id": "ID_DO_SERVIDOR",
    "name": "Nome do Servidor",
    "icon": "URL_DO_ICONE",
    "memberCount": 6
  }
]




> Se retornar `unauthorized`, o terminal SSH não carregou automaticamente as variáveis do `.env`. Use exatamente o comando acima.

---

# 16. Validar rotas de canais temporários

Confira se a API contém as rotas necessárias:

cd /root/discord-hub
grep -nE 'app\.(get|post|patch|delete).*guilds|voice-channels|roles' bot/api.js




Resultado esperado:


GET /guilds
GET /guilds/:guildId/roles
POST /guilds/:guildId/voice-channels
PATCH /guilds/:guildId/voice-channels/:channelId
DELETE /guilds/:guildId/voice-channels/:channelId
DELETE /guilds/:id




Essas rotas permitem:

- Listar servidores conectados
- Buscar cargos do servidor
- Criar o canal Hub
- Renomear o Hub
- Excluir o Hub
- Remover o bot de um servidor

---

# 17. Validar o painel

Abra no navegador:


https://discord-hub.seudominio.com.br




Valide os itens:


[ ] Login com Discord
[ ] Retorno ao painel após login
[ ] Dashboard carregando
[ ] Página de Servidores conectados
[ ] Conexão do bot a um servidor
[ ] Criação de Hub de voz
[ ] Edição de Hub de voz
[ ] Exclusão de Hub de voz
[ ] Entrada de membro no Hub
[ ] Criação de canal temporário
[ ] Exclusão automática de canal vazio
[ ] Aplicação de Templates
[ ] Remoção do bot de um servidor


---

# 18. Atualizar a plataforma no futuro

## No computador local

git status
git add .
git commit -m "feat: descricao da atualizacao"
git push origin main




## Na VPS

Confira se existem alterações locais:

cd /root/discord-hub
git status




Baixe a versão mais recente:

git pull --ff-only origin main




Atualize dependências:

npm install




Aplique migrations apenas se houve alteração no banco:

npx prisma migrate deploy

Gere o Prisma Client:

npx prisma generate

Gere o build:

npm run build

Reinicie a aplicação:

pm2 restart discord-hub --update-env

Confira os logs:

pm2 logs discord-hub --lines 100

---

# 19. Atualização rápida sem alteração de banco

cd /root/discord-hub
git pull --ff-only origin main
npm install
npx prisma generate
npm run build
pm2 restart discord-hub --update-env

---

# 20. Comandos úteis do PM2

Ver processos:
pm2 status

Ver logs:
pm2 logs discord-hub

Ver os últimos 100 logs:
pm2 logs discord-hub --lines 100

Reiniciar:
pm2 restart discord-hub --update-env

Parar temporariamente:
pm2 stop discord-hub

Iniciar novamente:
pm2 start discord-hub

Remover processo:
pm2 delete discord-hub

Salvar estado do PM2:
pm2 save

Atualizar PM2 se aparecer aviso de versão desatualizada:
pm2 update
pm2 save

---

# 21. Diagnóstico de problemas comuns

## Erro `UntrustedHost`

### Sintoma

UntrustedHost: Host must be trusted

### Verifique o `.env`

AUTH_URL="https://discord-hub.seudominio.com.br"
AUTH_TRUST_HOST=true

### Verifique o Nginx

O bloco `location /` precisa incluir:


proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
proxy_set_header X-Forwarded-Port $server_port;

Reinicie:

cd /root/discord-hub
pm2 restart discord-hub --update-env

---

## Erro `findMany` do Prisma

### Sintoma

TypeError: Cannot read properties of undefined (reading 'findMany')

### Correção

cd /root/discord-hub
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 restart discord-hub --update-env

---

## Erro `unauthorized` ao testar API com Curl

### Sintoma

{
  "error": "unauthorized"
}

### Correção

cd /root/discord-hub
./node_modules/.bin/dotenv -e .env -- sh -c 'curl -i -sS "http://127.0.0.1:2829/guilds" -H "x-bot-secret: $BOT_API_SECRET"'

---

## Erro `Unexpected token '<'`

### Sintoma

Unexpected token '<', "<!DOCTYPE "... is not valid JSON

### Causa

A aplicação esperava JSON da API interna, mas recebeu uma página HTML de erro, normalmente um `404`.

### Verificação

cd /root/discord-hub
grep -nE 'app\.(get|post|patch|delete).*guilds|voice-channels|roles' bot/api.js

Verifique se existem:

POST /guilds/:guildId/voice-channels
PATCH /guilds/:guildId/voice-channels/:channelId
DELETE /guilds/:guildId/voice-channels/:channelId

Depois de alterar `bot/api.js`:

cd /root/discord-hub
pm2 restart discord-hub --update-env

---

## Bot conectado, mas comandos não aparecem

Confira os logs:

pm2 logs discord-hub --lines 100


O resultado precisa conter:

Bot conectado como NOME_DO_BOT

Registre os comandos novamente:

cd /root/discord-hub
node bot/deploycommands.js




Verifique o token no `.env`:

DISCORD_BOT_TOKEN="SEU_TOKEN_DO_BOT"

---

## Bot conectado, mas canais temporários não são criados

Verifique se o código contém a lógica de voz:

cd /root/discord-hub
grep -nE "voiceStateUpdate|GuildVoiceStates|VoiceHub" bot/index.js

Resultado esperado:

GuildVoiceStates
registerVoiceHubHandlers

Também deve existir:

/root/discord-hub/bot/voice-hubs.js




Depois reinicie:

cd /root/discord-hub
pm2 restart discord-hub --update-env

---

## Git bloqueia o `pull` por alterações locais

### Sintoma

Your local changes to the following files would be overwritten by merge

### Verifique os arquivos alterados

cd /root/discord-hub
git status

### Faça backup antes de descartar alterações

mkdir -p /root/discord-hub-backup
cp bot/api.js /root/discord-hub-backup/api.js
cp bot/index.js /root/discord-hub-backup/index.js
cp package.json /root/discord-hub-backup/package.json


Depois restaure os arquivos rastreados e baixe a versão do GitHub:

git restore bot/api.js bot/index.js package.json
git pull --ff-only origin main

> Não execute `git restore` sem backup se não tiver certeza de que as alterações locais podem ser descartadas.

---

# 22. Arquivos importantes

| Arquivo | Responsabilidade |
|---|---|
| `.env` | Tokens, segredos, URLs, portas e banco de dados |
| `package.json` | Scripts e dependências |
| `bot/index.js` | Inicialização do bot Discord |
| `bot/api.js` | API interna usada pelo painel web |
| `bot/voice-hubs.js` | Criação e controle de canais temporários |
| `bot/deploycommands.js` | Registro dos comandos Slash |
| `prisma/schema.prisma` | Estrutura do banco de dados |
| `src/app/dashboard/servers/actions.js` | Comunicação do painel com API do bot |
| `src/app/dashboard/voice-channels` | Páginas e ações dos Hubs de voz |
| `/etc/nginx/sites-available/discord-hub` | Proxy reverso do domínio |
| `/root/.pm2/logs/discord-hub-out.log` | Logs normais do projeto |
| `/root/.pm2/logs/discord-hub-error.log` | Logs de erros do projeto |

---

# 23. Checklist final de produção

[ ] Domínio apontando para o IP da VPS
[ ] Certificado SSL ativo
[ ] Nginx validado com nginx -t
[ ] Arquivo .env configurado
[ ] AUTH_URL usando domínio público com HTTPS
[ ] AUTH_TRUST_HOST=true
[ ] Token do bot Discord configurado
[ ] URL de callback configurada no Discord Developer Portal
[ ] Prisma migrations aplicadas
[ ] Prisma Client gerado
[ ] Build concluído com npm run build
[ ] Comandos Discord registrados
[ ] PM2 com status online
[ ] PM2 salvo com pm2 save
[ ] PM2 configurado para iniciar com a VPS
[ ] Bot conectado ao Discord
[ ] API interna respondendo na porta 2829
[ ] Login Discord funcionando
[ ] Criação de Hub funcionando
[ ] Canais temporários funcionando
[ ] Templates funcionando

---

## Entrada de Log

- Data/hora: 2026-07-27
- Resumo do que foi feito:
  - Criado guia completo de instalação, publicação, configuração e manutenção do Discord Hub em VPS.
  - Incluídas instruções para Node.js, PM2, Nginx, SSL, Prisma, Discord Developer Portal, API interna do bot e atualização pelo GitHub.
  - Incluídos diagnósticos para problemas encontrados durante a publicação inicial.
- Arquivos criados/alterados:
  - `INSTALACAO_VPS.md`
- Decisões tomadas:
  - Next.js opera internamente na porta `2828`.
  - API interna do bot opera localmente na porta `2829`.
  - Nginx expõe somente o domínio público em HTTPS.
  - PM2 gerencia o processo completo com o comando `npm start`.
  - Atualizações de banco devem usar `npx prisma migrate deploy` em produção.
- Erros encontrados:
  - Nenhum durante a criação do documento.
- Como foi corrigido:
  - Não aplicável.
- Estado atual do build:
  - O documento cobre instalação inicial, configuração de produção, atualização contínua, validação e diagnóstico operacional.
- Próximo passo único:
  - Salvar este conteúdo no arquivo `INSTALACAO_VPS.md` na raiz do repositório.
