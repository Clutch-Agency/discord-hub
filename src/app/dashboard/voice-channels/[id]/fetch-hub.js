"use server"

import { auth } from "@/auth"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function fetchVoiceHub(hubId) {
  const session = await auth()
  if (!session) {
    return { error: "Não autenticado" }
  }

  const voiceHub = await prisma.voiceHub.findUnique({
    where: { id: hubId, userId: session.user.id },
  })

  if (!voiceHub) {
    return { error: "Hub de voz não encontrado" }
  }

  // Retornar o Hub como um objeto serializável
  return { data: JSON.parse(JSON.stringify(voiceHub)) }
}