import { describe, expect, it, vi } from "vitest"
import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
} from "../auth/authorization-error.js"
import { reorderTemplateChannels } from "./channel-order.js"

const ACTOR = Object.freeze({ userId: "owner", isOperator: true })
const TEMPLATE_ID = "template_123"
const FIRST_ID = "channel_1"
const SECOND_ID = "channel_2"

function dependencies(overrides = {}) {
  return {
    requireOperator: async () => ACTOR,
    findOwnedTemplate: async () => ({
      id: TEMPLATE_ID,
      channels: [{ id: FIRST_ID }, { id: SECOND_ID }],
    }),
    persistOrder: vi.fn(),
    ...overrides,
  }
}

describe("reorderTemplateChannels", () => {
  it("persiste a ordem normalizada no servidor", async () => {
    const deps = dependencies()

    await reorderTemplateChannels(
      TEMPLATE_ID,
      [{ id: SECOND_ID, order: 900 }, { id: FIRST_ID, order: -5 }],
      deps
    )

    expect(deps.persistOrder).toHaveBeenCalledWith(TEMPLATE_ID, [
      SECOND_ID,
      FIRST_ID,
    ])
  })

  it("não consulta nem persiste sem operador", async () => {
    const findOwnedTemplate = vi.fn()
    const persistOrder = vi.fn()

    await expect(
      reorderTemplateChannels(TEMPLATE_ID, [], {
        requireOperator: async () => {
          throw new AuthorizationError(
            AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED
          )
        },
        findOwnedTemplate,
        persistOrder,
      })
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED,
    })
    expect(findOwnedTemplate).not.toHaveBeenCalled()
    expect(persistOrder).not.toHaveBeenCalled()
  })

  it.each([
    ["template de outro usuário", null, [{ id: FIRST_ID }, { id: SECOND_ID }]],
    ["ID inexistente", null, [{ id: FIRST_ID }, { id: SECOND_ID }]],
  ])("nega %s sem enumerar recursos", async (_label, template, submitted) => {
    const deps = dependencies({ findOwnedTemplate: async () => template })

    await expect(
      reorderTemplateChannels(TEMPLATE_ID, submitted, deps)
    ).rejects.toMatchObject({ code: AUTHORIZATION_ERROR_CODES.ACCESS_DENIED })
    expect(deps.persistOrder).not.toHaveBeenCalled()
  })

  it.each([
    ["duplicado", [{ id: FIRST_ID }, { id: FIRST_ID }]],
    ["omitido", [{ id: FIRST_ID }]],
    ["extra", [{ id: FIRST_ID }, { id: SECOND_ID }, { id: "channel_3" }]],
    ["externo", [{ id: FIRST_ID }, { id: "foreign_channel" }]],
    ["payload inválido", null],
  ])("rejeita conjunto %s e não persiste", async (_label, submitted) => {
    const deps = dependencies()

    await expect(
      reorderTemplateChannels(TEMPLATE_ID, submitted, deps)
    ).rejects.toMatchObject({ code: AUTHORIZATION_ERROR_CODES.INVALID_INPUT })
    expect(deps.persistOrder).not.toHaveBeenCalled()
  })
})
