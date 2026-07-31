import { createRequire } from "node:module"
import { describe, expect, it, vi } from "vitest"
import { MessageFlags } from "discord.js"

const require = createRequire(import.meta.url)
const { respond } = require("./utils.js")

function interaction(overrides = {}) {
  return {
    replied: false,
    deferred: false,
    isButton: () => false,
    isStringSelectMenu: () => false,
    reply: vi.fn(),
    followUp: vi.fn(),
    update: vi.fn(),
    ...overrides,
  }
}

describe("Discord interaction responses", () => {
  it("responde de forma privada usando MessageFlags", async () => {
    const currentInteraction = interaction()

    await respond(currentInteraction, { content: "Privada" })

    expect(currentInteraction.reply).toHaveBeenCalledWith({
      content: "Privada",
      flags: MessageFlags.Ephemeral,
    })
    expect(currentInteraction.reply.mock.calls[0][0]).not.toHaveProperty(
      "ephemeral"
    )
  })

  it("mantém follow-up privado após uma resposta anterior", async () => {
    const currentInteraction = interaction({ replied: true })

    await respond(currentInteraction, { content: "Continuação" })

    expect(currentInteraction.followUp).toHaveBeenCalledWith({
      content: "Continuação",
      flags: MessageFlags.Ephemeral,
    })
  })

  it("atualiza componentes sem alterar a visibilidade da mensagem original", async () => {
    const currentInteraction = interaction({ isButton: () => true })
    const payload = { content: "Atualizada", components: [] }

    await respond(currentInteraction, payload)

    expect(currentInteraction.update).toHaveBeenCalledWith(payload)
    expect(currentInteraction.reply).not.toHaveBeenCalled()
    expect(currentInteraction.followUp).not.toHaveBeenCalled()
  })
})
