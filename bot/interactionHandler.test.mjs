import { createRequire } from "node:module"
import { describe, expect, it, vi } from "vitest"
import { MessageFlags } from "discord.js"

const require = createRequire(import.meta.url)
const { createInteractionHandler } = require("./interactionHandler.js")
const { createTemplateJob } = require("./template-workflow-validation.js")

const JOB_ID = "11111111111111111"
const OWNER_ID = "22222222222222222"
const GUILD_ID = "33333333333333333"

function templateSelectionInteraction(overrides = {}) {
  return {
    id: "44444444444444444",
    user: { id: OWNER_ID },
    guildId: GUILD_ID,
    customId: `pick-template-${JOB_ID}`,
    values: ["template_1"],
    replied: false,
    deferred: false,
    isChatInputCommand: () => false,
    isStringSelectMenu: () => true,
    isButton: () => false,
    isModalSubmit: () => false,
    isRepliable: () => true,
    reply: vi.fn(),
    ...overrides,
  }
}

describe("template interaction handler", () => {
  it("não aceita template fora do userId associado ao job", async () => {
    const interaction = templateSelectionInteraction()
    const jobs = new Map([
      [
        JOB_ID,
        createTemplateJob(
          { id: JOB_ID, user: { id: OWNER_ID }, guildId: GUILD_ID },
          "user_1"
        ),
      ],
    ])
    const findFirst = vi.fn(async () => null)
    const showCategoryMenu = vi.fn()
    const handler = createInteractionHandler({
      jobs,
      prisma: { template: { findFirst } },
      commands: { showCategoryMenu },
    })

    await handler(interaction)

    expect(findFirst).toHaveBeenCalledWith({
      where: { id: "template_1", userId: "user_1" },
      select: { id: true, name: true },
    })
    expect(showCategoryMenu).not.toHaveBeenCalled()
    expect(interaction.reply).toHaveBeenCalledWith(
      expect.objectContaining({
        flags: MessageFlags.Ephemeral,
        content: expect.stringContaining("não pertence"),
      })
    )
  })

  it("rejeita ator diferente antes de consultar Prisma", async () => {
    const interaction = templateSelectionInteraction({
      user: { id: "99999999999999999" },
    })
    const jobs = new Map([
      [
        JOB_ID,
        createTemplateJob(
          { id: JOB_ID, user: { id: OWNER_ID }, guildId: GUILD_ID },
          "user_1"
        ),
      ],
    ])
    const findFirst = vi.fn()
    const handler = createInteractionHandler({
      jobs,
      prisma: { template: { findFirst } },
      commands: {},
    })

    await handler(interaction)

    expect(findFirst).not.toHaveBeenCalled()
    expect(interaction.reply).toHaveBeenCalled()
  })
})
