const domainConstants = require("../domain/domain-constants.json")
const { normalizeDiscordId } = require("./guild-authorization")
const { validateChannelName } = require("./input-validation")

const JOB_TTL_MS = 15 * 60 * 1000
const INTERNAL_ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/

class WorkflowValidationError extends Error {
  constructor(message = "Esta etapa não é mais válida. Inicie o comando novamente.") {
    super(message)
    this.name = "WorkflowValidationError"
    this.publicMessage = message
  }
}

function invalidWorkflow(message) {
  throw new WorkflowValidationError(message)
}

function createTemplateJob(interaction, userId, now = Date.now()) {
  const id = normalizeDiscordId(interaction?.id)
  const ownerId = normalizeDiscordId(interaction?.user?.id)
  const guildId = normalizeDiscordId(interaction?.guildId)

  if (!id || !ownerId || !guildId || !INTERNAL_ID_PATTERN.test(userId || "")) {
    invalidWorkflow("Não foi possível iniciar o fluxo de template.")
  }

  return {
    id,
    userId,
    ownerId,
    guildId,
    expiresAt: now + JOB_TTL_MS,
  }
}

function getValidatedJob(interaction, jobs, jobId, options = {}) {
  const normalizedJobId = normalizeDiscordId(jobId)
  const actorId = normalizeDiscordId(interaction?.user?.id)
  const guildId = normalizeDiscordId(interaction?.guildId)
  const job = normalizedJobId ? jobs.get(normalizedJobId) : null

  if (!job) {
    invalidWorkflow()
  }

  if (!Number.isFinite(job.expiresAt) || job.expiresAt <= (options.now || Date.now())) {
    jobs.delete(normalizedJobId)
    invalidWorkflow("Este fluxo expirou. Execute /aplicar-template novamente.")
  }

  if (actorId !== job.ownerId || guildId !== job.guildId) {
    invalidWorkflow("Esta interação pertence a outro usuário ou servidor.")
  }

  for (const field of options.requiredFields || []) {
    if (job[field] === undefined || job[field] === null) {
      invalidWorkflow()
    }
  }

  return job
}

function validateSingleSelection(values, options = {}) {
  if (!Array.isArray(values) || values.length !== 1) {
    invalidWorkflow("Selecione exatamente uma opção.")
  }

  const value = values[0]

  if (options.allowNewValue && value === options.allowNewValue) {
    return value
  }

  if (options.internalId) {
    if (typeof value !== "string" || !INTERNAL_ID_PATTERN.test(value)) {
      invalidWorkflow("A opção selecionada é inválida.")
    }

    return value
  }

  const discordId = normalizeDiscordId(value)

  if (!discordId) {
    invalidWorkflow("A opção selecionada é inválida.")
  }

  return discordId
}

function validateRoleSelection(values, availableRoleIds, options = {}) {
  if (
    !Array.isArray(values) ||
    values.length < 1 ||
    values.length > domainConstants.limits.discordSelectOptionsMax
  ) {
    invalidWorkflow("A seleção de cargos excede o limite permitido.")
  }

  if (new Set(values).size !== values.length) {
    invalidWorkflow("A seleção contém cargos duplicados.")
  }

  const allowNewRole = options.allowNewRole === true
  const normalized = values.map((value) => {
    if (allowNewRole && value === "new-role") {
      return value
    }

    const roleId = normalizeDiscordId(value)

    if (!roleId || !availableRoleIds.has(roleId)) {
      invalidWorkflow("Um dos cargos selecionados não pertence a este servidor.")
    }

    return roleId
  })

  return normalized
}

function validateModalName(value, label, options = {}) {
  if (options.optional && (value === "" || value === null || value === undefined)) {
    return ""
  }

  const name = validateChannelName(value)

  if (!name) {
    invalidWorkflow(`${label} deve ter entre 1 e 100 caracteres válidos.`)
  }

  return name
}

function validateStoredTemplate(template, expectedUserId) {
  if (!template || template.userId !== expectedUserId || !Array.isArray(template.channels)) {
    invalidWorkflow("O template selecionado não está disponível para esta conta.")
  }

  if (template.channels.length > domainConstants.limits.channelsPerTemplateMax) {
    invalidWorkflow("O template excede o limite de canais suportado.")
  }

  for (const channel of template.channels) {
    if (
      !domainConstants.channelTypes.includes(channel?.type) ||
      !validateChannelName(channel?.name) ||
      typeof channel?.isPrivate !== "boolean"
    ) {
      invalidWorkflow("O template contém uma configuração de canal inválida.")
    }
  }

  return template
}

module.exports = {
  JOB_TTL_MS,
  WorkflowValidationError,
  createTemplateJob,
  getValidatedJob,
  validateModalName,
  validateRoleSelection,
  validateSingleSelection,
  validateStoredTemplate,
}
