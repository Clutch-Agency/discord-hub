"use server"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import { revalidatePath } from "next/cache"
import { requireOperator } from "@/lib/auth/operator-authorization"
import { requireGuildAuthorization } from "@/lib/discord/guild-authorization"
import { fetchGuildRolesWithBot } from "@/lib/discord/bot-api-client"
import { getGuildRolesResult } from "@/lib/discord/guild-roles"

const prisma = new PrismaClient()
const BOT_API_URL = `http://localhost:${process.env.BOT_API_PORT || 3001}`

function parseNumber(value, fallback) {
  const parsed = Number.parseInt(value, 10)

  return Number.isNaN(parsed) ? fallback : parsed
}

function uniqueValues(values) {
  return [...new Set(values.filter(Boolean))]
}

export async function getGuildRoles(guildId) {
  return getGuildRolesResult(guildId, {
    requireOperator,
    requireGuildAuthorization,
    fetchGuildRoles: fetchGuildRolesWithBot,
    onUnexpectedError: () => {
      console.error("Falha inesperada ao buscar cargos de uma guild autorizada.")
    },
  })
}

export async function updateVoiceHub(formData) {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  const id = String(formData.get("id") || "")
  const name = String(formData.get("name") || "").trim()
  const tempChannelName = String(formData.get("tempChannelName") || "").trim()

  const userLimit = parseNumber(formData.get("userLimit"), 0)
  const bitrateKbps = parseNumber(formData.get("bitrateKbps"), 64)
  const keepAliveMinutes = parseNumber(formData.get("keepAliveMinutes"), 0)
  const ownershipLockMinutes = parseNumber(
    formData.get("ownershipLockMinutes"),
    0
  )

  const syncWithCategory = formData.get("syncWithCategory") === "on"
  const syncWithHubChannel =
    !syncWithCategory && formData.get("syncWithHubChannel") === "on"

  const permissionMode =
    formData.get("permissionMode") === "deny_except"
      ? "deny_except"
      : "allow_except"

  const permissionRoles = uniqueValues(formData.getAll("permissionRoles"))
  const ignoredRoles = uniqueValues(formData.getAll("ignoredRoles"))
  const moderatorRoles = uniqueValues(formData.getAll("moderatorRoles"))

  if (!id || !name || !tempChannelName) {
    throw new Error("Preencha os campos obrigatórios do Hub.")
  }

  const voiceHub = await prisma.voiceHub.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  })

  if (!voiceHub) {
    throw new Error("Hub de voz não encontrado ou não autorizado.")
  }

  if (voiceHub.name !== name) {
    try {
      const response = await fetch(
        `${BOT_API_URL}/guilds/${voiceHub.guildId}/voice-channels/${voiceHub.channelId}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-bot-secret": process.env.BOT_API_SECRET,
          },
          body: JSON.stringify({ name }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))

        throw new Error(errorData.details || response.statusText)
      }
    } catch (error) {
      console.log(
        "Erro na atualização do nome do canal Discord:",
        error.message
      )

      throw new Error("Falha ao atualizar o nome do canal de voz no Discord.")
    }
  }

  await prisma.voiceHub.update({
    where: {
      id: voiceHub.id,
    },
    data: {
      name,
      tempChannelName,
      userLimit,
      bitrate: bitrateKbps * 1000,
      keepAliveMinutes,
      ownershipLockMinutes,
      syncWithCategory,
      syncWithHubChannel,
      permissionMode,
      permissionRoles,
      ignoredRoles,
      moderatorRoles,
    },
  })

  revalidatePath(`/dashboard/voice-channels/${id}`)
  revalidatePath("/dashboard/voice-channels")

  redirect(`/dashboard/voice-channels/${id}`)
}

export async function deleteVoiceHub(id) {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  const voiceHub = await prisma.voiceHub.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
  })

  if (!voiceHub) {
    throw new Error("Hub de voz não encontrado ou não autorizado.")
  }

  try {
    const response = await fetch(
      `${BOT_API_URL}/guilds/${voiceHub.guildId}/voice-channels/${voiceHub.channelId}`,
      {
        method: "DELETE",
        headers: {
          "x-bot-secret": process.env.BOT_API_SECRET,
        },
      }
    )

    if (!response.ok && response.status !== 404) {
      const errorData = await response.json().catch(() => ({}))

      throw new Error(errorData.details || response.statusText)
    }
  } catch (error) {
    console.log("Erro na exclusão do canal Discord:", error.message)

    throw new Error(
      "Falha ao excluir o canal de voz no Discord. Verifique as permissões do bot."
    )
  }

  await prisma.voiceHub.delete({
    where: {
      id: voiceHub.id,
    },
  })

  revalidatePath("/dashboard/voice-channels")

  redirect("/dashboard/voice-channels")
}
