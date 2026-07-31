import { describe, expect, it } from "vitest"
import { AUTHORIZATION_ERROR_CODES } from "../auth/authorization-error.js"
import {
  validateChannelInput,
  validateChannelOrderPayload,
  validateTemplateName,
} from "./template-validation.js"

function expectInvalid(operation, field) {
  expect(operation).toThrowError(
    expect.objectContaining({
      code: AUTHORIZATION_ERROR_CODES.INVALID_INPUT,
      ...(field ? { field } : {}),
    })
  )
}

describe("template validation", () => {
  it("normaliza nome do template sem impor unicidade", () => {
    expect(validateTemplateName("  Meu template  ")).toBe("Meu template")
  })

  it.each([null, 10, "", " ", "x".repeat(101)])(
    "rejeita nome de template inválido: %j",
    (value) => expectInvalid(() => validateTemplateName(value), "name")
  )

  it("normaliza nomes textuais e preserva nomes de voz", () => {
    expect(
      validateChannelInput({
        name: "  Reunião Geral  ",
        type: "TEXT",
        isPrivate: false,
      })
    ).toEqual({ name: "reuniao-geral", type: "TEXT", isPrivate: false })
    expect(
      validateChannelInput({
        name: "  Reunião Geral  ",
        type: "VOICE",
        isPrivate: true,
      })
    ).toEqual({ name: "Reunião Geral", type: "VOICE", isPrivate: true })
  })

  it.each([
    [{ name: "!!!", type: "TEXT", isPrivate: false }, "name"],
    [{ name: "canal", type: "STAGE", isPrivate: false }, "type"],
    [{ name: "canal", type: "TEXT", isPrivate: "false" }, "isPrivate"],
    [{ name: "canal", type: "TEXT", isPrivate: false, order: 1 }, null],
  ])("rejeita configuração de canal inválida", (input, field) => {
    expectInvalid(() => validateChannelInput(input), field)
  })

  it("aceita reorder mínimo e rejeita extras, duplicatas e excesso", () => {
    expect(validateChannelOrderPayload([{ id: "channel_1" }])).toEqual([
      "channel_1",
    ])
    expectInvalid(
      () => validateChannelOrderPayload([{ id: "channel_1", order: 0 }]),
      "channels"
    )
    expectInvalid(
      () =>
        validateChannelOrderPayload([
          { id: "channel_1" },
          { id: "channel_1" },
        ]),
      "channels"
    )
    expectInvalid(
      () =>
        validateChannelOrderPayload(
          Array.from({ length: 101 }, (_, index) => ({ id: `channel_${index}` }))
        ),
      "channels"
    )
  })
})
