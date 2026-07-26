"use server"

import { auth } from "@/auth"
import { setToolEnabled } from "@/lib/user-tools"
import { revalidatePath } from "next/cache"

export async function toggleTool(toolKey, enabled) {
  const session = await auth()
  if (!session) return

  await setToolEnabled(session.user.id, toolKey, enabled)
  revalidatePath("/dashboard")
}