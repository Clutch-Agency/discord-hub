const DISCORD_SNOWFLAKE_PATTERN = /^[1-9]\d{16,19}$/

export function normalizeDiscordId(value) {
  if (typeof value !== "string") {
    return null
  }

  const normalized = value.trim()

  return DISCORD_SNOWFLAKE_PATTERN.test(normalized) ? normalized : null
}

export function isDiscordId(value) {
  return normalizeDiscordId(value) !== null
}

