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
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-800 bg-slate-950/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-white">Discord Hub</h1>
          <div className="flex items-center gap-4">
            <img
              src={session.user.image}
              alt="avatar"
              className="w-9 h-9 rounded-full border border-slate-700"
            />
            <span className="text-slate-300 text-sm">{session.user.name}</span>
            <form
              action={async () => {
                "use server"
                await signOut()
              }}
            >
              <button
                type="submit"
                className="text-slate-400 hover:text-white text-sm transition-colors"
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
            className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            Criar
          </button>
        </form>

        {templates.length === 0 ? (
          <div className="border border-dashed border-slate-700 rounded-2xl p-16 text-center">
            <p className="text-slate-400">Você ainda não criou nenhum template.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl p-5 flex items-center justify-between"
              >
                <Link
                  href={`/dashboard/templates/${template.id}`}
                  className="text-white font-medium hover:text-indigo-400 transition-colors"
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