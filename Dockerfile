# syntax=docker/dockerfile:1.7

ARG NODE_IMAGE=node:22.23.1-bookworm-slim

FROM ${NODE_IMAGE} AS prisma-base
RUN apt-get update \
    && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

FROM prisma-base AS dependencies
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN npm ci

FROM dependencies AS builder
COPY . .
ENV DATABASE_URL=postgresql://build:build@127.0.0.1:5432/build
ENV AUTH_SECRET=build-only-placeholder
ENV DISCORD_CLIENT_ID=11111111111111111
ENV DISCORD_CLIENT_SECRET=build-only-placeholder
RUN npm run build

FROM prisma-base AS web
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/scripts/container-entrypoint.mjs ./scripts/container-entrypoint.mjs
USER node
EXPOSE 3000
CMD ["node", "scripts/container-entrypoint.mjs", "--database", "node", "server.js"]

FROM dependencies AS production-dependencies
COPY prisma ./prisma
RUN npx prisma generate && npm prune --omit=dev

FROM prisma-base AS worker
WORKDIR /app
ENV NODE_ENV=production
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --chown=node:node package.json ./package.json
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node domain ./domain
COPY --chown=node:node bot ./bot
COPY --chown=node:node scripts/container-entrypoint.mjs ./scripts/container-entrypoint.mjs
USER node
EXPOSE 3001
CMD ["node", "scripts/container-entrypoint.mjs", "--database", "node", "bot/index.js"]
