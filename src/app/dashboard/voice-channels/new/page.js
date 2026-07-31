import { redirect } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, CircleAlert, Radio, Server } from "lucide-react"
import { isToolEnabled } from "@/lib/user-tools"
import { getGuilds } from "@/app/dashboard/servers/actions"
import { requireOperator } from "@/lib/auth/operator-authorization"
import CreateVoiceHubForm from "./CreateVoiceHubForm"

function NoticeState({ error, title, description, children }) {
  return (
    <section
      className={`rounded-3xl border p-6 sm:p-8 ${
        error
          ? "border-red-500/25 bg-red-500/[0.045]"
          : "border-white/10 bg-[#1f1f23]"
      }`}
    >
      <div className="flex flex-col items-center text-center">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
            error
              ? "bg-red-500/10 text-red-300"
              : "bg-clutch-blue/10 text-clutch-blue"
          }`}
        >
          {error ? <CircleAlert size={26} /> : <Server size={26} />}
        </div>

        <h2 className="mt-5 text-xl font-bold text-white">{title}</h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-clutch-gray-lighter">
          {description}
        </p>
        {children ? <div className="mt-6">{children}</div> : null}
      </div>
    </section>
  )
}

function BackLink() {
  return (
    <Link
      href="/dashboard/voice-channels"
      className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-clutch-gray-lighter transition-colors hover:text-white"
    >
      <ArrowLeft size={17} />
      Voltar para Canais Temporários
    </Link>
  )
}

export default async function NewVoiceHubPage() {
  const actor = await requireOperator()
  const enabled = await isToolEnabled(actor.userId, "voice-channels")

  if (!enabled) {
    redirect("/dashboard")
  }

  const guildResult = await getGuilds()
  const guilds = guildResult.ok ? guildResult.data.guilds : []

  if (!guildResult.ok) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <BackLink />
        <NoticeState
          error
          title="Não foi possível carregar os servidores"
          description="A plataforma não conseguiu se comunicar com o bot para buscar os servidores disponíveis."
        >
          <p className="text-sm text-red-100/70">
            Verifique se o bot está online e tente atualizar a página.
          </p>
        </NoticeState>
      </div>
    )
  }

  if (guilds.length === 0) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <BackLink />
        <NoticeState
          title="Nenhum servidor disponível"
          description="O bot ainda não está conectado a nenhum servidor Discord para que um Hub possa ser criado."
        >
          <Link
            href="/dashboard/servers"
            className="inline-flex items-center gap-2 rounded-xl bg-clutch-blue px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-clutch-blue-dark"
          >
            <Server size={17} />
            Gerenciar servidores
          </Link>
        </NoticeState>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <BackLink />

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#202025] px-6 py-8 shadow-2xl shadow-black/20 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-clutch-pink/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-56 w-56 rounded-full bg-clutch-blue/15 blur-3xl" />

        <div className="relative">
          <div className="inline-flex items-center gap-2 rounded-full border border-clutch-pink/25 bg-clutch-pink/10 px-3 py-1.5 text-xs font-semibold text-clutch-pink-light">
            <Radio size={14} />
            Novo canal Hub
          </div>

          <div className="mt-5 max-w-2xl">
            <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Criar Hub de Canais Temporários
            </h1>
            <p className="mt-3 text-sm leading-6 text-clutch-gray-lighter sm:text-base">
              Escolha o servidor onde o Hub será criado. Depois, defina o nome,
              as permissões e o comportamento das salas temporárias.
            </p>
          </div>
        </div>
      </section>

      <CreateVoiceHubForm guilds={guilds} />
    </div>
  )
}
