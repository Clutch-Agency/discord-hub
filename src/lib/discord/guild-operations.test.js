import { describe, expect, it, vi } from "vitest"
import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
} from "../auth/authorization-error.js"
import {
  getGuildsResult,
  listGuildsForOperator,
  removeGuildForOperator,
} from "./guild-operations.js"

const ACTOR = Object.freeze({
  userId: "internal-user",
  discordUserId: "11111111111111111",
  isOperator: true,
})
const GUILD_ID = "33333333333333333"

describe("guild operations", () => {
  it("lista somente depois de autorizar o operador", async () => {
    const guilds = [{ id: GUILD_ID, name: "Allowed" }]
    const fetchAuthorizedGuilds = vi.fn(async () => guilds)

    await expect(
      listGuildsForOperator({
        requireOperator: async () => ACTOR,
        fetchAuthorizedGuilds,
      })
    ).resolves.toEqual(guilds)
    expect(fetchAuthorizedGuilds).toHaveBeenCalledWith({ actor: ACTOR })
  })

  it("não consulta o bot sem sessão ou allowlist", async () => {
    for (const code of [
      AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED,
      AUTHORIZATION_ERROR_CODES.ACCESS_DENIED,
    ]) {
      const fetchAuthorizedGuilds = vi.fn()

      await expect(
        listGuildsForOperator({
          requireOperator: async () => {
            throw new AuthorizationError(code)
          },
          fetchAuthorizedGuilds,
        })
      ).rejects.toMatchObject({ code })
      expect(fetchAuthorizedGuilds).not.toHaveBeenCalled()
    }
  })

  it("retorna falha pública segura quando o bot está indisponível", async () => {
    const result = await getGuildsResult({
      requireOperator: async () => ACTOR,
      fetchAuthorizedGuilds: async () => {
        throw new AuthorizationError(
          AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE,
          { cause: new Error("internal token") }
        )
      },
    })

    expect(result.guilds).toEqual([])
    expect(result.code).toBe(
      AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE
    )
    expect(JSON.stringify(result)).not.toContain("token")
  })

  it("remove a guild somente após autorização web por guild", async () => {
    const removeGuild = vi.fn()
    const authorizedGuild = { actor: ACTOR, guildId: GUILD_ID }

    await removeGuildForOperator(GUILD_ID, {
      requireOperator: async () => ACTOR,
      requireGuildAuthorization: async () => authorizedGuild,
      removeGuild,
    })

    expect(removeGuild).toHaveBeenCalledWith(authorizedGuild)
  })

  it("não remove a guild depois de uma negação", async () => {
    const removeGuild = vi.fn()

    await expect(
      removeGuildForOperator(GUILD_ID, {
        requireOperator: async () => ACTOR,
        requireGuildAuthorization: async () => {
          throw new AuthorizationError(
            AUTHORIZATION_ERROR_CODES.GUILD_ACCESS_DENIED
          )
        },
        removeGuild,
      })
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.GUILD_ACCESS_DENIED,
    })
    expect(removeGuild).not.toHaveBeenCalled()
  })
})
