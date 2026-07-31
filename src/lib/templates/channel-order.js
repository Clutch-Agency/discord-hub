import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
} from "../auth/authorization-error.js"

const INTERNAL_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

function normalizeInternalId(value) {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()

  return INTERNAL_ID_PATTERN.test(normalized) ? normalized : null
}

function invalidInput() {
  throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.INVALID_INPUT)
}

export async function reorderTemplateChannels(
  templateId,
  submittedChannels,
  dependencies
) {
  const actor = await dependencies.requireOperator()
  const normalizedTemplateId = normalizeInternalId(templateId)

  if (!normalizedTemplateId || !Array.isArray(submittedChannels)) {
    invalidInput()
  }

  const submittedIds = submittedChannels.map((channel) =>
    normalizeInternalId(channel?.id)
  )

  if (
    submittedIds.some((id) => !id) ||
    new Set(submittedIds).size !== submittedIds.length
  ) {
    invalidInput()
  }

  const template = await dependencies.findOwnedTemplate(
    normalizedTemplateId,
    actor.userId
  )

  if (!template) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.ACCESS_DENIED)
  }

  const expectedIds = template.channels.map((channel) => channel.id)
  const expectedSet = new Set(expectedIds)

  if (
    submittedIds.length !== expectedIds.length ||
    submittedIds.some((id) => !expectedSet.has(id))
  ) {
    invalidInput()
  }

  await dependencies.persistOrder(normalizedTemplateId, submittedIds)
}
