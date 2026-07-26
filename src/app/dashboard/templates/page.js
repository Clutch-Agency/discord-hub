import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { isToolEnabled } from "@/lib/user-tools"
import Link from "next/link"
// Importar as actions do caminho correto
import { createTemplate, getTemplates, deleteTemplate } from "@/app/dashboard/actions"

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
    <div>
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
    </div>
  )
}