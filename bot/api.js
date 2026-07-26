const express = require("express")

function startBotApi(client) {
  const app = express()
  const secret = process.env.BOT_API_SECRET
  const port = process.env.BOT_API_PORT || 3001

  app.use((req, res, next) => {
    const providedSecret = req.headers["x-bot-secret"]
    if (providedSecret !== secret) {
      res.status(401).json({ error: "unauthorized" })
      return
    }
    next()
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
      res.status(500).json({ error: "failed to leave guild" })
    }
  })

  app.listen(port, () => {
    console.log(`API interna do bot rodando na porta ${port}`)
  })
}

module.exports = { startBotApi }