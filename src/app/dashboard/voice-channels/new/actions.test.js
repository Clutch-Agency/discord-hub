import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
} from "@/lib/auth/authorization-error"
import { ACTION_RESULT_CODES } from "@/lib/contracts/action-result"

const mocks = vi.hoisted(() => ({
  createAuthorizedVoiceHub: vi.fn(),
  redirect: vi.fn(),
  revalidatePath: vi.fn(),
}))

vi.mock("@/lib/voice-hubs/voice-hub-service", () => ({
  createAuthorizedVoiceHub: mocks.createAuthorizedVoiceHub,
}))

vi.mock("next/navigation", () => ({ redirect: mocks.redirect }))
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidatePath }))

import { createVoiceHub } from "./actions"

const GUILD_ID = "33333333333333333"

function formData(guildId) {
  const data = new FormData()

  if (guildId !== undefined) {
    data.set("guildId", guildId)
  }

  return data
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("create VoiceHub action", () => {
  it("retorna o erro esperado de guildId sem lançar para a boundary", async () => {
    mocks.createAuthorizedVoiceHub.mockRejectedValue(
      new AuthorizationError(AUTHORIZATION_ERROR_CODES.INVALID_INPUT, {
        publicMessage: "Selecione um servidor para continuar.",
        field: "guildId",
      })
    )

    await expect(createVoiceHub(formData())).resolves.toEqual({
      ok: false,
      code: ACTION_RESULT_CODES.INVALID_INPUT,
      message: "Selecione um servidor para continuar.",
      field: "guildId",
    })
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
    expect(mocks.redirect).not.toHaveBeenCalled()
  })

  it.each([
    [
      AUTHORIZATION_ERROR_CODES.GUILD_ACCESS_DENIED,
      ACTION_RESULT_CODES.GUILD_ACCESS_DENIED,
    ],
    [
      AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE,
      ACTION_RESULT_CODES.EXTERNAL_UNAVAILABLE,
    ],
    [
      AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED,
      ACTION_RESULT_CODES.UNAUTHENTICATED,
    ],
  ])("preserva a categoria de falha %s", async (errorCode, resultCode) => {
    mocks.createAuthorizedVoiceHub.mockRejectedValue(
      new AuthorizationError(errorCode)
    )

    await expect(createVoiceHub(formData(GUILD_ID))).resolves.toMatchObject({
      ok: false,
      code: resultCode,
    })
    expect(mocks.revalidatePath).not.toHaveBeenCalled()
    expect(mocks.redirect).not.toHaveBeenCalled()
  })

  it("revalida e redireciona após a criação autorizada", async () => {
    mocks.createAuthorizedVoiceHub.mockResolvedValue({ id: "voice_hub_123" })

    await createVoiceHub(formData(GUILD_ID))

    expect(mocks.createAuthorizedVoiceHub).toHaveBeenCalledWith(GUILD_ID)
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(
      1,
      "/dashboard/voice-channels"
    )
    expect(mocks.revalidatePath).toHaveBeenNthCalledWith(
      2,
      "/dashboard/voice-channels/voice_hub_123"
    )
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/dashboard/voice-channels/voice_hub_123"
    )
  })
})
