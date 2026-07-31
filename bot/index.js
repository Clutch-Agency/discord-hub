require("dotenv").config()

const { Client, GatewayIntentBits } = require("discord.js")
const { PrismaClient } = require("@prisma/client")
const { startBotApi } = require("./api")
const { registerVoiceHubHandlers } = require("./voice-hubs")
const { handleInteraction } = require("./interactionHandler")

const prisma = new PrismaClient()

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildVoiceStates,
  ],
})

let apiServer
let shuttingDown = false

client.once("clientReady", () => {
  console.log(`Bot conectado como ${client.user.tag}`)
  registerVoiceHubHandlers(client, prisma)
})

client.on("guildCreate", async (guild) => {
  console.log(`Bot adicionado ao servidor: ${guild.name}`)
})

client.on("interactionCreate", async (interaction) => {
  await handleInteraction(interaction, client)
})

apiServer = startBotApi(client)

async function shutdown(signal, exitCode = 0) {
  if (shuttingDown) return
  shuttingDown = true
  console.log(`Encerrando bot após ${signal}.`)

  client.destroy()

  const operations = [prisma.$disconnect()]

  if (apiServer?.listening) {
    operations.push(
      new Promise((resolve) => {
        apiServer.close(() => resolve())
        apiServer.closeIdleConnections?.()
      })
    )
  }

  await Promise.allSettled(operations)
  process.exit(exitCode)
}

process.once("SIGTERM", () => void shutdown("SIGTERM"))
process.once("SIGINT", () => void shutdown("SIGINT"))

client.login(process.env.DISCORD_BOT_TOKEN).catch(() => {
  console.error("Falha ao autenticar o bot no Discord.")
  void shutdown("falha de autenticação", 1)
})
