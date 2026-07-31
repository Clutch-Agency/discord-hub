import { requireOperator } from "../auth/operator-authorization.js"
import {
  createVoiceChannelWithBot,
  deleteVoiceChannelWithBot,
  fetchGuildRolesWithBot,
  updateVoiceChannelWithBot,
} from "../discord/bot-api-client.js"
import { requireGuildAuthorization } from "../discord/guild-authorization.js"
import { prisma } from "../prisma.js"
import { withMappedPrismaErrors } from "../prisma-errors.js"
import {
  createVoiceHubForOperator,
  deleteVoiceHubForOperator,
  loadVoiceHubForOperator,
  loadVoiceHubRolesForOperator,
  updateVoiceHubForOperator,
} from "./voice-hub-operations.js"

export const VOICE_HUB_SELECT = Object.freeze({
  id: true,
  guildId: true,
  channelId: true,
  name: true,
  tempChannelName: true,
  userLimit: true,
  bitrate: true,
  keepAliveMinutes: true,
  syncWithCategory: true,
  syncWithHubChannel: true,
  permissionMode: true,
  permissionRoles: true,
  ignoredRoles: true,
  moderatorRoles: true,
})

function findOwnedVoiceHub(id, userId) {
  return prisma.voiceHub.findFirst({
    where: { id, userId },
    select: VOICE_HUB_SELECT,
  })
}

const baseDependencies = {
  requireOperator,
  requireGuildAuthorization,
  findOwnedVoiceHub,
}

export function createAuthorizedVoiceHub(guildId) {
  return createVoiceHubForOperator(guildId, {
    ...baseDependencies,
    createVoiceChannel: createVoiceChannelWithBot,
    createVoiceHubRecord: (data) =>
      withMappedPrismaErrors(() => prisma.voiceHub.create({ data })),
  })
}

export function getAuthorizedVoiceHub(id) {
  return loadVoiceHubForOperator(id, baseDependencies)
}

export function updateAuthorizedVoiceHub(input) {
  return updateVoiceHubForOperator(input, {
    ...baseDependencies,
    fetchGuildRoles: fetchGuildRolesWithBot,
    updateVoiceChannel: updateVoiceChannelWithBot,
    updateVoiceHubRecord: (id, userId, data) =>
      withMappedPrismaErrors(() =>
        prisma.voiceHub.updateMany({ where: { id, userId }, data })
      ),
  })
}

export function deleteAuthorizedVoiceHub(id) {
  return deleteVoiceHubForOperator(id, {
    ...baseDependencies,
    deleteVoiceChannel: deleteVoiceChannelWithBot,
    deleteVoiceHubRecord: (voiceHubId, userId) =>
      withMappedPrismaErrors(() =>
        prisma.voiceHub.deleteMany({ where: { id: voiceHubId, userId } })
      ),
  })
}

export function getAuthorizedVoiceHubRoles(id) {
  return loadVoiceHubRolesForOperator(id, {
    ...baseDependencies,
    fetchGuildRoles: fetchGuildRolesWithBot,
  })
}
