import { revalidatePath } from "next/cache"
import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
} from "./auth/authorization-error.js"
import { prisma } from "./prisma.js"

export const USER_TOOLS = Object.freeze([
  Object.freeze({
    key: "templates",
    name: "Templates de Servidor",
    description:
      "Crie e aplique templates de canais e cargos no seu servidor Discord.",
    icon: "LayoutTemplate",
    href: "/dashboard/templates",
    enabled: false,
  }),
  Object.freeze({
    key: "voice-channels",
    name: "Canais de Voz Temporários",
    description:
      "Crie canais de voz temporários que aparecem quando alguém entra e desaparecem quando todos saem.",
    icon: "Mic",
    href: "/dashboard/voice-channels",
    enabled: false,
  }),
])

const USER_TOOL_KEYS = new Set(USER_TOOLS.map((tool) => tool.key))

export function validateToolToggle(toolKey, enabled) {
  if (!USER_TOOL_KEYS.has(toolKey) || typeof enabled !== "boolean") {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.INVALID_INPUT)
  }

  return { toolKey, enabled }
}

export async function getUserToolsState(userId) {
  const userTools = await prisma.userTool.findMany({ where: { userId } })
  const stateByKey = new Map(
    userTools.map((userTool) => [userTool.toolKey, userTool.enabled])
  )

  return USER_TOOLS.map((tool) => ({
    ...tool,
    enabled: stateByKey.get(tool.key) ?? false,
  }))
}

export async function isToolEnabled(userId, toolKey) {
  if (!USER_TOOL_KEYS.has(toolKey)) {
    return false
  }

  const userTool = await prisma.userTool.findUnique({
    where: { userId_toolKey: { userId, toolKey } },
  })

  return userTool ? userTool.enabled : false
}

export async function setToolEnabled(userId, toolKey, enabled) {
  const input = validateToolToggle(toolKey, enabled)

  await prisma.userTool.upsert({
    where: { userId_toolKey: { userId, toolKey: input.toolKey } },
    update: { enabled: input.enabled },
    create: { userId, toolKey: input.toolKey, enabled: input.enabled },
  })

  revalidatePath("/dashboard")
}

export async function toggleToolForOperator(toolKey, enabled, dependencies) {
  const actor = await dependencies.requireOperator()
  const input = validateToolToggle(toolKey, enabled)

  await dependencies.persistToolState(
    actor.userId,
    input.toolKey,
    input.enabled
  )
}
