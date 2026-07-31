"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { actionFailure, actionSuccess } from "@/lib/contracts/action-result"
import {
  deleteAuthorizedVoiceHub,
  getAuthorizedVoiceHubRoles,
  updateAuthorizedVoiceHub,
} from "@/lib/voice-hubs/voice-hub-service"
import { parseVoiceHubUpdateFormData } from "@/lib/voice-hubs/voice-hub-validation"

export async function getGuildRoles(voiceHubId) {
  try {
    const roles = await getAuthorizedVoiceHubRoles(voiceHubId)

    return actionSuccess({ roles })
  } catch (error) {
    return actionFailure(error)
  }
}

export async function updateVoiceHub(formData) {
  const input = parseVoiceHubUpdateFormData(formData)
  await updateAuthorizedVoiceHub(input)

  revalidatePath(`/dashboard/voice-channels/${input.id}`)
  revalidatePath("/dashboard/voice-channels")
  redirect(`/dashboard/voice-channels/${input.id}`)
}

export async function deleteVoiceHub(id) {
  await deleteAuthorizedVoiceHub(id)
  revalidatePath("/dashboard/voice-channels")
  redirect("/dashboard/voice-channels")
}
