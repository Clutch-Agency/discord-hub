import { describe, expect, it } from "vitest"
import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
} from "../auth/authorization-error.js"
import {
  ACTION_RESULT_CODES,
  actionFailure,
  actionSuccess,
} from "./action-result.js"

describe("action results", () => {
  it("usa contrato discriminado no sucesso", () => {
    expect(actionSuccess({ items: [] })).toEqual({
      ok: true,
      data: { items: [] },
    })
  })

  it.each([
    [AUTHORIZATION_ERROR_CODES.INVALID_INPUT, ACTION_RESULT_CODES.INVALID_INPUT],
    [AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED, ACTION_RESULT_CODES.UNAUTHENTICATED],
    [AUTHORIZATION_ERROR_CODES.ACCESS_DENIED, ACTION_RESULT_CODES.ACCESS_DENIED],
    [AUTHORIZATION_ERROR_CODES.NOT_FOUND, ACTION_RESULT_CODES.NOT_FOUND],
    [AUTHORIZATION_ERROR_CODES.CONFLICT, ACTION_RESULT_CODES.CONFLICT],
    [
      AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE,
      ACTION_RESULT_CODES.EXTERNAL_UNAVAILABLE,
    ],
  ])("mapeia %s para %s", (errorCode, resultCode) => {
    expect(actionFailure(new AuthorizationError(errorCode))).toMatchObject({
      ok: false,
      code: resultCode,
    })
  })

  it("não serializa stack ou causa inesperada", () => {
    const result = actionFailure(new Error("postgres://secret/internal"))

    expect(result).toEqual({
      ok: false,
      code: ACTION_RESULT_CODES.UNEXPECTED,
      message: "Não foi possível concluir a operação.",
    })
  })
})
