import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { getUserToolsState } from "@/lib/user-tools"
import Sidebar from "@/components/Sidebar"

export default async function DashboardLayout({ children }) {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  const tools = await getUserToolsState(session.user.id)

  return (
    <div className="min-h-screen bg-clutch-gray flex">
      <Sidebar tools={tools} />

      <div className="flex-1 flex flex-col">
        <header className="border-b border-white/10 bg-[#1a1a1d]">
          <div className="px-6 py-4 flex items-center justify-between">
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

        <main className="flex-1 px-6 py-10">{children}</main>
      </div>
    </div>
  )
}