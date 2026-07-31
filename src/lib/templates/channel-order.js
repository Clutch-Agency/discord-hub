import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
} from "../auth/authorization-error.js"
import {
  validateChannelOrderPayload,
  validateTemplateId,
} from "./template-validation.js"

export async function reorderTemplateChannels(
  templateId,
  submittedChannels,
  dependencies
) {
  const actor = await dependencies.requireOperator()
  const normalizedTemplateId = validateTemplateId(templateId)
  const submittedIds = validateChannelOrderPayload(submittedChannels)

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
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.INVALID_INPUT, {
      publicMessage:
        "A ordem enviada não corresponde à estrutura atual do template.",
      field: "channels",
    })
  }

  await dependencies.persistOrder(normalizedTemplateId, submittedIds)
}
