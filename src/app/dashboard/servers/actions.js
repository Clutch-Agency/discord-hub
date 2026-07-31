"use server"

import { revalidatePath } from "next/cache"
import { requireOperator } from "@/lib/auth/operator-authorization"
import {
  fetchAuthorizedGuildsWithBot,
  removeGuildWithBot,
} from "@/lib/discord/bot-api-client"
import { requireGuildAuthorization } from "@/lib/discord/guild-authorization"
import {
  getGuildsResult,
  removeGuildForOperator,
} from "@/lib/discord/guild-operations"

export async function getGuilds() {
  return getGuildsResult({
    requireOperator,
    fetchAuthorizedGuilds: fetchAuthorizedGuildsWithBot,
    onUnexpectedError: () => {
      console.error("Falha inesperada ao listar guilds autorizadas.")
    },
  })
}

export async function removeGuild(guildId) {
  await removeGuildForOperator(guildId, {
    requireOperator,
    requireGuildAuthorization,
    removeGuild: removeGuildWithBot,
  })

  revalidatePath("/dashboard/servers")
  revalidatePath("/dashboard/voice-channels")
}
