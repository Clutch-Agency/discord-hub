const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} = require("discord.js")

const PAGE_SIZE = 24

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
    await interaction.followUp({ ...payload, flags: MessageFlags.Ephemeral })
    return
  }

  if (interaction.isButton() || interaction.isStringSelectMenu()) {
    await interaction.update(payload)
    return
  }

  await interaction.reply({ ...payload, flags: MessageFlags.Ephemeral })
}

module.exports = {
  baseEmbed,
  paginate,
  paginationRow,
  respond,
}
