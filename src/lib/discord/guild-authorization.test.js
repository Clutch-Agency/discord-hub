import { describe, expect, it, vi } from "vitest"
import { AUTHORIZATION_ERROR_CODES } from "../auth/authorization-error.js"
import { requireGuildAuthorization } from "./guild-authorization.js"

const GUILD_ID = "33333333333333333"
const OTHER_GUILD_ID = "44444444444444444"
const ACTOR = Object.freeze({
  userId: "internal-user-id",
  discordUserId: "11111111111111111",
  isOperator: true,
})

describe("requireGuildAuthorization", () => {
  it("autoriza guild válida permitida e retorna contexto mínimo", async () => {
    const authorizeGuild = vi.fn(async () => ({
      authorized: true,
      guildId: GUILD_ID,
      ignoredData: "must not leak",
    }))

    await expect(
      requireGuildAuthorization(ACTOR, GUILD_ID, { authorizeGuild })
    ).resolves.toEqual({ actor: ACTOR, guildId: GUILD_ID })
  })

  it("nega guild válida sem permissão", async () => {
    await expect(
      requireGuildAuthorization(ACTOR, GUILD_ID, {
        authorizeGuild: async () => ({ authorized: false }),
      })
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.GUILD_ACCESS_DENIED,
    })
  })

  it("rejeita guild inválida antes de consultar a fonte", async () => {
    const authorizeGuild = vi.fn()

    await expect(
      requireGuildAuthorization(ACTOR, "invalid", { authorizeGuild })
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.INVALID_INPUT,
    })
    expect(authorizeGuild).not.toHaveBeenCalled()
  })

  it("nega usuário sem identidade Discord válida", async () => {
    await expect(
      requireGuildAuthorization(
        { userId: ACTOR.userId, discordUserId: "invalid" },
        GUILD_ID,
        { authorizeGuild: vi.fn() }
      )
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED,
    })
  })

  it("impede acesso cruzado quando a fonte responde outra guild", async () => {
    await expect(
      requireGuildAuthorization(ACTOR, GUILD_ID, {
        authorizeGuild: async () => ({
          authorized: true,
          guildId: OTHER_GUILD_ID,
        }),
      })
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE,
    })
  })

  it("falha de forma segura quando a fonte de autorização falha", async () => {
    await expect(
      requireGuildAuthorization(ACTOR, GUILD_ID, {
        authorizeGuild: async () => {
          throw new Error("discord unavailable")
        },
      })
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE,
    })
  })
})

