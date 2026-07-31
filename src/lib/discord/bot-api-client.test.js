import { afterEach, describe, expect, it, vi } from "vitest"
import { AUTHORIZATION_ERROR_CODES } from "../auth/authorization-error.js"
import {
  authorizeGuildWithBot,
  createVoiceChannelWithBot,
  deleteVoiceChannelWithBot,
  fetchAuthorizedGuildsWithBot,
  getBotApiConfiguration,
} from "./bot-api-client.js"

const ACTOR = Object.freeze({
  userId: "owner",
  discordUserId: "11111111111111111",
})
const GUILD_ID = "33333333333333333"
const CHANNEL_ID = "44444444444444444"
const CONFIGURATION = Object.freeze({
  baseUrl: "http://127.0.0.1:3001",
  secret: "test-secret",
  timeoutMs: 1000,
})

afterEach(() => {
  vi.useRealTimers()
})

describe("bot API client", () => {
  it("valida configuração de timeout ausente, mínima e máxima", () => {
    expect(
      getBotApiConfiguration({
        BOT_API_SECRET: "secret",
        BOT_API_PORT: "3001",
      }).timeoutMs
    ).toBe(5000)

    for (const BOT_API_TIMEOUT_MS of ["0", "99", "30001", "invalid"]) {
      expect(() =>
        getBotApiConfiguration({
          BOT_API_SECRET: "secret",
          BOT_API_PORT: "3001",
          BOT_API_TIMEOUT_MS,
        })
      ).toThrowError(
        expect.objectContaining({
          code: AUTHORIZATION_ERROR_CODES.INVALID_CONFIGURATION,
        })
      )
    }
  })

  it("aborta no timeout e não repete uma chamada mutável", async () => {
    vi.useFakeTimers()
    const fetchImpl = vi.fn(
      (_url, options) =>
        new Promise((_resolve, reject) => {
          options.signal.addEventListener("abort", () => {
            reject(Object.assign(new Error("aborted"), { name: "AbortError" }))
          })
        })
    )
    const operation = createVoiceChannelWithBot(
      { actor: ACTOR, guildId: GUILD_ID },
      "Hub",
      {
        configuration: { ...CONFIGURATION, timeoutMs: 200 },
        fetchImpl,
      }
    )
    const rejection = expect(operation).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE,
    })

    await vi.advanceTimersByTimeAsync(201)

    await rejection
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it("envia segredo e ator na criação sem aceitar IDs do payload", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json(
        { channelId: CHANNEL_ID, channelName: "Hub" },
        { status: 201 }
      )
    )

    await createVoiceChannelWithBot(
      { actor: ACTOR, guildId: GUILD_ID },
      " Hub ",
      { configuration: CONFIGURATION, fetchImpl }
    )

    expect(fetchImpl).toHaveBeenCalledTimes(1)
    const [url, options] = fetchImpl.mock.calls[0]
    expect(url).toBe(
      `${CONFIGURATION.baseUrl}/guilds/${GUILD_ID}/voice-channels`
    )
    expect(options.headers).toMatchObject({
      "x-bot-secret": CONFIGURATION.secret,
      "x-actor-discord-id": ACTOR.discordUserId,
    })
    expect(JSON.parse(options.body)).toEqual({ name: "Hub" })
  })

  it("não falha ao excluir um canal já ausente", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({ error: "voice channel not found" }, { status: 404 })
    )

    await expect(
      deleteVoiceChannelWithBot(
        { actor: ACTOR, guildId: GUILD_ID },
        CHANNEL_ID,
        { configuration: CONFIGURATION, fetchImpl }
      )
    ).resolves.toEqual({ channelMissing: true })
  })

  it("nega resposta de autorização para outra guild", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json({
        authorized: true,
        guildId: "99999999999999999",
      })
    )

    await expect(
      authorizeGuildWithBot(
        { guildId: GUILD_ID, discordUserId: ACTOR.discordUserId },
        { configuration: CONFIGURATION, fetchImpl }
      )
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE,
    })
  })

  it("valida toda guild devolvida pelo bot", async () => {
    const fetchImpl = vi.fn(async () =>
      Response.json([{ id: "invalid", name: "Leaked" }])
    )

    await expect(
      fetchAuthorizedGuildsWithBot(
        { actor: ACTOR },
        { configuration: CONFIGURATION, fetchImpl }
      )
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE,
    })
  })
})
