"use server"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"

const prisma = new PrismaClient()
const BOT_API_URL = `http://localhost:${process.env.BOT_API_PORT || 3001}`

export async function createVoiceHub(formData) {
  const session = await auth()
  if (!session) redirect("/")

  const guildId = formData.get("guildId")

  // 1. Criar o canal de voz no Discord
  let channelId = "PENDING"
  let channelName = "Hub de Voz Temporário" // Nome padrão inicial

  try {
    const res = await fetch(`${BOT_API_URL}/guilds/${guildId}/voice-channels`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-bot-secret": process.env.BOT_API_SECRET,
      },
      body: JSON.stringify({ name: channelName }),
    })

    if (!res.ok) {
      const errorData = await res.json()
      console.error("Erro ao criar canal no Discord:", errorData)
      throw new Error(`Erro ao criar canal de voz no Discord: ${errorData.details || res.statusText}`)
    }

    const data = await res.json()
    channelId = data.channelId
    channelName = data.channelName // Usar o nome retornado pelo Discord, se houver
    console.log(`[createVoiceHub] Canal Discord criado: ID=${channelId}, Nome=${channelName}`)
  } catch (error) {
    console.error("[createVoiceHub] Erro na criação do canal Discord:", error)
    throw new Error("Falha ao criar o canal de voz no Discord. Verifique as permissões do bot.")
  }

  // 2. Criar o registro no banco de dados
  const newVoiceHub = await prisma.voiceHub.create({
    data: {
      userId: session.user.id,
      guildId: guildId,
      channelId: channelId,
      name: channelName,
      tempChannelName: "{username}'s Room", // Valor padrão
      userLimit: 0,
      bitrate: 64000, // 64 kbps
      keepAliveMinutes: -1,
      ownershipLockMinutes: -1,
      syncWithCategory: false,
      syncWithHubChannel: false,
      permissionMode: "allow_except",
    },
  })
  console.log(`[createVoiceHub] VoiceHub criado no DB: ID=${newVoiceHub.id}, userId=${newVoiceHub.userId}`)

  revalidatePath("/dashboard/voice-channels") // Revalida a lista de Hubs
  revalidatePath(`/dashboard/voice-channels/${newVoiceHub.id}`) // Revalida a página de edição específica
  console.log(`[createVoiceHub] Redirecionando para /dashboard/voice-channels/${newVoiceHub.id}`)
  redirect(`/dashboard/voice-channels/${newVoiceHub.id}`) // Redireciona para a página de edição do novo Hub
}