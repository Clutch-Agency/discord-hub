import { describe, expect, it, vi } from "vitest"
import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
} from "../auth/authorization-error.js"
import {
  getGuildRolesResult,
  loadGuildRolesForOperator,
} from "./guild-roles.js"

const GUILD_ID = "33333333333333333"
const ACTOR = Object.freeze({
  userId: "internal-user-id",
  discordUserId: "11111111111111111",
  isOperator: true,
})

function codedError(code) {
  return new AuthorizationError(code)
}

describe("loadGuildRolesForOperator", () => {
  it("retorna cargos somente depois das duas autorizações", async () => {
    const calls = []
    const roles = [{ id: "55555555555555555", name: "Admin" }]

    await expect(
      loadGuildRolesForOperator(GUILD_ID, {
        requireOperator: async () => {
          calls.push("operator")
          return ACTOR
        },
        requireGuildAuthorization: async (actor, guildId) => {
          calls.push("guild")
          return { actor, guildId }
        },
        fetchGuildRoles: async () => {
          calls.push("roles")
          return roles
        },
      })
    ).resolves.toEqual(roles)

    expect(calls).toEqual(["operator", "guild", "roles"])
  })

  it("não consulta guild ou cargos sem autenticação", async () => {
    const requireGuildAuthorization = vi.fn()
    const fetchGuildRoles = vi.fn()

    await expect(
      loadGuildRolesForOperator(GUILD_ID, {
        requireOperator: async () => {
          throw codedError(AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED)
        },
        requireGuildAuthorization,
        fetchGuildRoles,
      })
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED,
    })
    expect(requireGuildAuthorization).not.toHaveBeenCalled()
    expect(fetchGuildRoles).not.toHaveBeenCalled()
  })

  it("não consulta guild ou cargos para usuário fora da allowlist", async () => {
    const requireGuildAuthorization = vi.fn()
    const fetchGuildRoles = vi.fn()

    await expect(
      loadGuildRolesForOperator(GUILD_ID, {
        requireOperator: async () => {
          throw codedError(AUTHORIZATION_ERROR_CODES.ACCESS_DENIED)
        },
        requireGuildAuthorization,
        fetchGuildRoles,
      })
    ).rejects.toMatchObject({ code: AUTHORIZATION_ERROR_CODES.ACCESS_DENIED })
    expect(requireGuildAuthorization).not.toHaveBeenCalled()
    expect(fetchGuildRoles).not.toHaveBeenCalled()
  })

  it("não busca cargos quando a guild não é autorizada", async () => {
    const fetchGuildRoles = vi.fn()

    await expect(
      loadGuildRolesForOperator(GUILD_ID, {
        requireOperator: async () => ACTOR,
        requireGuildAuthorization: async () => {
          throw codedError(AUTHORIZATION_ERROR_CODES.GUILD_ACCESS_DENIED)
        },
        fetchGuildRoles,
      })
    ).rejects.toMatchObject({
      code: AUTHORIZATION_ERROR_CODES.GUILD_ACCESS_DENIED,
    })
    expect(fetchGuildRoles).not.toHaveBeenCalled()
  })

  it("não busca cargos quando o identificador da guild é inválido", async () => {
    const fetchGuildRoles = vi.fn()

    await expect(
      loadGuildRolesForOperator("invalid", {
        requireOperator: async () => ACTOR,
        requireGuildAuthorization: async () => {
          throw codedError(AUTHORIZATION_ERROR_CODES.INVALID_INPUT)
        },
        fetchGuildRoles,
      })
    ).rejects.toMatchObject({ code: AUTHORIZATION_ERROR_CODES.INVALID_INPUT })
    expect(fetchGuildRoles).not.toHaveBeenCalled()
  })
})

describe("getGuildRolesResult", () => {
  it("retorna o contrato seguro de sucesso do fluxo piloto", async () => {
    const roles = [{ id: "55555555555555555", name: "Admin" }]

    await expect(
      getGuildRolesResult(GUILD_ID, {
        requireOperator: async () => ACTOR,
        requireGuildAuthorization: async (actor, guildId) => ({
          actor,
          guildId,
        }),
        fetchGuildRoles: async () => roles,
      })
    ).resolves.toEqual({ error: false, roles })
  })

  it("retorna código seguro e lista vazia no caminho negado", async () => {
    await expect(
      getGuildRolesResult(GUILD_ID, {
        requireOperator: async () => {
          throw codedError(AUTHORIZATION_ERROR_CODES.ACCESS_DENIED)
        },
        requireGuildAuthorization: vi.fn(),
        fetchGuildRoles: vi.fn(),
      })
    ).resolves.toEqual({
      error: true,
      code: AUTHORIZATION_ERROR_CODES.ACCESS_DENIED,
      message: "Você não tem permissão para executar esta operação.",
      roles: [],
    })
  })
})
