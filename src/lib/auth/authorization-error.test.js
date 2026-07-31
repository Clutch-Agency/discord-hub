import { describe, expect, it } from "vitest"
import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
  toAuthorizationFailure,
} from "./authorization-error.js"

describe("authorization errors", () => {
  it("preserva uma categoria esperada sem expor detalhes internos", () => {
    const error = new AuthorizationError(
      AUTHORIZATION_ERROR_CODES.INVALID_CONFIGURATION,
      { cause: new Error("ALLOWED_DISCORD_USER_IDS=secret") }
    )

    const failure = toAuthorizationFailure(error)

    expect(failure).toEqual({
      error: true,
      code: AUTHORIZATION_ERROR_CODES.INVALID_CONFIGURATION,
      message: "A autorização do serviço não está configurada corretamente.",
    })
    expect(JSON.stringify(failure)).not.toContain("secret")
  })

  it("normaliza falha inesperada sem expor mensagem ou stack", () => {
    const failure = toAuthorizationFailure(
      new Error("database password and internal stack")
    )

    expect(failure).toEqual({
      error: true,
      code: AUTHORIZATION_ERROR_CODES.UNEXPECTED,
      message: "Não foi possível concluir a autorização.",
    })
    expect(JSON.stringify(failure)).not.toContain("database")
  })
})

