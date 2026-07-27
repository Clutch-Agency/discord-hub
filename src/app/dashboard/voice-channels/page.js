import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { isToolEnabled } from "@/lib/user-tools"
import { PrismaClient } from "@prisma/client"
import Link from "next/link"
import { Plus, Trash2 } from "lucide-react" // Importar Trash2
import { getGuilds } from "@/app/dashboard/servers/actions"
import { deleteVoiceHub } from "./[id]/actions" // Importar deleteVoiceHub

const prisma = new PrismaClient()

export default async function VoiceChannelsPage() {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  const enabled = await isToolEnabled(session.user.id, "voice-channels")

  if (!enabled) {
    redirect("/dashboard")
  }

  const voiceHubs = await prisma.voiceHub.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  })

  const { guilds } = await getGuilds()

  const voiceHubsWithGuilds = voiceHubs.map(hub => {
    const guild = guilds.find(g => g.id === hub.guildId)
    return {
      ...hub,
      guildName: guild ? guild.name : "Servidor Desconhecido",
      guildIcon: guild ? guild.icon : null,
    }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">Canais Temporários</h2>
        <Link
          href="/dashboard/voice-channels/new"
          className="bg-clutch-pink hover:bg-clutch-pink-dark text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors flex items-center gap-2"
        >
          <Plus size={18} />
          Novo Hub
        </Link>
      </div>

      {voiceHubsWithGuilds.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center">
          <p className="text-clutch-gray-lighter">Você ainda não configurou nenhum Hub de canais temporários.</p>
          <p className="text-clutch-gray-lighter mt-2">Crie um novo Hub para começar a gerenciar seus canais de voz.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {voiceHubsWithGuilds.map((hub) => (
            <div
              key={hub.id}
              className="bg-[#1f1f23] border border-white/10 rounded-xl p-5 flex items-center justify-between hover:border-clutch-pink/40 transition-colors"
            >
              <Link href={`/dashboard/voice-channels/${hub.id}`} className="flex items-center gap-4 flex-grow">
                {hub.guildIcon ? (
                  <img src={hub.guildIcon} alt={hub.guildName} className="w-12 h-12 rounded-full" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-clutch-gray-light flex items-center justify-center text-white font-bold">
                      {hub.guildName.charAt(0)}
                  </div>
                )}
                <div>
                  <p className="text-white font-medium">{hub.name}</p>
                  <p className="text-clutch-gray-lighter text-sm">Servidor: {hub.guildName}</p>
                </div>
              </Link>
              <form action={deleteVoiceHub.bind(null, hub.id)}>
                <button
                  type="submit"
                  className="text-red-400 hover:text-red-300 transition-colors p-2 rounded-full hover:bg-white/5"
                >
                  <Trash2 size={20} />
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}