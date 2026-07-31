const domainConstants = require("../domain/domain-constants.json")
const { normalizeDiscordId } = require("./guild-authorization")

function normalizeBitrate(hubBitrate, guildMaximumBitrate) {
  const requestedBitrate = Number.isInteger(hubBitrate) ? hubBitrate : 64000
  const maximumBitrate = Number.isInteger(guildMaximumBitrate)
    ? guildMaximumBitrate
    : 96000

  return Math.min(Math.max(8000, requestedBitrate), maximumBitrate)
}

function normalizeUserLimit(userLimit) {
  if (!Number.isInteger(userLimit)) {
    return 0
  }

  return Math.min(Math.max(0, userLimit), 99)
}

function renderTemporaryChannelName(template, username, index) {
  if (
    typeof template !== "string" ||
    typeof username !== "string" ||
    !Number.isInteger(index) ||
    index < 1 ||
    /[\u0000-\u001F\u007F]/.test(template)
  ) {
    return null
  }

  const unsupported = template
    .replace(/\{(?:username|index)\}/gi, "")
    .match(/[{}]/)

  if (unsupported) {
    return null
  }

  const name = template
    .replace(/\{username\}/gi, username)
    .replace(/\{index\}/gi, String(index))
    .trim()

  return name.length >= 1 && name.length <= 100 ? name : null
}

function validateRoleLists(hub, availableRoleIds) {
  const seen = new Set()

  for (const field of ["permissionRoles", "ignoredRoles", "moderatorRoles"]) {
    const values = hub[field]

    if (
      !Array.isArray(values) ||
      values.length > domainConstants.limits.roleIdsPerListMax
    ) {
      return false
    }

    for (const value of values) {
      const roleId = normalizeDiscordId(value)

      if (!roleId || seen.has(roleId) || !availableRoleIds.has(roleId)) {
        return false
      }

      seen.add(roleId)
    }
  }

  return true
}

function validateRuntimeVoiceHub(hub, availableRoleIds) {
  return Boolean(
    hub &&
      typeof hub === "object" &&
      Number.isInteger(hub.userLimit) &&
      hub.userLimit >= 0 &&
      hub.userLimit <= 99 &&
      Number.isInteger(hub.bitrate) &&
      hub.bitrate >= 8000 &&
      hub.bitrate <= 96000 &&
      domainConstants.retentionMinutes.includes(hub.keepAliveMinutes) &&
      typeof hub.syncWithCategory === "boolean" &&
      typeof hub.syncWithHubChannel === "boolean" &&
      !(hub.syncWithCategory && hub.syncWithHubChannel) &&
      domainConstants.permissionModes.includes(hub.permissionMode) &&
      validateRoleLists(hub, availableRoleIds)
  )
}

module.exports = {
  normalizeBitrate,
  normalizeUserLimit,
  renderTemporaryChannelName,
  validateRuntimeVoiceHub,
}
