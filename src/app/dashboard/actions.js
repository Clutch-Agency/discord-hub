"use server"

import { auth } from "@/auth"
import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"

export async function createTemplate(formData) {
  const session = await auth()
  if (!session) redirect("/")

  const name = formData.get("name")
  if (!name || name.trim() === "") return

  const template = await prisma.template.create({
    data: {
      name: name.trim(),
      userId: session.user.id,
    },
  })

  revalidatePath("/dashboard")
  redirect(`/dashboard/templates/${template.id}`)
}

export async function getTemplates() {
  const session = await auth()
  if (!session) return []

  return prisma.template.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  })
}

export async function deleteTemplate(id) {
  const session = await auth()
  if (!session) redirect("/")

  await prisma.template.deleteMany({
    where: { id, userId: session.user.id },
  })

  revalidatePath("/dashboard")
}