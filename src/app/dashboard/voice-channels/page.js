import { redirect } from "next/navigation"
import { isToolEnabled } from "@/lib/user-tools"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import {
  ArrowRight,
  AudioLines,
  Clock3,
  Mic,
  Plus,
  Radio,
  Server,
  Settings2,
  Trash2,
  Users,
} from "lucide-react"
import { getGuilds } from "@/app/dashboard/servers/actions"
import { deleteVoiceHub } from "./[id]/actions"
import { requireOperator } from "@/lib/auth/operator-authorization"

function formatKeepAlive(minutes) {
  if (minutes === -1) {
    return "Nunca apaga"
  }

  if (minutes === 0) {
    return "Apaga imediatamente"
  }

  return `Apaga em ${minutes} min`
}

function formatUserLimit(limit) {
  if (!limit) {
    return "Sem limite"
  }

  return `${limit} usuários`
}

export default async function VoiceChannelsPage() {
  const actor = await requireOperator()

  const enabled = await isToolEnabled(actor.userId, "voice-channels")

  if (!enabled) {
    redirect("/dashboard")
  }

  const guildResult = await getGuilds()
  const guilds = guildResult.ok ? guildResult.data.guilds : []
  const error = !guildResult.ok
  const authorizedGuildIds = guilds.map((guild) => guild.id)
  const voiceHubs = await prisma.voiceHub.findMany({
    where: {
      userId: actor.userId,
      guildId: { in: authorizedGuildIds },
    },
    orderBy: {
      createdAt: "asc",
    },
  })

  const voiceHubsWithGuilds = voiceHubs.map((hub) => {
    const guild = guilds.find((item) => item.id === hub.guildId)

    return {
      ...hub,
      guildName: guild?.name || "Servidor não encontrado",
      guildIcon: guild?.icon || null,
    }
  })

  return (
    <div className="mx-auto w-full max-w-6xl">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#202025] px-6 py-8 shadow-2xl shadow-black/20 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-clutch-pink/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-36 right-36 h-72 w-72 rounded-full bg-clutch-blue/15 blur-3xl" />

        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-clutch-pink/25 bg-clutch-pink/10 px-3 py-1.5 text-xs font-semibold text-clutch-pink-light">
            <AudioLines size={14} />
            Automação de voz
          </div>

          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Canais Temporários
              </h1>

              <p className="mt-3 text-sm leading-6 text-clutch-gray-lighter sm:text-base">
                Crie Hubs que geram salas de voz automaticamente quando alguém
                entra. Configure nome, limite de usuários, permissões e o tempo
                de exclusão de cada sala.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="rounded-2xl border border-white/10 bg-black/15 px-5 py-3">
                <p className="text-xs font-medium uppercase tracking-[0.14em] text-clutch-gray-light">
                  Hubs configurados
                </p>

                <p className="mt-1 text-2xl font-bold text-white">
                  {voiceHubs.length}
                </p>
              </div>

              <Link
                href="/dashboard/voice-channels/new"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-clutch-pink px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-clutch-pink/20 transition-all hover:-translate-y-0.5 hover:bg-clutch-pink-dark hover:shadow-clutch-pink/30"
              >
                <Plus size={18} />
                Novo Hub
              </Link>
            </div>
          </div>
        </div>
      </section>

      {error ? (
        <section className="mt-8 rounded-3xl border border-dashed border-red-400/30 bg-red-500/[0.04] px-6 py-16 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/10 text-red-300">
            <Server size={25} />
          </div>

          <h2 className="mt-5 text-lg font-semibold text-white">
            Não foi possível carregar os servidores
          </h2>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-clutch-gray-lighter">
            O painel não conseguiu se comunicar com o bot Discord. Confirme que
            o servidor está rodando e atualize esta página.
          </p>
        </section>
      ) : voiceHubsWithGuilds.length === 0 ? (
        <section className="mt-8 rounded-3xl border border-dashed border-white/15 bg-white/[0.015] px-6 py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-clutch-pink/10 text-clutch-pink">
            <Radio size={28} />
          </div>

          <h2 className="mt-5 text-xl font-semibold text-white">
            Seu primeiro Hub começa aqui
          </h2>

          <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-clutch-gray-lighter">
            Crie um Hub, escolha o servidor Discord e deixe o bot criar salas
            temporárias automaticamente para sua comunidade.
          </p>

          <Link
            href="/dashboard/voice-channels/new"
            className="mt-7 inline-flex items-center gap-2 rounded-xl bg-clutch-pink px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-clutch-pink-dark"
          >
            <Plus size={18} />
            Criar primeiro Hub
          </Link>
        </section>
      ) : (
        <section className="mt-10">
          <div className="mb-5">
            <h2 className="text-xl font-bold text-white">Seus Hubs</h2>

            <p className="mt-1 text-sm text-clutch-gray-lighter">
              Selecione um Hub para ajustar suas regras e permissões.
            </p>
          </div>

          <div className="grid gap-4">
            {voiceHubsWithGuilds.map((hub) => (
              <article
                key={hub.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#1f1f23] p-5 transition-all hover:-translate-y-0.5 hover:border-clutch-pink/45 hover:shadow-xl hover:shadow-black/20 sm:p-6"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-clutch-pink/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                  <Link
                    href={`/dashboard/voice-channels/${hub.id}`}
                    className="min-w-0 flex-1"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-clutch-pink/10 text-clutch-pink">
                        <Mic size={22} />
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="truncate text-lg font-semibold text-white transition-colors group-hover:text-clutch-pink">
                            {hub.name}
                          </h3>

                          <span className="rounded-md border border-clutch-green/20 bg-clutch-green/10 px-2 py-0.5 text-[11px] font-semibold text-clutch-green">
                            Ativo
                          </span>
                        </div>

                        <p className="mt-2 text-sm text-clutch-gray-lighter">
                          Salas:{" "}
                          <span className="font-medium text-white">
                            {hub.tempChannelName}
                          </span>
                        </p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-clutch-gray-lighter">
                            <Users size={14} className="text-clutch-pink" />
                            {formatUserLimit(hub.userLimit)}
                          </span>

                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-clutch-gray-lighter">
                            <Clock3 size={14} className="text-clutch-blue" />
                            {formatKeepAlive(hub.keepAliveMinutes)}
                          </span>

                          <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-xs text-clutch-gray-lighter">
                            <AudioLines size={14} className="text-clutch-green" />
                            {Math.round(hub.bitrate / 1000)} kbps
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>

                  <div className="flex items-center justify-between gap-4 border-t border-white/10 pt-5 lg:justify-end lg:border-t-0 lg:border-l lg:pl-6 lg:pt-0">
                    <div className="flex min-w-0 items-center gap-3">
                      {hub.guildIcon ? (
                        <img
                          src={hub.guildIcon}
                          alt={hub.guildName}
                          className="h-10 w-10 shrink-0 rounded-full object-cover"
                        />
                      ) : (
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clutch-blue/10 text-sm font-bold text-clutch-blue">
                          {hub.guildName.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="min-w-0">
                        <p className="text-xs text-clutch-gray-light">
                          Servidor Discord
                        </p>

                        <p className="max-w-44 truncate text-sm font-medium text-white">
                          {hub.guildName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/dashboard/voice-channels/${hub.id}`}
                        aria-label={`Configurar ${hub.name}`}
                        className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-clutch-gray-lighter transition-colors hover:border-clutch-pink/40 hover:bg-clutch-pink/10 hover:text-clutch-pink"
                      >
                        <Settings2 size={18} />
                      </Link>

                      <form action={deleteVoiceHub.bind(null, hub.id)}>
                        <button
                          type="submit"
                          aria-label={`Excluir ${hub.name}`}
                          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-clutch-gray-lighter transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                        >
                          <Trash2 size={18} />
                        </button>
                      </form>
                    </div>
                  </div>
                </div>

                <Link
                  href={`/dashboard/voice-channels/${hub.id}`}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-clutch-pink transition-colors hover:text-clutch-pink-light"
                >
                  Configurar Hub
                  <ArrowRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
