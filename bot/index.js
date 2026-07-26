require("dotenv").config()
const {
  Client,
  GatewayIntentBits,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ChannelType,
} = require("discord.js")
const { PrismaClient } = require("@prisma/client")

const prisma = new PrismaClient()

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
})

const CHANNEL_TYPE_MAP = {
  TEXT: ChannelType.GuildText,
  VOICE: ChannelType.GuildVoice,
  FORUM: ChannelType.GuildForum,
  ANNOUNCEMENT: ChannelType.GuildAnnouncement,
  STAGE: ChannelType.GuildStageVoice,
}

const pendingJobs = new Map()

async function createChannel(guild, channel) {
  const discordType = CHANNEL_TYPE_MAP[channel.type]
  const createOptions = { name: channel.name, type: discordType }

  if (channel.isPrivate) {
    createOptions.permissionOverwrites = [
      {
        id: guild.roles.everyone.id,
        deny: ["ViewChannel"],
      },
    ]
  }

  const created = await guild.channels.create(createOptions)
  return created
}

async function processNextPrivateChannel(interaction, job) {
  if (job.privateIndex >= job.privateChannels.length) {
    let summary = `${job.createdCount} canal(is) criado(s) com sucesso.`
    if (job.failedNames.length > 0) {
      summary += ` ${job.failedNames.length} falharam: ${job.failedNames.join(", ")}.`
    }
    await interaction.followUp({ content: summary, ephemeral: true })
    pendingJobs.delete(job.id)
    return
  }

  const current = job.privateChannels[job.privateIndex]

  const roles = await interaction.guild.roles.fetch()
  const options = roles
    .filter((r) => r.id !== interaction.guild.roles.everyone.id && !r.managed)
    .map((r) => ({ label: r.name, value: r.id }))
    .slice(0, 25)

  if (options.length === 0) {
    await interaction.followUp({
      content: `Canal privado "${current.name}" criado, mas não há cargos disponíveis no servidor para vincular. Ele ficará oculto até você configurar manualmente.`,
      ephemeral: true,
    })
    job.privateIndex += 1
    await processNextPrivateChannel(interaction, job)
    return
  }

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`select-role-${job.id}`)
    .setPlaceholder("Escolha o(s) cargo(s) com acesso")
    .setMinValues(1)
    .setMaxValues(options.length)
    .addOptions(options)

  const row = new ActionRowBuilder().addComponents(menu)

  await interaction.followUp({
    content: `Canal privado "${current.name}" criado. Quais cargos devem ter acesso a ele?`,
    components: [row],
    ephemeral: true,
  })
}

client.once("clientReady", () => {
  console.log(`Bot conectado como ${client.user.tag}`)
})

client.on("interactionCreate", async (interaction) => {
  if (interaction.isChatInputCommand() && interaction.commandName === "aplicar-template") {
    if (!interaction.inGuild()) {
      await interaction.reply({
        content: "Esse comando só funciona dentro de um servidor.",
        ephemeral: true,
      })
      return
    }

    const account = await prisma.account.findFirst({
      where: {
        provider: "discord",
        providerAccountId: interaction.user.id,
      },
      include: { user: true },
    })

    if (!account) {
      await interaction.reply({
        content: "Não encontrei sua conta vinculada. Faça login na plataforma web com este mesmo usuário do Discord antes de usar esse comando.",
        ephemeral: true,
      })
      return
    }

    const templates = await prisma.template.findMany({
      where: { userId: account.userId },
      orderBy: { createdAt: "desc" },
    })

    if (templates.length === 0) {
      await interaction.reply({
        content: "Você ainda não criou nenhum template na plataforma web.",
        ephemeral: true,
      })
      return
    }

    const menu = new StringSelectMenuBuilder()
      .setCustomId("select-template")
      .setPlaceholder("Escolha um template")
      .addOptions(
        templates.map((t) => ({
          label: t.name,
          value: t.id,
        }))
      )

    const row = new ActionRowBuilder().addComponents(menu)

    await interaction.reply({
      content: "Escolha o template que deseja aplicar neste servidor:",
      components: [row],
      ephemeral: true,
    })
    return
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "select-template") {
    const templateId = interaction.values[0]

    const template = await prisma.template.findUnique({
      where: { id: templateId },
      include: { channels: { orderBy: { order: "asc" } } },
    })

    if (!template) {
      await interaction.update({
        content: "Template não encontrado, pode ter sido excluído.",
        components: [],
      })
      return
    }

    await interaction.update({
      content: `Criando ${template.channels.length} canal(is) do template "${template.name}"...`,
      components: [],
    })

    let createdCount = 0
    const failedNames = []
    const privateChannels = []

    for (const channel of template.channels) {
      try {
        const createdChannel = await createChannel(interaction.guild, channel)
        createdCount += 1
        if (channel.isPrivate) {
          privateChannels.push({ id: createdChannel.id, name: createdChannel.name })
        }
      } catch (error) {
        console.log(`Erro ao criar canal ${channel.name}:`, error.message)
        failedNames.push(channel.name)
      }
    }

    const jobId = `${interaction.id}`
    pendingJobs.set(jobId, {
      id: jobId,
      createdCount,
      failedNames,
      privateChannels,
      privateIndex: 0,
    })

    await processNextPrivateChannel(interaction, pendingJobs.get(jobId))
    return
  }

  if (interaction.isStringSelectMenu() && interaction.customId.startsWith("select-role-")) {
    const jobId = interaction.customId.replace("select-role-", "")
    const job = pendingJobs.get(jobId)

    if (!job) {
      await interaction.update({
        content: "Essa sessão expirou, rode o comando novamente.",
        components: [],
      })
      return
    }

    const current = job.privateChannels[job.privateIndex]
    const roleIds = interaction.values

    try {
      const targetChannel = await interaction.guild.channels.fetch(current.id)
      for (const roleId of roleIds) {
        await targetChannel.permissionOverwrites.edit(roleId, { ViewChannel: true })
      }

      await interaction.update({
        content: `Canal "${current.name}" liberado para ${roleIds.length} cargo(s).`,
        components: [],
      })
    } catch (error) {
      console.log(`Erro ao aplicar permissão no canal ${current.name}:`, error.message)
      await interaction.update({
        content: `Erro ao configurar permissões do canal "${current.name}".`,
        components: [],
      })
    }

    job.privateIndex += 1
    await processNextPrivateChannel(interaction, job)
  }
})

client.login(process.env.DISCORD_BOT_TOKEN)