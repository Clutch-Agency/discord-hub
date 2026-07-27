const { PrismaClient } = require("@prisma/client")
const { showTemplateMenu, showCategoryMenu, showRoleMenu, applyTemplate, processNextPrivateChannel, createPendingPrivateChannel } = require("./templateCommands") // Novo arquivo para comandos de template
const { baseEmbed, respond } = require("./utils") // Novo arquivo para utilitários

const prisma = new PrismaClient()
const jobs = new Map() // Mantenha o Map de jobs aqui ou em um módulo de estado

async function handleInteraction(interaction, client) {
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

      const userTool = await prisma.userTool.findUnique({
        where: {
          userId_toolKey: {
            userId: account.userId,
            toolKey: 'templates',
          },
        },
      });

      if (!userTool || !userTool.enabled) {
        await interaction.reply({
          content: 'A ferramenta de templates não está ativada para sua conta. Ative-a no painel web.',
          ephemeral: true,
        });
        return;
      }

      await showTemplateMenu(interaction, account.userId, jobs)
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

      await showCategoryMenu(interaction, job, jobs)
      return
    }

    if (interaction.isStringSelectMenu() && interaction.customId.startsWith("pick-category-")) {
      const jobId = interaction.customId.replace("pick-category-", "")
      const job = jobs.get(jobId)
      if (!job) return

      const choice = interaction.values[0]

      if (choice === "new-category") {
        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js")
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

      await applyTemplate(interaction, job, jobs)
      return
    }

    if (interaction.isButton() && interaction.customId.startsWith("cat-prev-")) {
      const jobId = interaction.customId.replace("cat-prev-", "")
      const job = jobs.get(jobId)
      if (!job) return
      await showCategoryMenu(interaction, job, jobs, job.categoryPage - 1)
      return
    }

    if (interaction.isButton() && interaction.customId.startsWith("cat-next-")) {
      const jobId = interaction.customId.replace("cat-next-", "")
      const job = jobs.get(jobId)
      if (!job) return
      await showCategoryMenu(interaction, job, jobs, job.categoryPage + 1)
      return
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith("modal-category-")) {
      const jobId = interaction.customId.replace("modal-category-", "")
      const job = jobs.get(jobId)
      if (!job) return

      job.categoryId = "new-category"
      job.categoryName = interaction.fields.getTextInputValue("category-name")
      jobs.set(jobId, job)

      const { ButtonBuilder, ButtonStyle, ActionRowBuilder } = require("discord.js")
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

      await applyTemplate(interaction, job, jobs)
      return
    }

    if (interaction.isButton() && interaction.customId.startsWith("cat-private-yes-")) {
      const jobId = interaction.customId.replace("cat-private-yes-", "")
      const job = jobs.get(jobId)
      if (!job) return

      job.categoryIsPrivate = true
      job.selectedRoleIds = []
      jobs.set(jobId, job)

      await showRoleMenu(interaction, job, jobs, 0)
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

        const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js")
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

      await showRoleMenu(interaction, job, jobs, job.rolePage)
      return
    }

    if (interaction.isButton() && interaction.customId.startsWith("role-prev-")) {
      const jobId = interaction.customId.replace("role-prev-", "")
      const job = jobs.get(jobId)
      if (!job) return
      await showRoleMenu(interaction, job, jobs, job.rolePage - 1)
      return
    }

    if (interaction.isButton() && interaction.customId.startsWith("role-next-")) {
      const jobId = interaction.customId.replace("role-next-", "")
      const job = jobs.get(jobId)
      if (!job) return
      await showRoleMenu(interaction, job, jobs, job.rolePage + 1)
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

      await showRoleMenu(interaction, job, jobs, job.rolePage || 0)
      return
    }

    if (interaction.isButton() && interaction.customId.startsWith("confirm-roles-")) {
      const jobId = interaction.customId.replace("confirm-roles-", "")
      const job = jobs.get(jobId)
      if (!job) return

      if (job.pendingChannelName) {
        await createPendingPrivateChannel(interaction, job, jobs)
      } else {
        await applyTemplate(interaction, job, jobs)
      }
      return
    }
  } catch (error) {
    console.log("Erro não tratado na interação:", error)
    if (interaction.isRepliable() && !interaction.replied && !interaction.deferred) {
      await interaction.reply({ content: "Ocorreu um erro inesperado, tente novamente.", ephemeral: true }).catch(() => {})
    }
  }
}

module.exports = { handleInteraction }