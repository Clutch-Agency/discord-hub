import { describe, expect, it, vi } from "vitest"
import { AUTHORIZATION_ERROR_CODES } from "./auth/authorization-error.js"
import {
  toggleToolForOperator,
  validateToolToggle,
} from "./user-tools.js"

const ACTOR = Object.freeze({ userId: "owner", isOperator: true })

describe("user tool validation", () => {
  it.each(["templates", "voice-channels"])(
    "aceita a chave oficial %s",
    (toolKey) => {
      expect(validateToolToggle(toolKey, true)).toEqual({
        toolKey,
        enabled: true,
      })
    }
  )

  it.each([
    ["unknown-tool", true],
    ["templates", "true"],
    ["templates", 1],
  ])("rejeita chave ou boolean manipulados", (toolKey, enabled) => {
    expect(() => validateToolToggle(toolKey, enabled)).toThrowError(
      expect.objectContaining({ code: AUTHORIZATION_ERROR_CODES.INVALID_INPUT })
    )
  })

  it("persiste sob o usuário obtido da autorização", async () => {
    const persistToolState = vi.fn()

    await toggleToolForOperator("templates", false, {
      requireOperator: async () => ACTOR,
      persistToolState,
    })

    expect(persistToolState).toHaveBeenCalledWith(
      ACTOR.userId,
      "templates",
      false
    )
  })

  it.each([
    AUTHORIZATION_ERROR_CODES.ACCESS_DENIED,
    AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED,
  ])("não persiste quando a autorização falha com %s", async (code) => {
    const persistToolState = vi.fn()

    await expect(
      toggleToolForOperator("templates", true, {
        requireOperator: async () => {
          const error = new Error("denied")
          error.code = code
          throw error
        },
        persistToolState,
      })
    ).rejects.toMatchObject({ code })
    expect(persistToolState).not.toHaveBeenCalled()
  })
})
