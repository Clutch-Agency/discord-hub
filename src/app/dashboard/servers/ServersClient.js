"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import {
  ArrowUpRight,
  Bot,
  CheckCircle2,
  CircleAlert,
  Crown,
  LoaderCircle,
  Plus,
  RefreshCw,
  Server,
  Trash2,
  Users,
} from "lucide-react"

function formatMembers(memberCount) {
  if (!memberCount) {
    return "Sem dados de membros"
  }

  return new Intl.NumberFormat("pt-BR").format(memberCount) + " membros"
}

function GuildAvatar({ guild, size = "large" }) {
  const dimensions =
    size === "small"
      ? "h-10 w-10 rounded-xl"
      : "h-16 w-16 rounded-2xl"

  if (guild.icon) {
    return (
      <img
        src={guild.icon}
        alt={guild.name}
        className={`${dimensions} shrink-0 border border-white/10 object-cover`}
      />
    )
  }

  return (
    <div
      className={`flex ${dimensions} shrink-0 items-center justify-center bg-clutch-blue/15 text-xl font-bold text-clutch-blue`}
    >
      {guild.name.charAt(0).toUpperCase()}
    </div>
  )
}

function InviteButton({ href, compact = false }) {
  if (!href) {
    return null
  }

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center justify-center gap-2 rounded-xl bg-clutch-pink font-semibold text-white shadow-lg shadow-clutch-pink/20 transition-all hover:-translate-y-0.5 hover:bg-clutch-pink-dark ${
        compact ? "px-4 py-2.5 text-sm" : "px-5 py-3 text-sm"
      }`}
    >
      <Plus size={18} />
      Conectar bot
      {!compact ? <ArrowUpRight size={17} /> : null}
    </a>
  )
}

export default function ServersClient({
  initialGuilds,
  initialError,
  discordBotInviteUrl,
  removeGuild,
}) {
  const router = useRouter()

  useEffect(() => {
    function handleFocus() {
      router.refresh()
    }

    window.addEventListener("focus", handleFocus)

    return () => {
      window.removeEventListener("focus", handleFocus)
    }
  }, [router])

  function refreshServers() {
    router.refresh()
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#202025] px-6 py-8 shadow-2xl shadow-black/20 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-clutch-blue/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-28 h-64 w-64 rounded-full bg-clutch-pink/15 blur-3xl" />

        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-clutch-blue/25 bg-clutch-blue/10 px-3 py-1.5 text-xs font-semibold text-clutch-blue">
            <Server size={14} />
            Gestão de servidores
          </div>

          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Servidores conectados
              </h1>

              <p className="mt-3 text-sm leading-6 text-clutch-gray-lighter sm:text-base">
                Conecte o Clutch Hub aos seus servidores Discord e libere as
                ferramentas disponíveis para sua comunidade.
              </p>
            </div>

            <InviteButton href={discordBotInviteUrl} />
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clutch-pink/10 text-clutch-pink">
                  <Server size={19} />
                </div>

                <div>
                  <p className="text-2xl font-bold text-white">
                    {initialGuilds.length}
                  </p>
                  <p className="text-xs text-clutch-gray-lighter">
                    servidores conectados
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-clutch-blue/10 text-clutch-blue">
                  <Bot size={19} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Bot centralizado
                  </p>
                  <p className="text-xs text-clutch-gray-lighter">
                    Controle em um só lugar
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
                  <CheckCircle2 size={19} />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Pronto para usar
                  </p>
                  <p className="text-xs text-clutch-gray-lighter">
                    Templates e Hubs disponíveis
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Seus servidores Discord
            </h2>
            <p className="mt-1 text-sm text-clutch-gray-lighter">
              Os servidores onde o bot possui acesso atualmente.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshServers}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-semibold text-clutch-gray-lighter transition-colors hover:bg-white/10 hover:text-white"
          >
            <RefreshCw size={16} />
            Atualizar lista
          </button>
        </div>

        {initialError ? (
          <section className="rounded-3xl border border-red-500/25 bg-red-500/[0.045] px-6 py-14 text-center sm:px-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
              <CircleAlert size={27} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-white">
              Não foi possível consultar o bot
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-clutch-gray-lighter">
              O painel não conseguiu se comunicar com o bot Discord. Confirme
              que o projeto está rodando e atualize esta página.
            </p>

            <button
              type="button"
              onClick={refreshServers}
              className="mt-6 inline-flex items-center gap-2 rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-2.5 text-sm font-semibold text-red-200 transition-colors hover:bg-red-500/20 hover:text-white"
            >
              <RefreshCw size={16} />
              Tentar novamente
            </button>
          </section>
        ) : initialGuilds.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-white/15 bg-white/[0.015] px-6 py-14 text-center sm:px-10">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-clutch-blue/10 text-clutch-blue">
              <Bot size={27} />
            </div>

            <h3 className="mt-5 text-lg font-bold text-white">
              Nenhum servidor conectado
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-clutch-gray-lighter">
              Conecte o bot a um servidor Discord para começar a criar
              templates e configurar canais temporários.
            </p>

            <div className="mt-6">
              <InviteButton href={discordBotInviteUrl} compact />
            </div>
          </section>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {initialGuilds.map((guild) => (
              <article
                key={guild.id}
                className="group relative overflow-hidden rounded-3xl border border-white/10 bg-[#202025] p-5 transition-all hover:-translate-y-1 hover:border-clutch-pink/35 hover:shadow-xl hover:shadow-black/20"
              >
                <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-clutch-pink/10 blur-3xl opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="relative">
                  <div className="flex items-start justify-between gap-4">
                    <GuildAvatar guild={guild} />

                    <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-300" />
                      Conectado
                    </div>
                  </div>

                  <div className="mt-5 min-w-0">
                    <h3 className="truncate text-lg font-bold text-white">
                      {guild.name}
                    </h3>

                    <div className="mt-2 flex items-center gap-2 text-sm text-clutch-gray-lighter">
                      <Users size={15} className="text-clutch-pink" />
                      {formatMembers(guild.memberCount)}
                    </div>
                  </div>

                  <div className="my-5 h-px bg-white/10" />

                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-clutch-gray-lighter">
                      <Crown size={14} className="text-clutch-blue" />
                      Bot ativo neste servidor
                    </div>

                    <form action={removeGuild.bind(null, guild.id)}>
                      <button
                        type="submit"
                        className="inline-flex items-center gap-2 rounded-xl border border-red-400/20 bg-red-500/[0.06] px-3 py-2 text-xs font-semibold text-red-200 transition-colors hover:bg-red-500/15 hover:text-white"
                      >
                        <Trash2 size={15} />
                        Remover
                      </button>
                    </form>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {initialGuilds.length > 0 ? (
        <section className="mt-8 rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-clutch-blue/10 text-clutch-blue">
              <LoaderCircle size={18} />
            </div>

            <div>
              <h3 className="text-sm font-semibold text-white">
                Atualização automática
              </h3>

              <p className="mt-1 text-sm leading-6 text-clutch-gray-lighter">
                Ao conectar o bot no Discord e retornar para esta página, a
                lista será atualizada automaticamente.
              </p>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}