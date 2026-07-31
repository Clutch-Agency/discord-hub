import { describe, expect, it } from "vitest"
import { AUTHORIZATION_ERROR_CODES } from "./authorization-error.js"
import { requireOperator } from "./operator-authorization.js"

const ACTOR = Object.freeze({
  userId: "internal-user-id",
  discordUserId: "11111111111111111",
})

describe("requireOperator", () => {
  it("autoriza usuário autenticado presente na allowlist", async () => {
    await expect(
      requireOperator({
        getActor: async () => ACTOR,
        allowlistValue: ACTOR.discordUserId,
      })
    ).resolves.toEqual({ ...ACTOR, isOperator: true })
  })

  it("nega usuário autenticado fora da allowlist", async () => {
    await expect(
      requireOperator({
        getActor: async () => ACTOR,
        allowlistValue: "22222222222222222",
      })
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.ACCESS_DENIED,
    })
  })

  it("preserva a falha de usuário não autenticado", async () => {
    await expect(
      requireOperator({
        getActor: async () => {
          const error = new Error("not authenticated")
          error.code = AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED
          throw error
        },
        allowlistValue: ACTOR.discordUserId,
      })
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED,
    })
  })

  it("nega quando a configuração é inválida", async () => {
    await expect(
      requireOperator({
        getActor: async () => ACTOR,
        allowlistValue: "",
      })
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.INVALID_CONFIGURATION,
    })
  })
})

