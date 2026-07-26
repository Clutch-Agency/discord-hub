"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { normalizeChannelName } from "@/lib/discord-utils"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

async function verifyOwnership(templateId, userId) {
  const template = await prisma.template.findFirst({
    where: { id: templateId, userId },
  })
  return template
}

export async function addChannel(templateId, formData) {
  const session = await auth()
  if (!session) redirect("/")

  const template = await verifyOwnership(templateId, session.user.id)
  if (!template) redirect("/dashboard")

  const rawName = formData.get("name")
  const type = formData.get("type")
  const isPrivate = formData.get("isPrivate") === "on"

  if (!rawName || rawName.trim() === "") return

  const name = normalizeChannelName(rawName, type)
  if (!name) return

  const lastChannel = await prisma.channel.findFirst({
    where: { templateId },
    orderBy: { order: "desc" },
  })

  const nextOrder = lastChannel ? lastChannel.order + 1 : 0

  await prisma.channel.create({
    data: {
      templateId,
      name,
      type,
      order: nextOrder,
      isPrivate,
    },
  })

  revalidatePath(`/dashboard/templates/${templateId}`)
}

export async function deleteChannel(templateId, channelId) {
  const session = await auth()
  if (!session) redirect("/")

  const template = await verifyOwnership(templateId, session.user.id)
  if (!template) redirect("/dashboard")

  await prisma.channel.delete({
    where: { id: channelId },
  })

  revalidatePath(`/dashboard/templates/${templateId}`)
}

export async function reorderChannels(templateId, orderedIds) {
  const session = await auth()
  if (!session) redirect("/")

  const template = await verifyOwnership(templateId, session.user.id)
  if (!template) redirect("/dashboard")

  await prisma.$transaction(
    orderedIds.map((channelId, index) =>
      prisma.channel.update({
        where: { id: channelId },
        data: { order: index },
      })
    )
  )

  revalidatePath(`/dashboard/templates/${templateId}`)
}