import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
  isAuthorizationError,
} from "../auth/authorization-error.js"
import { authorizeGuildWithBot } from "./bot-api-client.js"
import { normalizeDiscordId } from "./discord-identifiers.js"

export async function requireGuildAuthorization(actor, guildId, options = {}) {
  const normalizedGuildId = normalizeDiscordId(guildId)
  const normalizedActorId = normalizeDiscordId(actor?.discordUserId)

  if (!normalizedGuildId) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.INVALID_INPUT)
  }

  if (!actor?.userId || !normalizedActorId) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED)
  }

  const authorizeGuild = options.authorizeGuild || authorizeGuildWithBot
  let result

  try {
    result = await authorizeGuild({
      guildId: normalizedGuildId,
      discordUserId: normalizedActorId,
    })
  } catch (error) {
    if (isAuthorizationError(error)) {
      throw error
    }

    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE,
      { cause: error }
    )
  }

  if (!result?.authorized) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.GUILD_ACCESS_DENIED
    )
  }

  if (result.guildId !== normalizedGuildId) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE
    )
  }

  return Object.freeze({
    actor,
    guildId: normalizedGuildId,
  })
}

