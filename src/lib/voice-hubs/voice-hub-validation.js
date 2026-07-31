import { normalizeDiscordId } from "../discord/discord-identifiers.js"
import {
  domainConstants,
  invalidInput,
  parseCheckbox,
  parseIntegerString,
  requireEnum,
  requireExactKeys,
  requireInteger,
  requireInternalId,
  requireTrimmedString,
} from "../validation/domain-validation.js"

const { limits } = domainConstants
const ROLE_FIELDS = ["permissionRoles", "ignoredRoles", "moderatorRoles"]
const SUPPORTED_PLACEHOLDERS = new Set(["username", "index"])

export function validateVoiceHubId(value) {
  return requireInternalId(value, "id")
}

function rejectControlCharacters(value, field, label) {
  if (/[\u0000-\u001F\u007F]/.test(value)) {
    invalidInput(`${label} contém caracteres não permitidos.`, field)
  }

  return value
}

export function validateVoiceHubName(value) {
  const name = requireTrimmedString(value, {
    field: "name",
    label: "O nome do Hub",
    minimum: limits.voiceHubNameMin,
    maximum: limits.voiceHubNameMax,
  })

  return rejectControlCharacters(name, "name", "O nome do Hub")
}

export function validateTemporaryChannelTemplate(value) {
  const template = requireTrimmedString(value, {
    field: "tempChannelName",
    label: "O padrão do nome da sala",
    minimum: limits.temporaryChannelTemplateMin,
    maximum: limits.temporaryChannelTemplateMax,
  })

  rejectControlCharacters(
    template,
    "tempChannelName",
    "O padrão do nome da sala"
  )

  const placeholders = [...template.matchAll(/\{([^{}]+)\}/g)].map(
    (match) => match[1].toLowerCase()
  )

  if (
    placeholders.some((placeholder) => !SUPPORTED_PLACEHOLDERS.has(placeholder)) ||
    /[{}]/.test(template.replace(/\{(?:username|index)\}/gi, ""))
  ) {
    invalidInput(
      "Use somente os marcadores {username} e {index} no nome da sala.",
      "tempChannelName"
    )
  }

  const worstCaseName = template
    .replace(/\{username\}/gi, "U".repeat(32))
    .replace(/\{index\}/gi, "999")
    .trim()

  if (
    worstCaseName.length < limits.channelNameMin ||
    worstCaseName.length > limits.channelNameMax
  ) {
    invalidInput(
      `O nome gerado da sala deve ter entre ${limits.channelNameMin} e ${limits.channelNameMax} caracteres.`,
      "tempChannelName"
    )
  }

  return template
}

export function validateRoleIds(values, field) {
  if (!Array.isArray(values) || values.length > limits.roleIdsPerListMax) {
    invalidInput(
      `Cada lista pode conter no máximo ${limits.roleIdsPerListMax} cargos.`,
      field
    )
  }

  const normalized = values.map((value) => normalizeDiscordId(value))

  if (normalized.some((value) => !value)) {
    invalidInput("A lista contém um identificador de cargo inválido.", field)
  }

  if (new Set(normalized).size !== normalized.length) {
    invalidInput("A lista contém cargos duplicados.", field)
  }

  return normalized
}

export function validateRoleListConflicts(roleLists) {
  const ownerByRole = new Map()

  for (const field of ROLE_FIELDS) {
    for (const roleId of roleLists[field] || []) {
      if (ownerByRole.has(roleId)) {
        invalidInput(
          "O mesmo cargo não pode participar de listas com responsabilidades diferentes.",
          field
        )
      }

      ownerByRole.set(roleId, field)
    }
  }
}

export function validateVoiceHubUpdateInput(input) {
  const record = requireExactKeys(
    input,
    [
      "id",
      "name",
      "tempChannelName",
      "userLimit",
      "bitrateKbps",
      "keepAliveMinutes",
      "syncWithCategory",
      "syncWithHubChannel",
      "permissionMode",
      "permissionRoles",
      "ignoredRoles",
      "moderatorRoles",
    ],
    "Os dados do Hub são inválidos."
  )

  const syncWithCategory = record.syncWithCategory
  const syncWithHubChannel = record.syncWithHubChannel

  if (typeof syncWithCategory !== "boolean" || typeof syncWithHubChannel !== "boolean") {
    invalidInput("As opções de sincronização são inválidas.", "syncWithCategory")
  }

  if (syncWithCategory && syncWithHubChannel) {
    invalidInput(
      "Escolha apenas uma fonte para sincronizar permissões.",
      "syncWithHubChannel"
    )
  }

  const result = {
    id: validateVoiceHubId(record.id),
    name: validateVoiceHubName(record.name),
    tempChannelName: validateTemporaryChannelTemplate(record.tempChannelName),
    userLimit: requireInteger(record.userLimit, {
      field: "userLimit",
      label: "O limite de usuários",
      minimum: limits.userLimitMin,
      maximum: limits.userLimitMax,
    }),
    bitrate: requireInteger(record.bitrateKbps, {
      field: "bitrateKbps",
      label: "O bitrate",
      minimum: limits.bitrateKbpsMin,
      maximum: limits.bitrateKbpsMax,
    }) * 1000,
    keepAliveMinutes: requireInteger(record.keepAliveMinutes, {
      field: "keepAliveMinutes",
      label: "A retenção da sala",
      allowedValues: domainConstants.retentionMinutes,
    }),
    syncWithCategory,
    syncWithHubChannel,
    permissionMode: requireEnum(
      record.permissionMode,
      domainConstants.permissionModes,
      "O modo de permissão",
      "permissionMode"
    ),
  }

  for (const field of ROLE_FIELDS) {
    if (record[field] !== undefined) {
      result[field] = validateRoleIds(record[field], field)
    }
  }

  validateRoleListConflicts(result)

  return result
}

function getOptionalRoleList(formData, field) {
  const marker = formData.get(`${field}Present`)
  const values = formData.getAll(field)

  if (marker === null && values.length === 0) {
    return undefined
  }

  if (marker !== "true") {
    invalidInput("O marcador da lista de cargos é inválido.", field)
  }

  return values
}

export function parseVoiceHubUpdateFormData(formData) {
  if (
    !formData ||
    typeof formData.get !== "function" ||
    typeof formData.getAll !== "function"
  ) {
    invalidInput("Os dados do Hub são inválidos.")
  }

  return {
    id: formData.get("id"),
    name: formData.get("name"),
    tempChannelName: formData.get("tempChannelName"),
    userLimit: parseIntegerString(formData.get("userLimit"), {
      field: "userLimit",
      label: "O limite de usuários",
      minimum: limits.userLimitMin,
      maximum: limits.userLimitMax,
    }),
    bitrateKbps: parseIntegerString(formData.get("bitrateKbps"), {
      field: "bitrateKbps",
      label: "O bitrate",
      minimum: limits.bitrateKbpsMin,
      maximum: limits.bitrateKbpsMax,
    }),
    keepAliveMinutes: parseIntegerString(formData.get("keepAliveMinutes"), {
      field: "keepAliveMinutes",
      label: "A retenção da sala",
      allowedValues: domainConstants.retentionMinutes,
    }),
    syncWithCategory: parseCheckbox(
      formData.get("syncWithCategory"),
      "syncWithCategory"
    ),
    syncWithHubChannel: parseCheckbox(
      formData.get("syncWithHubChannel"),
      "syncWithHubChannel"
    ),
    permissionMode: formData.get("permissionMode"),
    permissionRoles: getOptionalRoleList(formData, "permissionRoles"),
    ignoredRoles: getOptionalRoleList(formData, "ignoredRoles"),
    moderatorRoles: getOptionalRoleList(formData, "moderatorRoles"),
  }
}

export function assertRolesBelongToGuild(input, availableRoles) {
  if (!Array.isArray(availableRoles)) {
    invalidInput("Não foi possível validar os cargos selecionados.")
  }

  const availableIds = new Set(
    availableRoles.map((role) => normalizeDiscordId(role?.id)).filter(Boolean)
  )

  for (const field of ROLE_FIELDS) {
    if (
      input[field]?.some((roleId) => !availableIds.has(roleId))
    ) {
      invalidInput(
        "Um dos cargos selecionados não pertence mais a este servidor.",
        field
      )
    }
  }
}
