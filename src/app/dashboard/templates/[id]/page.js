import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import Link from "next/link"
import { addChannel } from "./actions"
import ChannelList from "./ChannelList"

const CHANNEL_TYPES = [
  { value: "TEXT", label: "Texto" },
  { value: "VOICE", label: "Voz" },
  { value: "FORUM", label: "Fórum" },
  { value: "ANNOUNCEMENT", label: "Announcements" },
  { value: "STAGE", label: "Palco" },
]

export default async function TemplateEditor({ params }) {
  const session = await auth()
  if (!session) redirect("/")

  const { id } = await params

  const template = await prisma.template.findFirst({
    where: { id, userId: session.user.id },
    include: {
      channels: {
        orderBy: { order: "asc" },
      },
    },
  })

  if (!template) redirect("/dashboard")

  const addChannelWithId = addChannel.bind(null, id)

  return (
    <div className="min-h-screen bg-slate-900">
      <header className="border-b border-slate-800 bg-slate-950/50">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-slate-400 hover:text-white transition-colors">
            ← Voltar
          </Link>
          <h1 className="text-xl font-bold text-white">{template.name}</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-lg font-semibold text-white mb-4">Adicionar canal</h2>

        <form action={addChannelWithId} className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-10 space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              name="name"
              placeholder="Nome do canal"
              required
              className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <select
              name="type"
              className="bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-indigo-500"
            >
              {CHANNEL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer w-fit">
            <span className="text-slate-300 text-sm">Canal privado</span>
            <div className="relative">
              <input
                type="checkbox"
                name="isPrivate"
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 rounded-full peer-checked:bg-indigo-600 transition-colors"></div>
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
            </div>
          </label>

          <button
            type="submit"
            className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            Adicionar canal
          </button>
        </form>

        <h2 className="text-lg font-semibold text-white mb-4">Canais do template</h2>

        <ChannelList templateId={id} initialChannels={template.channels} />
      </main>
    </div>
  )
}