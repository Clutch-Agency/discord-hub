"use client"

import { useState, useEffect } from "react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { deleteChannel, reorderChannels } from "./actions"

const CHANNEL_TYPES = [
  { value: "TEXT", label: "Texto" },
  { value: "VOICE", label: "Voz" },
  { value: "FORUM", label: "Fórum" },
  { value: "ANNOUNCEMENT", label: "Announcements" },
  { value: "STAGE", label: "Palco" },
]

function SortableChannel({ channel, templateId }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: channel.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[#1f1f23] border border-white/10 rounded-xl p-4 flex items-center justify-between hover:border-clutch-pink/30 transition-colors"
    >
      <div className="flex items-center gap-3">
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="text-clutch-gray-light hover:text-clutch-gray-lighter cursor-grab active:cursor-grabbing px-1"
        >
          ⠿
        </button>
        <span className="text-xs uppercase tracking-wide bg-[#17171a] border border-white/10 text-clutch-gray-lighter px-2 py-1 rounded-md">
          {CHANNEL_TYPES.find((t) => t.value === channel.type)?.label}
        </span>
        <span className="text-white">{channel.name}</span>
        {channel.isPrivate && (
          <span className="text-xs bg-clutch-pink/10 text-clutch-pink px-2 py-1 rounded-md">
            🔒 privado
          </span>
        )}
      </div>
      <form action={deleteChannel.bind(null, templateId, channel.id)}>
        <button
          type="submit"
          className="text-red-400 hover:text-red-300 text-sm transition-colors"
        >
          Excluir
        </button>
      </form>
    </div>
  )
}

export default function ChannelList({ templateId, initialChannels }) {
  const [channels, setChannels] = useState(initialChannels)

  useEffect(() => {
    setChannels(initialChannels)
  }, [initialChannels])

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  )

  function handleDragEnd(event) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = channels.findIndex((c) => c.id === active.id)
    const newIndex = channels.findIndex((c) => c.id === over.id)

    const newOrder = arrayMove(channels, oldIndex, newIndex)
    setChannels(newOrder)
    reorderChannels(templateId, newOrder.map((c) => c.id))
  }

  if (channels.length === 0) {
    return (
      <div className="border border-dashed border-white/10 rounded-2xl p-16 text-center">
        <p className="text-clutch-gray-lighter">Nenhum canal adicionado ainda.</p>
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
        items={channels.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="grid gap-3">
          {channels.map((channel) => (
            <SortableChannel key={channel.id} channel={channel} templateId={templateId} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  )
}