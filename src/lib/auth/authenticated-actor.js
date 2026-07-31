import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
  isAuthorizationError,
} from "./authorization-error.js"
import { normalizeDiscordId } from "../discord/discord-identifiers.js"

async function getServerSession() {
  const { auth } = await import("../../auth.js")

  return auth()
}

async function findDiscordAccount(userId) {
  const { prisma } = await import("../prisma.js")

  return prisma.account.findFirst({
    where: {
      userId,
      provider: "discord",
    },
    select: {
      providerAccountId: true,
    },
  })
}

export async function requireAuthenticatedActor(options = {}) {
  const getSession = options.getSession || getServerSession
  const getDiscordAccount = options.getDiscordAccount || findDiscordAccount

  let session

  try {
    session = await getSession()
  } catch (error) {
    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE,
      { cause: error }
    )
  }

  const userId =
    typeof session?.user?.id === "string" ? session.user.id.trim() : ""

  if (!userId) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED)
  }

  let account

  try {
    account = await getDiscordAccount(userId)
  } catch (error) {
    if (isAuthorizationError(error)) {
      throw error
    }

    throw new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE,
      { cause: error }
    )
  }

  const discordUserId = normalizeDiscordId(account?.providerAccountId)

  if (!discordUserId) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED)
  }

  return Object.freeze({
    userId,
    discordUserId,
  })
}

