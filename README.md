Guia de Instalação e Publicação do Discord Hub em VPS

Visão geral

Este documento explica como instalar e publicar o Discord Hub em uma VPS Linux com:
Node.js
NPM
Git
PM2
Nginx
Banco de dados configurado via Prisma
Bot Discord
Aplicação Next.js
A estrutura esperada do projeto é:discord-hub/
├── bot/
├── prisma/
├── src/
├── package.json
├── package-lock.json
├── .env
└── ecosystem.config.js


1. Requisitos da VPS

A VPS precisa ter:
Ubuntu ou Debian
Acesso SSH como root ou usuário com permissões sudo
Domínio apontado para o IP da VPS
Nginx instalado
Certificado SSL ativo
Banco de dados acessível pela VPS
Pacotes básicos

Entre na VPS:ssh root@IP_DA_SUA_VPS
Atualize o sistema:apt update && apt upgrade -y
Instale Git, Curl e ferramentas básicas:apt install -y git curl nginx


2. Instalar Node.js

Instale uma versão LTS atual do Node.js:curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
Confira as versões instaladas:node -v
npm -v
Resultado esperado:v22.x.x
10.x.x


3. Instalar PM2

O PM2 mantém a aplicação e o bot online mesmo após fechar o SSH ou reiniciar a VPS.npm install -g pm2
Confira a instalação:pm2 -v


4. Clonar o projeto do GitHub

Entre na pasta do usuário:cd /root
Clone o repositório:git clone https://github.com/SEU_USUARIO/discord-hub.git
Entre na pasta do projeto:cd /root/discord-hub
Confira os arquivos:ls
Resultado esperado:bot
prisma
src
package.json
package-lock.json


5. Instalar dependências

Dentro da pasta do projeto:cd /root/discord-hub
npm install
Caso o projeto possua package-lock.json válido e sincronizado com o GitHub, use:npm ci


6. Criar o arquivo de ambiente

Crie o arquivo .env:nano /root/discord-hub/.env
Cole a estrutura abaixo e substitua todos os valores pelos dados reais:DATABASE_URL="SUA_URL_DO_BANCO_DE_DADOS"

AUTH_SECRET="UMA_CHAVE_GRANDE_E_ALEATORIA"
AUTH_URL="https://discord-hub.seudominio.com.br"
AUTH_TRUST_HOST=true

DISCORD_CLIENT_ID="SEU_CLIENT_ID"
DISCORD_CLIENT_SECRET="SEU_CLIENT_SECRET"
DISCORD_BOT_TOKEN="SEU_TOKEN_DO_BOT"
DISCORD_BOT_INVITE_URL="URL_DE_CONVITE_DO_BOT"

BOT_API_SECRET="UM_SEGREDO_INTERNO_FORTE"
BOT_API_PORT=2829

PORT=2828
Salve no Nano:Ctrl + O
Enter
Ctrl + X
Gerar um segredo seguro

Use este comando para gerar valores para AUTH_SECRET e BOT_API_SECRET:openssl rand -base64 32
Use valores diferentes para cada variável.
  Nunca envie o arquivo .env ao GitHub. Ele contém tokens, senhas e segredos da aplicação.


7. Configurar o Discord Developer Portal

No painel de desenvolvedores do Discord, configure a aplicação usada pelo Discord Hub.URL de redirecionamento do login

Em OAuth2, adicione exatamente:https://discord-hub.seudominio.com.br/api/auth/callback/discord
O domínio deve ser idêntico ao configurado em:AUTH_URL="https://discord-hub.seudominio.com.br"
Permissões do bot

O link de convite do bot deve incluir pelo menos:
bot
applications.commands
Permissões recomendadas:
Gerenciar Canais
Gerenciar Cargos
Criar Convites
Mover Membros
Conectar
Falar
Ver Canais
Enviar Mensagens
Usar Comandos de Aplicação
Também habilite os intents necessários na área Bot do Discord Developer Portal:
Server Members Intent
Presence Intent, se utilizado pelo projeto
Message Content Intent, se utilizado pelo projeto


8. Aplicar Prisma em produção

Não use prisma migrate dev na VPS.Aplique migrations existentes:cd /root/discord-hub
npx prisma migrate deploy
Gere o Prisma Client:npx prisma generate
Resultado esperado:Generated Prisma Client


9. Gerar build da aplicação

Execute:cd /root/discord-hub
npm run build
Resultado esperado:Compiled successfully
Generating static pages
Finalizing page optimization
Se aparecer um erro de Prisma, execute novamente:npx prisma generate
npm run build


10. Registrar comandos do Discord

Quando houver comandos Slash, registre-os no Discord:cd /root/discord-hub
node bot/deploy-commands.js
Resultado esperado:Comandos registrados com sucesso
Comandos globais podem levar algum tempo para aparecer no Discord.

11. Iniciar com PM2

O projeto deve possuir um script start que inicia simultaneamente:
Next.js
Bot Discord
API interna do bot
Inicie o projeto:cd /root/discord-hub
pm2 start npm --name discord-hub -- start
Confira o status:pm2 status
Resultado esperado:discord-hub    online
Veja os logs:pm2 logs discord-hub --lines 100
Resultado esperado nos logs:API interna do bot rodando em http://127.0.0.1:2829
Bot conectado como NOME_DO_BOT
Ready
Para sair dos logs sem desligar a aplicação:Ctrl + C


12. Configurar inicialização automática do PM2

Execute:pm2 startup
O PM2 exibirá um comando específico. Copie e execute exatamente o comando apresentado.Depois salve os processos atuais:pm2 save
Resultado esperado:Successfully saved


13. Configurar Nginx

Crie a configuração do domínio:nano /etc/nginx/sites-available/discord-hub
Cole o conteúdo abaixo. Substitua o domínio pelo domínio real:server {
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
Ative a configuração:ln -s /etc/nginx/sites-available/discord-hub /etc/nginx/sites-enabled/discord-hub
Valide a configuração:nginx -t
Resultado esperado:syntax is ok
test is successful
Recarregue o Nginx:systemctl reload nginx


14. Configurar certificado SSL

Caso o certificado ainda não exista, instale o Certbot:apt install -y certbot python3-certbot-nginx
Gere o certificado:certbot --nginx -d discord-hub.seudominio.com.br
Teste a renovação automática:certbot renew --dry-run


15. Validar a API interna do bot

A API do bot deve funcionar apenas localmente na VPS.Teste a listagem de servidores conectados:cd /root/discord-hub
./node_modules/.bin/dotenv -e .env -- sh -c 'curl -i -sS "http://127.0.0.1:2829/guilds" -H "x-bot-secret: $BOT_API_SECRET"'
Resultado esperado:HTTP/1.1 200 OK
Exemplo de resposta:[
  {
    "id": "ID_DO_SERVIDOR",
    "name": "Nome do Servidor",
    "icon": "URL_DO_ICONE",
    "memberCount": 10
  }
]


16. Validar a plataforma

Abra no navegador:https://discord-hub.seudominio.com.br
Valide os seguintes pontos:
Login com Discord
Redirecionamento após login
Carregamento do Dashboard
Listagem de servidores conectados
Conexão do bot a um servidor Discord
Criação de Hub de voz
Entrada em um Hub de voz
Criação de canal temporário
Aplicação de Templates
Remoção do bot de um servidor


17. Atualizar a plataforma no futuro

No computador local:git add .
git commit -m "feat: descricao da atualizacao"
git push origin main
Na VPS:cd /root/discord-hub
git pull --ff-only origin main
npm install
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 restart discord-hub --update-env
pm2 logs discord-hub --lines 100
Se não houve alteração no banco de dados, o comando abaixo pode ser ignorado:npx prisma migrate deploy


18. Comandos úteis do PM2

Ver processos:pm2 status
Ver logs do Discord Hub:pm2 logs discord-hub
Reiniciar a plataforma:pm2 restart discord-hub --update-env
Parar temporariamente:pm2 stop discord-hub
Iniciar novamente:pm2 start discord-hub
Remover do PM2:pm2 delete discord-hub
Salvar o estado atual:pm2 save


19. Diagnóstico de problemas comuns

Erro UntrustedHost

Sintoma:UntrustedHost: Host must be trusted
Verifique o .env:AUTH_URL="https://discord-hub.seudominio.com.br"
AUTH_TRUST_HOST=true
Verifique o Nginx:proxy_set_header Host $host;
proxy_set_header X-Forwarded-Proto $scheme;
proxy_set_header X-Forwarded-Host $host;
Reinicie:cd /root/discord-hub
pm2 restart discord-hub --update-env


Erro findMany do Prisma

Sintoma:TypeError: Cannot read properties of undefined (reading 'findMany')
Execute:cd /root/discord-hub
npx prisma migrate deploy
npx prisma generate
npm run build
pm2 restart discord-hub --update-env


Erro unauthorized ao usar Curl

Sintoma:{
  "error": "unauthorized"
}
O terminal não carregou o .env. Use:cd /root/discord-hub
./node_modules/.bin/dotenv -e .env -- sh -c 'curl -i -sS "http://127.0.0.1:2829/guilds" -H "x-bot-secret: $BOT_API_SECRET"'


Erro Unexpected token '<'

Sintoma:Unexpected token '<', "<!DOCTYPE "... is not valid JSON
Isso normalmente significa que o site esperava JSON da API do bot, mas recebeu uma página HTML de erro.Verifique se a API possui as rotas de canais de voz:cd /root/discord-hub
grep -nE 'app\.(get|post|patch|delete).*guilds|voice-channels|roles' bot/api.js
Devem existir rotas para:GET /guilds
GET /guilds/:guildId/roles
POST /guilds/:guildId/voice-channels
PATCH /guilds/:guildId/voice-channels/:channelId
DELETE /guilds/:guildId/voice-channels/:channelId
DELETE /guilds/:id
Depois de qualquer alteração em bot/api.js ou bot/index.js:cd /root/discord-hub
pm2 restart discord-hub --update-env


Bot conectado, mas sem responder

Confira os logs:pm2 logs discord-hub --lines 100
Confirme se aparece:Bot conectado como NOME_DO_BOT
Registre os comandos novamente:cd /root/discord-hub
node bot/deploy-commands.js
Verifique se o token do bot no .env é o token correto:DISCORD_BOT_TOKEN="SEU_TOKEN_DO_BOT"


20. Arquivos importantes




Arquivo
Responsabilidade




.env
Segredos, tokens, URLs e portas


package.json
Scripts e dependências do projeto


bot/index.js
Inicialização do bot Discord


bot/api.js
API interna usada pelo painel


bot/voice-hubs.js
Automação de canais temporários


bot/deploy-commands.js
Registro de comandos Slash


prisma/schema.prisma
Estrutura do banco de dados


src/auth.js ou auth.js
Configuração de autenticação Discord


src/app/dashboard/servers/actions.js
Comunicação entre painel e API do bot


/etc/nginx/sites-available/discord-hub
Proxy reverso do domínio público




Entrada de Log


Data/hora: 2026-07-27
Resumo do que foi feito:
Criado guia completo para instalação, configuração, publicação e atualização do Discord Hub em VPS.
Incluídas etapas de Node.js, PM2, Nginx, SSL, Prisma, Discord Developer Portal, variáveis de ambiente, API interna e diagnóstico.
Arquivos criados/alterados:
Documento de instalação em Markdown.
Decisões tomadas:
O projeto é executado com PM2 usando o script npm start.
O Next.js opera internamente na porta 2828.
A API interna do bot opera localmente na porta 2829.
O Nginx expõe apenas o domínio público via HTTPS.
Erros encontrados:
Nenhum durante a criação deste documento.
Como foi corrigido:
Não aplicável.
Estado atual do build:
O guia cobre instalação inicial, atualização contínua e validação operacional do projeto em produção.
Próximo passo único:
Salvar este conteúdo como INSTALACAO_VPS.md na raiz do repositório.
