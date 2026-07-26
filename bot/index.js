require("dotenv").config()
const {
  Client,
  GatewayIntentBits,
  StringSelectMenuBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  EmbedBuilder,
  ChannelType,
} = require("discord.js")
const { PrismaClient } = require("@prisma/client")
const { startBotApi } = require("./api")

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

const PAGE_SIZE = 24
const jobs = new Map()

function baseEmbed(title, description) {
  return new EmbedBuilder()
    .setColor(0x5865f2)
    .setTitle(title)
    .setDescription(description)
}

function paginate(items, page) {
  const start = page * PAGE_SIZE
  return items.slice(start, start + PAGE_SIZE)
}

function paginationRow(jobId, prefix, page, totalItems) {
  const totalPages = Math.ceil(totalItems / PAGE_SIZE)
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`${prefix}-prev-${jobId}`)
      .setLabel("Anterior")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page <= 0),
    new ButtonBuilder()
      .setCustomId(`${prefix}-next-${jobId}`)
      .setLabel("Próxima")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1)
  )
  return row
}

async function respond(interaction, payload) {
  if (interaction.replied || interaction.deferred) {
    await interaction.followUp({ ...payload, ephemeral: true })
    return
  }

  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    await interaction.update(payload)
    return
  }

  await interaction.reply({ ...payload, ephemeral: true })
}

async function showTemplateMenu(interaction, userId) {
  const templates = await prisma.template.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  })

  if (templates.length === 0) {
    await interaction.reply({
      embeds: [baseEmbed("Nenhum template encontrado", "Você ainda não criou nenhum template na plataforma web.")],
      ephemeral: true,
    })
    return
  }

  const jobId = interaction.id
  jobs.set(jobId, { id: jobId, ownerId: interaction.user.id, guildId: interaction.guildId })

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`pick-template-${jobId}`)
    .setPlaceholder("Escolha um template")
    .addOptions(templates.map((t) => ({ label: t.name, value: t.id })))

  await interaction.reply({
    embeds: [baseEmbed("Aplicar template", "Escolha o template que deseja aplicar neste servidor.")],
    components: [new ActionRowBuilder().addComponents(menu)],
    ephemeral: true,
  })
}

async function showCategoryMenu(interaction, job, page = 0) {
  const guild = interaction.guild
  const categories = guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory)
  const categoryArray = Array.from(categories.values())

  job.categoryPage = page
  jobs.set(job.id, job)

  const pageItems = paginate(categoryArray, page)

  const options = [
    { label: "➕ Nova categoria", value: "new-category" },
    ...pageItems.map((c) => ({ label: c.name, value: c.id })),
  ]

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`pick-category-${job.id}`)
    .setPlaceholder("Escolha uma categoria")
    .addOptions(options)

  const components = [new ActionRowBuilder().addComponents(menu)]
  if (categoryArray.length > PAGE_SIZE) {
    components.push(paginationRow(job.id, "cat", page, categoryArray.length))
  }

  const embed = baseEmbed(
    "Categoria de destino",
    `Template: **${job.templateName}**\n\nEm qual categoria os canais devem ser criados?`
  )

  await respond(interaction, { embeds: [embed], components })
}

async function showRoleMenu(interaction, job, page = 0) {
  const guild = interaction.guild
  const roles = await guild.roles.fetch()
  const roleArray = Array.from(roles.values()).filter(
    (r) => r.id !== guild.roles.everyone.id && !r.managed
  )

  job.rolePage = page
  jobs.set(job.id, job)

  const pageItems = paginate(roleArray, page)
  const selectedIds = job.selectedRoleIds || []

  const options = [
    { label: "➕ Criar novo cargo", value: "new-role" },
    ...pageItems.map((r) => ({
      label: r.name,
      value: r.id,
      default: selectedIds.includes(r.id),
    })),
  ]

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`pick-roles-${job.id}`)
    .setPlaceholder("Escolha o(s) cargo(s)")
    .setMinValues(1)
    .setMaxValues(options.length)
    .addOptions(options)

  const confirmButton = new ButtonBuilder()
    .setCustomId(`confirm-roles-${job.id}`)
    .setLabel("Confirmar seleção")
    .setStyle(ButtonStyle.Success)
    .setDisabled(selectedIds.length === 0)

  const components = [new ActionRowBuilder().addComponents(menu)]
  if (roleArray.length > PAGE_SIZE) {
    components.push(paginationRow(job.id, "role", page, roleArray.length))
  }
  components.push(new ActionRowBuilder().addComponents(confirmButton))

  const targetLabel = job.pendingChannelName ? `canal **${job.pendingChannelName}**` : `categoria **${job.categoryName}**`

  const embed = baseEmbed(
    "Cargos com acesso",
    `Quais cargos devem ter acesso a este(a) ${targetLabel}?\n\nCargos já marcados: ${selectedIds.length > 0 ? selectedIds.map((id) => `<@&${id}>`).join(", ") : "nenhum"}`
  )

  await respond(interaction, { embeds: [embed], components })
}

async function applyTemplate(interaction, job) {
  await respond(interaction, {
    embeds: [baseEmbed("Criando canais", `Aplicando template **${job.templateName}** dentro da categoria **${job.categoryName}**...`)],
    components: [],
  })

  const guild = interaction.guild

  const categoryOverwrites = []
  if (job.categoryIsPrivate) {
    categoryOverwrites.push({ id: guild.roles.everyone.id, deny: ["ViewChannel"] })
    for (const roleId of job.selectedRoleIds || []) {
      categoryOverwrites.push({ id: roleId, allow: ["ViewChannel"] })
    }
  }

  let category
  if (job.categoryId === "new-category") {
    category = await guild.channels.create({
      name: job.categoryName,
      type: ChannelType.GuildCategory,
      permissionOverwrites: categoryOverwrites,
    })
  } else {
    category = await guild.channels.fetch(job.categoryId)
  }

  const template = await prisma.template.findUnique({
    where: { id: job.templateId },
    include: { channels: { orderBy: { order: "asc" } } },
  })

  const privateChannelsPending = template.channels.filter((c) => c.isPrivate)
  job.remainingPrivateChannels = privateChannelsPending
  job.privateChannelIndex = 0
  job.createdCount = 0
  job.failedNames = []
  job.category = category
  jobs.set(job.id, job)

  for (const channel of template.channels) {
    if (channel.isPrivate) continue

    try {
      await guild.channels.create({
        name: channel.name,
        type: CHANNEL_TYPE_MAP[channel.type],
        parent: category.id,
      })
      job.createdCount += 1
    } catch (error) {
      console.log(`Erro ao criar canal ${channel.name}:`, error.message)
      job.failedNames.push(channel.name)
    }
  }

  await processNextPrivateChannel(interaction, job)
}

async function processNextPrivateChannel(interaction, job) {
  if (job.privateChannelIndex >= job.remainingPrivateChannels.length) {
    const embed = baseEmbed(
      "Template aplicado",
      `${job.createdCount} canal(is) criado(s) com sucesso dentro de **${job.category.name}**.${
        job.failedNames.length > 0 ? `\n\n${job.failedNames.length} falharam: ${job.failedNames.join(", ")}.` : ""
      }`
    )
    await respond(interaction, { embeds: [embed], components: [] })
    jobs.delete(job.id)
    return
  }

  const channel = job.remainingPrivateChannels[job.privateChannelIndex]

  job.pendingChannelName = channel.name
  job.pendingChannelType = channel.type
  job.selectedRoleIds = []
  jobs.set(job.id, job)

  await showRoleMenu(interaction, job, 0)
}

async function createPendingPrivateChannel(interaction, job) {
  const guild = interaction.guild
  const channelData = job.remainingPrivateChannels[job.privateChannelIndex]

  const overwrites = [{ id: guild.roles.everyone.id, deny: ["ViewChannel"] }]
  for (const roleId of job.selectedRoleIds) {
    overwrites.push({ id: roleId, allow: ["ViewChannel"] })
  }

  try {
    await guild.channels.create({
      name: channelData.name,
      type: CHANNEL_TYPE_MAP[channelData.type],
      parent: job.category.id,
      permissionOverwrites: overwrites,
    })
    job.createdCount += 1
  } catch (error) {
    console.log(`Erro ao criar canal privado ${channelData.name}:`, error.message)
    job.failedNames.push(channelData.name)
  }

  job.privateChannelIndex += 1
  jobs.set(job.id, job)

  await processNextPrivateChannel(interaction, job)
}

async function sendWelcomeMessage(guild) {
  try {
    let channel = guild.channels.cache.find((c) => c.name === "clutch-bot" && c.type === ChannelType.GuildText)

    if (!channel) {
      channel = await guild.channels.create({
        name: "clutch-bot",
        type: ChannelType.GuildText,
        topic: "Canal de instruções do Clutch Hub",
      })
    }

    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("Bem-vindo ao Clutch Hub")
      .setDescription("Este bot cria a estrutura de canais e cargos do seu servidor a partir de templates configurados na plataforma web.")
      .addFields(
        { name: "1. Vincule sua conta", value: "Acesse https://discord-hub.clutch.com.br e faça login com o mesmo usuário do Discord que você usa neste servidor." },
        { name: "2. Crie um template", value: "Na plataforma, crie um template definindo quais canais devem ser gerados." },
        { name: "3. Aplique no servidor", value: "Use o comando /aplicar-template aqui no Discord para escolher o template e aplicá-lo." },
        { name: "4. Escolha a categoria", value: "Selecione uma categoria já existente ou crie uma nova para receber os canais do template." },
        { name: "5. Defina permissões", value: "Se a categoria ou algum canal for privado, escolha quais cargos terão acesso, ou crie um novo cargo na hora." }
      )
      .setFooter({ text: "Dúvidas? Fale com quem administra este bot." })

    await channel.send({ embeds: [embed] })
  } catch (error) {
    console.log("Erro ao criar canal de boas-vindas:", error.message)
  }
}

client.once("clientReady", () => {
  console.log(`Bot conectado como ${client.user.tag}`)
  startBotApi(client)
})

client.on("guildCreate", async (guild) => {
  await sendWelcomeMessage(guild)
})

client.on("interactionCreate", async (interaction) => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === "aplicar-template") {
      if (!interaction.inGuild()) {
        await interaction.reply({
          embeds: [baseEmbed("Comando indisponível", "Esse comando só funciona dentro de um servidor.")],
          ephemeral: true,
        })
        return
      }

      const account = await prisma.account.findFirst({
        where: { provider: "discord", providerAccountId: interaction.user.id },
        include: { user: true },
      })

      if (!account) {
        await interaction.reply({
          embeds: [baseEmbed("Conta não vinculada", "Faça login na plataforma web com este mesmo usuário do Discord antes de usar esse comando.")],
          ephemeral: true,
        })
        return
      }

      await showTemplateMenu(interaction, account.userId)
      return
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("pick-template-")) {
      const jobId = interaction.customId.replace("pick-template-", "")
      const job = jobs.get(jobId)
      if (!job) return

      const template = await prisma.template.findUnique({ where: { id: interaction.values[0] } })
      job.templateId = template.id
      job.templateName = template.name
      jobs.set(jobId, job)

      await showCategoryMenu(interaction, job)
      return
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("pick-category-")) {
      const jobId = interaction.customId.replace("pick-category-", "")
      const job = jobs.get(jobId)
      if (!job) return

      const choice = interaction.values[0]

      if (choice === "new-category") {
        const modal = new ModalBuilder()
          .setCustomId(`modal-category-${jobId}`)
          .setTitle("Nova categoria")

        const input = new TextInputBuilder()
          .setCustomId("category-name")
          .setLabel("Nome da categoria")
          .setStyle(TextInputStyle.Short)
          .setRequired(true)

        modal.addComponents(new ActionRowBuilder().addComponents(input))
        await interaction.showModal(modal)
        return
      }

      const category = await interaction.guild.channels.fetch(choice)
      job.categoryId = category.id
      job.categoryName = category.name
      job.categoryIsPrivate = false
      jobs.set(jobId, job)

      await applyTemplate(interaction, job)
      return
    }

    if (interaction.isButton() && interaction.customId.startsWith("cat-prev-")) {
      const jobId = interaction.customId.replace("cat-prev-", "")
      const job = jobs.get(jobId)
      if (!job) return
      await showCategoryMenu(interaction, job, job.categoryPage - 1)
      return
    }

    if (interaction.isButton() && interaction.customId.startsWith("cat-next-")) {
      const jobId = interaction.customId.replace("cat-next-", "")
      const job = jobs.get(jobId)
      if (!job) return
      await showCategoryMenu(interaction, job, job.categoryPage + 1)
      return
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith("modal-category-")) {
      const jobId = interaction.customId.replace("modal-category-", "")
      const job = jobs.get(jobId)
      if (!job) return

      job.categoryId = "new-category"
      job.categoryName = interaction.fields.getTextInputValue("category-name")
      jobs.set(jobId, job)

      const yesButton = new ButtonBuilder()
        .setCustomId(`cat-private-yes-${jobId}`)
        .setLabel("Privada")
        .setStyle(ButtonStyle.Danger)

      const noButton = new ButtonBuilder()
        .setCustomId(`cat-private-no-${jobId}`)
        .setLabel("Pública")
        .setStyle(ButtonStyle.Secondary)

      await interaction.reply({
        embeds: [baseEmbed("Visibilidade da categoria", `A categoria **${job.categoryName}** deve ser privada ou pública?`)],
        components: [new ActionRowBuilder().addComponents(noButton, yesButton)],
        ephemeral: true,
      })
      return
    }

    if (interaction.isButton() && interaction.customId.startsWith("cat-private-no-")) {
      const jobId = interaction.customId.replace("cat-private-no-", "")
      const job = jobs.get(jobId)
      if (!job) return

      job.categoryIsPrivate = false
      jobs.set(jobId, job)

      await applyTemplate(interaction, job)
      return
    }

    if (interaction.isButton() && interaction.customId.startsWith("cat-private-yes-")) {
      const jobId = interaction.customId.replace("cat-private-yes-", "")
      const job = jobs.get(jobId)
      if (!job) return

      job.categoryIsPrivate = true
      job.selectedRoleIds = []
      jobs.set(jobId, job)

      await showRoleMenu(interaction, job, 0)
      return
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("pick-roles-")) {
      const jobId = interaction.customId.replace("pick-roles-", "")
      const job = jobs.get(jobId)
      if (!job) return

      const values = interaction.values

      if (values.includes("new-role")) {
        job.selectedRoleIds = values.filter((v) => v !== "new-role")
        jobs.set(jobId, job)

        const fallbackName = job.pendingChannelName || job.categoryName

        const modal = new ModalBuilder()
          .setCustomId(`modal-role-${jobId}`)
          .setTitle("Novo cargo")

        const input = new TextInputBuilder()
          .setCustomId("role-name")
          .setLabel("Nome do cargo (opcional)")
          .setPlaceholder(`Se deixar em branco, o cargo será chamado de "${fallbackName}"`.slice(0, 100))
          .setStyle(TextInputStyle.Short)
          .setRequired(false)

        modal.addComponents(new ActionRowBuilder().addComponents(input))
        await interaction.showModal(modal)
        return
      }

      job.selectedRoleIds = values
      jobs.set(jobId, job)

      await showRoleMenu(interaction, job, job.rolePage)
      return
    }

    if (interaction.isButton() && interaction.customId.startsWith("role-prev-")) {
      const jobId = interaction.customId.replace("role-prev-", "")
      const job = jobs.get(jobId)
      if (!job) return
      await showRoleMenu(interaction, job, job.rolePage - 1)
      return
    }

    if (interaction.isButton() && interaction.customId.startsWith("role-next-")) {
      const jobId = interaction.customId.replace("role-next-", "")
      const job = jobs.get(jobId)
      if (!job) return
      await showRoleMenu(interaction, job, job.rolePage + 1)
      return
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith("modal-role-")) {
      const jobId = interaction.customId.replace("modal-role-", "")
      const job = jobs.get(jobId)
      if (!job) return

      const typedName = interaction.fields.getTextInputValue("role-name")
      const fallbackName = job.pendingChannelName || job.categoryName
      const roleName = typedName && typedName.trim().length > 0 ? typedName.trim() : fallbackName

      const newRole = await interaction.guild.roles.create({ name: roleName })

      job.selectedRoleIds = [...(job.selectedRoleIds || []), newRole.id]
      jobs.set(jobId, job)

      await interaction.reply({
        embeds: [baseEmbed("Cargo criado", `Cargo **${newRole.name}** criado com sucesso.`)],
        ephemeral: true,
      })

      await showRoleMenu(interaction, job, job.rolePage || 0)
      return
    }

    if (interaction.isButton() && interaction.customId.startsWith("confirm-roles-")) {
      const jobId = interaction.customId.replace("confirm-roles-", "")
      const job = jobs.get(jobId)
      if (!job) return

      if (job.pendingChannelName) {
        await createPendingPrivateChannel(interaction, job)
      } else {
        await applyTemplate(interaction, job)
      }
      return
    }
  } catch (error) {
    console.log("Erro não tratado na interação:", error)
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "Ocorreu um erro inesperado, tente novamente.", ephemeral: true }).catch(() => {})
    }
  }
})

client.login(process.env.DISCORD_BOT_TOKEN)