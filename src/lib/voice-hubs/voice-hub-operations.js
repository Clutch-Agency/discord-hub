import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
} from "../auth/authorization-error.js"
import { normalizeDiscordId } from "../discord/discord-identifiers.js"

const INTERNAL_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/
const PERMISSION_MODES = new Set(["allow_except", "deny_except"])

function invalidInput() {
  throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.INVALID_INPUT)
}

function normalizeInternalId(value) {
  if (typeof value !== "string") {
    invalidInput()
  }

  const normalized = value.trim()

  if (!INTERNAL_ID_PATTERN.test(normalized)) {
    invalidInput()
  }

  return normalized
}

function normalizeText(value, maximumLength = 100) {
  if (typeof value !== "string") {
    invalidInput()
  }

  const normalized = value.trim()

  if (normalized.length < 1 || normalized.length > maximumLength) {
    invalidInput()
  }

  return normalized
}

function normalizeInteger(value, minimum, maximum) {
  if (!Number.isInteger(value) || value < minimum || value > maximum) {
    invalidInput()
  }

  return value
}

function normalizeRoleIds(values) {
  if (!Array.isArray(values) || values.length > 250) {
    invalidInput()
  }

  const normalized = values.map((value) => normalizeDiscordId(value))

  if (normalized.some((value) => !value)) {
    invalidInput()
  }

  return [...new Set(normalized)]
}

function requireBoolean(value) {
  if (typeof value !== "boolean") {
    invalidInput()
  }

  return value
}

export async function createVoiceHubForOperator(guildId, dependencies) {
  const actor = await dependencies.requireOperator()
  const normalizedGuildId = normalizeDiscordId(guildId)

  if (!normalizedGuildId) {
    invalidInput()
  }

  const authorizedGuild = await dependencies.requireGuildAuthorization(
    actor,
    normalizedGuildId
  )
  const channel = await dependencies.createVoiceChannel(
    authorizedGuild,
    "Hub de Voz Temporário"
  )

  return dependencies.createVoiceHubRecord({
    userId: actor.userId,
    guildId: authorizedGuild.guildId,
    channelId: channel.channelId,
    name: channel.channelName,
    tempChannelName: "{username}'s Room",
    userLimit: 0,
    bitrate: 64000,
    keepAliveMinutes: -1,
    ownershipLockMinutes: -1,
    syncWithCategory: false,
    syncWithHubChannel: false,
    permissionMode: "allow_except",
  })
}

export async function loadVoiceHubForOperator(id, dependencies) {
  const actor = await dependencies.requireOperator()
  const normalizedId = normalizeInternalId(id)
  const voiceHub = await dependencies.findOwnedVoiceHub(
    normalizedId,
    actor.userId
  )

  if (!voiceHub) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.ACCESS_DENIED)
  }

  const authorizedGuild = await dependencies.requireGuildAuthorization(
    actor,
    voiceHub.guildId
  )

  return Object.freeze({ actor, authorizedGuild, voiceHub })
}

export async function updateVoiceHubForOperator(input, dependencies) {
  const context = await loadVoiceHubForOperator(input?.id, dependencies)
  const { actor, authorizedGuild, voiceHub } = context
  const name = normalizeText(input.name)
  const tempChannelName = normalizeText(input.tempChannelName)
  const syncWithCategory = requireBoolean(input.syncWithCategory)
  const requestedHubSync = requireBoolean(input.syncWithHubChannel)
  const permissionMode = PERMISSION_MODES.has(input.permissionMode)
    ? input.permissionMode
    : invalidInput()
  const data = {
    name,
    tempChannelName,
    userLimit: normalizeInteger(input.userLimit, 0, 99),
    bitrate: normalizeInteger(input.bitrateKbps, 8, 96) * 1000,
    keepAliveMinutes: normalizeInteger(input.keepAliveMinutes, -1, 10),
    ownershipLockMinutes: normalizeInteger(
      input.ownershipLockMinutes,
      -1,
      10
    ),
    syncWithCategory,
    syncWithHubChannel: !syncWithCategory && requestedHubSync,
    permissionMode,
  }

  for (const field of [
    "permissionRoles",
    "ignoredRoles",
    "moderatorRoles",
  ]) {
    if (input[field] !== undefined) {
      data[field] = normalizeRoleIds(input[field])
    }
  }

  if (voiceHub.name !== name) {
    await dependencies.updateVoiceChannel(
      authorizedGuild,
      voiceHub.channelId,
      name
    )
  }

  const result = await dependencies.updateVoiceHubRecord(
    voiceHub.id,
    actor.userId,
    data
  )

  if (result?.count !== 1) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE
    )
  }

  return { id: voiceHub.id }
}

export async function deleteVoiceHubForOperator(id, dependencies) {
  const { actor, authorizedGuild, voiceHub } =
    await loadVoiceHubForOperator(id, dependencies)

  await dependencies.deleteVoiceChannel(
    authorizedGuild,
    voiceHub.channelId
  )

  const result = await dependencies.deleteVoiceHubRecord(
    voiceHub.id,
    actor.userId
  )

  if (result?.count !== 1) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE
    )
  }
}

export async function loadVoiceHubRolesForOperator(id, dependencies) {
  const { authorizedGuild } = await loadVoiceHubForOperator(id, dependencies)

  return dependencies.fetchGuildRoles(authorizedGuild)
}
