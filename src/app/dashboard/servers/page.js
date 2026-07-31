import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getGuilds, removeGuild } from "./actions"
import ServersClient from "./ServersClient"

export default async function ServersPage() {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  const result = await getGuilds()
  const guilds = result.ok ? result.data.guilds : []
  const discordBotInviteUrl = process.env.DISCORD_BOT_INVITE_URL || ""

  return (
    <ServersClient
      initialGuilds={guilds}
      initialError={!result.ok}
      discordBotInviteUrl={discordBotInviteUrl}
      removeGuild={removeGuild}
    />
  )
}
