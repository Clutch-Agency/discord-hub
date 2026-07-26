import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getGuilds, removeGuild } from "./actions"

export default async function ServersPage() {
  const session = await auth()
  if (!session) redirect("/")

  const { error, guilds } = await getGuilds()

  return (
    <div className="min-h-screen bg-clutch-gray">
      <header className="border-b border-white/10 bg-[#1a1a1d]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-clutch-gray-lighter hover:text-white transition-colors">
            ← Voltar
          </Link>
          <h1 className="text-xl font-bold text-white">Servidores conectados</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {error ? (
          <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center">
            <p className="text-clutch-gray-lighter">Não foi possível conectar ao bot. Verifique se ele está rodando.</p>
          </div>
        ) : guilds.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center">
            <p className="text-clutch-gray-lighter">O bot ainda não está em nenhum servidor.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {guilds.map((guild) => (
              <div
                key={guild.id}
                className="bg-[#1f1f23] border border-white/10 rounded-xl p-5 flex items-center justify-between hover:border-clutch-pink/40 transition-colors"
              >
                <div className="flex items-center gap-4">
                  {guild.icon ? (
                    <img src={guild.icon} alt={guild.name} className="w-12 h-12 rounded-full" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-clutch-gray-light flex items-center justify-center text-white font-bold">
                      {guild.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-white font-medium">{guild.name}</p>
                    <p className="text-clutch-gray-lighter text-sm">{guild.memberCount} membros</p>
                  </div>
                </div>
                <form action={removeGuild.bind(null, guild.id)}>
                  <button
                    type="submit"
                    className="text-red-400 hover:text-red-300 text-sm transition-colors"
                  >
                    Remover bot
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}