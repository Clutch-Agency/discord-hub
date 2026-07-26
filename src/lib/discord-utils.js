export function normalizeChannelName(name, type) {
  const lowercaseTypes = ["TEXT", "ANNOUNCEMENT", "FORUM"]

  if (!lowercaseTypes.includes(type)) {
    return name.trim()
  }

  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
}