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
    <div className="min-h-screen bg-clutch-gray">
      <header className="border-b border-white/10 bg-[#1a1a1d]">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-4">
          <Link href="/dashboard" className="text-clutch-gray-lighter hover:text-white transition-colors">
            ← Voltar
          </Link>
          <h1 className="text-xl font-bold text-white">{template.name}</h1>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        <h2 className="text-lg font-semibold text-white mb-4">Adicionar canal</h2>

        <form action={addChannelWithId} className="bg-[#1f1f23] border border-white/10 rounded-xl p-6 mb-10 space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              name="name"
              placeholder="Nome do canal"
              required
              className="flex-1 bg-[#17171a] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-clutch-gray-light focus:outline-none focus:border-clutch-pink"
            />
            <select
              name="type"
              className="bg-[#17171a] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-clutch-pink"
            >
              {CHANNEL_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-3 cursor-pointer w-fit">
            <span className="text-clutch-gray-lighter text-sm">Canal privado</span>
            <div className="relative">
              <input
                type="checkbox"
                name="isPrivate"
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#17171a] border border-white/10 rounded-full peer-checked:bg-clutch-pink transition-colors"></div>
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform peer-checked:translate-x-5"></div>
            </div>
          </label>

          <button
            type="submit"
            className="bg-clutch-pink hover:bg-clutch-pink-dark text-white font-medium py-3 px-6 rounded-xl transition-colors"
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