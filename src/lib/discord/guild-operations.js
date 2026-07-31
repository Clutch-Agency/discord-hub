import {
  isAuthorizationError,
  toAuthorizationFailure,
} from "../auth/authorization-error.js"

export async function listGuildsForOperator(dependencies) {
  const actor = await dependencies.requireOperator()

  return dependencies.fetchAuthorizedGuilds({ actor })
}

export async function getGuildsResult(dependencies) {
  try {
    const guilds = await listGuildsForOperator(dependencies)

    return { error: false, guilds }
  } catch (error) {
    if (!isAuthorizationError(error) && dependencies.onUnexpectedError) {
      dependencies.onUnexpectedError()
    }

    return {
      ...toAuthorizationFailure(error),
      guilds: [],
    }
  }
}

export async function removeGuildForOperator(guildId, dependencies) {
  const actor = await dependencies.requireOperator()
  const authorizedGuild = await dependencies.requireGuildAuthorization(
    actor,
    guildId
  )

  await dependencies.removeGuild(authorizedGuild)
}
