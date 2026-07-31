function normalizeBitrate(hubBitrate, guildMaximumBitrate) {
  const requestedBitrate = Number(hubBitrate || 64000)
  const maximumBitrate = Number(guildMaximumBitrate || 96000)

  return Math.min(Math.max(8000, requestedBitrate), maximumBitrate)
}

function normalizeUserLimit(userLimit) {
  return Math.min(Math.max(0, Number(userLimit || 0)), 99)
}

module.exports = {
  normalizeBitrate,
  normalizeUserLimit,
}
