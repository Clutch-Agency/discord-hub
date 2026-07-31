const {
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
const { baseEmbed, paginate, paginationRow, respond } = require("./utils")
const domainConstants = require("../domain/domain-constants.json")
const { validateChannelName } = require("./input-validation")
const {
  WorkflowValidationError,
  createTemplateJob,
  validateRoleSelection,
  validateStoredTemplate,
} = require("./template-workflow-validation")

const prisma = new PrismaClient()

const CHANNEL_TYPE_MAP = {
  TEXT: ChannelType.GuildText,
  VOICE: ChannelType.GuildVoice,
  FORUM: ChannelType.GuildForum,
  ANNOUNCEMENT: ChannelType.GuildAnnouncement,
}

const PAGE_SIZE = 24

async function showTemplateMenu(interaction, userId, jobs) {
  const templates = await prisma.template.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: domainConstants.limits.templatesPerUserMax + 1,
  })

  if (templates.length === 0) {
    await interaction.reply({
      embeds: [baseEmbed("Nenhum template encontrado", "Você ainda não criou nenhum template na plataforma web.")],
      ephemeral: true,
    })
    return
  }

  if (
    templates.length > domainConstants.limits.templatesPerUserMax ||
    templates.some((template) => !validateChannelName(template.name))
  ) {
    await interaction.reply({
      embeds: [baseEmbed("Templates indisponíveis", "Revise a quantidade e os nomes dos templates no painel web antes de continuar.")],
      ephemeral: true,
    })
    return
  }

  const jobId = interaction.id
  jobs.set(jobId, createTemplateJob(interaction, userId))

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

async function showCategoryMenu(interaction, job, jobs, page = 0) {
  const guild = interaction.guild
  const categories = guild.channels.cache.filter((c) => c.type === ChannelType.GuildCategory)
  const categoryArray = Array.from(categories.values())
  const maximumPage = Math.max(0, Math.ceil(categoryArray.length / PAGE_SIZE) - 1)

  if (!Number.isInteger(page) || page < 0 || page > maximumPage) {
    throw new WorkflowValidationError()
  }

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

async function showRoleMenu(interaction, job, jobs, page = 0) {
  const guild = interaction.guild
  const roles = await guild.roles.fetch()
  const roleArray = Array.from(roles.values()).filter(
    (r) => r.id !== guild.roles.everyone.id && !r.managed
  )
  const maximumPage = Math.max(0, Math.ceil(roleArray.length / PAGE_SIZE) - 1)

  if (!Number.isInteger(page) || page < 0 || page > maximumPage) {
    throw new WorkflowValidationError()
  }

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

async function applyTemplate(interaction, job, jobs) {
  const template = await prisma.template.findFirst({
    where: { id: job.templateId, userId: job.userId },
    include: { channels: { orderBy: { order: "asc" } } },
  })
  validateStoredTemplate(template, job.userId)

  const guild = interaction.guild

  const categoryOverwrites = []
  if (job.categoryIsPrivate) {
    const roles = await guild.roles.fetch()
    const availableRoleIds = new Set(roles.map((role) => role.id))
    job.selectedRoleIds = validateRoleSelection(
      job.selectedRoleIds,
      availableRoleIds
    )
    categoryOverwrites.push({ id: guild.roles.everyone.id, deny: ["ViewChannel"] })
    for (const roleId of job.selectedRoleIds || []) {
      categoryOverwrites.push({ id: roleId, allow: ["ViewChannel"] })
    }
  }

  let category
  if (job.categoryId === "new-category") {
    category = null
  } else {
    category = await guild.channels.fetch(job.categoryId)

    if (!category || category.type !== ChannelType.GuildCategory) {
      throw new Error("Invalid template workflow category")
    }
  }

  await respond(interaction, {
    embeds: [baseEmbed("Criando canais", `Aplicando template **${job.templateName}** dentro da categoria **${job.categoryName}**...`)],
    components: [],
  })

  if (!category) {
    category = await guild.channels.create({
      name: job.categoryName,
      type: ChannelType.GuildCategory,
      permissionOverwrites: categoryOverwrites,
    })
  }

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

  await processNextPrivateChannel(interaction, job, jobs)
}

async function processNextPrivateChannel(interaction, job, jobs) {
  if (job.privateChannelIndex >= job.remainingPrivateChannels.length) {
    const embed = baseEmbed(
      "Template aplicado",
      `${job.createdCount} canal(is) criado(s) com sucesso dentro de **${job.category.name}**. ${
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

  await showRoleMenu(interaction, job, jobs, 0)
}

async function createPendingPrivateChannel(interaction, job, jobs) {
  const guild = interaction.guild
  const channelData = job.remainingPrivateChannels[job.privateChannelIndex]
  const roles = await guild.roles.fetch()
  const availableRoleIds = new Set(roles.map((role) => role.id))

  job.selectedRoleIds = validateRoleSelection(
    job.selectedRoleIds,
    availableRoleIds
  )

  if (
    !channelData ||
    !domainConstants.channelTypes.includes(channelData.type) ||
    !validateChannelName(channelData.name)
  ) {
    throw new Error("Invalid private channel configuration")
  }

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

  await processNextPrivateChannel(interaction, job, jobs)
}

module.exports = {
  showTemplateMenu,
  showCategoryMenu,
  showRoleMenu,
  applyTemplate,
  processNextPrivateChannel,
  createPendingPrivateChannel,
}
