"use server"

import { prisma } from "@/lib/prisma"
import { requireOperator } from "@/lib/auth/operator-authorization"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createTemplate(formData) {
  const actor = await requireOperator()

  const name = formData.get("name")
  if (!name || name.trim() === "") return

  const template = await prisma.template.create({
    data: {
      name: name.trim(),
      userId: actor.userId,
    },
  })

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

  await prisma.template.deleteMany({
    where: { id, userId: actor.userId },
  })

  revalidatePath("/dashboard")
  revalidatePath("/dashboard/templates") // Adicionado para revalidar a lista de templates
}
