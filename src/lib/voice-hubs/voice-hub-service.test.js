import { describe, expect, it } from "vitest"
import { VOICE_HUB_SELECT } from "./voice-hub-service.js"

describe("VoiceHub editor projection", () => {
  it("inclui todos os arrays de cargos persistidos", () => {
    expect(VOICE_HUB_SELECT).toMatchObject({
      permissionRoles: true,
      ignoredRoles: true,
      moderatorRoles: true,
    })
  })
})
