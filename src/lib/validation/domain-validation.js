import domainConstants from "../../../domain/domain-constants.json"
import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
} from "../auth/authorization-error.js"

export { domainConstants }

export function invalidInput(message, field = null) {
  throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.INVALID_INPUT, {
    publicMessage: message,
    field,
  })
}

export function requireRecord(value, message = "Os dados enviados são inválidos.") {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    invalidInput(message)
  }

  return value
}

export function requireExactKeys(value, allowedKeys, message, field = null) {
  const record = requireRecord(value, message)
  const allowed = new Set(allowedKeys)

  if (Object.keys(record).some((key) => !allowed.has(key))) {
    invalidInput(message, field)
  }

  return record
}

export function requireTrimmedString(value, options) {
  const { field, label, minimum = 1, maximum } = options

  if (typeof value !== "string") {
    invalidInput(`${label} deve ser um texto.`, field)
  }

  const normalized = value.trim()

  if (normalized.length < minimum || normalized.length > maximum) {
    invalidInput(
      `${label} deve ter entre ${minimum} e ${maximum} caracteres.`,
      field
    )
  }

  return normalized
}

export function requireInteger(value, options) {
  const { field, label, minimum, maximum, allowedValues } = options

  if (!Number.isInteger(value)) {
    invalidInput(`${label} deve ser um número inteiro.`, field)
  }

  if (allowedValues && !allowedValues.includes(value)) {
    invalidInput(`${label} possui um valor não permitido.`, field)
  }

  if (
    (minimum !== undefined && value < minimum) ||
    (maximum !== undefined && value > maximum)
  ) {
    invalidInput(`${label} está fora do intervalo permitido.`, field)
  }

  return value
}

export function parseIntegerString(value, options) {
  if (typeof value !== "string" || !/^-?\d+$/.test(value)) {
    invalidInput(`${options.label} deve ser um número inteiro.`, options.field)
  }

  const parsed = Number(value)

  if (!Number.isSafeInteger(parsed)) {
    invalidInput(`${options.label} deve ser um número inteiro válido.`, options.field)
  }

  return requireInteger(parsed, options)
}

export function parseCheckbox(value, field) {
  if (value === null) {
    return false
  }

  if (value !== "on") {
    invalidInput("O valor do campo de seleção é inválido.", field)
  }

  return true
}

export function requireEnum(value, allowedValues, label, field) {
  if (typeof value !== "string" || !allowedValues.includes(value)) {
    invalidInput(`${label} possui um valor não permitido.`, field)
  }

  return value
}

export function requireInternalId(value, field = "id") {
  if (typeof value !== "string") {
    invalidInput("O identificador informado é inválido.", field)
  }

  const normalized = value.trim()

  if (!/^[A-Za-z0-9_-]{1,64}$/.test(normalized)) {
    invalidInput("O identificador informado é inválido.", field)
  }

  return normalized
}
