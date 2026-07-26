import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-clutch-gray relative overflow-hidden">
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-clutch-pink/20 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-clutch-blue/20 rounded-full blur-3xl"></div>

      <div className="relative bg-[#1f1f23] border border-white/10 rounded-2xl p-10 shadow-2xl text-center max-w-sm w-full mx-4">
        <img src="/logo/logo-white.png" alt="Clutch" className="h-10 mx-auto mb-8" />

        <h1 className="text-2xl font-bold text-white mb-2">Discord Hub</h1>
        <p className="text-clutch-gray-lighter mb-8 text-sm">Gerencie templates do seu servidor</p>

        <form
          action={async () => {
            "use server"
            await signIn("discord")
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-clutch-pink hover:bg-clutch-pink-dark text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            Entrar com Discord
          </button>
        </form>
      </div>
    </div>
  )
}