require("dotenv").config()
const { REST, Routes, SlashCommandBuilder } = require("discord.js")

const commands = [
  new SlashCommandBuilder()
    .setName("aplicar-template")
    .setDescription("Aplica um template de canais neste servidor")
    .toJSON(),
]

const rest = new REST().setToken(process.env.DISCORD_BOT_TOKEN)

async function deploy() {
  const data = await rest.put(
    Routes.applicationCommands(process.env.DISCORD_CLIENT_ID),
    { body: commands }
  )
  console.log(`${data.length} comando(s) registrado(s) com sucesso`)
}

deploy()
