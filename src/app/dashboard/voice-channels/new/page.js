import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { isToolEnabled } from "@/lib/user-tools"
import { getGuilds } from "@/app/dashboard/servers/actions"
import { createVoiceHub } from "./actions"

export default async function NewVoiceHubPage() {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  const enabled = await isToolEnabled(session.user.id, "voice-channels")

  if (!enabled) {
    redirect("/dashboard")
  }

  const { error, guilds } = await getGuilds()

  if (error) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-white mb-8">Novo Hub de Canais Temporários</h2>
        <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center">
          <p className="text-clutch-gray-lighter">Não foi possível carregar a lista de servidores.</p>
          <p className="text-clutch-gray-lighter mt-2">Verifique se o bot está rodando e tente novamente.</p>
        </div>
      </div>
    )
  }

  if (guilds.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold text-white mb-8">Novo Hub de Canais Temporários</h2>
        <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center">
          <p className="text-clutch-gray-lighter">O bot não está conectado a nenhum servidor.</p>
          <p className="text-clutch-gray-lighter mt-2">Conecte o bot a um servidor Discord antes de criar um Hub.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-8">Novo Hub de Canais Temporários</h2>

      <form action={createVoiceHub} className="bg-[#1f1f23] border border-white/10 rounded-2xl p-6">
        <div className="mb-6">
          <label htmlFor="guildId" className="block text-clutch-gray-lighter text-sm font-medium mb-2">
            Selecione o Servidor Discord
          </label>
          <div className="relative">
            <select
              id="guildId"
              name="guildId"
              required
              className="w-full bg-[#2a2a2e] border border-white/10 rounded-lg py-2 px-3 text-white appearance-none focus:outline-none focus:ring-2 focus:ring-clutch-pink pr-10"
            >
              <option value="">Selecione um servidor</option>
              {guilds.map((guild) => (
                <option key={guild.id} value={guild.id}>
                  {guild.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-clutch-gray-lighter">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="bg-clutch-pink hover:bg-clutch-pink-dark text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors"
        >
          Criar Hub
        </button>
      </form>
    </div>
  )
}