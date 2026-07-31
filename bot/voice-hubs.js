const { ChannelType, PermissionFlagsBits } = require("discord.js")
const {
  normalizeBitrate,
  normalizeUserLimit,
  renderTemporaryChannelName,
  validateRuntimeVoiceHub,
} = require("./voice-hub-utils")

const activeTemporaryChannels = new Map()
const creationLocks = new Set()

const accessPermissions = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.Connect,
  PermissionFlagsBits.Speak,
]

const ownerPermissions = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.Connect,
  PermissionFlagsBits.Speak,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.MoveMembers,
]

const moderatorPermissions = [
  PermissionFlagsBits.ViewChannel,
  PermissionFlagsBits.Connect,
  PermissionFlagsBits.Speak,
  PermissionFlagsBits.ManageChannels,
  PermissionFlagsBits.MoveMembers,
  PermissionFlagsBits.MuteMembers,
  PermissionFlagsBits.DeafenMembers,
]

function memberHasAnyRole(member, roleIds) {
  if (!Array.isArray(roleIds) || roleIds.length === 0) {
    return false
  }

  return roleIds.some((roleId) => member.roles.cache.has(roleId))
}

function getTemporaryChannelIndex(hubId) {
  return (
    Array.from(activeTemporaryChannels.values()).filter(
      (temporaryChannel) => temporaryChannel.hubId === hubId
    ).length + 1
  )
}

function getTemporaryChannelName(hub, member) {
  const index = getTemporaryChannelIndex(hub.id)

  return renderTemporaryChannelName(
    hub.tempChannelName,
    member.displayName,
    index
  )
}

function getChannelOverwrites(channel) {
  return channel.permissionOverwrites.cache.map((overwrite) => ({
    id: overwrite.id,
    allow: overwrite.allow.toArray(),
    deny: overwrite.deny.toArray(),
  }))
}

function buildCustomOverwrites(hub, guild, member) {
  const overwrites = []

  if (hub.permissionMode === "deny_except") {
    overwrites.push({
      id: guild.roles.everyone.id,
      deny: accessPermissions,
    })

    for (const roleId of hub.permissionRoles || []) {
      overwrites.push({
        id: roleId,
        allow: accessPermissions,
      })
    }
  }

  if (hub.permissionMode === "allow_except") {
    for (const roleId of hub.permissionRoles || []) {
      overwrites.push({
        id: roleId,
        deny: accessPermissions,
      })
    }
  }

  for (const roleId of hub.moderatorRoles || []) {
    overwrites.push({
      id: roleId,
      allow: moderatorPermissions,
    })
  }

  overwrites.push({
    id: member.id,
    allow: ownerPermissions,
  })

  return overwrites
}

function mergeMemberOverwrite(overwrites, memberId) {
  const existing = overwrites.find(
    (overwrite) => String(overwrite.id) === String(memberId)
  )

  if (!existing) {
    overwrites.push({
      id: memberId,
      allow: ownerPermissions,
    })

    return overwrites
  }

  const allow = Array.isArray(existing.allow) ? existing.allow : []

  existing.allow = [...new Set([...allow, ...ownerPermissions])]

  return overwrites
}

function mergeModeratorOverwrites(overwrites, roleIds) {
  for (const roleId of roleIds || []) {
    const existing = overwrites.find(
      (overwrite) => String(overwrite.id) === String(roleId)
    )

    if (!existing) {
      overwrites.push({
        id: roleId,
        allow: moderatorPermissions,
      })

      continue
    }

    const allow = Array.isArray(existing.allow) ? existing.allow : []

    existing.allow = [...new Set([...allow, ...moderatorPermissions])]
  }

  return overwrites
}

function getPermissionOverwrites(hub, hubChannel, guild, member) {
  let overwrites = []

  if (hub.syncWithCategory && hubChannel.parent) {
    overwrites = getChannelOverwrites(hubChannel.parent)
  } else if (hub.syncWithHubChannel) {
    overwrites = getChannelOverwrites(hubChannel)
  } else {
    overwrites = buildCustomOverwrites(hub, guild, member)
  }

  mergeMemberOverwrite(overwrites, member.id)
  mergeModeratorOverwrites(overwrites, hub.moderatorRoles || [])

  return overwrites
}

async function deleteTemporaryChannel(client, channelId) {
  const temporaryChannel = activeTemporaryChannels.get(channelId)

  if (!temporaryChannel) {
    return
  }

  if (temporaryChannel.deleteTimer) {
    clearTimeout(temporaryChannel.deleteTimer)
  }

  activeTemporaryChannels.delete(channelId)

  try {
    const guild = client.guilds.cache.get(temporaryChannel.guildId)

    if (!guild) {
      return
    }

    const channel = await guild.channels.fetch(channelId).catch(() => null)

    if (!channel) {
      return
    }

    await channel.delete("Canal temporário vazio")
    console.log(`Canal temporário removido: ${channel.name}`)
  } catch (error) {
    console.log(
      `Erro ao excluir canal temporário ${channelId}: ${error.message}`
    )
  }
}

async function scheduleTemporaryChannelDeletion(client, channelId) {
  const temporaryChannel = activeTemporaryChannels.get(channelId)

  if (!temporaryChannel || temporaryChannel.deleteTimer) {
    return
  }

  if (temporaryChannel.keepAliveMinutes === -1) {
    return
  }

  const delay = Math.max(0, temporaryChannel.keepAliveMinutes) * 60 * 1000

  if (delay === 0) {
    await deleteTemporaryChannel(client, channelId)
    return
  }

  temporaryChannel.deleteTimer = setTimeout(() => {
    deleteTemporaryChannel(client, channelId)
  }, delay)

  activeTemporaryChannels.set(channelId, temporaryChannel)

  console.log(
    `Canal temporário será removido em ${temporaryChannel.keepAliveMinutes} minuto(s): ${channelId}`
  )
}

function cancelTemporaryChannelDeletion(channelId) {
  const temporaryChannel = activeTemporaryChannels.get(channelId)

  if (!temporaryChannel || !temporaryChannel.deleteTimer) {
    return
  }

  clearTimeout(temporaryChannel.deleteTimer)

  temporaryChannel.deleteTimer = null

  activeTemporaryChannels.set(channelId, temporaryChannel)
}

async function createTemporaryChannel(client, hub, member, hubChannel) {
  const guild = member.guild
  const roles = await guild.roles.fetch()
  const availableRoleIds = new Set(roles.map((role) => role.id))

  if (!validateRuntimeVoiceHub(hub, availableRoleIds)) {
    throw new Error("Invalid persisted VoiceHub configuration")
  }

  const channelName = getTemporaryChannelName(hub, member)

  if (!channelName) {
    throw new Error("Invalid temporary channel name")
  }
  const permissionOverwrites = getPermissionOverwrites(
    hub,
    hubChannel,
    guild,
    member
  )

  const channel = await guild.channels.create({
    name: channelName,
    type: ChannelType.GuildVoice,
    parent: hubChannel.parentId || null,
    bitrate: normalizeBitrate(hub.bitrate, guild.maximumBitrate),
    userLimit: normalizeUserLimit(hub.userLimit),
    permissionOverwrites,
    reason: `Canal temporário criado pelo Hub ${hub.name}`,
  })

  activeTemporaryChannels.set(channel.id, {
    channelId: channel.id,
    guildId: guild.id,
    hubId: hub.id,
    ownerId: member.id,
    keepAliveMinutes: hub.keepAliveMinutes,
    deleteTimer: null,
  })

  try {
    await member.voice.setChannel(
      channel,
      "Movido para sala temporária criada pelo Hub"
    )
  } catch (error) {
    activeTemporaryChannels.delete(channel.id)

    await channel
      .delete("Falha ao mover membro para sala temporária")
      .catch(() => null)

    throw error
  }

  console.log(
    `Canal temporário criado: ${channel.name} para ${member.user.tag}`
  )
}

async function handleHubEntry(client, prisma, oldState, newState) {
  if (!newState.channelId || oldState.channelId === newState.channelId) {
    return
  }

  if (!newState.member || newState.member.user.bot) {
    return
  }

  const hub = await prisma.voiceHub.findUnique({
    where: {
      channelId: newState.channelId,
    },
  })

  if (!hub || hub.guildId !== newState.guild.id) {
    return
  }

  if (memberHasAnyRole(newState.member, hub.ignoredRoles)) {
    console.log(
      `Membro ignorado entrou no Hub: ${newState.member.user.tag}`
    )
    return
  }

  const lockKey = `${newState.guild.id}:${newState.member.id}`

  if (creationLocks.has(lockKey)) {
    return
  }

  creationLocks.add(lockKey)

  try {
    const hubChannel = await newState.guild.channels.fetch(hub.channelId)

    if (!hubChannel || hubChannel.type !== ChannelType.GuildVoice) {
      console.log(`Canal Hub inválido: ${hub.channelId}`)
      return
    }

    await createTemporaryChannel(client, hub, newState.member, hubChannel)
  } catch (error) {
    console.log(
      `Erro ao criar sala temporária para ${newState.member.user.tag}: ${error.message}`
    )
  } finally {
    creationLocks.delete(lockKey)
  }
}

async function handleTemporaryChannelChange(client, oldState, newState) {
  if (newState.channelId && activeTemporaryChannels.has(newState.channelId)) {
    cancelTemporaryChannelDeletion(newState.channelId)
  }

  if (!oldState.channelId || !activeTemporaryChannels.has(oldState.channelId)) {
    return
  }

  const oldChannel = oldState.channel

  if (!oldChannel || oldChannel.members.size > 0) {
    return
  }

  await scheduleTemporaryChannelDeletion(client, oldState.channelId)
}

function registerVoiceHubHandlers(client, prisma) {
  client.on("voiceStateUpdate", async (oldState, newState) => {
    try {
      await handleTemporaryChannelChange(client, oldState, newState)
      await handleHubEntry(client, prisma, oldState, newState)
    } catch (error) {
      console.log(`Erro no evento de voz: ${error.message}`)
    }
  })

  client.on("channelDelete", (channel) => {
    const temporaryChannel = activeTemporaryChannels.get(channel.id)

    if (!temporaryChannel) {
      return
    }

    if (temporaryChannel.deleteTimer) {
      clearTimeout(temporaryChannel.deleteTimer)
    }

    activeTemporaryChannels.delete(channel.id)
  })
}

module.exports = {
  registerVoiceHubHandlers,
}
