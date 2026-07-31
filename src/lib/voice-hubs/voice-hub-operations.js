import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
} from "../auth/authorization-error.js"
import { normalizeDiscordId } from "../discord/discord-identifiers.js"
import {
  assertRolesBelongToGuild,
  validateRoleListConflicts,
  validateVoiceHubId,
  validateVoiceHubName,
  validateVoiceHubUpdateInput,
} from "./voice-hub-validation.js"

const ROLE_FIELDS = ["permissionRoles", "ignoredRoles", "moderatorRoles"]

function invalidGuildId(publicMessage = "O servidor selecionado é inválido.") {
  throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.INVALID_INPUT, {
    publicMessage,
    field: "guildId",
  })
}

async function findVoiceHubContext(id, actor, dependencies) {
  const voiceHub = await dependencies.findOwnedVoiceHub(id, actor.userId)

  if (!voiceHub) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.ACCESS_DENIED)
  }

  const authorizedGuild = await dependencies.requireGuildAuthorization(
    actor,
    voiceHub.guildId
  )

  return Object.freeze({ actor, authorizedGuild, voiceHub })
}

export async function createVoiceHubForOperator(guildId, dependencies) {
  const actor = await dependencies.requireOperator()

  if (typeof guildId !== "string" || guildId.trim().length === 0) {
    invalidGuildId("Selecione um servidor para continuar.")
  }

  const normalizedGuildId = normalizeDiscordId(guildId)

  if (!normalizedGuildId) {
    invalidGuildId()
  }

  const name = validateVoiceHubName("Hub de Voz Temporário")
  const authorizedGuild = await dependencies.requireGuildAuthorization(
    actor,
    normalizedGuildId
  )
  const channel = await dependencies.createVoiceChannel(authorizedGuild, name)

  return dependencies.createVoiceHubRecord({
    userId: actor.userId,
    guildId: authorizedGuild.guildId,
    channelId: channel.channelId,
    name: channel.channelName,
    tempChannelName: "Sala de {username}",
    userLimit: 0,
    bitrate: 64000,
    keepAliveMinutes: -1,
    syncWithCategory: false,
    syncWithHubChannel: false,
    permissionMode: "allow_except",
  })
}

export async function loadVoiceHubForOperator(id, dependencies) {
  const actor = await dependencies.requireOperator()
  const normalizedId = validateVoiceHubId(id)

  return findVoiceHubContext(normalizedId, actor, dependencies)
}

export async function updateVoiceHubForOperator(input, dependencies) {
  const actor = await dependencies.requireOperator()
  const validated = validateVoiceHubUpdateInput(input)
  const context = await findVoiceHubContext(validated.id, actor, dependencies)
  const { authorizedGuild, voiceHub } = context
  const combinedRoleLists = {}

  for (const field of ROLE_FIELDS) {
    combinedRoleLists[field] =
      validated[field] === undefined ? voiceHub[field] || [] : validated[field]
  }

  validateRoleListConflicts(combinedRoleLists)

  if (ROLE_FIELDS.some((field) => validated[field]?.length > 0)) {
    const availableRoles = await dependencies.fetchGuildRoles(authorizedGuild)
    assertRolesBelongToGuild(validated, availableRoles)
  }

  const { id, ...data } = validated

  if (voiceHub.name !== data.name) {
    await dependencies.updateVoiceChannel(
      authorizedGuild,
      voiceHub.channelId,
      data.name
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

  await dependencies.deleteVoiceChannel(authorizedGuild, voiceHub.channelId)

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
