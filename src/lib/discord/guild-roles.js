import {
  isAuthorizationError,
  toAuthorizationFailure,
} from "../auth/authorization-error.js"

export async function loadGuildRolesForOperator(guildId, dependencies) {
  const actor = await dependencies.requireOperator()
  const authorizedGuild = await dependencies.requireGuildAuthorization(
    actor,
    guildId
  )

  return dependencies.fetchGuildRoles(authorizedGuild)
}

export async function getGuildRolesResult(guildId, dependencies) {
  try {
    const roles = await loadGuildRolesForOperator(guildId, dependencies)

    return {
      error: false,
      roles,
    }
  } catch (error) {
    if (!isAuthorizationError(error) && dependencies.onUnexpectedError) {
      dependencies.onUnexpectedError()
    }

    return {
      ...toAuthorizationFailure(error),
      roles: [],
    }
  }
}
