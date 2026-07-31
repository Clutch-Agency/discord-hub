import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
  isAuthorizationError,
} from "./auth/authorization-error.js"

const PRISMA_CODE_MAP = Object.freeze({
  P2002: AUTHORIZATION_ERROR_CODES.CONFLICT,
  P2003: AUTHORIZATION_ERROR_CODES.INVALID_INPUT,
  P2025: AUTHORIZATION_ERROR_CODES.NOT_FOUND,
  P2034: AUTHORIZATION_ERROR_CODES.CONFLICT,
})

export function mapPrismaError(error) {
  if (isAuthorizationError(error)) {
    return error
  }

  const mappedCode = PRISMA_CODE_MAP[error?.code]

  if (mappedCode) {
    return new AuthorizationError(mappedCode, { cause: error })
  }

  return new AuthorizationError(
    AUTHORIZATION_ERROR_CODES.PERSISTENCE_UNAVAILABLE,
    { cause: error }
  )
}

export async function withMappedPrismaErrors(operation) {
  try {
    return await operation()
  } catch (error) {
    throw mapPrismaError(error)
  }
}
