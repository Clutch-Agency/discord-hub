import { createRequire } from "node:module"
import { describe, expect, it } from "vitest"

const require = createRequire(import.meta.url)
const {
  validateChannelName,
  validateExactRecord,
  validateVoiceChannelBody,
} = require("./input-validation.js")

describe("bot input validation", () => {
  it("aceita somente record exato e nome de canal válido", () => {
    expect(validateVoiceChannelBody({ name: "  Hub  " })).toEqual({ name: "Hub" })
    expect(validateVoiceChannelBody({ name: "Hub", type: 2 })).toBeNull()
    expect(validateVoiceChannelBody(["Hub"])).toBeNull()
    expect(validateVoiceChannelBody({ name: "" })).toBeNull()
    expect(validateChannelName("x".repeat(101))).toBeNull()
  })

  it("não aceita objetos com protótipo inesperado", () => {
    expect(validateExactRecord(new Date(), [])).toBeNull()
  })
})
