import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  ArrowRight,
  FilePlus2,
  Files,
  LayoutTemplate,
  Plus,
  Trash2,
} from "lucide-react"
import { isToolEnabled } from "@/lib/user-tools"
import {
  createTemplate,
  getTemplates,
  deleteTemplate,
} from "@/app/dashboard/actions"

export default async function TemplatesPage() {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  const enabled = await isToolEnabled(session.user.id, "templates")

  if (!enabled) {
    redirect("/dashboard")
  }

  const templates = await getTemplates()

  return (
    <div className="mx-auto w-full max-w-6xl">
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#202025] px-6 py-8 shadow-2xl shadow-black/20 sm:px-8 sm:py-10">
        <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-clutch-pink/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-32 h-60 w-60 rounded-full bg-clutch-blue/15 blur-3xl" />

        <div className="relative">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-clutch-pink/25 bg-clutch-pink/10 px-3 py-1.5 text-xs font-semibold text-clutch-pink-light">
            <LayoutTemplate size={14} />
            Estrutura do servidor
          </div>

          <div className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
            <div className="max-w-2xl">
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
                Templates de Servidor
              </h1>

              <p className="mt-3 text-sm leading-6 text-clutch-gray-lighter sm:text-base">
                Crie estruturas reutilizáveis de canais para organizar seu
                servidor Discord com rapidez e consistência.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/15 px-5 py-4">
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-clutch-gray-light">
                Templates criados
              </p>

              <p className="mt-1 text-2xl font-bold text-white">
                {templates.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-white/10 bg-[#1f1f23] p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-bold text-white">
              Criar novo template
            </h2>

            <p className="mt-1 text-sm text-clutch-gray-lighter">
              Dê um nome para a estrutura que você deseja configurar.
            </p>
          </div>

          <form
            action={createTemplate}
            className="flex w-full flex-col gap-3 sm:flex-row lg:max-w-xl"
          >
            <input
              type="text"
              name="name"
              placeholder="Ex.: Comunidade Gamer"
              required
              className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#17171a] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-clutch-gray-light focus:border-clutch-pink focus:ring-2 focus:ring-clutch-pink/20"
            />

            <button
              type="submit"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-clutch-pink px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-clutch-pink-dark"
            >
              <Plus size={18} />
              Criar template
            </button>
          </form>
        </div>
      </section>

      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white">Seus templates</h2>

            <p className="mt-1 text-sm text-clutch-gray-lighter">
              Selecione um template para configurar seus canais.
            </p>
          </div>

          {templates.length > 0 ? (
            <p className="text-sm text-clutch-gray-lighter">
              {templates.length}{" "}
              {templates.length === 1 ? "template" : "templates"}
            </p>
          ) : null}
        </div>

        {templates.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.015] px-6 py-16 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-clutch-pink/10 text-clutch-pink">
              <FilePlus2 size={25} />
            </div>

            <h3 className="mt-5 text-lg font-semibold text-white">
              Seu primeiro template começa aqui
            </h3>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-clutch-gray-lighter">
              Crie um template para definir categorias e canais que poderão ser
              aplicados no seu servidor Discord.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {templates.map((template) => (
              <article
                key={template.id}
                className="group relative overflow-hidden rounded-2xl border border-white/10 bg-[#1f1f23] p-5 transition-all hover:-translate-y-1 hover:border-clutch-pink/45 hover:shadow-xl hover:shadow-black/20"
              >
                <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-clutch-pink/70 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                <div className="flex items-start justify-between gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clutch-pink/10 text-clutch-pink">
                    <Files size={23} />
                  </div>

                  <form action={deleteTemplate.bind(null, template.id)}>
                    <button
                      type="submit"
                      aria-label={`Excluir template ${template.name}`}
                      className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-clutch-gray-lighter transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
                    >
                      <Trash2 size={17} />
                    </button>
                  </form>
                </div>

                <div className="mt-6">
                  <h3 className="truncate text-lg font-semibold text-white">
                    {template.name}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-clutch-gray-lighter">
                    Configure canais, tipos, ordem e regras de privacidade.
                  </p>
                </div>

                <Link
                  href={`/dashboard/templates/${template.id}`}
                  className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-clutch-pink transition-colors hover:text-clutch-pink-light"
                >
                  Editar template
                  <ArrowRight size={16} />
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}