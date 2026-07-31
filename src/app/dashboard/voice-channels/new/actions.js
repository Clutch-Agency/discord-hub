"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createAuthorizedVoiceHub } from "@/lib/voice-hubs/voice-hub-service"

export async function createVoiceHub(formData) {
  const guildId = formData.get("guildId")
  const newVoiceHub = await createAuthorizedVoiceHub(guildId)

  revalidatePath("/dashboard/voice-channels")
  revalidatePath(`/dashboard/voice-channels/${newVoiceHub.id}`)
  redirect(`/dashboard/voice-channels/${newVoiceHub.id}`)
}
