"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { normalizeChannelName } from "@/lib/discord-utils"

export async function getTemplate(id) { // Receber id como argumento simples
  const session = await auth()
  if (!session) return null

  if (!id) { // Adicionar uma verificação para garantir que o id existe
    console.error("ID do template não fornecido para getTemplate.")
    return null
  }

  return prisma.template.findUnique({
    where: { id, userId: session.user.id },
    include: { channels: { orderBy: { order: "asc" } } },
  })
}

export async function updateTemplateName(id, formData) {
  const session = await auth()
  if (!session) redirect("/")

  const name = formData.get("name")
  if (!name || name.trim() === "") return

  await prisma.template.updateMany({
    where: { id, userId: session.user.id },
    data: { name: name.trim() },
  })

  revalidatePath(`/dashboard/templates/${id}`)
}

export async function addChannel(templateId, formData) {
  const session = await auth()
  if (!session) redirect("/")

  const name = formData.get("name")
  const type = formData.get("type")
  const isPrivate = formData.get("isPrivate") === "on"

  if (!name || name.trim() === "") return

  const template = await prisma.template.findUnique({
    where: { id: templateId, userId: session.user.id },
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
  const session = await auth()
  if (!session) redirect("/")

  const name = formData.get("name")
  const type = formData.get("type")
  const isPrivate = formData.get("isPrivate") === "on"
  const order = parseInt(formData.get("order"))

  if (!name || name.trim() === "") return

  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { template: true },
  })

  if (!channel || channel.template.userId !== session.user.id) return

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
  const session = await auth()
  if (!session) redirect("/")

  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    include: { template: true },
  })

  if (!channel || channel.template.userId !== session.user.id) return

  await prisma.channel.delete({
    where: { id: channelId },
  })

  revalidatePath(`/dashboard/templates/${channel.templateId}`)
}

export async function updateChannelOrder(templateId, channels) {
  const session = await auth()
  if (!session) redirect("/")

  const template = await prisma.template.findUnique({
    where: { id: templateId, userId: session.user.id },
  })

  if (!template) return

  const transaction = channels.map((channel, index) =>
    prisma.channel.update({
      where: { id: channel.id },
      data: { order: index },
    })
  )

  await prisma.$transaction(transaction)

  revalidatePath(`/dashboard/templates/${templateId}`)
}