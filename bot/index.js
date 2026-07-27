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

startBotApi(client)
client.login(process.env.DISCORD_BOT_TOKEN)