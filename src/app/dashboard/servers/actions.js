"use server"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

const BOT_API_URL = `http://localhost:${process.env.BOT_API_PORT || 3001}`

export async function getGuilds() {
  const session = await auth()
  if (!session) redirect("/")

  try {
    const res = await fetch(`${BOT_API_URL}/guilds`, {
      headers: { "x-bot-secret": process.env.BOT_API_SECRET },
      cache: "no-store",
    })

    if (!res.ok) return { error: true, guilds: [] }

    const guilds = await res.json()
    return { error: false, guilds }
  } catch (error) {
    console.log("Erro ao buscar servidores do bot:", error.message)
    return { error: true, guilds: [] }
  }
}

export async function removeGuild(guildId) {
  const session = await auth()
  if (!session) redirect("/")

  await fetch(`${BOT_API_URL}/guilds/${guildId}`, {
    method: "DELETE",
    headers: { "x-bot-secret": process.env.BOT_API_SECRET },
  })

  revalidatePath("/dashboard/servers")
}