"use client"

import { useState } from "react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from "@dnd-kit/core"
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { updateChannelOrder } from "./actions"
import { Trash2, GripVertical } from "lucide-react"

function SortableChannelItem({ channel, updateChannel, deleteChannel, channelTypes }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: channel.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(channel.name)
  const [type, setType] = useState(channel.type)
  const [isPrivate, setIsPrivate] = useState(channel.isPrivate)

  const handleUpdate = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    formData.append("name", name)
    formData.append("type", type)
    formData.append("isPrivate", isPrivate ? "on" : "off")
    formData.append("order", channel.order)
    await updateChannel(channel.id, formData)
    setIsEditing(false)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="bg-[#1f1f23] border border-white/10 rounded-xl p-4 flex items-center justify-between mb-2 last:mb-0"
    >
      <div className="flex items-center flex-1">
        <button {...listeners} {...attributes} className="mr-3 cursor-grab text-clutch-gray-lighter hover:text-white">
          <GripVertical size={20} />
        </button>
        {isEditing ? (
          <form onSubmit={handleUpdate} className="flex-1 flex items-center gap-3">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-transparent border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-clutch-pink flex-1"
            />
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="bg-transparent border border-white/10 rounded-md px-3 py-2 text-white text-sm focus:outline-none focus:border-clutch-pink"
            >
              {channelTypes.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
            <div className="flex items-center gap-2">
              <label htmlFor={`isPrivate-${channel.id}`} className="text-clutch-gray-lighter text-sm">Privado</label>
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                id={`isPrivate-${channel.id}`}
                className="hidden"
              />
              <label htmlFor={`isPrivate-${channel.id}`} className="relative w-9 h-5 rounded-full transition-colors flex-shrink-0 cursor-pointer bg-white/10 has-[:checked]:bg-clutch-pink">
                <span className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform has-[:checked]:translate-x-4" />
              </label>
            </div>
            <button type="submit" className="bg-clutch-pink hover:bg-clutch-pink-dark text-white text-sm py-2 px-4 rounded-md transition-colors">
              Salvar
            </button>
            <button type="button" onClick={() => setIsEditing(false)} className="text-clutch-gray-lighter hover:text-white text-sm py-2 px-4 rounded-md transition-colors">
              Cancelar
            </button>
          </form>
        ) : (
          <span
            className="text-white font-medium flex-1 cursor-pointer hover:text-clutch-pink transition-colors"
            onClick={() => setIsEditing(true)}
          >
            {channel.name} ({channelTypes.find(t => t.value === channel.type)?.label}) {channel.isPrivate && "(Privado)"}
          </span>
        )}
      </div>
      <form action={deleteChannel.bind(null, channel.id)}>
        <button type="submit" className="text-red-400 hover:text-red-300 transition-colors">
          <Trash2 size={20} />
        </button>
      </form>
    </div>
  )
}

export default function ChannelList({ templateId, channels, updateChannel, deleteChannel, updateChannelOrder, channelTypes }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = channels.findIndex((c) => c.id === active.id)
      const newIndex = channels.findIndex((c) => c.id === over.id)

      const newChannels = arrayMove(channels, oldIndex, newIndex)
      await updateChannelOrder(templateId, newChannels)
    }
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={channels} strategy={verticalListSortingStrategy}>
        <div>
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

function arrayMove(array, from, to) {
  const newArray = [...array]
  const [item] = newArray.splice(from, 1)
  newArray.splice(to, 0, item)
  return newArray
}