import { createRequire } from "node:module"
import { describe, expect, it } from "vitest"

const require = createRequire(import.meta.url)
const {
  JOB_TTL_MS,
  createTemplateJob,
  getValidatedJob,
  validateModalName,
  validateRoleSelection,
  validateSingleSelection,
  validateStoredTemplate,
} = require("./template-workflow-validation.js")

const JOB_ID = "11111111111111111"
const OWNER_ID = "22222222222222222"
const GUILD_ID = "33333333333333333"
const ROLE_ID = "44444444444444444"

function interaction(overrides = {}) {
  return {
    id: JOB_ID,
    user: { id: OWNER_ID },
    guildId: GUILD_ID,
    ...overrides,
  }
}

describe("template workflow validation", () => {
  it("vincula job ao autor/guild e aplica TTL", () => {
    const job = createTemplateJob(interaction(), "user_1", 100)

    expect(job).toMatchObject({
      id: JOB_ID,
      userId: "user_1",
      ownerId: OWNER_ID,
      guildId: GUILD_ID,
      expiresAt: 100 + JOB_TTL_MS,
    })
  })

  it.each([
    ["ator", { user: { id: "99999999999999999" } }],
    ["guild", { guildId: "99999999999999999" }],
  ])("rejeita interação de outro %s", (_label, override) => {
    const jobs = new Map([
      [JOB_ID, createTemplateJob(interaction(), "user_1", 100)],
    ])

    expect(() =>
      getValidatedJob(interaction(override), jobs, JOB_ID, { now: 101 })
    ).toThrow(/outro usuário ou servidor/)
  })

  it("rejeita job ausente, expirado e estado incompleto", () => {
    expect(() => getValidatedJob(interaction(), new Map(), JOB_ID)).toThrow()
    const jobs = new Map([
      [JOB_ID, createTemplateJob(interaction(), "user_1", 100)],
    ])
    expect(() =>
      getValidatedJob(interaction(), jobs, JOB_ID, { now: 100 + JOB_TTL_MS })
    ).toThrow(/expirou/)
    const activeJobs = new Map([
      [JOB_ID, createTemplateJob(interaction(), "user_1")],
    ])
    expect(() =>
      getValidatedJob(interaction(), activeJobs, JOB_ID, {
        requiredFields: ["templateId"],
      })
    ).toThrow()
  })

  it("valida quantidade, IDs e pertencimento das seleções", () => {
    expect(validateSingleSelection(["template_1"], { internalId: true })).toBe(
      "template_1"
    )
    expect(() => validateSingleSelection([])).toThrow()
    expect(validateRoleSelection([ROLE_ID], new Set([ROLE_ID]))).toEqual([
      ROLE_ID,
    ])
    expect(() =>
      validateRoleSelection(["55555555555555555"], new Set([ROLE_ID]))
    ).toThrow(/não pertence/)
    expect(() =>
      validateRoleSelection(Array.from({ length: 26 }, () => ROLE_ID), new Set([ROLE_ID]))
    ).toThrow(/excede/)
  })

  it("valida modal e template persistido antes dos efeitos", () => {
    expect(validateModalName("  Categoria  ", "A categoria")).toBe("Categoria")
    expect(() => validateModalName("x".repeat(101), "A categoria")).toThrow()
    expect(
      validateStoredTemplate(
        {
          userId: "user_1",
          channels: [
            { name: "geral", type: "TEXT", isPrivate: false },
          ],
        },
        "user_1"
      )
    ).toBeTruthy()
    expect(() =>
      validateStoredTemplate(
        {
          userId: "other_user",
          channels: [
            { name: "geral", type: "TEXT", isPrivate: false },
          ],
        },
        "user_1"
      )
    ).toThrow(/não está disponível/)
  })
})
