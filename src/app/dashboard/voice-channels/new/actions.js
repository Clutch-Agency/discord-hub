"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { createAuthorizedVoiceHub } from "@/lib/voice-hubs/voice-hub-service"
import { actionFailure } from "@/lib/contracts/action-result"

export async function createVoiceHub(formData) {
  const guildId = formData?.get?.("guildId")
  let newVoiceHub

  try {
    newVoiceHub = await createAuthorizedVoiceHub(guildId)
  } catch (error) {
    return actionFailure(error)
  }

  revalidatePath("/dashboard/voice-channels")
  revalidatePath(`/dashboard/voice-channels/${newVoiceHub.id}`)
  redirect(`/dashboard/voice-channels/${newVoiceHub.id}`)
}
