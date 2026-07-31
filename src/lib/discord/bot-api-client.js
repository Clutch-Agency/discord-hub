import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
} from "../auth/authorization-error.js"
import { normalizeDiscordId } from "./discord-identifiers.js"

function getBotApiConfiguration() {
  const secret = process.env.BOT_API_SECRET
  const configuredPort = process.env.BOT_API_PORT || "3001"
  const port = Number.parseInt(configuredPort, 10)

  if (
    typeof secret !== "string" ||
    secret.trim().length === 0 ||
    !/^\d+$/.test(configuredPort) ||
    port < 1 ||
    port > 65535
  ) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.INVALID_CONFIGURATION
    )
  }

  return {
    baseUrl: `http://127.0.0.1:${port}`,
    secret,
  }
}

function getAuthorizedHeaders(secret, discordUserId) {
  return {
    "x-bot-secret": secret,
    "x-actor-discord-id": discordUserId,
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

export async function authorizeGuildWithBot({ guildId, discordUserId }) {
  const input = validateAuthorizationInput(guildId, discordUserId)
  const { baseUrl, secret } = getBotApiConfiguration()

  let response

  try {
    response = await fetch(`${baseUrl}/guilds/${input.guildId}/access`, {
      headers: getAuthorizedHeaders(secret, input.discordUserId),
      cache: "no-store",
    })
  } catch (error) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE,
      { cause: error }
    )
  }

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
  const { baseUrl, secret } = getBotApiConfiguration()

  let response

  try {
    response = await fetch(`${baseUrl}/guilds/${input.guildId}/roles`, {
      headers: getAuthorizedHeaders(secret, input.discordUserId),
      cache: "no-store",
    })
  } catch (error) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE,
      { cause: error }
    )
  }

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
