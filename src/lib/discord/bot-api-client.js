import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
} from "../auth/authorization-error.js"
import { normalizeDiscordId } from "./discord-identifiers.js"

export const DEFAULT_BOT_API_TIMEOUT_MS = 5000
const MINIMUM_BOT_API_TIMEOUT_MS = 100
const MAXIMUM_BOT_API_TIMEOUT_MS = 30000

export function getBotApiConfiguration(environment = process.env) {
  const secret = environment.BOT_API_SECRET
  const configuredPort = environment.BOT_API_PORT || "3001"
  const configuredTimeout =
    environment.BOT_API_TIMEOUT_MS || String(DEFAULT_BOT_API_TIMEOUT_MS)
  const port = Number.parseInt(configuredPort, 10)
  const timeoutMs = Number.parseInt(configuredTimeout, 10)

  if (
    typeof secret !== "string" ||
    secret.trim().length === 0 ||
    !/^\d+$/.test(configuredPort) ||
    port < 1 ||
    port > 65535 ||
    !/^\d+$/.test(configuredTimeout) ||
    timeoutMs < MINIMUM_BOT_API_TIMEOUT_MS ||
    timeoutMs > MAXIMUM_BOT_API_TIMEOUT_MS
  ) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.INVALID_CONFIGURATION
    )
  }

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    secret,
    timeoutMs,
  }
}

function validateAuthorizationInput(guildId, discordUserId) {
  const normalizedGuildId = normalizeDiscordId(guildId)
  const normalizedDiscordUserId = normalizeDiscordId(discordUserId)

  if (!normalizedGuildId || !normalizedDiscordUserId) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.INVALID_INPUT)
  }

  return {
    guildId: normalizedGuildId,
    discordUserId: normalizedDiscordUserId,
  }
}

function validateActor(actor) {
  const discordUserId = normalizeDiscordId(actor?.discordUserId)

  if (!actor?.userId || !discordUserId) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED)
  }

  return discordUserId
}

function validateChannelId(channelId) {
  const normalizedChannelId = normalizeDiscordId(channelId)

  if (!normalizedChannelId) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.INVALID_INPUT)
  }

  return normalizedChannelId
}

function normalizeChannelName(name) {
  if (typeof name !== "string") {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.INVALID_INPUT)
  }

  const normalizedName = name.trim()

  if (normalizedName.length < 1 || normalizedName.length > 100) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.INVALID_INPUT)
  }

  return normalizedName
}

async function requestBotApi(path, request = {}, dependencies = {}) {
  const configuration =
    dependencies.configuration || getBotApiConfiguration()
  const fetchImpl = dependencies.fetchImpl || fetch
  const controller = new AbortController()
  const timeout = setTimeout(
    () => controller.abort(),
    configuration.timeoutMs
  )

  try {
    return await fetchImpl(`${configuration.baseUrl}${path}`, {
      ...request,
      headers: {
        "x-bot-secret": configuration.secret,
        ...request.headers,
      },
      cache: "no-store",
      signal: controller.signal,
    })
  } catch (error) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE,
      { cause: error }
    )
  } finally {
    clearTimeout(timeout)
  }
}

function throwForFailedResponse(response, options = {}) {
  if (response.status === 400) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.INVALID_INPUT)
  }

  if (response.status === 403) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.GUILD_ACCESS_DENIED
    )
  }

  if (response.status === 404 && options.allowNotFound) {
    return
  }

  if (response.status === 404) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.GUILD_ACCESS_DENIED
    )
  }

  throw new AuthorizationError(
    AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE
  )
}

export async function authorizeGuildWithBot(
  { guildId, discordUserId },
  dependencies
) {
  const input = validateAuthorizationInput(guildId, discordUserId)
  const response = await requestBotApi(
    `/guilds/${input.guildId}/access`,
    { headers: { "x-actor-discord-id": input.discordUserId } },
    dependencies
  )

  if (response.status === 403 || response.status === 404) {
    return { authorized: false }
  }

  if (!response.ok) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE
    )
  }

  const payload = await response.json().catch(() => null)

  if (payload?.authorized !== true || payload.guildId !== input.guildId) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE
    )
  }

  return {
    authorized: true,
    guildId: input.guildId,
  }
}

export async function fetchGuildRolesWithBot({ actor, guildId }) {
  const input = validateAuthorizationInput(guildId, actor?.discordUserId)
  const response = await requestBotApi(`/guilds/${input.guildId}/roles`, {
    headers: { "x-actor-discord-id": input.discordUserId },
  })

  if (response.status === 403 || response.status === 404) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.GUILD_ACCESS_DENIED
    )
  }

  if (!response.ok) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE
    )
  }

  const roles = await response.json().catch(() => null)

  if (!Array.isArray(roles)) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE
    )
  }

  return roles
}

export async function fetchAuthorizedGuildsWithBot({ actor }, dependencies) {
  const discordUserId = validateActor(actor)
  const response = await requestBotApi(
    "/guilds",
    { headers: { "x-actor-discord-id": discordUserId } },
    dependencies
  )

  if (!response.ok) {
    throwForFailedResponse(response)
  }

  const guilds = await response.json().catch(() => null)

  if (
    !Array.isArray(guilds) ||
    guilds.some((guild) => !normalizeDiscordId(guild?.id))
  ) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE
    )
  }

  return guilds.map((guild) => ({
    id: guild.id,
    name: typeof guild.name === "string" ? guild.name : "Servidor Discord",
    icon: typeof guild.icon === "string" ? guild.icon : null,
    memberCount: Number.isInteger(guild.memberCount) ? guild.memberCount : 0,
  }))
}

export async function createVoiceChannelWithBot(
  authorizedGuild,
  name,
  dependencies
) {
  const input = validateAuthorizationInput(
    authorizedGuild?.guildId,
    authorizedGuild?.actor?.discordUserId
  )
  const normalizedName = normalizeChannelName(name)
  const response = await requestBotApi(
    `/guilds/${input.guildId}/voice-channels`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-actor-discord-id": input.discordUserId,
      },
      body: JSON.stringify({ name: normalizedName }),
    },
    dependencies
  )

  if (!response.ok) {
    throwForFailedResponse(response)
  }

  const payload = await response.json().catch(() => null)
  const channelId = normalizeDiscordId(payload?.channelId)

  if (!channelId || typeof payload?.channelName !== "string") {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE
    )
  }

  return { channelId, channelName: payload.channelName }
}

export async function updateVoiceChannelWithBot(
  authorizedGuild,
  channelId,
  name,
  dependencies
) {
  const input = validateAuthorizationInput(
    authorizedGuild?.guildId,
    authorizedGuild?.actor?.discordUserId
  )
  const normalizedChannelId = validateChannelId(channelId)
  const normalizedName = normalizeChannelName(name)
  const response = await requestBotApi(
    `/guilds/${input.guildId}/voice-channels/${normalizedChannelId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-actor-discord-id": input.discordUserId,
      },
      body: JSON.stringify({ name: normalizedName }),
    },
    dependencies
  )

  if (!response.ok) {
    throwForFailedResponse(response)
  }
}

export async function deleteVoiceChannelWithBot(
  authorizedGuild,
  channelId,
  dependencies
) {
  const input = validateAuthorizationInput(
    authorizedGuild?.guildId,
    authorizedGuild?.actor?.discordUserId
  )
  const normalizedChannelId = validateChannelId(channelId)
  const response = await requestBotApi(
    `/guilds/${input.guildId}/voice-channels/${normalizedChannelId}`,
    {
      method: "DELETE",
      headers: { "x-actor-discord-id": input.discordUserId },
    },
    dependencies
  )

  if (!response.ok && response.status !== 404) {
    throwForFailedResponse(response)
  }

  return { channelMissing: response.status === 404 }
}

export async function removeGuildWithBot(authorizedGuild, dependencies) {
  const input = validateAuthorizationInput(
    authorizedGuild?.guildId,
    authorizedGuild?.actor?.discordUserId
  )
  const response = await requestBotApi(
    `/guilds/${input.guildId}`,
    {
      method: "DELETE",
      headers: { "x-actor-discord-id": input.discordUserId },
    },
    dependencies
  )

  if (!response.ok) {
    throwForFailedResponse(response)
  }
}
