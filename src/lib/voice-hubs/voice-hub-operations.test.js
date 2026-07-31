import { describe, expect, it, vi } from "vitest"
import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
} from "../auth/authorization-error.js"
import {
  createVoiceHubForOperator,
  deleteVoiceHubForOperator,
  loadVoiceHubForOperator,
  loadVoiceHubRolesForOperator,
  updateVoiceHubForOperator,
} from "./voice-hub-operations.js"

const ACTOR = Object.freeze({
  userId: "owner",
  discordUserId: "11111111111111111",
  isOperator: true,
})
const GUILD_ID = "33333333333333333"
const CHANNEL_ID = "44444444444444444"
const ROLE_ID = "55555555555555555"
const HUB_ID = "voice_hub_123"
const VOICE_HUB = Object.freeze({
  id: HUB_ID,
  guildId: GUILD_ID,
  channelId: CHANNEL_ID,
  name: "Current Hub",
  permissionRoles: [ROLE_ID],
  ignoredRoles: [],
  moderatorRoles: [],
})

function baseDependencies(overrides = {}) {
  return {
    requireOperator: async () => ACTOR,
    requireGuildAuthorization: async (actor, guildId) => ({ actor, guildId }),
    findOwnedVoiceHub: async () => VOICE_HUB,
    ...overrides,
  }
}

function validUpdate(overrides = {}) {
  return {
    id: HUB_ID,
    name: "Updated Hub",
    tempChannelName: "Room {username}",
    userLimit: 10,
    bitrateKbps: 64,
    keepAliveMinutes: 2,
    syncWithCategory: false,
    syncWithHubChannel: true,
    permissionMode: "allow_except",
    permissionRoles: [ROLE_ID],
    ignoredRoles: [],
    moderatorRoles: [],
    ...overrides,
  }
}

describe("VoiceHub operations", () => {
  it("cria canal e registro somente no escopo do ator e guild autorizados", async () => {
    const calls = []
    const createVoiceHubRecord = vi.fn(async (data) => ({ id: HUB_ID, ...data }))

    const result = await createVoiceHubForOperator(
      GUILD_ID,
      baseDependencies({
        requireOperator: async () => {
          calls.push("operator")
          return ACTOR
        },
        requireGuildAuthorization: async (actor, guildId) => {
          calls.push("guild")
          return { actor, guildId }
        },
        createVoiceChannel: async () => {
          calls.push("discord")
          return { channelId: CHANNEL_ID, channelName: "Hub" }
        },
        createVoiceHubRecord: async (data) => {
          calls.push("database")
          return createVoiceHubRecord(data)
        },
      })
    )

    expect(calls).toEqual(["operator", "guild", "discord", "database"])
    expect(result).toMatchObject({
      userId: ACTOR.userId,
      guildId: GUILD_ID,
      channelId: CHANNEL_ID,
    })
  })

  it.each([
    AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED,
    AUTHORIZATION_ERROR_CODES.ACCESS_DENIED,
  ])("não cria efeitos quando o operador falha com %s", async (code) => {
    const requireGuildAuthorization = vi.fn()
    const createVoiceChannel = vi.fn()
    const createVoiceHubRecord = vi.fn()

    await expect(
      createVoiceHubForOperator(GUILD_ID, {
        requireOperator: async () => {
          throw new AuthorizationError(code)
        },
        requireGuildAuthorization,
        createVoiceChannel,
        createVoiceHubRecord,
      })
    ).rejects.toMatchObject({ code })
    expect(requireGuildAuthorization).not.toHaveBeenCalled()
    expect(createVoiceChannel).not.toHaveBeenCalled()
    expect(createVoiceHubRecord).not.toHaveBeenCalled()
  })

  it("não cria canal ou registro quando a guild é negada", async () => {
    const createVoiceChannel = vi.fn()
    const createVoiceHubRecord = vi.fn()

    await expect(
      createVoiceHubForOperator(
        GUILD_ID,
        baseDependencies({
          requireGuildAuthorization: async () => {
            throw new AuthorizationError(
              AUTHORIZATION_ERROR_CODES.GUILD_ACCESS_DENIED
            )
          },
          createVoiceChannel,
          createVoiceHubRecord,
        })
      )
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.GUILD_ACCESS_DENIED,
    })
    expect(createVoiceChannel).not.toHaveBeenCalled()
    expect(createVoiceHubRecord).not.toHaveBeenCalled()
  })

  it("nega recurso de outro usuário sem consultar a guild", async () => {
    const requireGuildAuthorization = vi.fn()

    await expect(
      loadVoiceHubForOperator(
        HUB_ID,
        baseDependencies({
          findOwnedVoiceHub: async () => null,
          requireGuildAuthorization,
        })
      )
    ).rejects.toMatchObject({ code: AUTHORIZATION_ERROR_CODES.ACCESS_DENIED })
    expect(requireGuildAuthorization).not.toHaveBeenCalled()
  })

  it.each([
    ["atualização", "update"],
    ["exclusão", "delete"],
  ])("não inicia %s sem sessão ou allowlist", async (_label, operation) => {
    for (const code of [
      AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED,
      AUTHORIZATION_ERROR_CODES.ACCESS_DENIED,
    ]) {
      const findOwnedVoiceHub = vi.fn()
      const mutableEffect = vi.fn()
      const persistence = vi.fn()
      const deps = {
        requireOperator: async () => {
          throw new AuthorizationError(code)
        },
        requireGuildAuthorization: vi.fn(),
        findOwnedVoiceHub,
        ...(operation === "update"
          ? {
              updateVoiceChannel: mutableEffect,
              updateVoiceHubRecord: persistence,
            }
          : {
              deleteVoiceChannel: mutableEffect,
              deleteVoiceHubRecord: persistence,
            }),
      }
      const result =
        operation === "update"
          ? updateVoiceHubForOperator(validUpdate(), deps)
          : deleteVoiceHubForOperator(HUB_ID, deps)

      await expect(result).rejects.toMatchObject({ code })
      expect(findOwnedVoiceHub).not.toHaveBeenCalled()
      expect(mutableEffect).not.toHaveBeenCalled()
      expect(persistence).not.toHaveBeenCalled()
    }
  })

  it("deriva guild e canal do registro atual ao atualizar", async () => {
    const requireGuildAuthorization = vi.fn(async (actor, guildId) => ({
      actor,
      guildId,
    }))
    const updateVoiceChannel = vi.fn()
    const updateVoiceHubRecord = vi.fn(async () => ({ count: 1 }))

    await updateVoiceHubForOperator(
      validUpdate(),
      baseDependencies({
        requireGuildAuthorization,
        fetchGuildRoles: async () => [{ id: ROLE_ID }],
        updateVoiceChannel,
        updateVoiceHubRecord,
      })
    )

    expect(requireGuildAuthorization).toHaveBeenCalledWith(ACTOR, GUILD_ID)
    expect(updateVoiceChannel).toHaveBeenCalledWith(
      { actor: ACTOR, guildId: GUILD_ID },
      CHANNEL_ID,
      "Updated Hub"
    )
    expect(updateVoiceHubRecord).toHaveBeenCalledWith(
      HUB_ID,
      ACTOR.userId,
      expect.objectContaining({ permissionRoles: [ROLE_ID] })
    )
  })

  it("preserva arrays quando os campos estão ausentes", async () => {
    const updateVoiceHubRecord = vi.fn(async () => ({ count: 1 }))
    const input = validUpdate({ name: VOICE_HUB.name })
    delete input.permissionRoles
    delete input.ignoredRoles
    delete input.moderatorRoles

    await updateVoiceHubForOperator(
      input,
      baseDependencies({
        updateVoiceChannel: vi.fn(),
        updateVoiceHubRecord,
      })
    )

    const data = updateVoiceHubRecord.mock.calls[0][2]
    expect(data).not.toHaveProperty("permissionRoles")
    expect(data).not.toHaveProperty("ignoredRoles")
    expect(data).not.toHaveProperty("moderatorRoles")
  })

  it("persiste arrays vazios quando a limpeza é intencional", async () => {
    const updateVoiceHubRecord = vi.fn(async () => ({ count: 1 }))

    await updateVoiceHubForOperator(
      validUpdate({
        name: VOICE_HUB.name,
        permissionRoles: [],
        ignoredRoles: [],
        moderatorRoles: [],
      }),
      baseDependencies({
        updateVoiceChannel: vi.fn(),
        updateVoiceHubRecord,
      })
    )

    expect(updateVoiceHubRecord.mock.calls[0][2]).toMatchObject({
      permissionRoles: [],
      ignoredRoles: [],
      moderatorRoles: [],
    })
  })

  it("não renomeia nem persiste após negação da guild", async () => {
    const updateVoiceChannel = vi.fn()
    const updateVoiceHubRecord = vi.fn()

    await expect(
      updateVoiceHubForOperator(
        validUpdate(),
        baseDependencies({
          requireGuildAuthorization: async () => {
            throw new AuthorizationError(
              AUTHORIZATION_ERROR_CODES.GUILD_ACCESS_DENIED
            )
          },
          updateVoiceChannel,
          updateVoiceHubRecord,
        })
      )
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.GUILD_ACCESS_DENIED,
    })
    expect(updateVoiceChannel).not.toHaveBeenCalled()
    expect(updateVoiceHubRecord).not.toHaveBeenCalled()
  })

  it("rejeita campos manipulados antes de efeitos mutáveis", async () => {
    const findOwnedVoiceHub = vi.fn()
    const updateVoiceChannel = vi.fn()
    const updateVoiceHubRecord = vi.fn()

    await expect(
      updateVoiceHubForOperator(
        validUpdate({ userLimit: 100 }),
        baseDependencies({
          findOwnedVoiceHub,
          updateVoiceChannel,
          updateVoiceHubRecord,
        })
      )
    ).rejects.toMatchObject({ code: AUTHORIZATION_ERROR_CODES.INVALID_INPUT })
    expect(findOwnedVoiceHub).not.toHaveBeenCalled()
    expect(updateVoiceChannel).not.toHaveBeenCalled()
    expect(updateVoiceHubRecord).not.toHaveBeenCalled()
  })

  it("rejeita cargo externo antes de renomear ou persistir", async () => {
    const updateVoiceChannel = vi.fn()
    const updateVoiceHubRecord = vi.fn()

    await expect(
      updateVoiceHubForOperator(
        validUpdate(),
        baseDependencies({
          fetchGuildRoles: async () => [],
          updateVoiceChannel,
          updateVoiceHubRecord,
        })
      )
    ).rejects.toMatchObject({ code: AUTHORIZATION_ERROR_CODES.INVALID_INPUT })
    expect(updateVoiceChannel).not.toHaveBeenCalled()
    expect(updateVoiceHubRecord).not.toHaveBeenCalled()
  })

  it("exclui usando guild e canal derivados do banco", async () => {
    const deleteVoiceChannel = vi.fn()
    const deleteVoiceHubRecord = vi.fn(async () => ({ count: 1 }))

    await deleteVoiceHubForOperator(
      HUB_ID,
      baseDependencies({ deleteVoiceChannel, deleteVoiceHubRecord })
    )

    expect(deleteVoiceChannel).toHaveBeenCalledWith(
      { actor: ACTOR, guildId: GUILD_ID },
      CHANNEL_ID
    )
    expect(deleteVoiceHubRecord).toHaveBeenCalledWith(HUB_ID, ACTOR.userId)
  })

  it("não exclui efeito externo ou banco após negação", async () => {
    const deleteVoiceChannel = vi.fn()
    const deleteVoiceHubRecord = vi.fn()

    await expect(
      deleteVoiceHubForOperator(
        HUB_ID,
        baseDependencies({
          requireGuildAuthorization: async () => {
            throw new AuthorizationError(
              AUTHORIZATION_ERROR_CODES.GUILD_ACCESS_DENIED
            )
          },
          deleteVoiceChannel,
          deleteVoiceHubRecord,
        })
      )
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.GUILD_ACCESS_DENIED,
    })
    expect(deleteVoiceChannel).not.toHaveBeenCalled()
    expect(deleteVoiceHubRecord).not.toHaveBeenCalled()
  })

  it("carrega cargos somente para a guild derivada do Hub", async () => {
    const fetchGuildRoles = vi.fn(async () => [{ id: ROLE_ID }])

    await expect(
      loadVoiceHubRolesForOperator(
        HUB_ID,
        baseDependencies({ fetchGuildRoles })
      )
    ).resolves.toEqual([{ id: ROLE_ID }])
    expect(fetchGuildRoles).toHaveBeenCalledWith({
      actor: ACTOR,
      guildId: GUILD_ID,
    })
  })
})
