const express = require("express")

let apiStarted = false

function startBotApi(client) {
  if (apiStarted) {
    return
  }

  apiStarted = true

  const app = express()
  const secret = process.env.BOT_API_SECRET
  const port = Number(process.env.BOT_API_PORT || 3001)

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
      api: "online",
      discordReady: client.isReady(),
    })
  })

  app.get("/guilds", (req, res) => {
    if (!client.isReady()) {
      res.status(503).json({
        error: "bot_not_ready",
        guilds: [],
      })
      return
    }

    const guilds = client.guilds.cache.map((guild) => ({
      id: guild.id,
      name: guild.name,
      icon: guild.iconURL(),
      memberCount: guild.memberCount,
    }))

    res.json(guilds)
  })

  app.get("/guilds/:guildId/roles", async (req, res) => {
    if (!client.isReady()) {
      res.status(503).json({
        error: "bot_not_ready",
        roles: [],
      })
      return
    }

    const guild = client.guilds.cache.get(req.params.guildId)

    if (!guild) {
      res.status(404).json({
        error: "guild_not_found",
        roles: [],
      })
      return
    }

    try {
      const roles = await guild.roles.fetch()

      const formattedRoles = Array.from(roles.values())
        .filter(
          (role) =>
            role.id !== guild.roles.everyone.id &&
            !role.managed
        )
        .sort((first, second) => second.position - first.position)
        .map((role) => ({
          id: role.id,
          name: role.name,
          color: role.hexColor,
        }))

      res.json(formattedRoles)
    } catch (error) {
      console.log("Erro ao buscar cargos do servidor:", error.message)

      res.status(500).json({
        error: "failed_to_fetch_roles",
        roles: [],
      })
    }
  })

  app.delete("/guilds/:id", async (req, res) => {
    if (!client.isReady()) {
      res.status(503).json({
        error: "bot_not_ready",
      })
      return
    }

    const guild = client.guilds.cache.get(req.params.id)

    if (!guild) {
      res.status(404).json({
        error: "guild_not_found",
      })
      return
    }

    try {
      await guild.leave()

      res.json({
        success: true,
      })
    } catch (error) {
      console.log("Erro ao sair do servidor:", error.message)

      res.status(500).json({
        error: "failed_to_leave_guild",
      })
    }
  })

  const server = app.listen(port, "127.0.0.1", () => {
    console.log(`API interna do bot rodando em http://127.0.0.1:${port}`)
  })

  server.on("error", (error) => {
    apiStarted = false
    console.log(`Erro ao iniciar a API interna do bot na porta ${port}:`, error.message)
  })
}

module.exports = { startBotApi }