"use server"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { revalidatePath } from "next/cache"

const BOT_API_URL = `http://127.0.0.1:${process.env.BOT_API_PORT || 3001}`

export async function getGuilds() {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  try {
    const response = await fetch(`${BOT_API_URL}/guilds`, {
      headers: {
        "x-bot-secret": process.env.BOT_API_SECRET,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      console.log(
        `Erro ao buscar servidores do bot: status ${response.status}`
      )

      return {
        error: true,
        guilds: [],
      }
    }

    const guilds = await response.json()

    return {
      error: false,
      guilds,
    }
  } catch (error) {
    console.log("Erro ao buscar servidores do bot:", error.message)

    return {
      error: true,
      guilds: [],
    }
  }
}

export async function removeGuild(guildId) {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  try {
    const response = await fetch(`${BOT_API_URL}/guilds/${guildId}`, {
      method: "DELETE",
      headers: {
        "x-bot-secret": process.env.BOT_API_SECRET,
      },
    })

    if (!response.ok) {
      throw new Error(`Status ${response.status}`)
    }
  } catch (error) {
    console.log("Erro ao remover bot do servidor:", error.message)
    throw new Error("Não foi possível remover o bot do servidor.")
  }

  revalidatePath("/dashboard/servers")
}