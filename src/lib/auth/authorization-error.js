export const AUTHORIZATION_ERROR_CODES = Object.freeze({
  UNAUTHENTICATED: "UNAUTHENTICATED",
  ACCESS_DENIED: "ACCESS_DENIED",
  INVALID_INPUT: "INVALID_INPUT",
  INVALID_CONFIGURATION: "INVALID_CONFIGURATION",
  GUILD_ACCESS_DENIED: "GUILD_ACCESS_DENIED",
  AUTHORIZATION_UNAVAILABLE: "AUTHORIZATION_UNAVAILABLE",
  NOT_FOUND: "NOT_FOUND",
  CONFLICT: "CONFLICT",
  PERSISTENCE_UNAVAILABLE: "PERSISTENCE_UNAVAILABLE",
  UNEXPECTED: "UNEXPECTED",
})

const PUBLIC_MESSAGES = Object.freeze({
  [AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED]:
    "É necessário entrar novamente para continuar.",
  [AUTHORIZATION_ERROR_CODES.ACCESS_DENIED]:
    "Você não tem permissão para executar esta operação.",
  [AUTHORIZATION_ERROR_CODES.INVALID_INPUT]:
    "Os dados informados para autorização são inválidos.",
  [AUTHORIZATION_ERROR_CODES.INVALID_CONFIGURATION]:
    "A autorização do serviço não está configurada corretamente.",
  [AUTHORIZATION_ERROR_CODES.GUILD_ACCESS_DENIED]:
    "Você não tem permissão para operar neste servidor.",
  [AUTHORIZATION_ERROR_CODES.AUTHORIZATION_UNAVAILABLE]:
    "Não foi possível validar sua permissão neste momento.",
  [AUTHORIZATION_ERROR_CODES.NOT_FOUND]:
    "O recurso solicitado não foi encontrado.",
  [AUTHORIZATION_ERROR_CODES.CONFLICT]:
    "Os dados foram alterados por outra operação.",
  [AUTHORIZATION_ERROR_CODES.PERSISTENCE_UNAVAILABLE]:
    "Não foi possível salvar os dados neste momento.",
  [AUTHORIZATION_ERROR_CODES.UNEXPECTED]:
    "Não foi possível concluir a autorização.",
})

export class AuthorizationError extends Error {
  constructor(code, options = {}) {
    const publicMessage =
      options.publicMessage ||
      PUBLIC_MESSAGES[code] ||
      PUBLIC_MESSAGES.UNEXPECTED

    super(publicMessage, options.cause ? { cause: options.cause } : undefined)

    this.name = "AuthorizationError"
    this.code = PUBLIC_MESSAGES[code]
      ? code
      : AUTHORIZATION_ERROR_CODES.UNEXPECTED
    this.publicMessage = publicMessage
    this.field = typeof options.field === "string" ? options.field : null
  }
}

export function isAuthorizationError(error) {
  return error instanceof AuthorizationError
}

export function toAuthorizationFailure(error) {
  if (isAuthorizationError(error)) {
    return {
      error: true,
      code: error.code,
      message: error.publicMessage,
      ...(error.field ? { field: error.field } : {}),
    }
  }

  return {
    error: true,
    code: AUTHORIZATION_ERROR_CODES.UNEXPECTED,
    message: PUBLIC_MESSAGES[AUTHORIZATION_ERROR_CODES.UNEXPECTED],
  }
}
