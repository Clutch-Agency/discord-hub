const express = require("express")
const { ChannelType } = require("discord.js")

function startBotApi(client) {
  const app = express()
  const secret = process.env.BOT_API_SECRET
  const port = process.env.BOT_API_PORT || 3001

  app.use(express.json())

  app.use((req, res, next) => {
    const providedSecret = req.headers["x-bot-secret"]

    if (!secret || providedSecret !== secret) {
      res.status(401).json({ error: "unauthorized" })
      return
    }

    next()
  })

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

  app.get("/guilds", (req, res) => {
    const guilds = client.guilds.cache.map((guild) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL(),
      memberCount: guild.memberCount,
    }))

    res.json(guilds)
  })

  app.get("/guilds/:guildId/roles", async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId)

    if (!guild) {
      res.status(404).json({ error: "guild not found" })
      return
    }

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
      console.log("Erro ao buscar cargos do servidor:", error.message)
      res.status(500).json({
        error: "failed to fetch roles",
        details: error.message,
      })
    }
  })

  app.post("/guilds/:guildId/voice-channels", async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId)
    const name = String(req.body?.name || "").trim()

    if (!guild) {
      res.status(404).json({ error: "guild not found" })
      return
    }

    if (!name) {
      res.status(400).json({
        error: "invalid channel name",
        details: "O nome do canal de voz é obrigatório.",
      })
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
      console.log("Erro ao criar canal de voz:", error.message)
      res.status(500).json({
        error: "failed to create voice channel",
        details: error.message,
      })
    }
  })

  app.patch("/guilds/:guildId/voice-channels/:channelId", async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId)
    const name = String(req.body?.name || "").trim()

    if (!guild) {
      res.status(404).json({ error: "guild not found" })
      return
    }

    if (!name) {
      res.status(400).json({
        error: "invalid channel name",
        details: "O nome do canal de voz é obrigatório.",
      })
      return
    }

    try {
      const channel = await guild.channels.fetch(req.params.channelId)

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
      console.log("Erro ao atualizar canal de voz:", error.message)
      res.status(500).json({
        error: "failed to update voice channel",
        details: error.message,
      })
    }
  })

  app.delete("/guilds/:guildId/voice-channels/:channelId", async (req, res) => {
    const guild = client.guilds.cache.get(req.params.guildId)

    if (!guild) {
      res.status(404).json({ error: "guild not found" })
      return
    }

    try {
      const channel = await guild.channels.fetch(req.params.channelId)

      if (!channel || channel.type !== ChannelType.GuildVoice) {
        res.status(404).json({ error: "voice channel not found" })
        return
      }

      await channel.delete("Hub de canais temporários removido pela plataforma")

      res.json({
        success: true,
        channelId: req.params.channelId,
      })
    } catch (error) {
      console.log("Erro ao excluir canal de voz:", error.message)
      res.status(500).json({
        error: "failed to delete voice channel",
        details: error.message,
      })
    }
  })

  app.delete("/guilds/:id", async (req, res) => {
    const guild = client.guilds.cache.get(req.params.id)

    if (!guild) {
      res.status(404).json({ error: "guild not found" })
      return
    }

    try {
      await guild.leave()
      res.json({ success: true })
    } catch (error) {
      console.log("Erro ao sair do servidor:", error.message)
      res.status(500).json({
        error: "failed to leave guild",
        details: error.message,
      })
    }
  })

  app.listen(port, "127.0.0.1", () => {
    console.log(`API interna do bot rodando em http://127.0.0.1:${port}`)
  })
}

module.exports = { startBotApi }