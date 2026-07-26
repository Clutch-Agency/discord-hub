import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { getTemplate, updateTemplateName, addChannel, updateChannel, deleteChannel, updateChannelOrder } from "./actions"
import ChannelList from "./ChannelList"
import { isToolEnabled } from "@/lib/user-tools"

const CHANNEL_TYPES = [
  { value: "TEXT", label: "Texto" },
  { value: "VOICE", label: "Voz" },
  { value: "FORUM", label: "Fórum" },
  { value: "ANNOUNCEMENT", label: "Anúncios" },
]

export default async function TemplateDetailsPage({ params }) {
  const session = await auth()
  if (!session) redirect("/")

  const enabled = await isToolEnabled(session.user.id, "templates")
  if (!enabled) {
    redirect("/dashboard")
  }

  // Desestruturar o id de params usando await
  const { id } = await params

  if (!id) {
    // Se o ID não for válido, redirecionar para a lista de templates
    redirect("/dashboard/templates");
  }

  const template = await getTemplate(id)

  if (!template || template.userId !== session.user.id) {
    redirect("/dashboard/templates")
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white">Editar Template: {template.name}</h2>
        <form action={updateTemplateName.bind(null, template.id)}>
          <input
            type="text"
            name="name"
            defaultValue={template.name}
            className="bg-[#1f1f23] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-clutch-gray-light focus:outline-none focus:border-clutch-pink"
          />
          <button
            type="submit"
            className="ml-3 bg-clutch-pink hover:bg-clutch-pink-dark text-white font-medium py-3 px-6 rounded-xl transition-colors"
          >
            Salvar
          </button>
        </form>
      </div>

      <h3 className="text-xl font-bold text-white mb-4">Canais</h3>

      <form action={addChannel.bind(null, template.id)} className="flex gap-3 mb-10">
        <input
          type="text"
          name="name"
          placeholder="Nome do novo canal"
          required
          className="flex-1 bg-[#1f1f23] border border-white/10 rounded-xl px-4 py-3 text-white placeholder-clutch-gray-light focus:outline-none focus:border-clutch-pink"
        />
        <select
          name="type"
          className="bg-[#1f1f23] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-clutch-pink"
        >
          {CHANNEL_TYPES.map((type) => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <input type="checkbox" name="isPrivate" id="isPrivate" className="w-4 h-4 text-clutch-pink bg-gray-700 border-gray-600 rounded focus:ring-clutch-pink focus:ring-2" />
          <label htmlFor="isPrivate" className="text-clutch-gray-lighter text-sm">Privado</label>
        </div>
        <button
          type="submit"
          className="bg-clutch-pink hover:bg-clutch-pink-dark text-white font-medium py-3 px-6 rounded-xl transition-colors"
        >
          Adicionar
        </button>
      </form>

      <ChannelList
        templateId={template.id}
        channels={template.channels}
        updateChannel={updateChannel}
        deleteChannel={deleteChannel}
        updateChannelOrder={updateChannelOrder}
        channelTypes={CHANNEL_TYPES}
      />
    </div>
  )
}