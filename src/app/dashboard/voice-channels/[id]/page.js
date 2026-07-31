import { redirect } from "next/navigation"
import { isToolEnabled } from "@/lib/user-tools"
import { requireOperator } from "@/lib/auth/operator-authorization"
import { getGuilds } from "@/app/dashboard/servers/actions"
import { getAuthorizedVoiceHub } from "@/lib/voice-hubs/voice-hub-service"
import VoiceHubEditor from "./VoiceHubEditor"

export default async function EditVoiceHubPage({ params }) {
  const actor = await requireOperator()
  const enabled = await isToolEnabled(actor.userId, "voice-channels")

  if (!enabled) {
    redirect("/dashboard")
  }

  const { id } = await params
  let voiceHub

  try {
    const context = await getAuthorizedVoiceHub(id)
    voiceHub = context.voiceHub
  } catch {
    redirect("/dashboard/voice-channels")
  }

  const { guilds } = await getGuilds()
  const guild = guilds.find((item) => item.id === voiceHub.guildId) || null

  return <VoiceHubEditor voiceHub={voiceHub} guild={guild} />
}
