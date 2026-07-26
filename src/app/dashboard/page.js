import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { createTemplate, getTemplates, deleteTemplate } from "./actions"
import Link from "next/link"

export default async function Dashboard() {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  const templates = await getTemplates()

  return (
    <div className="min-h-screen bg-clutch-gray">
      <header className="border-b border-white/10 bg-[#1a1a1d]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <img src="/logo/logo-white.png" alt="Clutch" className="h-7" />
          <div className="flex items-center gap-4">
            <a
              href="https://discord.com/oauth2/authorize?client_id=1530768967935721553&permissions=8&integration_type=0&scope=bot"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-clutch-blue hover:bg-clutch-blue-dark text-white text-sm font-medium py-2 px-4 rounded-xl transition-colors"
            >
              Conectar bot ao servidor
            </a>
                        <Link
              href="/dashboard/servers"
              className="text-clutch-gray-lighter hover:text-white text-sm transition-colors"
            >
              Ver servidores
            </Link>
            <img
              src={session.user.image}
              alt="avatar"
              className="w-9 h-9 rounded-full border border-white/10"
            />
            <span className="text-clutch-gray-lighter text-sm">{session.user.name}</span>
            <form
              action={async () => {
                "use server"
                await signOut()
              }}
            >
              <button
                type="submit"
                className="text-clutch-gray-lighter hover:text-white text-sm transition-colors"
              >
                Sair
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white">Seus Templates</h2>
        </div>

        <form action={createTemplate} className="flex gap-3 mb-10">
          <input
            type="text"
            name="name"
            placeholder="Nome do novo template"
            required
            className="flex-1 bg-[#1f1f23] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-clutch-gray-light focus:outline-none focus:border-clutch-pink"
          />
          <button
            type="submit"
            className="bg-clutch-pink hover:bg-clutch-pink-dark text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            Criar
          </button>
        </form>

        {templates.length === 0 ? (
          <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center">
            <p className="text-clutch-gray-lighter">Você ainda não criou nenhum template.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-[#1f1f23] border border-white/10 rounded-xl p-5 flex items-center justify-between hover:border-clutch-pink/40 transition-colors"
              >
                <Link
                  href={`/dashboard/templates/${template.id}`}
                  className="text-white font-medium hover:text-clutch-pink transition-colors"
                >
                  {template.name}
                </Link>
                <form action={deleteTemplate.bind(null, template.id)}>
                  <button
                    type="submit"
                    className="text-red-400 hover:text-red-300 text-sm transition-colors"
                  >
                    Excluir
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