import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()

export async function getUserToolsState(userId) {
  const tools = [
    {
      key: "templates",
      name: "Templates de Servidor",
      description: "Crie e aplique templates de canais e cargos no seu servidor Discord.",
      icon: "LayoutTemplate",
      href: "/dashboard/templates",
      enabled: false,
    },
    {
      key: "voice-channels",
      name: "Canais de Voz Temporários",
      description: "Crie canais de voz temporários que aparecem quando alguém entra e desaparecem quando todos saem.",
      icon: "Mic", // Ícone para canais de voz
      href: "/dashboard/voice-channels",
      enabled: false,
    },
  ]

  const userTools = await prisma.userTool.findMany({
    where: { userId },
  })

  return tools.map((tool) => {
    const userToolState = userTools.find((ut) => ut.toolKey === tool.key)
    return {
      ...tool,
      enabled: userToolState ? userToolState.enabled : false,
    }
  })
}

export async function isToolEnabled(userId, toolKey) {
  const userTool = await prisma.userTool.findUnique({
    where: {
      userId_toolKey: {
        userId,
        toolKey,
      },
    },
  })
  return userTool ? userTool.enabled : false
}

export async function setToolEnabled(userId, toolKey, enabled) { // Exportar a função
  await prisma.userTool.upsert({
    where: {
      userId_toolKey: {
        userId,
        toolKey,
      },
    },
    update: {
      enabled: enabled,
    },
    create: {
      userId,
      toolKey,
      enabled,
    },
  })
  revalidatePath("/dashboard")
}