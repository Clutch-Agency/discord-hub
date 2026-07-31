"use server"

import { prisma } from "@/lib/prisma"
import { requireOperator } from "@/lib/auth/operator-authorization"
import {
  AUTHORIZATION_ERROR_CODES,
  AuthorizationError,
} from "@/lib/auth/authorization-error"
import {
  validateTemplateId,
  validateTemplateName,
} from "@/lib/templates/template-validation"
import { domainConstants } from "@/lib/validation/domain-validation"
import { withMappedPrismaErrors } from "@/lib/prisma-errors"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createTemplate(formData) {
  const actor = await requireOperator()

  const name = validateTemplateName(formData?.get?.("name"))
  const templateCount = await withMappedPrismaErrors(() =>
    prisma.template.count({ where: { userId: actor.userId } })
  )

  if (templateCount >= domainConstants.limits.templatesPerUserMax) {
    throw new AuthorizationError(AUTHORIZATION_ERROR_CODES.INVALID_INPUT, {
      publicMessage: `Cada operador pode manter no máximo ${domainConstants.limits.templatesPerUserMax} templates.`,
      field: "name",
    })
  }

  const template = await withMappedPrismaErrors(() =>
    prisma.template.create({
      data: { name, userId: actor.userId },
    })
  )

  revalidatePath("/dashboard")
  redirect(`/dashboard/templates/${template.id}`) // Ajustado para a nova rota
}

export async function getTemplates() {
  const actor = await requireOperator()

  return prisma.template.findMany({
    where: { userId: actor.userId },
    orderBy: { createdAt: "desc" },
  })
}

export async function deleteTemplate(id) {
  const actor = await requireOperator()
  const templateId = validateTemplateId(id)

  await withMappedPrismaErrors(() =>
    prisma.template.deleteMany({
      where: { id: templateId, userId: actor.userId },
    })
  )

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/templates") // Adicionado para revalidar a lista de templates
}
