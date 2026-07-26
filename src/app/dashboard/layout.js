import { auth, signOut } from "@/auth"
import { redirect } from "next/navigation"
import { getUserToolsState } from "@/lib/user-tools"
import Sidebar from "@/components/Sidebar"
import UserDropdown from "@/components/UserDropdown" // Importe o novo componente

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
              <UserDropdown user={session.user} /> {/* Adicionado o componente UserDropdown */}
            </div>
          </div>
        </header>

        <main className="flex-1 px-6 py-10">{children}</main>
      </div>
    </div>
  )
}