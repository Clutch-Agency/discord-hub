import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getUserToolsState } from "@/lib/user-tools"
import Link from "next/link"
import { LayoutTemplate, Check, X, Server } from "lucide-react"
import { toggleTool } from "@/app/dashboard/tools-actions"

const ICONS = {
  LayoutTemplate: LayoutTemplate,
  Server: Server,
}

export default async function Dashboard() {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  const tools = await getUserToolsState(session.user.id)

  // Filtra as ferramentas que não são "core" para exibir nos cards
  const nonCoreTools = tools.filter(tool => !tool.isCore)

  return (
    <div>
      <h2 className="text-2xl font-bold text-white mb-8">Ferramentas do Hub</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {nonCoreTools.map((tool) => {
          const Icon = ICONS[tool.icon] || LayoutTemplate

          const cardContent = (
            <div
              className={`bg-[#1f1f23] border rounded-2xl p-6 h-full transition-colors ${
                tool.enabled
                  ? "border-white/10 hover:border-clutch-pink/40"
                  : "border-white/5 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 rounded-xl bg-clutch-pink/10 flex items-center justify-center">
                  <Icon size={22} className="text-clutch-pink" />
                </div>

                <div className="flex items-center gap-2">
                  <form action={toggleTool.bind(null, tool.key, !tool.enabled)}>
                    <button
                      type="submit"
                      className={`relative w-9 h-5 rounded-full transition-colors flex-shrink-0 ${
                        tool.enabled ? "bg-clutch-pink" : "bg-white/10"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                          tool.enabled ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </form>
                </div>
              </div>

              <h3 className="text-white font-semibold mb-1">{tool.name}</h3>
              <p className="text-clutch-gray-lighter text-sm">{tool.description}</p>
            </div>
          )

          return tool.enabled ? (
            <Link key={tool.key} href={tool.href}>
              {cardContent}
            </Link>
          ) : (
            <div key={tool.key}>{cardContent}</div>
          )
        })}
      </div>
    </div>
  )
}