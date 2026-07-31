import { isAuthorizationError } from "../auth/authorization-error.js"
import { actionFailure, actionSuccess } from "../contracts/action-result.js"

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

    return actionSuccess({ roles })
  } catch (error) {
    if (!isAuthorizationError(error) && dependencies.onUnexpectedError) {
      dependencies.onUnexpectedError()
    }

    return actionFailure(error)
  }
}
