"use client"

import { useState } from "react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import {
  Check,
  GripVertical,
  Hash,
  Lock,
  MessageSquareText,
  Mic,
  Pencil,
  Radio,
  Trash2,
  X,
} from "lucide-react"

const TYPE_ICONS = {
  TEXT: Hash,
  VOICE: Mic,
  FORUM: MessageSquareText,
  ANNOUNCEMENT: Radio,
}

function SortableChannelItem({
  channel,
  updateChannel,
  deleteChannel,
  channelTypes,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({
    id: channel.id,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(channel.name)
  const [type, setType] = useState(channel.type)
  const [isPrivate, setIsPrivate] = useState(channel.isPrivate)

  const TypeIcon = TYPE_ICONS[channel.type] || Hash
  const typeLabel =
    channelTypes.find((channelType) => channelType.value === channel.type)
      ?.label || "Canal"

  async function handleUpdate(event) {
    event.preventDefault()

    const formData = new FormData()
    formData.append("name", name)
    formData.append("type", type)
    if (isPrivate) {
      formData.append("isPrivate", "on")
    }

    await updateChannel(channel.id, formData)
    setIsEditing(false)
  }

  function cancelEdit() {
    setName(channel.name)
    setType(channel.type)
    setIsPrivate(channel.isPrivate)
    setIsEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group rounded-2xl border border-white/10 bg-[#1f1f23] p-4 transition-colors hover:border-white/20 sm:p-5"
    >
      {isEditing ? (
        <form
          onSubmit={handleUpdate}
          className="grid gap-3 lg:grid-cols-[auto_minmax(0,1fr)_170px_auto_auto]"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-clutch-pink/10 text-clutch-pink">
            <Pencil size={19} />
          </div>

          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            minLength={1}
            maxLength={100}
            required
            className="min-w-0 rounded-xl border border-white/10 bg-[#17171a] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-clutch-pink focus:ring-2 focus:ring-clutch-pink/20"
          />

          <select
            value={type}
            onChange={(event) => setType(event.target.value)}
            className="rounded-xl border border-white/10 bg-[#17171a] px-4 py-3 text-sm text-white outline-none transition-colors focus:border-clutch-pink focus:ring-2 focus:ring-clutch-pink/20"
          >
            {channelTypes.map((channelType) => (
              <option key={channelType.value} value={channelType.value}>
                {channelType.label}
              </option>
            ))}
          </select>

          <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm font-medium text-clutch-gray-lighter">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(event) => setIsPrivate(event.target.checked)}
              className="h-4 w-4 accent-[#f92c6e]"
            />
            <Lock size={16} />
            Privado
          </label>

          <div className="flex gap-2">
            <button
              type="submit"
              aria-label="Salvar canal"
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-clutch-pink text-white transition-colors hover:bg-clutch-pink-dark"
            >
              <Check size={18} />
            </button>

            <button
              type="button"
              onClick={cancelEdit}
              aria-label="Cancelar edição"
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-clutch-gray-lighter transition-colors hover:bg-white/10 hover:text-white"
            >
              <X size={18} />
            </button>
          </div>
        </form>
      ) : (
        <div className="flex items-center gap-3">
          <button
            type="button"
            {...listeners}
            {...attributes}
            aria-label={`Reordenar canal ${channel.name}`}
            className="flex h-10 w-8 shrink-0 cursor-grab items-center justify-center rounded-lg text-clutch-gray-light transition-colors hover:bg-white/5 hover:text-white active:cursor-grabbing"
          >
            <GripVertical size={20} />
          </button>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-clutch-pink/10 text-clutch-pink">
            <TypeIcon size={20} />
          </div>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="min-w-0 flex-1 text-left"
          >
            <p className="truncate text-sm font-semibold text-white transition-colors hover:text-clutch-pink">
              {channel.name}
            </p>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="text-xs text-clutch-gray-lighter">
                Canal de {typeLabel.toLowerCase()}
              </span>

              {channel.isPrivate ? (
                <span className="inline-flex items-center gap-1 rounded-md border border-clutch-pink/25 bg-clutch-pink/10 px-1.5 py-0.5 text-[11px] font-medium text-clutch-pink-light">
                  <Lock size={11} />
                  Privado
                </span>
              ) : null}
            </div>
          </button>

          <button
            type="button"
            onClick={() => setIsEditing(true)}
            aria-label={`Editar canal ${channel.name}`}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-clutch-gray-lighter transition-colors hover:border-clutch-pink/40 hover:bg-clutch-pink/10 hover:text-clutch-pink"
          >
            <Pencil size={17} />
          </button>

          <form action={deleteChannel.bind(null, channel.id)}>
            <button
              type="submit"
              aria-label={`Excluir canal ${channel.name}`}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-clutch-gray-lighter transition-colors hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-300"
            >
              <Trash2 size={17} />
            </button>
          </form>
        </div>
      )}
    </div>
  )
}

export default function ChannelList({
  templateId,
  channels,
  updateChannel,
  deleteChannel,
  updateChannelOrder,
  channelTypes,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  async function handleDragEnd(event) {
    const { active, over } = event

    if (!over || active.id === over.id) {
      return
    }

    const oldIndex = channels.findIndex((channel) => channel.id === active.id)
    const newIndex = channels.findIndex((channel) => channel.id === over.id)

    if (oldIndex === -1 || newIndex === -1) {
      return
    }

    const newChannels = [...channels]
    const [movedChannel] = newChannels.splice(oldIndex, 1)
    newChannels.splice(newIndex, 0, movedChannel)

    await updateChannelOrder(
      templateId,
      newChannels.map((channel) => ({ id: channel.id }))
    )
  }

  if (channels.length === 0) {
    return (
      <div className="rounded-3xl border border-dashed border-white/15 bg-white/[0.015] px-6 py-14 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-clutch-gray-lighter">
          <Hash size={22} />
        </div>

        <h3 className="mt-4 font-semibold text-white">
          Nenhum canal configurado
        </h3>

        <p className="mt-2 text-sm text-clutch-gray-lighter">
          Adicione o primeiro canal para começar a estruturar este template.
        </p>
      </div>
    )
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={channels.map((channel) => channel.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="space-y-3">
          {channels.map((channel) => (
            <SortableChannelItem
              key={channel.id}
              channel={channel}
              updateChannel={updateChannel}
              deleteChannel={deleteChannel}
              channelTypes={channelTypes}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}
