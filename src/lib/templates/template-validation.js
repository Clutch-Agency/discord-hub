import { normalizeChannelName } from "../discord-utils.js"
import {
  domainConstants,
  invalidInput,
  parseCheckbox,
  requireEnum,
  requireExactKeys,
  requireInternalId,
  requireTrimmedString,
} from "../validation/domain-validation.js"

const { limits } = domainConstants

export function validateTemplateName(value) {
  return requireTrimmedString(value, {
    field: "name",
    label: "O nome do template",
    minimum: limits.templateNameMin,
    maximum: limits.templateNameMax,
  })
}

export function validateTemplateId(value) {
  return requireInternalId(value, "templateId")
}

export function validateChannelId(value) {
  return requireInternalId(value, "channelId")
}

export function validateChannelInput(input) {
  const record = requireExactKeys(
    input,
    ["name", "type", "isPrivate"],
    "Os dados do canal são inválidos."
  )
  const type = requireEnum(
    record.type,
    domainConstants.channelTypes,
    "O tipo do canal",
    "type"
  )
  const rawName = requireTrimmedString(record.name, {
    field: "name",
    label: "O nome do canal",
    minimum: limits.channelNameMin,
    maximum: limits.channelNameMax,
  })
  const name = normalizeChannelName(rawName, type)

  if (name.length < limits.channelNameMin) {
    invalidInput("O nome do canal ficou vazio após a normalização.", "name")
  }

  if (name.length > limits.channelNameMax) {
    invalidInput(
      `O nome final do canal deve ter no máximo ${limits.channelNameMax} caracteres.`,
      "name"
    )
  }

  if (typeof record.isPrivate !== "boolean") {
    invalidInput("A privacidade do canal é inválida.", "isPrivate")
  }

  return { name, type, isPrivate: record.isPrivate }
}

export function parseChannelFormData(formData) {
  if (!formData || typeof formData.get !== "function") {
    invalidInput("Os dados do canal são inválidos.")
  }

  return validateChannelInput({
    name: formData.get("name"),
    type: formData.get("type"),
    isPrivate: parseCheckbox(formData.get("isPrivate"), "isPrivate"),
  })
}

export function validateChannelOrderPayload(value) {
  if (!Array.isArray(value) || value.length > limits.channelsPerTemplateMax) {
    invalidInput(
      `A ordem deve conter no máximo ${limits.channelsPerTemplateMax} canais.`,
      "channels"
    )
  }

  const ids = value.map((item) => {
    const record = requireExactKeys(
      item,
      ["id"],
      "Cada item da ordem deve conter somente o identificador do canal.",
      "channels"
    )

    return validateChannelId(record.id)
  })

  if (new Set(ids).size !== ids.length) {
    invalidInput("A ordem contém canais duplicados.", "channels")
  }

  return ids
}
