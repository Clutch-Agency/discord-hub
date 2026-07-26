import { prisma } from "@/lib/prisma"
import { TOOLS } from "@/lib/tools"

export async function getUserToolsState(userId) {
  const records = await prisma.userTool.findMany({ where: { userId } })

  return TOOLS.map((tool) => {
    const record = records.find((r) => r.toolKey === tool.key)
    return { ...tool, enabled: record ? record.enabled : false }
  })
}

export async function isToolEnabled(userId, toolKey) {
  const record = await prisma.userTool.findUnique({
    where: { userId_toolKey: { userId, toolKey } },
  })
  return record ? record.enabled : false
}

export async function setToolEnabled(userId, toolKey, enabled) {
  await prisma.userTool.upsert({
    where: { userId_toolKey: { userId, toolKey } },
    update: { enabled },
    create: { userId, toolKey, enabled },
  })
}