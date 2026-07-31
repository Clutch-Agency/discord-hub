"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { requireOperator } from "@/lib/auth/operator-authorization"
import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
} from "@/lib/auth/authorization-error"
import { reorderTemplateChannels } from "@/lib/templates/channel-order"
import {
  parseChannelFormData,
  validateChannelId,
  validateTemplateId,
  validateTemplateName,
} from "@/lib/templates/template-validation"
import { domainConstants } from "@/lib/validation/domain-validation"
import { withMappedPrismaErrors } from "@/lib/prisma-errors"

export async function getTemplate(id) {
  const actor = await requireOperator()
  const templateId = validateTemplateId(id)

  return prisma.template.findUnique({
    where: { id: templateId, userId: actor.userId },
    include: { channels: { orderBy: { order: "asc" } } },
  })
}

export async function updateTemplateName(id, formData) {
  const actor = await requireOperator()
  const templateId = validateTemplateId(id)
  const name = validateTemplateName(formData?.get?.("name"))

  const result = await withMappedPrismaErrors(() =>
    prisma.template.updateMany({
      where: { id: templateId, userId: actor.userId },
      data: { name },
    })
  )

  if (result.count !== 1) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.ACCESS_DENIED)
  }

  revalidatePath(`/dashboard/templates/${templateId}`)
}

export async function addChannel(templateId, formData) {
  const actor = await requireOperator()
  const normalizedTemplateId = validateTemplateId(templateId)
  const input = parseChannelFormData(formData)
  const template = await prisma.template.findUnique({
    where: { id: normalizedTemplateId, userId: actor.userId },
    include: { channels: true },
  })

  if (!template) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.ACCESS_DENIED)
  }

  if (template.channels.length >= domainConstants.limits.channelsPerTemplateMax) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.INVALID_INPUT, {
      publicMessage: `Cada template pode conter no máximo ${domainConstants.limits.channelsPerTemplateMax} canais.`,
      field: "name",
    })
  }

  const newOrder =
    template.channels.length > 0
      ? Math.max(...template.channels.map((channel) => channel.order)) + 1
      : 0

  await withMappedPrismaErrors(() =>
    prisma.channel.create({
      data: {
        ...input,
        order: newOrder,
        templateId: normalizedTemplateId,
      },
    })
  )

  revalidatePath(`/dashboard/templates/${normalizedTemplateId}`)
}

export async function updateChannel(channelId, formData) {
  const actor = await requireOperator()
  const normalizedChannelId = validateChannelId(channelId)
  const input = parseChannelFormData(formData)
  const channel = await prisma.channel.findUnique({
    where: { id: normalizedChannelId },
    include: { template: true },
  })

  if (!channel || channel.template.userId !== actor.userId) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.ACCESS_DENIED)
  }

  await withMappedPrismaErrors(() =>
    prisma.channel.update({
      where: { id: normalizedChannelId },
      data: input,
    })
  )

  revalidatePath(`/dashboard/templates/${channel.templateId}`)
}

export async function deleteChannel(channelId) {
  const actor = await requireOperator()
  const normalizedChannelId = validateChannelId(channelId)
  const channel = await prisma.channel.findUnique({
    where: { id: normalizedChannelId },
    include: { template: true },
  })

  if (!channel || channel.template.userId !== actor.userId) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.ACCESS_DENIED)
  }

  await withMappedPrismaErrors(() =>
    prisma.channel.delete({ where: { id: normalizedChannelId } })
  )
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
      withMappedPrismaErrors(() =>
        prisma.$transaction(async (transaction) => {
        for (const [order, channelId] of orderedIds.entries()) {
          const result = await transaction.channel.updateMany({
            where: { id: channelId, templateId: id },
            data: { order },
          })

          if (result.count !== 1) {
            throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.CONFLICT)
          }
        }
        })
      ),
  })

  revalidatePath(`/dashboard/templates/${templateId}`)
}
