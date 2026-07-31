import { describe, expect, it, vi } from "vitest"
import { AUTHORIZATION_ERROR_CODES } from "./authorization-error.js"
import { requireAuthenticatedActor } from "./authenticated-actor.js"

const USER_ID = "internal-user-id"
const DISCORD_USER_ID = "11111111111111111"

describe("requireAuthenticatedActor", () => {
  it("retorna identidade mínima para uma sessão válida", async () => {
    const actor = await requireAuthenticatedActor({
      getSession: async () => ({ user: { id: USER_ID, name: "Operator" } }),
      getDiscordAccount: async () => ({ providerAccountId: DISCORD_USER_ID }),
    })

    expect(actor).toEqual({
      userId: USER_ID,
      discordUserId: DISCORD_USER_ID,
    })
  })

  it("rejeita sessão ausente", async () => {
    await expect(
      requireAuthenticatedActor({
        getSession: async () => null,
        getDiscordAccount: vi.fn(),
      })
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED,
    })
  })

  it("rejeita identidade ausente ou incompleta", async () => {
    await expect(
      requireAuthenticatedActor({
        getSession: async () => ({ user: {} }),
        getDiscordAccount: vi.fn(),
      })
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED,
    })

    await expect(
      requireAuthenticatedActor({
        getSession: async () => ({ user: { id: USER_ID } }),
        getDiscordAccount: async () => null,
      })
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED,
    })
  })

  it("não permite que dado externo substitua a identidade da sessão", async () => {
    const getDiscordAccount = vi.fn(async () => ({
      providerAccountId: DISCORD_USER_ID,
    }))

    const actor = await requireAuthenticatedActor({
      userId: "client-controlled-user",
      discordUserId: "99999999999999999",
      getSession: async () => ({ user: { id: USER_ID } }),
      getDiscordAccount,
    })

    expect(getDiscordAccount).toHaveBeenCalledWith(USER_ID)
    expect(actor).toEqual({
      userId: USER_ID,
      discordUserId: DISCORD_USER_ID,
    })
  })

  it("representa falha da fonte de identidade de forma previsível", async () => {
    await expect(
      requireAuthenticatedActor({
        getSession: async () => ({ user: { id: USER_ID } }),
        getDiscordAccount: async () => {
          throw new Error("database details")
        },
      })
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE,
    })
  })
})

