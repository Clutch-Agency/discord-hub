import { describe, expect, it } from "vitest"
import voiceHubUtils from "./voice-hub-utils.js"

const { normalizeBitrate, normalizeUserLimit } = voiceHubUtils

describe("normalização das configurações de voz", () => {
  it("limita o bitrate ao intervalo suportado pela guild", () => {
    expect(normalizeBitrate(4000, 96000)).toBe(8000)
    expect(normalizeBitrate(128000, 96000)).toBe(96000)
    expect(normalizeBitrate(64000, 96000)).toBe(64000)
  })

  it("limita a quantidade de usuários ao intervalo do Discord", () => {
    expect(normalizeUserLimit(-10)).toBe(0)
    expect(normalizeUserLimit(120)).toBe(99)
    expect(normalizeUserLimit(25)).toBe(25)
  })
})
