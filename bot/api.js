const express = require("express")
const { ChannelType } = require("discord.js")
const {
  GUILD_AUTHORIZATION_CODES,
  authorizeGuildActor,
  listAuthorizedGuilds,
  normalizeDiscordId,
} = require("./guild-authorization")

function isUnknownChannelError(error) {
  return error?.code === 10003 || error?.code === "UnknownChannel"
}

function normalizeChannelName(value) {
  if (typeof value !== "string") {
    return null
  }

  const name = value.trim()

  return name.length >= 1 && name.length <= 100 ? name : null
}

function createBotApi(client, options = {}) {
  const app = express()
  const secret = Object.hasOwn(options, "secret")
    ? options.secret
    : process.env.BOT_API_SECRET

  app.use(express.json())

  app.use((req, res, next) => {
    const providedSecret = req.headers["x-bot-secret"]

    if (!secret || providedSecret !== secret) {
      res.status(401).json({ error: "unauthorized" })
      return
    }

    next()
  })

  function sendGuildAuthorizationError(error, res) {
    if (error.code === GUILD_AUTHORIZATION_CODES.INVALID_INPUT) {
      res.status(400).json({ error: "invalid authorization input" })
      return
    }

    if (error.code === GUILD_AUTHORIZATION_CODES.ACCESS_DENIED) {
      res.status(403).json({ error: "guild access denied" })
      return
    }

    console.error("Falha ao verificar autorização da guild.")
    res.status(503).json({ error: "guild authorization unavailable" })
  }

  async function requireGuildActor(req, res) {
    try {
      return await authorizeGuildActor(
        client,
        req.params.guildId,
        req.headers["x-actor-discord-id"]
      )
    } catch (error) {
      sendGuildAuthorizationError(error, res)
      return null
    }
  }

  app.get("/health", (req, res) => {
    res.json({
      success: true,
      botReady: client.isReady(),
      botUser: client.user
        ? {
            id: client.user.id,
            tag: client.user.tag,
          }
        : null,
    })
  })

  app.get("/guilds", async (req, res) => {
    try {
      const guilds = await listAuthorizedGuilds(
        client,
        req.headers["x-actor-discord-id"]
      )

      res.json(guilds)
    } catch (error) {
      sendGuildAuthorizationError(error, res)
    }
  })

  app.get("/guilds/:guildId/access", async (req, res) => {
    const authorization = await requireGuildActor(req, res)

    if (!authorization) {
      return
    }

    res.json({
      authorized: true,
      guildId: authorization.guildId,
    })
  })

  app.get("/guilds/:guildId/roles", async (req, res) => {
    const authorization = await requireGuildActor(req, res)

    if (!authorization) {
      return
    }

    const { guild } = authorization

    try {
      const roles = await guild.roles.fetch()
      const formattedRoles = roles
        .filter((role) => role.id !== guild.roles.everyone.id && !role.managed)
        .sort((first, second) => second.position - first.position)
        .map((role) => ({
          id: role.id,
          name: role.name,
          color: role.hexColor,
          position: role.position,
        }))

      res.json(formattedRoles)
    } catch (error) {
      console.error("Falha ao buscar cargos de uma guild autorizada.")
      res.status(503).json({ error: "failed to fetch roles" })
    }
  })

  app.post("/guilds/:guildId/voice-channels", async (req, res) => {
    const authorization = await requireGuildActor(req, res)

    if (!authorization) {
      return
    }

    const { guild } = authorization
    const name = normalizeChannelName(req.body?.name)

    if (!name) {
      res.status(400).json({ error: "invalid channel name" })
      return
    }

    try {
      const channel = await guild.channels.create({
        name,
        type: ChannelType.GuildVoice,
      })

      res.status(201).json({
        success: true,
        channelId: channel.id,
        channelName: channel.name,
      })
    } catch (error) {
      console.error("Falha ao criar canal de voz em guild autorizada.")
      res.status(503).json({ error: "failed to create voice channel" })
    }
  })

  app.patch("/guilds/:guildId/voice-channels/:channelId", async (req, res) => {
    const authorization = await requireGuildActor(req, res)

    if (!authorization) {
      return
    }

    const { guild } = authorization
    const channelId = normalizeDiscordId(req.params.channelId)
    const name = normalizeChannelName(req.body?.name)

    if (!channelId || !name) {
      res.status(400).json({ error: "invalid voice channel input" })
      return
    }

    try {
      const channel = await guild.channels.fetch(channelId)

      if (!channel || channel.type !== ChannelType.GuildVoice) {
        res.status(404).json({ error: "voice channel not found" })
        return
      }

      await channel.setName(name)

      res.json({
        success: true,
        channelId: channel.id,
        channelName: channel.name,
      })
    } catch (error) {
      if (isUnknownChannelError(error)) {
        res.status(404).json({ error: "voice channel not found" })
        return
      }

      console.error("Falha ao atualizar canal de voz em guild autorizada.")
      res.status(503).json({ error: "failed to update voice channel" })
    }
  })

  app.delete("/guilds/:guildId/voice-channels/:channelId", async (req, res) => {
    const authorization = await requireGuildActor(req, res)

    if (!authorization) {
      return
    }

    const { guild } = authorization
    const channelId = normalizeDiscordId(req.params.channelId)

    if (!channelId) {
      res.status(400).json({ error: "invalid voice channel input" })
      return
    }

    try {
      const channel = await guild.channels.fetch(channelId)

      if (!channel || channel.type !== ChannelType.GuildVoice) {
        res.status(404).json({ error: "voice channel not found" })
        return
      }

      await channel.delete("Hub de canais temporários removido pela plataforma")

      res.json({ success: true, channelId })
    } catch (error) {
      if (isUnknownChannelError(error)) {
        res.status(404).json({ error: "voice channel not found" })
        return
      }

      console.error("Falha ao excluir canal de voz em guild autorizada.")
      res.status(503).json({ error: "failed to delete voice channel" })
    }
  })

  app.delete("/guilds/:guildId", async (req, res) => {
    const authorization = await requireGuildActor(req, res)

    if (!authorization) {
      return
    }

    try {
      await authorization.guild.leave()
      res.json({ success: true })
    } catch (error) {
      console.error("Falha ao remover o bot de uma guild autorizada.")
      res.status(503).json({ error: "failed to leave guild" })
    }
  })

  return app
}

function startBotApi(client) {
  const app = createBotApi(client)
  const port = process.env.BOT_API_PORT || 3001

  return app.listen(port, "127.0.0.1", () => {
    console.log(`API interna do bot rodando em http://127.0.0.1:${port}`)
  })
}

module.exports = { createBotApi, startBotApi }
