import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"
import {
  AudioLines,
  Bot,
  LayoutTemplate,
  ShieldCheck,
  Sparkles,
} from "lucide-react"

const features = [
  {
    icon: LayoutTemplate,
    title: "Templates inteligentes",
    description: "Estruture servidores completos sem repetir trabalho manual.",
  },
  {
    icon: AudioLines,
    title: "Canais temporários",
    description: "Crie salas de voz automáticas com regras definidas por você.",
  },
  {
    icon: ShieldCheck,
    title: "Permissões sob controle",
    description: "Aplique cargos, acessos e regras diretamente pelo painel.",
  },
]

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <main className="login-shell min-h-screen overflow-hidden bg-clutch-gray text-white">
      <div className="login-grid pointer-events-none absolute inset-0" />
      <div className="login-orb login-orb-pink pointer-events-none absolute" />
      <div className="login-orb login-orb-blue pointer-events-none absolute" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <img
            src="/logo/logo-white.png"
            alt="Clutch"
            className="h-7 w-auto sm:h-8"
          />

          <div className="hidden items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-xs font-medium text-clutch-gray-lighter sm:flex">
            <span className="h-2 w-2 rounded-full bg-clutch-green shadow-[0_0_12px_rgba(46,245,176,0.9)]" />
            Plataforma online
          </div>
        </header>

        <div className="flex flex-1 items-center py-12 lg:py-16">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
            <section className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-clutch-pink/25 bg-clutch-pink/10 px-3 py-1.5 text-xs font-semibold text-clutch-pink-light">
                <Sparkles size={14} />
                Gestão Discord em um só lugar
              </div>

              <h1 className="max-w-xl text-4xl font-bold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-6xl">
                Seu servidor Discord,
                <span className="block bg-gradient-to-r from-clutch-pink to-clutch-blue bg-clip-text text-transparent">
                  muito mais inteligente.
                </span>
              </h1>

              <p className="mt-6 max-w-xl text-base leading-7 text-clutch-gray-lighter sm:text-lg">
                Centralize templates, permissões e canais temporários em uma
                plataforma pensada para deixar a gestão do seu servidor simples
                e profissional.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                {features.map((feature) => {
                  const Icon = feature.icon

                  return (
                    <div
                      key={feature.title}
                      className="rounded-2xl border border-white/10 bg-white/[0.035] p-4 backdrop-blur-sm"
                    >
                      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-clutch-pink/10 text-clutch-pink">
                        <Icon size={20} />
                      </div>

                      <h2 className="text-sm font-semibold text-white">
                        {feature.title}
                      </h2>

                      <p className="mt-1.5 text-xs leading-5 text-clutch-gray-lighter">
                        {feature.description}
                      </p>
                    </div>
                  )
                })}
              </div>
            </section>

            <section className="mx-auto w-full max-w-md lg:mx-0 lg:justify-self-end">
              <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#202025]/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-xl sm:p-8">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-clutch-pink/80 to-transparent" />

                <div className="mb-8 flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-clutch-pink to-[#b71f59] text-white shadow-lg shadow-clutch-pink/20">
                    <Bot size={24} />
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-white">
                      Bem-vindo ao Clutch Hub
                    </p>
                    <p className="mt-1 text-sm text-clutch-gray-lighter">
                      Entre para acessar seu painel.
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-black/15 p-4">
                  <p className="text-sm font-medium text-white">
                    Continue com sua conta Discord
                  </p>

                  <p className="mt-1.5 text-sm leading-6 text-clutch-gray-lighter">
                    Usamos sua conta para conectar você aos servidores onde o
                    bot está instalado.
                  </p>
                </div>

                <form
                  className="mt-6"
                  action={async () => {
                    "use server"
                    await signIn("discord")
                  }}
                >
                  <button
                    type="submit"
                    className="group flex w-full items-center justify-center gap-3 rounded-xl bg-[#5865F2] px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-[#5865F2]/20 transition-all hover:-translate-y-0.5 hover:bg-[#6874f4] hover:shadow-[#5865F2]/35 active:translate-y-0"
                  >
                    <svg
                      viewBox="0 0 127.14 96.36"
                      aria-hidden="true"
                      className="h-5 w-5 fill-current transition-transform group-hover:scale-110"
                    >
                      <path d="M107.7 8.07A105.15 105.15 0 0 0 81.47.12a72.06 72.06 0 0 0-3.36 6.83 97.68 97.68 0 0 0-29.22 0A72.37 72.37 0 0 0 45.53.12 105.89 105.89 0 0 0 19.39 8.06C2.79 32.65-1.71 56.63.54 80.28h.01a105.73 105.73 0 0 0 32.17 16.08 77.7 77.7 0 0 0 6.89-11.13 68.42 68.42 0 0 1-10.85-5.18c.91-.67 1.8-1.37 2.66-2.08 20.91 9.77 43.65 9.77 64.31 0 .87.71 1.75 1.41 2.66 2.08a68.68 68.68 0 0 1-10.87 5.19 77 77 0 0 0 6.89 11.12 105.25 105.25 0 0 0 32.19-16.08c2.64-27.43-4.51-51.18-18.9-72.21ZM42.45 65.69c-6.27 0-11.4-5.74-11.4-12.81 0-7.06 5.05-12.81 11.4-12.81 6.36 0 11.5 5.75 11.4 12.81 0 7.07-5.05 12.81-11.4 12.81Zm42.24 0c-6.27 0-11.4-5.74-11.4-12.81 0-7.06 5.05-12.81 11.4-12.81 6.36 0 11.5 5.75 11.4 12.81 0 7.07-5.04 12.81-11.4 12.81Z" />
                    </svg>
                    Entrar com Discord
                  </button>
                </form>

                <div className="my-6 h-px bg-white/10" />

                <p className="text-center text-xs leading-5 text-clutch-gray-lighter">
                  Ao entrar, você autoriza a conexão da sua conta Discord com a
                  plataforma Clutch Hub.
                </p>
              </div>

              <p className="mt-5 text-center text-xs text-clutch-gray-light">
                Clutch Hub · Gestão inteligente para comunidades Discord
              </p>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}