import { describe, expect, it } from "vitest"
import { AUTHORIZATION_ERROR_CODES } from "../auth/authorization-error.js"
import {
  assertRolesBelongToGuild,
  parseVoiceHubUpdateFormData,
  validateRoleIds,
  validateTemporaryChannelTemplate,
  validateVoiceHubUpdateInput,
} from "./voice-hub-validation.js"

const ROLE_A = "55555555555555555"
const ROLE_B = "66666666666666666"

function validInput(overrides = {}) {
  return {
    id: "voice_hub_1",
    name: "Hub principal",
    tempChannelName: "Sala de {username} #{index}",
    userLimit: 10,
    bitrateKbps: 64,
    keepAliveMinutes: 2,
    syncWithCategory: false,
    syncWithHubChannel: false,
    permissionMode: "allow_except",
    permissionRoles: [ROLE_A],
    ignoredRoles: [],
    moderatorRoles: [ROLE_B],
    ...overrides,
  }
}

function expectInvalid(operation, field) {
  expect(operation).toThrowError(
    expect.objectContaining({
      code: AUTHORIZATION_ERROR_CODES.INVALID_INPUT,
      ...(field ? { field } : {}),
    })
  )
}

describe("VoiceHub validation", () => {
  it("aceita somente placeholders explícitos e saída potencial válida", () => {
    expect(validateTemporaryChannelTemplate("Sala {username} {index}")).toBe(
      "Sala {username} {index}"
    )
    expectInvalid(
      () => validateTemporaryChannelTemplate("Sala {eval}"),
      "tempChannelName"
    )
    expectInvalid(
      () => validateTemporaryChannelTemplate("x".repeat(80) + "{username}"),
      "tempChannelName"
    )
  })

  it.each([
    ["userLimit", { userLimit: -1 }],
    ["userLimit", { userLimit: 1.5 }],
    ["userLimit", { userLimit: 100 }],
    ["bitrateKbps", { bitrateKbps: 7 }],
    ["bitrateKbps", { bitrateKbps: 97 }],
    ["keepAliveMinutes", { keepAliveMinutes: -2 }],
    ["keepAliveMinutes", { keepAliveMinutes: 1.5 }],
    ["permissionMode", { permissionMode: "everyone" }],
  ])("rejeita limite inválido de %s", (field, override) => {
    expectInvalid(() => validateVoiceHubUpdateInput(validInput(override)), field)
  })

  it("rejeita sincronizações simultâneas", () => {
    expectInvalid(
      () =>
        validateVoiceHubUpdateInput(
          validInput({ syncWithCategory: true, syncWithHubChannel: true })
        ),
      "syncWithHubChannel"
    )
  })

  it("rejeita campos externos e o lock de propriedade não implementado", () => {
    expectInvalid(() =>
      validateVoiceHubUpdateInput(
        validInput({ ownershipLockMinutes: 5 })
      )
    )
    expectInvalid(() =>
      validateVoiceHubUpdateInput(
        validInput({ guildId: "99999999999999999" })
      )
    )
  })

  it("rejeita cargos duplicados, excesso e sobreposição entre listas", () => {
    expectInvalid(() => validateRoleIds([ROLE_A, ROLE_A], "permissionRoles"))
    expectInvalid(() =>
      validateRoleIds(Array.from({ length: 26 }, () => ROLE_A), "permissionRoles")
    )
    expectInvalid(() =>
      validateVoiceHubUpdateInput(
        validInput({ ignoredRoles: [ROLE_A], moderatorRoles: [] })
      )
    )
  })

  it("confirma que todos os cargos pertencem à guild", () => {
    expect(() =>
      assertRolesBelongToGuild(validInput(), [
        { id: ROLE_A },
        { id: ROLE_B },
      ])
    ).not.toThrow()
    expectInvalid(() =>
      assertRolesBelongToGuild(validInput(), [{ id: ROLE_A }])
    )
  })

  it("faz parsing estrito de inteiros, booleanos e marcadores do FormData", () => {
    const formData = new FormData()
    const values = validInput({ permissionRoles: [], moderatorRoles: [] })

    for (const [field, value] of Object.entries(values)) {
      if (["syncWithCategory", "syncWithHubChannel", "ignoredRoles", "permissionRoles", "moderatorRoles"].includes(field)) {
        continue
      }
      formData.set(field, String(value))
    }
    formData.set("permissionRolesPresent", "true")
    formData.set("ignoredRolesPresent", "true")
    formData.set("moderatorRolesPresent", "true")

    expect(parseVoiceHubUpdateFormData(formData)).toMatchObject({
      userLimit: 10,
      bitrateKbps: 64,
      syncWithCategory: false,
      permissionRoles: [],
    })

    formData.set("syncWithCategory", "false")
    expectInvalid(() => parseVoiceHubUpdateFormData(formData), "syncWithCategory")
  })
})
