Instalação do Discord Hub em VPS
1. Acessar a VPS
ssh root@IP_DA_VPS
Atualize o sistema:

apt update && apt upgrade -y
Instale os pacotes necessários:

apt install -y git curl nginx openssl
2. Instalar Node.js
Instale o Node.js LTS:

curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs
Verifique a instalação:

node -v
npm -v
3. Instalar PM2
npm install -g pm2
Verifique a instalação:

pm2 -v
4. Clonar o projeto
Entre na pasta principal:

cd /root
Clone o repositório:

git clone https://github.com/SEU_USUARIO/discord-hub.git
Entre na pasta do projeto:

cd /root/discord-hub
Instale as dependências:

npm install
5. Criar o arquivo de ambiente
Crie o arquivo:

nano /root/discord-hub/.env
Cole o conteúdo abaixo e substitua os valores pelos dados reais:

DATABASE_URL="SUA_URL_DO_BANCO_DE_DADOS"

AUTH_SECRET="SEU_AUTH_SECRET"
AUTH_URL="https://discord-hub.seudominio.com.br"
AUTH_TRUST_HOST=true

DISCORD_CLIENT_ID="SEU_DISCORD_CLIENT_ID"
DISCORD_CLIENT_SECRET="SEU_DISCORD_CLIENT_SECRET"
DISCORD_BOT_TOKEN="SEU_DISCORD_BOT_TOKEN"
DISCORD_BOT_INVITE_URL="SUA_URL_DE_CONVITE_DO_BOT"

BOT_API_SECRET="SEU_BOT_API_SECRET"
BOT_API_PORT=2829

PORT=2828
Para gerar valores seguros para AUTH_SECRET e BOT_API_SECRET:

openssl rand -base64 32
Salve o arquivo no Nano:

Ctrl + O
Enter
Ctrl + X
6. Configurar o Discord Developer Portal
Configure esta URL de redirecionamento OAuth2:

https://discord-hub.seudominio.com.br/api/auth/callback/discord
Adicione os escopos ao convite do bot:

bot
applications.commands
Conceda ao bot estas permissões:

Ver Canais
Enviar Mensagens
Gerenciar Canais
Gerenciar Cargos
Criar Convites
Conectar
Falar
Mover Membros
Usar Comandos de Aplicação
Ative estes intents na área Bot:

Server Members Intent
Presence Intent, caso usado pelo projeto
Message Content Intent, caso usado pelo projeto
7. Aplicar banco de dados e Prisma
Entre na pasta do projeto:

cd /root/discord-hub
Aplique as migrations:

npx prisma migrate deploy
Gere o Prisma Client:

npx prisma generate
8. Registrar comandos do Discord
cd /root/discord-hub
node bot/deploycommands.js
9. Gerar o build
cd /root/discord-hub
npm run build
10. Iniciar o Discord Hub com PM2
cd /root/discord-hub
pm2 start npm --name discord-hub -- start
Verifique o status:

pm2 status
Veja os logs:

pm2 logs discord-hub --lines 100
Resultado esperado:

API interna do bot rodando em http://127.0.0.1:2829
Bot conectado como NOME_DO_BOT
Para sair dos logs sem parar o sistema:

Ctrl + C
11. Configurar inicialização automática
Execute:

pm2 startup
Copie e execute o comando que o PM2 mostrar na tela.

Depois salve a configuração:

pm2 save
12. Configurar Nginx inicialmente em HTTP
Crie o arquivo:

nano /etc/nginx/sites-available/discord-hub
Cole este conteúdo e substitua o domínio:

server {
    listen 80;
    server_name discord-hub.seudominio.com.br;

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
Teste a configuração:

nginx -t
Recarregue o Nginx:

systemctl reload nginx
13. Configurar certificado SSL
Instale o Certbot:

apt install -y certbot python3-certbot-nginx
Gere e configure o certificado SSL:

certbot --nginx -d discord-hub.seudominio.com.br
Teste a renovação automática:

certbot renew --dry-run
14. Validar a instalação
Verifique o PM2:

pm2 status
Valide a API interna do bot:

cd /root/discord-hub
./node_modules/.bin/dotenv -e .env -- sh -c 'curl -i -sS "http://127.0.0.1:2829/guilds" -H "x-bot-secret: $BOT_API_SECRET"'
Resultado esperado:

HTTP/1.1 200 OK
Acesse a plataforma:

https://discord-hub.seudominio.com.br
