import {
  AUTHORIZATION_ERROR_CODES,
  isAuthorizationError,
} from "../auth/authorization-error.js"

export const ACTION_RESULT_CODES = Object.freeze({
  INVALID_INPUT: AUTHORIZATION_ERROR_CODES.INVALID_INPUT,
  UNAUTHENTICATED: AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED,
  ACCESS_DENIED: AUTHORIZATION_ERROR_CODES.ACCESS_DENIED,
  GUILD_ACCESS_DENIED: AUTHORIZATION_ERROR_CODES.GUILD_ACCESS_DENIED,
  NOT_FOUND: AUTHORIZATION_ERROR_CODES.NOT_FOUND,
  CONFLICT: AUTHORIZATION_ERROR_CODES.CONFLICT,
  EXTERNAL_UNAVAILABLE: "EXTERNAL_UNAVAILABLE",
  UNEXPECTED: AUTHORIZATION_ERROR_CODES.UNEXPECTED,
})

export function actionSuccess(data) {
  return data === undefined ? { ok: true } : { ok: true, data }
}

export function actionFailure(error, fallbackCode = ACTION_RESULT_CODES.UNEXPECTED) {
  if (isAuthorizationError(error)) {
    const code =
      error.code === AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE
        ? ACTION_RESULT_CODES.EXTERNAL_UNAVAILABLE
        : error.code

    return {
      ok: false,
      code,
      message: error.publicMessage,
      ...(error.field ? { field: error.field } : {}),
    }
  }

  const messages = {
    [ACTION_RESULT_CODES.NOT_FOUND]: "O recurso solicitado não foi encontrado.",
    [ACTION_RESULT_CODES.CONFLICT]: "Os dados foram alterados por outra operação.",
    [ACTION_RESULT_CODES.EXTERNAL_UNAVAILABLE]:
      "O serviço externo está indisponível no momento.",
    [ACTION_RESULT_CODES.UNEXPECTED]: "Não foi possível concluir a operação.",
  }

  return {
    ok: false,
    code: fallbackCode,
    message: messages[fallbackCode] || messages[ACTION_RESULT_CODES.UNEXPECTED],
  }
}
