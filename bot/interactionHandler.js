const { PrismaClient } = require("@prisma/client")
const { ChannelType, MessageFlags } = require("discord.js")
const {
  showTemplateMenu,
  showCategoryMenu,
  showRoleMenu,
  applyTemplate,
  createPendingPrivateChannel,
} = require("./templateCommands")
const { baseEmbed } = require("./utils")
const {
  WorkflowValidationError,
  getValidatedJob,
  validateModalName,
  validateRoleSelection,
  validateSingleSelection,
} = require("./template-workflow-validation")

const prisma = new PrismaClient()
const jobs = new Map()

async function replyWithWorkflowError(interaction, error) {
  if (!interaction.isRepliable()) {
    return
  }

  const content =
    error instanceof WorkflowValidationError
      ? error.publicMessage
      : "Ocorreu um erro inesperado. Execute o comando novamente."
  const payload = { content, flags: MessageFlags.Ephemeral }

  if (interaction.replied || interaction.deferred) {
    await Promise.resolve(interaction.followUp?.(payload)).catch(() => {})
    return
  }

  await Promise.resolve(interaction.reply(payload)).catch(() => {})
}

function createInteractionHandler(dependencies = {}) {
  const database = dependencies.prisma || prisma
  const workflowJobs = dependencies.jobs || jobs
  const commands = dependencies.commands || {
    showTemplateMenu,
    showCategoryMenu,
    showRoleMenu,
    applyTemplate,
    createPendingPrivateChannel,
  }

  return async function handleInteraction(interaction) {
    try {
      if (
        interaction.isChatInputCommand() &&
        interaction.commandName === "aplicar-template"
      ) {
        if (!interaction.inGuild()) {
          await interaction.reply({
            embeds: [
              baseEmbed(
                "Comando indisponível",
                "Esse comando só funciona dentro de um servidor."
              ),
            ],
            flags: MessageFlags.Ephemeral,
          })
          return
        }

        const account = await database.account.findFirst({
          where: {
            provider: "discord",
            providerAccountId: interaction.user.id,
          },
          include: { user: true },
        })

        if (!account) {
          await interaction.reply({
            embeds: [
              baseEmbed(
                "Conta não vinculada",
                "Faça login na plataforma web com este mesmo usuário do Discord antes de usar esse comando."
              ),
            ],
            flags: MessageFlags.Ephemeral,
          })
          return
        }

        const userTool = await database.userTool.findUnique({
          where: {
            userId_toolKey: {
              userId: account.userId,
              toolKey: "templates",
            },
          },
        })

        if (!userTool?.enabled) {
          await interaction.reply({
            content:
              "A ferramenta de templates não está ativada para sua conta. Ative-a no painel web.",
            flags: MessageFlags.Ephemeral,
          })
          return
        }

        await commands.showTemplateMenu(
          interaction,
          account.userId,
          workflowJobs
        )
        return
      }

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId.startsWith("pick-template-")
      ) {
        const jobId = interaction.customId.slice("pick-template-".length)
        const job = getValidatedJob(interaction, workflowJobs, jobId, {
          requiredFields: ["userId"],
        })
        const templateId = validateSingleSelection(interaction.values, {
          internalId: true,
        })
        const template = await database.template.findFirst({
          where: { id: templateId, userId: job.userId },
          select: { id: true, name: true },
        })

        if (!template) {
          throw new WorkflowValidationError(
            "O template selecionado não pertence mais a esta conta."
          )
        }

        job.templateId = template.id
        job.templateName = validateModalName(template.name, "O nome do template")
        workflowJobs.set(jobId, job)
        await commands.showCategoryMenu(interaction, job, workflowJobs)
        return
      }

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId.startsWith("pick-category-")
      ) {
        const jobId = interaction.customId.slice("pick-category-".length)
        const job = getValidatedJob(interaction, workflowJobs, jobId, {
          requiredFields: ["templateId", "templateName"],
        })
        const choice = validateSingleSelection(interaction.values, {
          allowNewValue: "new-category",
        })

        if (choice === "new-category") {
          const {
            ModalBuilder,
            TextInputBuilder,
            TextInputStyle,
            ActionRowBuilder,
          } = require("discord.js")
          const modal = new ModalBuilder()
            .setCustomId(`modal-category-${jobId}`)
            .setTitle("Nova categoria")
          const input = new TextInputBuilder()
            .setCustomId("category-name")
            .setLabel("Nome da categoria")
            .setStyle(TextInputStyle.Short)
            .setMinLength(1)
            .setMaxLength(100)
            .setRequired(true)

          modal.addComponents(new ActionRowBuilder().addComponents(input))
          await interaction.showModal(modal)
          return
        }

        const category = await interaction.guild.channels.fetch(choice)

        if (!category || category.type !== ChannelType.GuildCategory) {
          throw new WorkflowValidationError(
            "A categoria selecionada não pertence a este servidor."
          )
        }

        job.categoryId = category.id
        job.categoryName = validateModalName(category.name, "O nome da categoria")
        job.categoryIsPrivate = false
        workflowJobs.set(jobId, job)
        await commands.applyTemplate(interaction, job, workflowJobs)
        return
      }

      for (const direction of ["prev", "next"]) {
        const prefix = `cat-${direction}-`

        if (interaction.isButton() && interaction.customId.startsWith(prefix)) {
          const jobId = interaction.customId.slice(prefix.length)
          const job = getValidatedJob(interaction, workflowJobs, jobId, {
            requiredFields: ["templateId", "categoryPage"],
          })
          const page = job.categoryPage + (direction === "next" ? 1 : -1)

          if (!Number.isInteger(page) || page < 0) {
            throw new WorkflowValidationError()
          }

          await commands.showCategoryMenu(interaction, job, workflowJobs, page)
          return
        }
      }

      if (
        interaction.isModalSubmit() &&
        interaction.customId.startsWith("modal-category-")
      ) {
        const jobId = interaction.customId.slice("modal-category-".length)
        const job = getValidatedJob(interaction, workflowJobs, jobId, {
          requiredFields: ["templateId", "templateName"],
        })

        job.categoryId = "new-category"
        job.categoryName = validateModalName(
          interaction.fields.getTextInputValue("category-name"),
          "O nome da categoria"
        )
        workflowJobs.set(jobId, job)

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
          embeds: [
            baseEmbed(
              "Visibilidade da categoria",
              `A categoria **${job.categoryName}** deve ser privada ou pública?`
            ),
          ],
          components: [new ActionRowBuilder().addComponents(noButton, yesButton)],
          flags: MessageFlags.Ephemeral,
        })
        return
      }

      for (const privacy of ["no", "yes"]) {
        const prefix = `cat-private-${privacy}-`

        if (interaction.isButton() && interaction.customId.startsWith(prefix)) {
          const jobId = interaction.customId.slice(prefix.length)
          const job = getValidatedJob(interaction, workflowJobs, jobId, {
            requiredFields: ["templateId", "categoryId", "categoryName"],
          })

          job.categoryIsPrivate = privacy === "yes"
          job.selectedRoleIds = []
          workflowJobs.set(jobId, job)

          if (job.categoryIsPrivate) {
            await commands.showRoleMenu(interaction, job, workflowJobs, 0)
          } else {
            await commands.applyTemplate(interaction, job, workflowJobs)
          }
          return
        }
      }

      if (
        interaction.isStringSelectMenu() &&
        interaction.customId.startsWith("pick-roles-")
      ) {
        const jobId = interaction.customId.slice("pick-roles-".length)
        const job = getValidatedJob(interaction, workflowJobs, jobId, {
          requiredFields: ["categoryName", "rolePage"],
        })
        const roles = await interaction.guild.roles.fetch()
        const availableRoleIds = new Set(roles.map((role) => role.id))
        const values = validateRoleSelection(interaction.values, availableRoleIds, {
          allowNewRole: true,
        })

        if (values.includes("new-role")) {
          job.selectedRoleIds = values.filter((value) => value !== "new-role")
          workflowJobs.set(jobId, job)
          const fallbackName = job.pendingChannelName || job.categoryName
          const {
            ModalBuilder,
            TextInputBuilder,
            TextInputStyle,
            ActionRowBuilder,
          } = require("discord.js")
          const modal = new ModalBuilder()
            .setCustomId(`modal-role-${jobId}`)
            .setTitle("Novo cargo")
          const input = new TextInputBuilder()
            .setCustomId("role-name")
            .setLabel("Nome do cargo (opcional)")
            .setPlaceholder(
              `Se deixar em branco, o cargo será chamado de "${fallbackName}"`.slice(0, 100)
            )
            .setStyle(TextInputStyle.Short)
            .setMaxLength(100)
            .setRequired(false)

          modal.addComponents(new ActionRowBuilder().addComponents(input))
          await interaction.showModal(modal)
          return
        }

        job.selectedRoleIds = values
        workflowJobs.set(jobId, job)
        await commands.showRoleMenu(interaction, job, workflowJobs, job.rolePage)
        return
      }

      for (const direction of ["prev", "next"]) {
        const prefix = `role-${direction}-`

        if (interaction.isButton() && interaction.customId.startsWith(prefix)) {
          const jobId = interaction.customId.slice(prefix.length)
          const job = getValidatedJob(interaction, workflowJobs, jobId, {
            requiredFields: ["categoryName", "rolePage"],
          })
          const page = job.rolePage + (direction === "next" ? 1 : -1)

          if (!Number.isInteger(page) || page < 0) {
            throw new WorkflowValidationError()
          }

          await commands.showRoleMenu(interaction, job, workflowJobs, page)
          return
        }
      }

      if (
        interaction.isModalSubmit() &&
        interaction.customId.startsWith("modal-role-")
      ) {
        const jobId = interaction.customId.slice("modal-role-".length)
        const job = getValidatedJob(interaction, workflowJobs, jobId, {
          requiredFields: ["categoryName", "rolePage"],
        })
        const typedName = validateModalName(
          interaction.fields.getTextInputValue("role-name"),
          "O nome do cargo",
          { optional: true }
        )
        const fallbackName = validateModalName(
          job.pendingChannelName || job.categoryName,
          "O nome do cargo"
        )
        const roleName = typedName || fallbackName
        const newRole = await interaction.guild.roles.create({ name: roleName })

        job.selectedRoleIds = [
          ...new Set([...(job.selectedRoleIds || []), newRole.id]),
        ]
        workflowJobs.set(jobId, job)
        await interaction.reply({
          embeds: [
            baseEmbed("Cargo criado", `Cargo **${newRole.name}** criado com sucesso.`),
          ],
          flags: MessageFlags.Ephemeral,
        })
        await commands.showRoleMenu(interaction, job, workflowJobs, job.rolePage)
        return
      }

      if (
        interaction.isButton() &&
        interaction.customId.startsWith("confirm-roles-")
      ) {
        const jobId = interaction.customId.slice("confirm-roles-".length)
        const job = getValidatedJob(interaction, workflowJobs, jobId, {
          requiredFields: ["categoryName", "selectedRoleIds"],
        })
        const roles = await interaction.guild.roles.fetch()
        const availableRoleIds = new Set(roles.map((role) => role.id))

        job.selectedRoleIds = validateRoleSelection(
          job.selectedRoleIds,
          availableRoleIds
        )

        if (job.pendingChannelName) {
          await commands.createPendingPrivateChannel(
            interaction,
            job,
            workflowJobs
          )
        } else {
          await commands.applyTemplate(interaction, job, workflowJobs)
        }
      }
    } catch (error) {
      console.error("Falha ao processar interação de template.")
      await replyWithWorkflowError(interaction, error)
    }
  }
}

const handleInteraction = createInteractionHandler()

module.exports = { createInteractionHandler, handleInteraction }
