"use server"

import { auth } from "@/auth"
import { redirect } from "next/navigation"
import { setToolEnabled } from "@/lib/user-tools" // Importar setToolEnabled

export async function toggleTool(toolKey, enabled) {
  const session = await auth()
  if (!session) redirect("/")

  await setToolEnabled(session.user.id, toolKey, enabled)
}