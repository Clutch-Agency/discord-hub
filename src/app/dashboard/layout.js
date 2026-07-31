import { auth } from "@/auth"
import { notFound, redirect } from "next/navigation"
import { getUserToolsState } from "@/lib/user-tools"
import {
  AUTHORIZATION_ERROR_CODES,
  isAuthorizationError,
} from "@/lib/auth/authorization-error"
import { requireOperator } from "@/lib/auth/operator-authorization"
import Sidebar from "@/components/Sidebar"
import UserDropdown from "@/components/UserDropdown"

export const dynamic = "force-dynamic"

export default async function DashboardLayout({ children }) {
  try {
    await requireOperator()
  } catch (error) {
    if (
      isAuthorizationError(error) &&
      error.code === AUTHORIZATION_ERROR_CODES.UNAUTHENTICATED
    ) {
      redirect("/")
    }

    notFound()
  }

  const session = await auth()

  if (!session) {
    redirect("/")
  }

  const tools = await getUserToolsState(session.user.id)

  return (
    <div className="min-h-screen bg-[#17171a] text-white">
      <div className="flex min-h-screen">
        <Sidebar tools={tools} />

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 border-b border-white/10 bg-[#1a1a1d]/90 backdrop-blur-xl">
            <div className="flex h-18 items-center justify-between px-5 py-4 sm:px-7 lg:px-10">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-clutch-green shadow-[0_0_12px_rgba(46,245,176,0.9)]" />

                <p className="text-sm font-medium text-clutch-gray-lighter">
                  Clutch Hub
                </p>
              </div>

              <UserDropdown user={session.user} />
            </div>
          </header>

          <main className="flex-1 px-5 py-7 sm:px-7 lg:px-10 lg:py-10">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
