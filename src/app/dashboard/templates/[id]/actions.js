"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { normalizeChannelName } from "@/lib/discord-utils"
import { requireOperator } from "@/lib/auth/operator-authorization"
import { reorderTemplateChannels } from "@/lib/templates/channel-order"

export async function getTemplate(id) { // Receber id como argumento simples
  const actor = await requireOperator()

  if (!id) { // Adicionar uma verificação para garantir que o id existe
    console.error("ID do template não fornecido para getTemplate.")
    return null
  }

  return prisma.template.findUnique({
    where: { id, userId: actor.userId },
    include: { channels: { orderBy: { order: "asc" } } },
  })
}

export async function updateTemplateName(id, formData) {
  const actor = await requireOperator()

  const name = formData.get("name")
  if (!name || name.trim() === "") return

  await prisma.template.updateMany({
    where: { id, userId: actor.userId },
    data: { name: name.trim() },
  })

  revalidatePath(`/dashboard/templates/${id}`)
}

export async function addChannel(templateId, formData) {
  const actor = await requireOperator()

  const name = formData.get("name")
  const type = formData.get("type")
  const isPrivate = formData.get("isPrivate") === "on"

  if (!name || name.trim() === "") return

  const template = await prisma.template.findUnique({
    where: { id: templateId, userId: actor.userId },
    include: { channels: true },
  })

  if (!template) return

  const newOrder = template.channels.length > 0 ? Math.max(...template.channels.map(c => c.order)) + 1 : 0

  await prisma.channel.create({
    data: {
      name: normalizeChannelName(name, type),
      type,
      isPrivate,
      order: newOrder,
      templateId,
    },
  })

  revalidatePath(`/dashboard/templates/${templateId}`)
}

export async function updateChannel(channelId, formData) {
  const actor = await requireOperator()

  const name = formData.get("name")
  const type = formData.get("type")
  const isPrivate = formData.get("isPrivate") === "on"
  const order = parseInt(formData.get("order"))

  if (!name || name.trim() === "") return

  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { template: true },
  })

  if (!channel || channel.template.userId !== actor.userId) return

  await prisma.channel.update({
    where: { id: channelId },
    data: {
      name: normalizeChannelName(name, type),
      type,
      isPrivate,
      order,
    },
  })

  revalidatePath(`/dashboard/templates/${channel.templateId}`)
}

export async function deleteChannel(channelId) {
  const actor = await requireOperator()

  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { template: true },
  })

  if (!channel || channel.template.userId !== actor.userId) return

  await prisma.channel.delete({
    where: { id: channelId },
  })

  revalidatePath(`/dashboard/templates/${channel.templateId}`)
}

export async function updateChannelOrder(templateId, channels) {
  await reorderTemplateChannels(templateId, channels, {
    requireOperator,
    findOwnedTemplate: (id, userId) =>
      prisma.template.findFirst({
        where: { id, userId },
        select: { id: true, channels: { select: { id: true } } },
      }),
    persistOrder: (id, orderedIds) =>
      prisma.$transaction(async (transaction) => {
        for (const [order, channelId] of orderedIds.entries()) {
          const result = await transaction.channel.updateMany({
            where: { id: channelId, templateId: id },
            data: { order },
          })

          if (result.count !== 1) {
            throw new Error("Channel order changed concurrently")
          }
        }
      }),
  })

  revalidatePath(`/dashboard/templates/${templateId}`)
}
