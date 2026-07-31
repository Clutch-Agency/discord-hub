import { redirect } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  ArrowRight,
  AudioLines,
  CheckCircle2,
  CircleAlert,
  Radio,
  Server,
  Sparkles,
} from "lucide-react"
import { isToolEnabled } from "@/lib/user-tools"
import { getGuilds } from "@/app/dashboard/servers/actions"
import { createVoiceHub } from "./actions"
import ServerSelector from "./ServerSelector"
import { requireOperator } from "@/lib/auth/operator-authorization"

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

export default async function NewVoiceHubPage() {
  const actor = await requireOperator()

  const enabled = await isToolEnabled(actor.userId, "voice-channels")

  if (!enabled) {
    redirect("/dashboard")
  }

  const { error, guilds } = await getGuilds()

  if (error) {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <Link
          href="/dashboard/voice-channels"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-clutch-gray-lighter transition-colors hover:text-white"
        >
          <ArrowLeft size={17} />
          Voltar para Canais Temporários
        </Link>

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
        <Link
          href="/dashboard/voice-channels"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-clutch-gray-lighter transition-colors hover:text-white"
        >
          <ArrowLeft size={17} />
          Voltar para Canais Temporários
        </Link>

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
      <Link
        href="/dashboard/voice-channels"
        className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-clutch-gray-lighter transition-colors hover:text-white"
      >
        <ArrowLeft size={17} />
        Voltar para Canais Temporários
      </Link>

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

      <form
        action={createVoiceHub}
        className="mt-6 rounded-3xl border border-white/10 bg-[#1f1f23] p-6 sm:p-8"
      >
        <div className="flex items-start gap-4 border-b border-white/10 pb-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-clutch-pink/10 text-clutch-pink">
            <Server size={21} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              Servidor de destino
            </h2>

            <p className="mt-1 text-sm leading-6 text-clutch-gray-lighter">
              O bot criará um canal de voz que será usado como ponto de entrada
              para as salas temporárias.
            </p>
          </div>
        </div>

        <div className="mt-7">
          <label className="mb-2 block text-sm font-semibold text-white">
            Selecione o servidor Discord
          </label>

          <ServerSelector guilds={guilds} />

          <p className="mt-3 text-sm leading-6 text-clutch-gray-lighter">
            Apenas servidores onde o bot está conectado aparecem nesta lista.
          </p>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clutch-pink/10 text-clutch-pink">
              <AudioLines size={18} />
            </div>

            <p className="mt-3 text-sm font-semibold text-white">
              Hub criado no Discord
            </p>

            <p className="mt-1 text-xs leading-5 text-clutch-gray-lighter">
              Um canal de voz será criado automaticamente.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-clutch-blue/10 text-clutch-blue">
              <Sparkles size={18} />
            </div>

            <p className="mt-3 text-sm font-semibold text-white">
              Configuração guiada
            </p>

            <p className="mt-1 text-xs leading-5 text-clutch-gray-lighter">
              Nome, limites e permissões serão definidos em seguida.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
              <CheckCircle2 size={18} />
            </div>

            <p className="mt-3 text-sm font-semibold text-white">
              Pronto para usar
            </p>

            <p className="mt-1 text-xs leading-5 text-clutch-gray-lighter">
              O Hub passa a criar salas quando estiver configurado.
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-col-reverse gap-3 border-t border-white/10 pt-6 sm:flex-row sm:items-center sm:justify-end">
          <Link
            href="/dashboard/voice-channels"
            className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] px-5 py-3 text-sm font-semibold text-clutch-gray-lighter transition-colors hover:bg-white/10 hover:text-white"
          >
            Cancelar
          </Link>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-clutch-pink px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-clutch-pink/20 transition-all hover:-translate-y-0.5 hover:bg-clutch-pink-dark"
          >
            Criar Hub
            <ArrowRight size={18} />
          </button>
        </div>
      </form>
    </div>
  )
}
