import { describe, expect, it } from "vitest"
import { normalizeChannelName } from "./discord-utils"

describe("normalizeChannelName", () => {
  it("normaliza nomes de canais textuais para o formato aceito pelo Discord", () => {
    expect(normalizeChannelName("  Sala de Áudio & Notícias  ", "TEXT")).toBe(
      "sala-de-audio-noticias"
    )
  })

  it("preserva maiúsculas e espaços internos em canais de voz", () => {
    expect(normalizeChannelName("  Reunião Geral  ", "VOICE")).toBe(
      "Reunião Geral"
    )
  })
})
