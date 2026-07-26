"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function ServersClient({ initialGuilds, initialError, discordBotInviteUrl, removeGuild }) {
  const router = useRouter()

  // Este useEffect irá forçar uma revalidação dos dados da rota atual
  // sempre que a janela do navegador for focada novamente.
  // Isso é útil quando o usuário vai para o Discord para adicionar o bot e volta.
  useEffect(() => {
    const handleFocus = () => {
      router.refresh() // Força uma re-renderização do Server Component pai
    }

    window.addEventListener("focus", handleFocus)
    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [router])

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold text-white">Servidores conectados</h2>
        {discordBotInviteUrl && (
          <Link
            href={discordBotInviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-clutch-pink hover:bg-clutch-pink/80 text-white font-medium py-2 px-4 rounded-lg transition-colors"
          >
            Conectar bot a um novo servidor
          </Link>
        )}
      </div>

      {initialError ? (
        <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center">
          <p className="text-clutch-gray-lighter">Não foi possível conectar ao bot. Verifique se ele está rodando e se as variáveis de ambiente estão corretas.</p>
        </div>
      ) : initialGuilds.length === 0 ? (
        <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center">
          <p className="text-clutch-gray-lighter">O bot ainda não está em nenhum servidor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {initialGuilds.map((guild) => (
            <div
              key={guild.id}
              className="bg-[#1f1f23] border border-white/10 rounded-xl p-6 flex flex-col items-center text-center hover:border-clutch-pink/40 transition-colors"
            >
              {guild.icon ? (
                <img src={guild.icon} alt={guild.name} className="w-20 h-20 rounded-full mb-4" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-clutch-gray-light flex items-center justify-center text-white font-bold text-3xl mb-4">
                    {guild.name.charAt(0)}
                </div>
              )}
              <p className="text-white font-medium text-lg mb-1">{guild.name}</p>
              <p className="text-clutch-gray-lighter text-sm mb-4">{guild.memberCount} membros</p>
              <form action={removeGuild.bind(null, guild.id)} className="mt-auto">
                <button
                  type="submit"
                  className="text-red-400 hover:text-red-300 text-sm transition-colors px-4 py-2 rounded-lg border border-red-400 hover:border-red-300"
                >
                  Remover bot
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}