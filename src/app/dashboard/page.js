import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import { getUserToolsState } from "@/lib/user-tools"
import {
  ArrowRight,
  CheckCircle2,
  LayoutTemplate,
  Mic,
  Server,
  Sparkles,
} from "lucide-react"
import { toggleTool } from "@/app/dashboard/tools-actions"

const ICONS = {
  LayoutTemplate,
  Server,
  Mic,
}

export default async function Dashboard() {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  const tools = await getUserToolsState(session.user.id)
  const coreTools = tools.filter((tool) => tool.isCore)
  const nonCoreTools = tools.filter((tool) => !tool.isCore)
  const enabledTools = nonCoreTools.filter((tool) => tool.enabled)
  const serverTool = coreTools.find((tool) => tool.key === "servers")
  const firstName = session.user.name?.split(" ")[0] || "usuário"

  return (
    <div className="mx-auto w-full max-w-7xl">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#202025] px-6 py-8 shadow-2xl shadow-black/20 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full bg-clutch-pink/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-36 right-40 h-72 w-72 rounded-full bg-clutch-blue/15 blur-3xl" />

        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-clutch-pink/25 bg-clutch-pink/10 px-3 py-1.5 text-xs font-semibold text-clutch-pink-light">
            <Sparkles size={14} />
            Painel de controle
          </div>

          <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Olá, {firstName}.
              </h1>

              <p className="mt-3 max-w-xl text-sm leading-6 text-clutch-gray-lighter sm:text-base">
                Gerencie seus servidores Discord, ative ferramentas e configure
                a experiência da sua comunidade em um único lugar.
              </p>
            </div>

            <Link
              href={serverTool?.href || "/dashboard/servers"}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-clutch-blue px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-clutch-blue/20 transition-all hover:-translate-y-0.5 hover:bg-clutch-blue-dark hover:shadow-clutch-blue/30"
            >
              <Server size={18} />
              Gerenciar servidores
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <Link
          href={serverTool?.href || "/dashboard/servers"}
          className="group rounded-2xl border border-white/10 bg-[#1f1f23] p-5 transition-all hover:-translate-y-1 hover:border-clutch-blue/45 hover:shadow-xl hover:shadow-black/20"
        >
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-clutch-blue/10 text-clutch-blue">
              <Server size={21} />
            </div>

            <ArrowRight
              size={18}
              className="text-clutch-gray-light transition-transform group-hover:translate-x-1 group-hover:text-clutch-blue"
            />
          </div>

          <p className="mt-5 text-base font-semibold text-white">
            Servidores conectados
          </p>

          <p className="mt-1 text-sm leading-6 text-clutch-gray-lighter">
            Conecte o bot, acompanhe os servidores disponíveis e gerencie sua
            integração com o Discord.
          </p>
        </Link>

        <div className="rounded-2xl border border-white/10 bg-[#1f1f23] p-5">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-clutch-pink/10 text-clutch-pink">
              <Sparkles size={21} />
            </div>

            <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-xs font-medium text-clutch-gray-lighter">
              Ferramentas
            </span>
          </div>

          <p className="mt-5 text-3xl font-bold text-white">
            {nonCoreTools.length}
          </p>

          <p className="mt-1 text-sm text-clutch-gray-lighter">
            ferramentas disponíveis na plataforma
          </p>
        </div>

        <div className="rounded-2xl border border-white/10 bg-[#1f1f23] p-5 sm:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-clutch-green/10 text-clutch-green">
              <CheckCircle2 size={21} />
            </div>

            <span className="rounded-full border border-clutch-green/20 bg-clutch-green/10 px-2.5 py-1 text-xs font-medium text-clutch-green">
              Ativas
            </span>
          </div>

          <p className="mt-5 text-3xl font-bold text-white">
            {enabledTools.length}
          </p>

          <p className="mt-1 text-sm text-clutch-gray-lighter">
            ferramentas prontas para serem usadas
          </p>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Ferramentas do Hub
            </h2>

            <p className="mt-1 text-sm text-clutch-gray-lighter">
              Ative as ferramentas que deseja disponibilizar para sua comunidade.
            </p>
          </div>

          <p className="text-sm text-clutch-gray-lighter">
            {enabledTools.length} de {nonCoreTools.length} ativas
          </p>
        </div>

        {nonCoreTools.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.015] px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-clutch-gray-lighter">
              <Sparkles size={22} />
            </div>

            <h3 className="mt-4 font-semibold text-white">
              Nenhuma ferramenta disponível
            </h3>

            <p className="mt-2 text-sm text-clutch-gray-lighter">
              As próximas ferramentas adicionadas à plataforma aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {nonCoreTools.map((tool) => {
              const Icon = ICONS[tool.icon] || LayoutTemplate

              return (
                <article
                  key={tool.key}
                  className={`group relative overflow-hidden rounded-2xl border bg-[#1f1f23] p-5 transition-all ${
                    tool.enabled
                      ? "border-white/10 hover:-translate-y-1 hover:border-clutch-pink/45 hover:shadow-xl hover:shadow-black/20"
                      : "border-white/5 opacity-65"
                  }`}
                >
                  {tool.enabled ? (
                    <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-clutch-pink/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
                  ) : null}

                  <div className="flex items-start justify-between gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clutch-pink/10 text-clutch-pink">
                      <Icon size={23} />
                    </div>

                    <form action={toggleTool.bind(null, tool.key, !tool.enabled)}>
                      <button
                        type="submit"
                        aria-label={
                          tool.enabled
                            ? `Desativar ${tool.name}`
                            : `Ativar ${tool.name}`
                        }
                        className={`relative h-6 w-11 rounded-full transition-colors ${
                          tool.enabled ? "bg-clutch-pink" : "bg-white/10"
                        }`}
                      >
                        <span
                          className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
                            tool.enabled ? "translate-x-5" : "translate-x-0"
                          }`}
                        />
                      </button>
                    </form>
                  </div>

                  <div className="mt-6">
                    <h3 className="text-base font-semibold text-white">
                      {tool.name}
                    </h3>

                    <p className="mt-2 min-h-12 text-sm leading-6 text-clutch-gray-lighter">
                      {tool.description}
                    </p>
                  </div>

                  {tool.enabled ? (
                    <Link
                      href={tool.href}
                      className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-clutch-pink transition-colors hover:text-clutch-pink-light"
                    >
                      Abrir ferramenta
                      <ArrowRight size={16} />
                    </Link>
                  ) : (
                    <p className="mt-5 text-sm font-medium text-clutch-gray-light">
                      Ferramenta desativada
                    </p>
                  )}
                </article>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}