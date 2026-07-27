import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { PrismaClient } from "@prisma/client"
import { isToolEnabled } from "@/lib/user-tools"
import { getGuilds } from "@/app/dashboard/servers/actions"
import VoiceHubEditor from "./VoiceHubEditor"

const prisma = new PrismaClient()

export default async function EditVoiceHubPage({ params }) {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  const enabled = await isToolEnabled(session.user.id, "voice-channels")

  if (!enabled) {
    redirect("/dashboard")
  }

  const { id } = await params

  const voiceHub = await prisma.voiceHub.findFirst({
    where: {
      id,
      userId: session.user.id,
    },
    select: {
      id: true,
      guildId: true,
      channelId: true,
      name: true,
      tempChannelName: true,
      userLimit: true,
      bitrate: true,
      keepAliveMinutes: true,
      ownershipLockMinutes: true,
      syncWithCategory: true,
      syncWithHubChannel: true,
      permissionMode: true,
    },
  })

  if (!voiceHub) {
    redirect("/dashboard/voice-channels")
  }

  const { guilds } = await getGuilds()
  const guild = guilds.find((item) => item.id === voiceHub.guildId) || null

  return <VoiceHubEditor voiceHub={voiceHub} guild={guild} />
}