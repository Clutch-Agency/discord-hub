import { auth, signIn } from "@/auth"
import { redirect } from "next/navigation"

export default async function Home() {
  const session = await auth()

  if (session) {
    redirect("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950">
      <div className="bg-slate-800/50 backdrop-blur-xl border border-slate-700 rounded-2xl p-10 shadow-2xl text-center max-w-sm w-full">
        <h1 className="text-3xl font-bold text-white mb-2">Discord Hub</h1>
        <p className="text-slate-400 mb-8">Gerencie templates do seu servidor</p>
        <form
          action={async () => {
            "use server"
            await signIn("discord")
          }}
        >
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-3 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            Entrar com Discord
          </button>
        </form>
      </div>
    </div>
  )
}