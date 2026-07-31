const { PermissionFlagsBits } = require("discord.js")

const DISCORD_SNOWFLAKE_PATTERN = /^[1-9]\d{16,19}$/

const GUILD_AUTHORIZATION_CODES = Object.freeze({
  INVALID_INPUT: "INVALID_INPUT",
  ACCESS_DENIED: "ACCESS_DENIED",
  UNAVAILABLE: "UNAVAILABLE",
})

class GuildAuthorizationError extends Error {
  constructor(code, options = {}) {
    super("Guild authorization failed", options.cause ? { cause: options.cause } : undefined)
    this.name = "GuildAuthorizationError"
    this.code = code
  }
}

function normalizeDiscordId(value) {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()

  return DISCORD_SNOWFLAKE_PATTERN.test(normalized) ? normalized : null
}

function isUnknownMemberError(error) {
  return error?.code === 10007 || error?.code === "UnknownMember"
}

function canManageGuild(guild, member, actorDiscordId) {
  if (guild.ownerId === actorDiscordId) {
    return true
  }

  return (
    member.permissions.has(PermissionFlagsBits.Administrator) ||
    member.permissions.has(PermissionFlagsBits.ManageGuild)
  )
}

async function authorizeGuildActor(client, guildId, actorDiscordId) {
  const normalizedGuildId = normalizeDiscordId(guildId)
  const normalizedActorId = normalizeDiscordId(actorDiscordId)

  if (!normalizedGuildId || !normalizedActorId) {
    throw new GuildAuthorizationError(
      GUILD_AUTHORIZATION_CODES.INVALID_INPUT
    )
  }

  const guild = client.guilds.cache.get(normalizedGuildId)

  if (!guild) {
    throw new GuildAuthorizationError(
      GUILD_AUTHORIZATION_CODES.ACCESS_DENIED
    )
  }

  let member

  try {
    member =
      guild.members.cache?.get(normalizedActorId) ||
      (await guild.members.fetch(normalizedActorId))
  } catch (error) {
    if (isUnknownMemberError(error)) {
      throw new GuildAuthorizationError(
        GUILD_AUTHORIZATION_CODES.ACCESS_DENIED
      )
    }

    throw new GuildAuthorizationError(
      GUILD_AUTHORIZATION_CODES.UNAVAILABLE,
      { cause: error }
    )
  }

  if (!member || !canManageGuild(guild, member, normalizedActorId)) {
    throw new GuildAuthorizationError(
      GUILD_AUTHORIZATION_CODES.ACCESS_DENIED
    )
  }

  return {
    guild,
    member,
    guildId: normalizedGuildId,
    actorDiscordId: normalizedActorId,
  }
}

async function listAuthorizedGuilds(client, actorDiscordId) {
  const normalizedActorId = normalizeDiscordId(actorDiscordId)

  if (!normalizedActorId) {
    throw new GuildAuthorizationError(
      GUILD_AUTHORIZATION_CODES.INVALID_INPUT
    )
  }

  const authorizedGuilds = []

  for (const guild of client.guilds.cache.values()) {
    try {
      const authorization = await authorizeGuildActor(
        client,
        guild.id,
        normalizedActorId
      )

      authorizedGuilds.push({
        id: authorization.guild.id,
        name: authorization.guild.name,
        icon: authorization.guild.iconURL(),
        memberCount: authorization.guild.memberCount,
      })
    } catch (error) {
      if (error.code === GUILD_AUTHORIZATION_CODES.ACCESS_DENIED) {
        continue
      }

      throw error
    }
  }

  return authorizedGuilds
}

module.exports = {
  GUILD_AUTHORIZATION_CODES,
  GuildAuthorizationError,
  authorizeGuildActor,
  canManageGuild,
  listAuthorizedGuilds,
  normalizeDiscordId,
}
