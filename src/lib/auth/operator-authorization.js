import { requireAuthenticatedActor } from "./authenticated-actor.js"
import { assertAllowedOperator } from "./operator-allowlist.js"

export async function requireOperator(options = {}) {
  const getActor = options.getActor || requireAuthenticatedActor
  const allowlistValue = Object.hasOwn(options, "allowlistValue")
    ? options.allowlistValue
    : process.env.ALLOWED_DISCORD_USER_IDS

  const actor = await getActor()

  assertAllowedOperator(actor.discordUserId, allowlistValue)

  return Object.freeze({
    ...actor,
    isOperator: true,
  })
}

