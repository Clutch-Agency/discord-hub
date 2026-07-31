const domainConstants = require("../domain/domain-constants.json")

function isPlainRecord(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false
  }

  const prototype = Object.getPrototypeOf(value)
  return prototype === Object.prototype || prototype === null
}

function validateExactRecord(value, allowedKeys) {
  if (!isPlainRecord(value)) {
    return null
  }

  const keys = Object.keys(value)

  if (keys.some((key) => !allowedKeys.includes(key))) {
    return null
  }

  return value
}

function validateChannelName(value) {
  if (typeof value !== "string") {
    return null
  }

  const name = value.trim()
  const { channelNameMin, channelNameMax } = domainConstants.limits

  if (
    name.length < channelNameMin ||
    name.length > channelNameMax ||
    /[\u0000-\u001F\u007F]/.test(name)
  ) {
    return null
  }

  return name
}

function validateVoiceChannelBody(value) {
  const body = validateExactRecord(value, ["name"])
  const name = validateChannelName(body?.name)

  return name ? { name } : null
}

module.exports = {
  validateChannelName,
  validateExactRecord,
  validateVoiceChannelBody,
}
