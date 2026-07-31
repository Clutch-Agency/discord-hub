import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
} from "./authorization-error.js"
import { normalizeDiscordId } from "../discord/discord-identifiers.js"

const ALLOWLIST_SEPARATOR_PATTERN = /[,;\s]+/

export function parseOperatorAllowlist(value) {
  if (typeof value !== "string") {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.INVALID_CONFIGURATION
    )
  }

  const entries = value
    .split(ALLOWLIST_SEPARATOR_PATTERN)
    .map((entry) => entry.trim())
    .filter(Boolean)

  if (entries.length === 0) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.INVALID_CONFIGURATION
    )
  }

  const normalizedEntries = entries.map((entry) => normalizeDiscordId(entry))

  if (normalizedEntries.some((entry) => entry === null)) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.INVALID_CONFIGURATION
    )
  }

  return new Set(normalizedEntries)
}

export function assertAllowedOperator(discordUserId, allowlistValue) {
  const normalizedUserId = normalizeDiscordId(discordUserId)

  if (!normalizedUserId) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED)
  }

  const allowedIds = parseOperatorAllowlist(allowlistValue)

  if (!allowedIds.has(normalizedUserId)) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.ACCESS_DENIED)
  }

  return normalizedUserId
}

