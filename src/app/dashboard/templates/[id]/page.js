import { auth } from "@/auth"
import { redirect } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  FolderPlus,
  LayoutTemplate,
  Lock,
  Plus,
  Save,
} from "lucide-react"
import {
  getTemplate,
  updateTemplateName,
  addChannel,
  updateChannel,
  deleteChannel,
  updateChannelOrder,
} from "./actions"
import ChannelList from "./ChannelList"
import { isToolEnabled } from "@/lib/user-tools"
import { domainConstants } from "@/lib/validation/domain-validation"

const CHANNEL_TYPE_LABELS = Object.freeze({
  TEXT: "Texto",
  VOICE: "Voz",
  FORUM: "Fórum",
  ANNOUNCEMENT: "Anúncios",
})
const CHANNEL_TYPES = domainConstants.channelTypes.map((value) => ({
  value,
  label: CHANNEL_TYPE_LABELS[value],
}))

export default async function TemplateDetailsPage({ params }) {
  const session = await auth()

  if (!session) {
    redirect("/")
  }

  const enabled = await isToolEnabled(session.user.id, "templates")

  if (!enabled) {
    redirect("/dashboard")
  }

  const { id } = await params

  if (!id) {
    redirect("/dashboard/templates")
  }

  const template = await getTemplate(id)

  if (!template || template.userId !== session.user.id) {
    redirect("/dashboard/templates")
  }

  return (
    <div className="mx-auto w-full max-w-6xl">
      <div className="mb-8 flex items-center gap-3">
        <Link
          href="/dashboard/templates"
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-clutch-gray-lighter transition-colors hover:border-clutch-pink/50 hover:bg-clutch-pink/10 hover:text-white"
          aria-label="Voltar para templates"
        >
          <ArrowLeft size={20} />
        </Link>

        <div>
          <p className="text-sm text-clutch-gray-lighter">
            Templates de Servidor
          </p>

          <h1 className="text-2xl font-bold text-white">Editar template</h1>
        </div>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#202025] p-6 shadow-2xl shadow-black/20 sm:p-8">
        <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-clutch-pink/15 blur-3xl" />

        <div className="relative flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-clutch-pink/10 text-clutch-pink">
              <LayoutTemplate size={23} />
            </div>

            <h2 className="mt-5 text-2xl font-bold text-white">
              {template.name}
            </h2>

            <p className="mt-2 text-sm leading-6 text-clutch-gray-lighter">
              Defina a estrutura de canais que será criada quando este template
              for aplicado no Discord.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-black/15 px-5 py-4">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-clutch-gray-light">
              Canais configurados
            </p>

            <p className="mt-1 text-2xl font-bold text-white">
              {template.channels.length}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-[#1f1f23] p-5 sm:p-6">
        <div className="mb-5">
          <h2 className="text-lg font-bold text-white">Nome do template</h2>

          <p className="mt-1 text-sm text-clutch-gray-lighter">
            Este nome será exibido ao aplicar o template no Discord.
          </p>
        </div>

        <form
          action={updateTemplateName.bind(null, template.id)}
          className="flex flex-col gap-3 sm:flex-row"
        >
          <input
            type="text"
            name="name"
            defaultValue={template.name}
            minLength={1}
            maxLength={100}
            required
            className="min-w-0 flex-1 rounded-xl border border-white/10 bg-[#17171a] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-clutch-gray-light focus:border-clutch-pink focus:ring-2 focus:ring-clutch-pink/20"
          />

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/15"
          >
            <Save size={17} />
            Salvar nome
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-[#1f1f23] p-5 sm:p-6">
        <div className="mb-6 flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-clutch-blue/10 text-clutch-blue">
            <FolderPlus size={20} />
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">Adicionar canal</h2>

            <p className="mt-1 text-sm leading-6 text-clutch-gray-lighter">
              Crie os canais que farão parte da estrutura deste template.
            </p>
          </div>
        </div>

        <form
          action={addChannel.bind(null, template.id)}
          className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_170px_auto_auto]"
        >
          <input
            type="text"
            name="name"
            placeholder="Nome do novo canal"
            minLength={1}
            maxLength={100}
            required
            className="min-w-0 rounded-xl border border-white/10 bg-[#17171a] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-clutch-gray-light focus:border-clutch-pink focus:ring-2 focus:ring-clutch-pink/20"
          />

          <select
            name="type"
            defaultValue="TEXT"
            className="rounded-xl border border-white/10 bg-[#17171a] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-clutch-pink focus:ring-2 focus:ring-clutch-pink/20"
          >
            {CHANNEL_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-clutch-gray-lighter transition-colors hover:border-white/20 hover:text-white">
            <input
              type="checkbox"
              name="isPrivate"
              className="h-4 w-4 accent-[#f92c6e]"
            />
            <Lock size={16} />
            Privado
          </label>

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-clutch-pink px-5 py-3 text-sm font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-clutch-pink-dark"
          >
            <Plus size={18} />
            Adicionar
          </button>
        </form>
      </section>

      <section className="mt-10">
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Canais do template
            </h2>

            <p className="mt-1 text-sm text-clutch-gray-lighter">
              Arraste os canais para definir a ordem de criação no Discord.
            </p>
          </div>

          <p className="text-sm text-clutch-gray-lighter">
            {template.channels.length}{" "}
            {template.channels.length === 1 ? "canal" : "canais"}
          </p>
        </div>

        <ChannelList
          templateId={template.id}
          channels={template.channels}
          updateChannel={updateChannel}
          deleteChannel={deleteChannel}
          updateChannelOrder={updateChannelOrder}
          channelTypes={CHANNEL_TYPES}
        />
      </section>
    </div>
  )
}
